# frozen_string_literal: true

class OrderProvisioningService
  class ProvisioningError < StandardError; end

  def initialize(order, user_or_reseller)
    @order = order
    @actor = user_or_reseller # Can be User or Reseller
    @product = order.product
  end

  def process!(skip_payment: false)
    return false unless @order.pending? || @order.awaiting_payment?

    ActiveRecord::Base.transaction do
      # 1. Price Calculation
      @order.calculate_total_amount
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

      # 3a. Send Invoice (New)
      InvoiceMailer.with(order: @order).invoice_email.deliver_later
    end
    
    # 4. Provision based on product type
    provision_product!

    # 5. Generate and store invoice PDF via Active Storage
    begin
      InvoicePdfService.new(@order).generate_and_attach!
    rescue => e
      Rails.logger.warn("Failed to generate invoice PDF for order #{@order.id}: #{e.message}")
    end
    
    # 6. Record reseller profit share (replaced affiliate commission)
    ResellerEarningsService.record_profit_share!(@order)
    
    NotificationService.notify(
      recipient: @actor,
      category: 'success',
      title: 'Order Completed',
      message: "Order ##{@order.order_number} has been successfully provisioned.",
      metadata: { order_id: @order.id }
    )

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

    NotificationService.notify(
      recipient: @actor,
      category: 'error',
      title: 'Order Failed',
      message: "Order ##{@order.order_number} failed to provision. Support has been notified.",
      metadata: { order_id: @order.id, error: e.message }
    )

    # Notify Employees (System Alert)
    Employee.where(active: true).find_each do |employee|
      NotificationService.notify(
        recipient: employee,
        category: 'system_alert',
        title: 'Provisioning Failure',
        message: "Order ##{@order.order_number} for #{@actor.try(:email) || @actor.try(:username)} failed: #{e.message}",
        metadata: { order_id: @order.id, actor_id: @actor.id, actor_type: @actor.class.name }
      )
    end

    raise e
  end

  private

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
    when 'proxy'
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

  # ========== VM Provisioning ==========
  def provision_vm!
    # Extract explicit user country selection or fallback to product default
    country = @order.metadata&.dig('countryCode').presence || @product.metadata&.dig('country_code') || 'US'

    # Create VM Order first
    vm_order = VmOrder.create!(
      order: @order,
      os_type: @product.metadata&.dig('os_template') || 'ubuntu-22-04',
      vm_type: @product.metadata&.dig('vm_type') || 'shared-cpu',
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
      vm_type: vm_order.vm_type
    )

    job_params = {
      'os_template' => vm_order.os_type,
      'cpu_cores' => vm_order.cpu_cores,
      'ram_gb' => vm_order.ram_gb,
      'storage_gb' => vm_order.disk_gb,
      'country_code' => vm_order.country_code
    }

    # Intercept non-Canadian VMs and bundle a localized proxy for Ansible configurations
    if vm_order.country_code.to_s.upcase != 'CA' && vm_order.country_code.to_s.upcase != 'CANADA'
      proxy_slug = @product.product_type == 'rdp' || @product.metadata&.dig('rdp').to_s == 'true' ? 'static-residential' : 'datacenter'

      # Find a base 1x product corresponding to the target slug
      proxy_pr = Product.joins(:product_category).where(product_categories: { slug: proxy_slug }, active: true).where('products.name LIKE ?', '1 x%').first
      if proxy_pr.nil?
        Rails.logger.error("Provisioning failure: No 1x #{proxy_slug} mapping available to satisfy VM proxy rule")
        raise ProvisioningError, "No localized proxy mapping available for country #{vm_order.country_code}"
      end

      # Execute MyProxyApi Purchase
      user_id = ENV.fetch('MY_PROXY_RESELLER_USER_ID', '1')
      begin
        client = MyProxyApiClient.new
        response = client.place_order(user_id: user_id, product_api_id: proxy_pr.provider_product_id, period: 1, protocol: 'http', locations: vm_order.country_code)

        # Store the API response metadata securely for recordkeeping
        @order.metadata ||= {}
        @order.metadata['my_proxy_api_response'] = response
        @order.save!

        # Attach to the Ansible Job params
        job_params['proxy_ip'] = response['ip']
        job_params['proxy_port'] = response['port'] || response['http_port'] || response['socks5_port']
        job_params['proxy_username'] = response['username']
        job_params['proxy_password'] = response['password']
        job_params['proxy_protocol'] = 'http'
        
        Rails.logger.info("Successfully provisioned intercept #{proxy_slug} proxy for VM '#{vm.id}' residing in #{vm_order.country_code}")
      rescue => e
        Rails.logger.error("Failed to provision intercept proxy for VM: #{e.message}")
        raise ProvisioningError, "Dependency error acquiring proxy for VM: #{e.message}"
      end
    end

    VmProvisioningJob.perform_later(vm.id, job_params)

    # Order stays in processing until job completes
  end

  # ========== Proxy Provisioning ==========
  def provision_proxy!
    case @product.provider_type
    when 'xproxy'
      XProxyService.new.provision(@order)
      @order.activate!

    when 'myproxyapi'
      # The frontend captures 'period' as GB Traffic amount for residential rotating, or months/days for others.
      period = @order.metadata['period'] || 1
      locations = @order.metadata['locationsString'] || 1
      client_ip = @order.metadata['client_ip']
      protocol = @order.metadata['protocol'] || 'http'
      api_id = @product.provider_product_id
      user_id = ENV.fetch('MY_PROXY_RESELLER_USER_ID', '1') # From API docs example user_id

      # Place the order via Reseller API for ALL myproxyapi products
      client = MyProxyApiClient.new
      response = client.place_order(user_id: user_id, product_api_id: api_id, period: period, protocol: protocol, locations: locations, whitelist_ip: client_ip)

      # Provider returns basic order info, but we need full details (IPs, etc.)
      # data: { order_id: "..." }
      provider_order_id = response.dig('data', 'order_id') || response['order_id']
      
      if provider_order_id.present?
        begin
          full_details = client.view_order(provider_order_id)
          # Store the detailed response (first item in data array)
          response = full_details['data'].is_a?(Array) ? full_details['data'].first : full_details['data']
        rescue => e
          Rails.logger.warn("Failed to fetch full order details for MyProxy order #{provider_order_id}: #{e.message}")
        end
      end

      # "put it in a metadata tag" -> store API payload/response in order metadata
      @order.metadata ||= {}
      @order.metadata['my_proxy_api_response'] = response
      @order.save!
      @order.activate!

      # Send credentials email using the API response data
      owner = @actor || @order.orderable
      InvoiceMailer.with(order: @order, owner: owner, api_response: response).api_proxy_credentials_email.deliver_later

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
      quantity: @order.quantity || 1
    )

    # Generate credentials
    username = "user_#{SecureRandom.hex(4)}"
    password = SecureRandom.hex(8)

    proxy.update!(
      status: 'assigned',
      username: username,
      password: password,
      order_id: @order.id,
      proxy_order_foreign_key => proxy_order.id
    )

    proxy
  end

  def send_proxy_credentials(proxy)
    owner = @actor || @order.orderable
    ProxyMailer.with(
      owner: owner,
      proxy: proxy,
      order: @order
    ).credentials_email.deliver_later
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
      raise ProvisioningError, "Minimum order quantity for USA eSIM #{provider} is #{moq} line(s). Requested: #{quantity}."
    end

    UsaEsimCredential.transaction do
      creds = UsaEsimCredential.lock("FOR UPDATE SKIP LOCKED").where(provider: provider, status: 'available').limit(quantity).to_a

      if creds.size < quantity
        raise ProvisioningError, "Insufficient stock for USA eSIM #{provider}. Requested: #{quantity}, Available: #{creds.size}."
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

      # Send credentials email
      UsaEsimMailer.with(owner: @actor, credentials: creds, order: @order).credentials_email.deliver_later

      @order.update!(status: 'active')
    end
  end

  # ========== VPN Provisioning ==========
  def provision_vpn!
    if @product.provider_type == 'myproxyapi'
      period = @order.metadata['period'] || 1
      locations = @order.metadata['locationsString'] || 1
      client_ip = @order.metadata['client_ip']
      protocol = @order.metadata['protocol'] || 'http'
      api_id = @product.provider_product_id
      user_id = ENV.fetch('MY_PROXY_RESELLER_USER_ID', '1')

      client = MyProxyApiClient.new
      response = client.place_order(user_id: user_id, product_api_id: api_id, period: period, protocol: protocol, locations: locations, whitelist_ip: client_ip)

      provider_order_id = response.dig('data', 'order_id') || response['order_id']
      
      if provider_order_id.present?
        begin
          full_details = client.view_order(provider_order_id)
          response = full_details['data'].is_a?(Array) ? full_details['data'].first : full_details['data']
        rescue => e
          Rails.logger.warn("Failed to fetch full order details for MyProxy VPN order #{provider_order_id}: #{e.message}")
        end
      end

      @order.metadata ||= {}
      @order.metadata['my_proxy_api_response'] = response
      @order.save!
      @order.activate!

      # Download and store the OVPN config file via Active Storage
      provider_order_id = response.dig('order', 'order_id') || response.dig('data', 'order_id') || provider_order_id
      if provider_order_id.present?
        begin
          ovpn_content = client.download_ovpn(provider_order_id)
          @order.ovpn_config.attach(
            io: StringIO.new(ovpn_content),
            filename: "vpn-#{provider_order_id}.ovpn",
            content_type: 'application/x-openvpn-profile'
          )
          Rails.logger.info("Stored OVPN config for order #{@order.id} (provider: #{provider_order_id})")
        rescue => e
          Rails.logger.warn("Failed to download/store OVPN config for order #{@order.id}: #{e.message}")
        end
      end

      # Send credentials email
      owner = @actor || @order.orderable
      InvoiceMailer.with(order: @order, owner: owner, api_response: response).api_proxy_credentials_email.deliver_later
      return
    end

    # Generate VPN credentials (for local inventory fallback)
    username = "vpn_#{SecureRandom.hex(4)}"
    password = SecureRandom.hex(12)

    # Store VPN credentials
    # Create the VpnOrder first (similar to VmOrder)
    vpn_order = VpnOrder.create!(
      order: @order,
      country_code: @product.metadata&.dig('country_code') || 'US',
      quantity: 1,
      status: 'active'
    )

    vpn_account = Vpn.create!(
      vpn_order: vpn_order,
      username: username,
      password: password,
      server_ip: @product.metadata&.dig('server') || '192.168.1.1',
      status: 'active'
    )

    owner = @actor || @order.orderable
    VpnMailer.with(owner: owner, vpn_account: vpn_account).credentials_email.deliver_later

    @order.activate!
  end
end
