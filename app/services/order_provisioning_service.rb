# frozen_string_literal: true

class OrderProvisioningService
  class ProvisioningError < StandardError; end

  def initialize(order, user_or_reseller)
    @order = order
    @order.metadata ||= {}
    @actor = user_or_reseller # Can be User or Reseller
    @product = order.product
  end

  def process!(skip_payment: false)
    return false unless @order.pending? || @order.awaiting_payment?

    ActiveRecord::Base.transaction do
      # 1. Price Calculation
      @order.calculate_total_amount

      # Re-apply promo discount if one was applied at checkout
      promo_discount = @order.metadata&.dig('promo_discount').to_f
      if promo_discount.positive?
        @order.total_amount = [@order.total_amount.to_f - promo_discount, 0].max.round(2)
      end

      total = @order.total_amount

      # 2. Payment / Balance Check (Resellers always use wallet)
      unless skip_payment
        if @actor.is_a?(Reseller)
          validate_and_deduct_balance!(total)
        elsif @actor.is_a?(User)
          # Users may have already paid via gateway, or pay from wallet
          # If this is called, assume wallet payment
          validate_and_deduct_balance!(total)
        end
      end

      # 3. Transition to processing
      @order.process!
    end

    # 3a. Send Invoice — MUST be outside the transaction so the Order
    #     is committed and visible to Sidekiq when the mailer job runs.
    InvoiceMailer.with(order: @order).invoice_email.deliver_later

    # 4. Provision based on product type
    provision_product!

    # 5. Generate and store invoice PDF via Active Storage
    begin
      InvoicePdfService.new(@order).generate_and_attach!
    rescue StandardError => e
      Rails.logger.warn("Failed to generate invoice PDF for order #{@order.id}: #{e.message}")
    end

    # 6. Record reseller profit share (replaced affiliate commission)
    ResellerEarningsService.record_profit_share!(@order)

    # Notify Admins and Support on success ONLY (as per requirements)
    [Employee.admins, Employee.support_agents].each do |scope|
      scope.find_each do |employee|
        NotificationService.notify(
          recipient: employee,
          category: 'success',
          title: 'Order Completed',
          message: "Order ##{@order.order_number} for #{@actor.try(:email) || @actor.try(:username)} has been successfully provisioned.",
          metadata: { order_id: @order.id }
        )
      end
    end

    true
  rescue StandardError => e
    handle_failure(e)
  end

  def process_without_deduction!
    process!(skip_payment: true)
  end

  private

  def handle_failure(e)
    Rails.logger.error("[OrderProvisioningService] Failed: #{e.message}")
    @order.fail! if @order.may_fail?

    begin
      RefundService.new(@order).process!
    rescue RefundService::DeferredCryptoRefund => re
      Rails.logger.info("Order #{@order.id} paid via crypto. Awaiting user-provided refund address: #{re.message}")
    rescue StandardError => re
      Rails.logger.error("Auto-refund completely failed for order #{@order.id}: #{re.message}")
    end

    # Notify the Actor (Customer or Reseller)
    if @actor.is_a?(Reseller)
      # Direct Resellers get detailed failure info
      NotificationService.notify(
        recipient: @actor,
        category: 'error',
        title: 'Provisioning Failed',
        message: "Your order ##{@order.order_number} failed to provision: #{e.message}",
        metadata: { order_id: @order.id, error: e.message }
      )
    elsif @actor.is_a?(User)
      # Regular customers get a generic failure message
      NotificationService.notify(
        recipient: @actor,
        category: 'error',
        title: 'Provisioning Failed',
        message: "Your order ##{@order.order_number} failed to provision. Support has been notified.",
        metadata: { order_id: @order.id }
      )

      # If this user belongs to an Infrastructure Reseller, notify the reseller with details
      if @actor.reseller.present?
        NotificationService.notify(
          recipient: @actor.reseller,
          category: 'error',
          title: 'Managed User Provisioning Failed',
          message: "Managed user #{@actor.username}'s order ##{@order.order_number} failed: #{e.message}",
          metadata: { order_id: @order.id, user_id: @actor.id, error: e.message }
        )
      end
    end

    # Notify Admins and Support ONLY on failure
    [Employee.admins, Employee.support_agents].each do |scope|
      scope.find_each do |employee|
        NotificationService.notify(
          recipient: employee,
          category: 'system_alert',
          title: 'Provisioning Failure',
          message: "Order ##{@order.order_number} for #{@actor.try(:email) || @actor.try(:username)} failed: #{e.message}",
          metadata: { order_id: @order.id, actor_id: @actor.id, actor_type: @actor.class.name }
        )
      end
    end

    raise e
  end

  def validate_and_deduct_balance!(total)
    unless enough_balance?(total)
      raise ProvisioningError, "Insufficient balance: Wallet has #{@actor.wallet&.balance || 0}, required #{total}"
    end

    transaction = Transaction.create!(
      transactable: @actor,
      reference: @order,
      amount: total,
      transaction_type: 'debit',
      status: 'success',
      currency: 'USD',
      description: "Order ##{@order.id} payment",
      metadata: { order_id: @order.id }
    )

    @actor.wallet.debit!(total, "Order ##{@order.id} payment", { order_id: @order.id }, transaction)
  end

  def enough_balance?(amount)
    return false unless @actor.wallet

    @actor.wallet.balance >= amount
  end

  def provision_product!
    case @product.product_type
    when 'vps', 'rdp', 'vm'
      provision_vm!
    when 'proxy', 'datacenter', 'isp', 'static_residential', 'residential_rotating', 'premium_isp', 'mobile', 'global_isp'
      provision_proxy!
    when 'esim'
      provision_esim!
    when 'usa_esim'
      provision_usa_esim!
    when 'vpn'
      provision_vpn!
    else
      raise ProvisioningError, "Unknown product type: #{@product.product_type}"
    end
  end

  def service_renewal_metadata
    {
      'auto_renew' => @order.metadata['auto_renew'],
      'renewal_method' => @order.metadata['payment_debug'],
      'paystack_auth_code' => @order.metadata['paystack_auth_code'],
      'fastspring_sub_id' => @order.metadata['fastspring_sub_id']
    }.compact
  end

  # ========== VM Provisioning ==========
  def provision_vm!
    # Extract explicit user country selection or fallback to product default
    country = (@order.metadata&.dig('countryCode').presence ||
               @order.metadata&.dig('selected_country_id').presence ||
               @order.metadata&.dig('country_code').presence ||
               @product.metadata&.dig('country_code') || 'US').to_s.upcase

    # Determine VM type: strictly 'vps' or 'rdp'
    vm_type = if @product.product_type == 'rdp' || @product.metadata&.dig('rdp').to_s == 'true'
                'rdp'
              else
                'vps'
              end

    # Create VM Order first
    vm_order = VmOrder.create!(
      order: @order,
      os_type: @order.metadata&.dig('os_template').presence || @product.metadata&.dig('os_template') || 'ubuntu-22-04',
      vm_type: vm_type,
      cpu_cores: @product.metadata&.dig('cpu_cores') || 1,
      ram_gb: @product.metadata&.dig('ram_gb') || 1,
      disk_gb: @product.metadata&.dig('storage_gb') || 20,
      country_code: country,
      status: 'provisioning'
    )

    # Create VM record and queue provisioning
    vm = Vm.create!(
      vm_order: vm_order,
      status: 'pending',
      vm_type: vm_order.vm_type,
      metadata: service_renewal_metadata
    )

    job_params = {
      'os_template' => vm_order.os_type,
      'vm_type' => vm_order.vm_type,
      'cpu_cores' => vm_order.cpu_cores,
      'ram_gb' => vm_order.ram_gb,
      'storage_gb' => vm_order.disk_gb,
      'hostname' => @order.metadata&.dig('hostname').presence,
      'management_type' => @order.metadata&.dig('management_type') || @product.metadata&.dig('management_type') || 'unmanaged',
      'country_code' => vm_order.country_code
    }

    # Intercept non-Canadian VMs and bundle a localized proxy for Ansible configurations
    if vm_order.country_code.to_s.upcase != 'CA' && vm_order.country_code.to_s.upcase != 'CANADA'
      proxy_slug = @product.product_type == 'rdp' || @product.metadata&.dig('rdp').to_s == 'true' ? 'static-residential' : 'datacenter'

      # Find a base 1x product corresponding to the target slug
      proxy_pr = Product.joins(:product_category).where(product_categories: { slug: proxy_slug }, active: true).where(
        'products.name LIKE ?', '1 x%'
      ).first
      if proxy_pr.nil?
        Rails.logger.error("Provisioning failure: No 1x #{proxy_slug} mapping available to satisfy VM proxy rule")
        raise ProvisioningError, "No localized proxy mapping available for country #{vm_order.country_code}"
      end

      # Determine location ID from product metadata for the API call
      # The API expects a numeric location/city ID, not a country code.
      location_id = nil
      if proxy_pr.metadata['isp'].is_a?(Array)
        proxy_pr.metadata['isp'].each do |isp|
          next unless isp['locations'] && isp['locations'][country]

          city = isp['locations'][country]['cities']&.first
          if city
            location_id = city['id']
            break
          end
        end
      end

      # Execute MyProxyApi Purchase
      begin
        client = MyProxyApiClient.new
        user_id = client.reseller_user_id
        
        order_response = client.place_order(
          user_id: user_id,
          product_api_id: proxy_pr.provider_product_id,
          period: 1,
          protocol: 'http',
          locations: location_id,
          whitelist_ip: @order.metadata['client_ip']
        )

        # place_order returns { data: { order_id: "..." } } — we need to call view_order
        # to get the actual proxy credentials (IP, port, username, password).
        provider_order_id = order_response.dig('data', 'order_id') || order_response['order_id']
        if provider_order_id.blank?
          raise ProvisioningError,
                "MyProxyApi did not return an order_id. #{order_response.inspect}"
        end

        full_details = client.view_order(provider_order_id)
        response = full_details['data'].is_a?(Array) ? full_details['data'].first : full_details['data']
        raise ProvisioningError, 'MyProxyApi view_order returned no proxy data' if response.blank?

        # Store the API response metadata securely for recordkeeping
        @order.metadata ||= {}
        @order.metadata['my_proxy_api_response'] = response
        @order.save!

        # Attach to the Ansible Job params
        job_params['proxy'] ||= {}
        job_params['proxy']['ip']       = response['ip']
        job_params['proxy']['port']     = response['port'] || response['http_port'] || response['socks5_port']
        job_params['proxy']['username'] = response['username']
        job_params['proxy']['password'] = response['password']
        job_params['proxy']['protocol'] = 'http'

        Rails.logger.info("Successfully provisioned intercept #{proxy_slug} proxy for VM '#{vm.id}' residing in #{vm_order.country_code}")
      rescue StandardError => e
        Rails.logger.error("Failed to provision intercept proxy for VM: #{e.message}")
        raise ProvisioningError, "Dependency error acquiring proxy for VM: #{e.message}"
      end
    end

    # Enqueue AFTER the implicit transaction commits so the VM record is
    # visible to Sidekiq on its own DB connection.
    enqueued_vm_id = vm.id
    enqueued_job_params = job_params.dup
    ActiveRecord.after_all_transactions_commit do
      VmProvisioningJob.perform_later(enqueued_vm_id, enqueued_job_params)
    end

    # Order stays in processing until job completes
  end

  # ========== Proxy Provisioning ==========
  def provision_proxy!
    case @product.provider_type
    when 'xproxy'
      XProxyService.new.provision(@order)
      @order.activate!

    when 'myproxyapi'
      category_slug = @product.product_category&.slug

      # NOTE: residential rotating and global-isp are different in a way.
      # Global ISP targets specific ISP/City IDs for a fixed duration (7d/30d),
      # while Residential Rotating uses traffic-based plans (GB) and dynamic pool rotations.

      # Extract provisioning params from order metadata.
      # 'period' = months/days string for static IPs, GB for residential rotating, IPs count for mobile
      raw_period = @order.metadata['period'] || @product.metadata&.dig('duration_value') || 1

      # For Global ISP, strictly map period to '30d' or '7d' as per documentation
      period = if category_slug == 'global-isp'
                 if raw_period.to_s.include?('d')
                   raw_period
                 elsif raw_period.to_i == 7
                   '7d'
                 else
                   '30d' # Default to 30 days for 1 month
                 end
               else
                 raw_period
               end

      client_ip = @order.metadata['client_ip']
      protocol  = @order.metadata['protocol'] || 'http'
      api_id    = @product.provider_product_id
      
      client = MyProxyApiClient.new
      user_id = client.reseller_user_id

      # 'locationId' is the numeric city/ISP ID the API expects.
      # 'locationsString' is the human-readable label (e.g. "Dallas, Texas") — NOT for the API.
      # For Residential Rotating, we avoid sending the human-readable "Global Residential Pool" to the API.
      locations = if category_slug == 'global-isp'
                    @order.metadata['selected_country_id'] || @order.metadata['locationId'] || @product.metadata&.dig('selected_country_id')
                  else
                    loc = @order.metadata['locationId'] || @order.metadata['locationsString']
                    loc.to_s.match?(/\A\d+\z/) || category_slug != 'residential-rotating' ? loc : nil
                  end

      # Determine debug label from payment method used
      payment_debug = @order.metadata['payment_debug'] || (@actor.is_a?(Reseller) ? 'reseller_balance' : 'balance')

      provisioning_params = {
        user_id: user_id,
        product_api_id: api_id,
        period: period,
        protocol: protocol,
        locations: locations,
        whitelist_ip: client_ip,
        debug: payment_debug
      }

      # Handle Global ISP specific parameters
      if category_slug == 'global-isp'
        provisioning_params[:type] = 'global-isp'
        provisioning_params[:target_section_id] = @order.metadata['target_section_id'] || @order.metadata['targetSectionId'] || @product.metadata&.dig('target_section_id')
        provisioning_params[:target_id] = @order.metadata['target_id'] || @order.metadata['targetId'] || @product.metadata&.dig('target_id')
      end

      # Handle Residential Rotating V2 (resi: 1)
      if category_slug == 'residential-rotating'
        provisioning_params[:resi] = 1 # Force V2 API strictly
      end

      response = client.place_order(**provisioning_params)

      # Provider returns basic order info, but we need full details (IPs, etc.)
      provider_order_id = response.dig('data', 'order_id') || response['order_id']

      if provider_order_id.present?
        # Sleep for 1 minute as requested to allow the provider to assign an IP/credentials
        sleep(60)

        begin
          # Re-fetch full details (IPs, credentials) from the provider
          full_details = if category_slug == 'mobile'
                           client.view_mobile_order(provider_order_id)
                         elsif category_slug == 'residential-rotating' && provisioning_params[:resi] == 1
                           client.fetch_v2_residential_rotating_order(provider_order_id)
                         else
                           client.view_order(provider_order_id)
                         end
          # Support both Array and Hash formats returned by the API
          response = full_details['data'].is_a?(Array) ? full_details['data'].first : (full_details['data'] || full_details)
        rescue StandardError => e
          Rails.logger.warn("Failed to fetch full order details for MyProxy order #{provider_order_id}: #{e.message}")
        end
      end

      # ========== RESIDENTIAL ROTATING V2 CREDENTIAL GENERATION ==========
      if category_slug == 'residential-rotating' && provisioning_params[:resi] == 1 && provider_order_id.present?
        begin
          proxy_rotation = @order.metadata['residentalRotatingConfig']&.dig('rotationStrategy') || '0'
          proxy_hostname = @order.metadata['residentalRotatingConfig']&.dig('proxyRegion') || 'ip-na.myproxyapi.com'
          quantity       = (@order.metadata['residentalRotatingConfig']&.dig('quantity') || 1).to_i
          auto_generate  = @order.metadata['residentalRotatingConfig']&.dig('autoGenerate') != false

          all_credentials = []
          quantity.times do
            if auto_generate
              proxy_username = "user_#{SecureRandom.hex(4)}"
              proxy_password = SecureRandom.hex(12)
            else
              proxy_username = @order.metadata['residentalRotatingConfig']&.dig('customUsername') || "user_#{SecureRandom.hex(4)}"
              proxy_password = @order.metadata['residentalRotatingConfig']&.dig('customPassword') || SecureRandom.hex(12)
            end

            # Determine targeting type based on provided filters
            targeting = if @order.metadata['residentalRotatingConfig']&.dig('isp').present?
                          'isp'
                        else
                          'state_city'
                        end

            proxy_creds = client.generate_v2_res_rot_proxy(
              user_id: user_id,
              hostname: proxy_hostname,
              username: proxy_username,
              password: proxy_password,
              proxy_rotation: proxy_rotation.to_s,
              protocol: protocol,
              quantity: 1,
              format: 'hostname:port:username:password',
              country: @order.metadata['residentalRotatingConfig']&.dig('country'),
              state: @order.metadata['residentalRotatingConfig']&.dig('state'),
              city: @order.metadata['residentalRotatingConfig']&.dig('city'),
              isp: @order.metadata['residentalRotatingConfig']&.dig('isp'),
              targeting: targeting
            )
            all_credentials << proxy_creds
          end

          @order.metadata['proxy_credentials']    = all_credentials
          @order.metadata['rotation_strategy']    = proxy_rotation
          @order.metadata['proxy_region']         = proxy_hostname
          @order.metadata['quantity_generated']   = quantity

          Rails.logger.info("Generated #{quantity} residential rotating proxy credential(s) for order #{provider_order_id}")
        rescue StandardError => e
          Rails.logger.warn("Failed to generate residential rotating credentials: #{e.message}")
          raise ProvisioningError, "Failed to generate proxy credentials: #{e.message}"
        end
      end
      # ========== END RESIDENTIAL ROTATING CREDENTIAL GENERATION ==========

      @order.metadata ||= {}
      @order.metadata['my_proxy_api_response'] = response
      @order.metadata['provider_order_id'] = provider_order_id
      @order.save!
      @order.activate!

      # Save to specialized models after activation
      save_specialized_proxy_records(category_slug, provider_order_id, response)

      # Send credentials email using the API response data — deferred to
      # after the implicit transaction commits.
      target_email = @order.metadata&.dig('credentials_email').presence
      owner = @actor || @order.orderable
      saved_order = @order
      ActiveRecord.after_all_transactions_commit do
        InvoiceMailer.with(
          order: saved_order,
          owner: owner,
          api_response: response,
          target_email: target_email
        ).api_proxy_credentials_email.deliver_later
      end

    when 'static_datacenter', 'static_isp', 'residential', 'static-residential', 'premium-isp'
      proxy = assign_proxy_from_inventory(@product.provider_type)
      send_proxy_credentials(proxy)
      @order.activate!

    else
      raise ProvisioningError, "Unknown proxy provider: #{@product.provider_type}"
    end
  end

  def assign_proxy_from_inventory(provider_type)
    # Find available proxy from synced inventory
    proxy_class = case provider_type
                  when 'static_datacenter' then StaticDatacenterProxy
                  when 'static_isp' then StaticIspProxy
                  when 'premium-isp' then PremiumIspProxy
                  when 'static-residential' then StaticResidentialProxy
                  when 'residential', 'residential-rotating' then ResidentialRotatingProxy
                  else MobileProxy
                  end

    proxy_order_class = case provider_type
                        when 'static_datacenter' then StaticDatacenterProxyOrder
                        when 'static_isp' then StaticIspProxyOrder
                        when 'premium-isp' then PremiumIspProxyOrder
                        when 'static-residential' then StaticResidentialProxyOrder
                        when 'residential', 'residential-rotating' then ResidentialRotatingProxyOrder
                        else MobileProxyOrder
                        end

    proxy_order_foreign_key = case provider_type
                              when 'static_datacenter' then :static_datacenter_proxy_order_id
                              when 'static_isp' then :static_isp_proxy_order_id
                              when 'premium-isp' then :premium_isp_proxy_order_id
                              when 'static-residential' then :static_residential_proxy_order_id
                              when 'residential', 'residential-rotating' then :residential_rotating_proxy_order_id
                              else :mobile_proxy_order_id
                              end

    proxy = proxy_class.lock.where(status: 'available').first
    raise ProvisioningError, "No available #{provider_type} proxies" unless proxy

    # Create ProxyOrder
    proxy_order = proxy_order_class.create!(
      order: @order,
      status: 'active',
      country_code: @product.metadata&.dig('country_code'),
      quantity: @order.quantity || 1,
      metadata: service_renewal_metadata
    )

    # Generate credentials
    username = "user_#{SecureRandom.hex(4)}"
    password = SecureRandom.hex(8)

    proxy.update!(
      status: 'assigned',
      username: username,
      password: password,
      order_id: @order.id,
      proxy_order_foreign_key => proxy_order.id,
      metadata: (proxy.metadata || {}).merge(service_renewal_metadata)
    )

    proxy
  end

  def send_proxy_credentials(proxy)
    target_email = @order.metadata&.dig('credentials_email').presence
    owner = @actor || @order.orderable
    saved_order = @order
    ActiveRecord.after_all_transactions_commit do
      ProxyMailer.with(
        owner: owner,
        proxy: proxy,
        order: saved_order,
        target_email: target_email
      ).credentials_email.deliver_later
    end
  end

  # ========== eSIM Provisioning ==========
  def provision_esim!
    EsimProvisioningService.new(@order).provision!
    # eSIM service handles order status and mailer internally
  end

  # ========== USA eSIM Provisioning ==========
  def provision_usa_esim!
    provider = @product.provider
    quantity = @order.quantity.to_i <= 0 ? 1 : @order.quantity
    moq = @product.metadata&.dig('moq').to_i
    moq = 1 if moq <= 0

    if quantity < moq
      raise ProvisioningError,
            "Minimum order quantity for USA eSIM #{provider} is #{moq} line(s). Requested: #{quantity}."
    end

    if provider == 'colt'
      # Colt requires manual fulfillment
      UsaEsimOrder.transaction do
          UsaEsimOrder.create!(
            order: @order,
            status: 'pending',
            provider: provider,
            quantity: quantity,
            total_amount: @order.total_amount || 0.0,
            metadata: service_renewal_metadata
          )
      end

      @order.update!(status: 'processing')

      # Notify user and admin AFTER the transaction commits
      saved_order = @order
      saved_actor = @actor
      ActiveRecord.after_all_transactions_commit do
        UsaEsimMailer.with(
          owner: saved_actor,
          order: saved_order
        ).manual_order_notification.deliver_later

        UsaEsimMailer.with(
          order: saved_order
        ).admin_manual_order_alert.deliver_later
      end
      return
    end

    UsaEsimCredential.transaction do
      creds = UsaEsimCredential.lock('FOR UPDATE SKIP LOCKED').where(provider: provider,
                                                                     status: 'available').limit(quantity).to_a

      if creds.size < quantity
        raise ProvisioningError,
              "Insufficient stock for USA eSIM #{provider}. Requested: #{quantity}, Available: #{creds.size}."
      end

      usa_esim_order = UsaEsimOrder.create!(
        order: @order,
        status: 'active',
        provider: provider,
        quantity: quantity,
        total_amount: @order.total_amount || 0.0
      )

      # Claim credentials
      creds.each do |cred|
        cred.update!(
          status: 'assigned',
          order_id: usa_esim_order.id,
          user_id: @actor.is_a?(User) ? @actor.id : nil,
          assigned_at: Time.current
        )
      end

      @order.update!(status: 'active')

      # Send credentials email AFTER transaction commits
      target_email = @order.metadata&.dig('credentials_email').presence
      saved_order = @order
      saved_actor = @actor
      saved_creds = creds.dup
      ActiveRecord.after_all_transactions_commit do
        UsaEsimMailer.with(
          owner: saved_actor,
          credentials: saved_creds,
          order: saved_order,
          target_email: target_email
        ).credentials_email.deliver_later
      end
    end
  end

  # ========== VPN Provisioning ==========
  def provision_vpn!
    if @product.provider_type == 'myproxyapi'
      period    = @order.metadata['period'] || 1
      locations = @order.metadata['locationId'] || @order.metadata['locationsString']
      client_ip = @order.metadata['client_ip']
      protocol  = @order.metadata['protocol'] || 'http'
      api_id    = @product.provider_product_id
      
      client = MyProxyApiClient.new
      user_id = client.reseller_user_id

      # Determine debug label from payment method used
      payment_debug = @order.metadata['payment_debug'] || (@actor.is_a?(Reseller) ? 'reseller_balance' : 'balance')

      provisioning_params = {
        user_id: user_id,
        product_api_id: api_id,
        period: period,
        protocol: protocol,
        locations: locations,
        whitelist_ip: client_ip,
        debug: payment_debug
      }

      response = client.place_order(**provisioning_params)

      provider_order_id = response.dig('data', 'order_id') || response['order_id']

      if provider_order_id.present?
        begin
          # VPN orders have their own view endpoint
          full_details = client.view_vpn_order(provider_order_id)
          response = full_details['data'].is_a?(Array) ? full_details['data'].first : full_details['data']
        rescue StandardError => e
          Rails.logger.warn("Failed to fetch full order details for MyProxy VPN order #{provider_order_id}: #{e.message}")
        end
      end

      @order.metadata ||= {}
      @order.metadata['my_proxy_api_response'] = response
      @order.metadata['provider_order_id'] = provider_order_id
      @order.save!

      # Create VpnOrder and Vpn records for system visibility
      if provider_order_id.present? && response.present?
        vpn_info = response['vpn_info']&.first || {}
        creds    = response.dig('config', 'auth_credentials') || {}

        vpn_order = VpnOrder.find_or_create_by!(order: @order) do |vo|
          vo.myproxyapi_order_id = provider_order_id
          vo.country_code = response['country_code'] || response['country'] ||
                            vpn_info['ip_info']&.match(/,\s*([A-Z]{2})\z/)&.[](1) ||
                            @order.metadata['country_code'] || 'US'
          vo.status = 'active'
        end

        Vpn.find_or_create_by!(vpn_order: vpn_order) do |v|
          v.myproxyapi_order_id = provider_order_id
          v.vpn_username = creds['username'] || response['username'] || response['vpn_username']
          v.vpn_password = creds['password'] || response['password'] || response['vpn_password']
          v.country_code = vpn_order.country_code
          v.status = 'active'
          v.metadata = response
        end
      end

      @order.activate!

      # Download and store the OVPN config file via Active Storage
      if provider_order_id.present?
        begin
          ovpn_content = client.download_ovpn(provider_order_id)
          @order.ovpn_config.attach(
            io: StringIO.new(ovpn_content),
            filename: "vpn-#{provider_order_id}.ovpn",
            content_type: 'application/x-openvpn-profile'
          )
          Rails.logger.info("Stored OVPN config for order #{@order.id} (provider: #{provider_order_id})")
        rescue StandardError => e
          Rails.logger.warn("Failed to download/store OVPN config for order #{@order.id}: #{e.message}")
        end
      end

      # Send credentials email — deferred to after commit
      owner = @actor || @order.orderable
      saved_order = @order
      ActiveRecord.after_all_transactions_commit do
        InvoiceMailer.with(order: saved_order, owner: owner, api_response: response).api_proxy_credentials_email.deliver_later
      end
      return
    end

    # Generate VPN credentials (for local inventory fallback)
    username = "vpn_#{SecureRandom.hex(4)}"
    password = SecureRandom.hex(12)

    # Store VPN credentials
    # Create the VpnOrder first (similar to VmOrder)
    # VpnOrder schema: country_code, myproxyapi_order_id, order_id, status (no quantity column)
    vpn_order = VpnOrder.create!(
      order: @order,
      country_code: @product.metadata&.dig('country_code') || 'US',
      status: 'active'
    )

    # Vpn schema uses vpn_username / vpn_password (not username / password)
    # There is no server_ip column — store the server in metadata if needed
    vpn_account = Vpn.create!(
      vpn_order: vpn_order,
      vpn_username: username,
      vpn_password: password,
      status: 'active',
      metadata: { server: @product.metadata&.dig('server') }.merge(service_renewal_metadata)
    )

    target_email = @order.metadata&.dig('credentials_email').presence
    owner = @actor || @order.orderable
    saved_vpn_account = vpn_account
    ActiveRecord.after_all_transactions_commit do
      VpnMailer.with(
        owner: owner,
        vpn_account: saved_vpn_account,
        target_email: target_email
      ).credentials_email.deliver_later
    end

    @order.activate!
  end

  def save_specialized_proxy_records(category_slug, provider_order_id, response)
    return if response.blank?

    case category_slug
    when 'global-isp'
      GlobalIspProxyOrder.find_or_create_by!(order: @order) do |o|
        o.myproxyapi_order_id = provider_order_id
        o.target_section_id = @order.metadata['target_section_id'] || @order.metadata['targetSectionId'] || @product.metadata&.dig('target_section_id')
        o.target_id         = @order.metadata['target_id'] || @order.metadata['targetId'] || @product.metadata&.dig('target_id')
        o.metadata          = service_renewal_metadata
      end

      if response['ips'].is_a?(Array)
        response['ips'].each_with_index do |cred_string, idx|
          parts = cred_string.split(':')
          GlobalIspProxy.create!(
            order: @order,
            myproxyapi_order_id: provider_order_id,
            ip_address: parts[0],
            port: parts[1],
            username: parts[2],
            password: parts[3],
            country_code: @order.metadata['selected_country_id'] || @order.metadata['countryCode'] || @order.metadata['country_code'] || @product.metadata&.dig('country_code'),
            city: response.dig('ips_info', idx)&.split(',')&.last&.strip,
            isp_name: response.dig('ips_info', idx)&.split(',')&.first&.strip,
            status: 'active',
            metadata: {
              original_cred: cred_string,
              info: response.dig('ips_info', idx),
              config: response['config']
            }.merge(service_renewal_metadata)
          )
        end
      else
        # Handle both single proxy and multiple proxies (array)
        proxies_data = response.is_a?(Array) ? response : [response]
        proxies_data.each do |p_data|
          GlobalIspProxy.create!(
            order: @order,
            myproxyapi_order_id: provider_order_id,
            ip_address: p_data['ip'] || p_data['ip_address'],
            port: p_data['port'],
            username: p_data['username'],
            password: p_data['password'],
            country_code: @order.metadata['selected_country_id'] || @order.metadata['countryCode'] || @order.metadata['country_code'] || @product.metadata&.dig('country_code'),
            city: p_data['city'],
            isp_name: p_data['isp'] || p_data['isp_name'],
            expires_at: p_data['expires_at'],
            metadata: p_data.merge(service_renewal_metadata)
          )
        end
      end
    when 'mobile'
      if response['ips'].is_a?(Array)
        m_order = MobileProxyOrder.find_or_create_by!(order: @order) do |mo|
          mo.myproxyapi_order_id = provider_order_id
          mo.quantity = response['ips'].size
          mo.status = 'active'
          mo.metadata = service_renewal_metadata
        end
        response['ips'].each_with_index do |cred_string, idx|
          parts = cred_string.split(':')
          MobileProxy.create!(
            order: @order,
            mobile_proxy_order: m_order,
            myproxyapi_order_id: provider_order_id,
            ip_address: parts[0],
            port: parts[1],
            username: parts[2],
            password: parts[3],
            status: 'active',
            metadata: {
              original_cred: cred_string,
              info: response.dig('ips_info', idx),
              config: response['config']
            }.merge(service_renewal_metadata)
          )
        end
      else
        proxies_data = response.is_a?(Array) ? response : [response]
        proxies_data.each do |p_data|
          # MobileProxyOrder needs to be created once per order
          m_order = MobileProxyOrder.find_or_create_by!(order: @order) do |mo|
            mo.myproxyapi_order_id = provider_order_id
            mo.quantity = proxies_data.size
            mo.status = 'active'
            mo.metadata = service_renewal_metadata
          end

          MobileProxy.create!(
            order: @order,
            mobile_proxy_order: m_order,
            myproxyapi_order_id: provider_order_id,
            ip_address: p_data['ip'] || p_data['ip_address'],
            username: p_data['username'],
            password: p_data['password'],
            port: p_data['port'],
            status: 'active',
            metadata: p_data.merge(service_renewal_metadata)
          )
        end
      end
    when 'isp', 'datacenter', 'premium-isp', 'static-residential', 'static_residential', 'premium_isp'
      proxy_order_class = case category_slug
                          when 'datacenter' then StaticDatacenterProxyOrder
                          when 'premium_isp', 'premium-isp' then PremiumIspProxyOrder
                          when 'static-residential', 'static_residential' then StaticResidentialProxyOrder
                          else StaticIspProxyOrder
                          end

      proxy_class = case category_slug
                    when 'datacenter' then StaticDatacenterProxy
                    when 'premium_isp', 'premium-isp' then PremiumIspProxy
                    when 'static-residential', 'static_residential' then StaticResidentialProxy
                    else StaticIspProxy
                    end

      # Create parent order record
      po = proxy_order_class.find_or_create_by!(order: @order) do |o|
        o.status = 'active' if o.respond_to?(:status=)
        o.metadata = service_renewal_metadata
      end
      fk = proxy_order_class.name.underscore + "_id"

      # Handle both Array and Hash responses
      records = response['ips'] || (response.is_a?(Array) ? response : [response])

      if records.is_a?(Array) && records.first.is_a?(String) && records.first.include?(':')
        records.each_with_index do |cred_string, idx|
          parts = cred_string.split(':')
          # Sometimes IP is missing from string ("::user:pass"), use top-level fields
          ip = parts[0].presence || response['ip'] || response['ip_address']
          port = parts[1].presence || response['port'] || response['http_port'] || response['socks5_port']

          proxy_class.create!(
            order_id: @order.id,
            fk => po.id,
            ip_address: ip,
            port: port,
            username: parts[2] || response['username'],
            password: parts[3] || response['password'],
            status: 'active',
            metadata: {
              original_cred: cred_string,
              info: response.dig('ips_info', idx) || response['info'],
              config: response['config']
            }.merge(service_renewal_metadata)
          )
        end
      else
        proxies_data = response.is_a?(Array) ? response : [response]
        proxies_data.each do |p_data|
          proxy_class.create!(
            order_id: @order.id,
            fk => po.id,
            ip_address: p_data['ip'] || p_data['ip_address'],
            port: p_data['port'] || p_data['http_port'] || p_data['socks5_port'],
            username: p_data['username'],
            password: p_data['password'],
            status: 'active',
            metadata: p_data.merge(service_renewal_metadata)
          )
        end
      end
    when 'residential-rotating', 'residential'
      order_data = response['order'] || response

      ro = ResidentialRotatingProxyOrder.find_or_create_by!(order: @order) do |o|
        o.myproxyapi_order_id = provider_order_id
        o.traffic_gb_total    = order_data['traffic_total_gb'] || (order_data['traffic_total'].to_f / (1024**3)).round(2)
        o.traffic_gb_used     = 0
        o.status              = 'active'
        o.traffic_expires_at  = order_data['end_time'] || order_data['expires_at']
        o.metadata            = service_renewal_metadata
      end

      # Use credentials generated by generate_v2_res_rot_proxy (v2 flow),
      # falling back to a single placeholder record for v1 orders.
      creds_array = @order.metadata&.dig('proxy_credentials') || []

      if creds_array.any?
        creds_array.each_with_index do |creds, idx|
          ResidentialRotatingProxy.create!(
            order: @order,
            residential_rotating_proxy_order: ro,
            myproxyapi_order_id: provider_order_id,
            main_username: creds['username'],
            main_password: creds['password'],
            hostname: creds['hostname'],
            port: creds['port'],
            traffic_gb_total: ro.traffic_gb_total,
            traffic_gb_used: 0,
            status: 'active',
            metadata: {
              credential_set: idx + 1,
              rotation_strategy: @order.metadata&.dig('rotation_strategy'),
              proxy_region: @order.metadata&.dig('proxy_region'),
              isp: @order.metadata['residentalRotatingConfig']&.dig('isp'),
              country: @order.metadata['residentalRotatingConfig']&.dig('country'),
              original_response: creds
            }.merge(service_renewal_metadata)
          )
        end
      else
        # v1 / non-v2 fallback: single placeholder representing pool access
        ResidentialRotatingProxy.create!(
          order: @order,
          residential_rotating_proxy_order: ro,
          myproxyapi_order_id: provider_order_id,
          traffic_gb_total: ro.traffic_gb_total,
          traffic_gb_used: 0,
          status: 'active',
          metadata: order_data.merge(service_renewal_metadata)
        )
      end
    end
  end
end
