# frozen_string_literal: true

module Web
  module Api
    class OrdersController < BaseController
      include JwtAuthenticated

      # Set by provisioning for staff; never shown to customers.
      INTERNAL_ORDER_METADATA_KEYS = %w[meisim_error meisim_review_required].freeze

      # GET /web/api/orders
      def index
        scope = current_actor.orders.includes(:product, :product_pricing)

        if params[:product_type].present?
          types = params[:product_type].split(',')
          if types.include?('proxy')
            proxy_types = %w[proxy datacenter isp static_residential residential_rotating premium_isp mobile global_isp]
            types = (types - ['proxy'] + proxy_types).uniq
          end
          scope = scope.joins(:product).where(products: { product_type: types })
        end

        if params[:category_slug].present?
          slugs = params[:category_slug].split(',')
          scope = scope.joins(product: :product_category).where(product_categories: { slug: slugs })
        end

        orders = scope.order(created_at: :desc).page(params[:page]).per(params[:per_page] || 20)
        render json: {
          orders: orders.map { |o| serialize_order(o) },
          meta: pagination_meta(orders)
        }
      end

      # GET /web/api/orders/stats
      def stats
        orders = current_actor.orders

        # Apply time range if provided
        if params[:range].present? && params[:range] != 'all'
          days = params[:range].to_i
          days = 30 if days.zero? # fallback
          orders = orders.where('orders.created_at >= ?', days.days.ago)
        end

        # Normalize status names for frontend
        active_statuses = %w[active processing completed delivered allocated]
        pending_statuses = %w[pending provisioning awaiting_payment]
        expired_statuses = %w[expired suspended cancelled]
        failed_statuses = %w[failed error stopped]

        # Single query for counts by status
        counts_by_status = orders.group(:status).count

        active_count = 0
        pending_count = 0
        expired_count = 0
        failed_count = 0

        total_orders = 0
        counts_by_status.each do |status, count|
          total_orders += count
          if active_statuses.include?(status)
            active_count += count
          elsif pending_statuses.include?(status)
            pending_count += count
          elsif expired_statuses.include?(status)
            expired_count += count
          elsif failed_statuses.include?(status)
            failed_count += count
          end
        end

        # Single query for type statistics (counts and revenue)
        type_counts = orders.joins(:product).group('products.product_type', :status).count
        type_revenues = orders.joins(:product).group('products.product_type').sum(:total_amount)

        type_stats = {}
        %w[proxy vpn vps esim rdp].each do |type|
          type_stats[type] = {
            total: 0,
            active: 0,
            pending: 0,
            expired: 0,
            failed: 0,
            revenue: type_revenues[type].to_f
          }
        end

        type_counts.each do |(type, status), count|
          # Map sub-types to main categories for the dashboard cards
          category = case type
                     when 'datacenter', 'isp', 'static_residential', 'residential_rotating', 'premium_isp', 'mobile', 'global_isp'
                       'proxy'
                     else
                       type
                     end

          next unless type_stats.key?(category)

          type_stats[category][:total] += count
          if active_statuses.include?(status)
            type_stats[category][:active] += count
          elsif pending_statuses.include?(status)
            type_stats[category][:pending] += count
          elsif expired_statuses.include?(status)
            type_stats[category][:expired] += count
          elsif failed_statuses.include?(status)
            type_stats[category][:failed] += count
          end
        end

        current_month = Time.current.beginning_of_month
        last_month = 1.month.ago.beginning_of_month

        total_spent = orders.sum(:total_amount).to_f
        monthly_spending = orders.where('orders.created_at >= ?', current_month).sum(:total_amount).to_f
        last_month_spending = orders.where(orders: { created_at: last_month...current_month }).sum(:total_amount).to_f

        recent_orders = orders.includes(:product).order('orders.created_at' => :desc).limit(10).map do |o|
          {
            id: o.id,
            status: o.status,
            total_amount: o.total_amount,
            created_at: o.created_at,
            product_type: o.product&.product_type,
            product_name: o.product&.name
          }
        end

        render json: {
          total_orders: total_orders,
          active_services: active_count,
          pending_orders: pending_count,
          total_spent: total_spent,
          monthly_spending: monthly_spending,
          last_month_spending: last_month_spending,
          available_balance: current_actor.wallet&.balance.to_f,
          type_stats: type_stats,
          recent_orders: recent_orders
        }
      end

      # GET /web/api/orders/:id
      def show
        order = current_actor.orders.find(params[:id])
        render json: serialize_order(order)
      end

      # POST /web/api/orders
      def create
        product = Product.for_ecommerce.find(params[:product_id])
        pricing = product.product_pricings.find_by(active: true)
        payment_method = params[:payment_method] || 'wallet' # 'wallet' or 'gateway'
        promo_code_input = params[:promo_code]&.strip&.upcase

        # Extract frontend parameters
        meta = params[:metadata] || {}
        meta[:period] = params[:period] if params[:period].present?
        meta[:locationsString] = params[:locationsString] if params[:locationsString].present?
        meta[:protocol] = params[:protocol] if params[:protocol].present?
        meta[:target_section_id] = params[:target_section_id] if params[:target_section_id].present?
        meta[:target_id] = params[:target_id] if params[:target_id].present?
        meta[:resi] = params[:resi] if params[:resi].present?
        meta[:residentalRotatingConfig] = params[:residentalRotatingConfig] if params[:residentalRotatingConfig].present?
        meta[:locationId] = params[:locationId] if params[:locationId].present?
        meta[:selected_country_id] = params[:selected_country_id] if params[:selected_country_id].present?

        # Support frontend-specific keys for Global ISP
        meta[:globalCountry] = params[:globalCountry] if params[:globalCountry].present?
        meta[:globalTarget] = params[:globalTarget] if params[:globalTarget].present?
        meta[:globalTargetSectionId] = params[:globalTargetSectionId] if params[:globalTargetSectionId].present?

        meta[:client_ip] = request.remote_ip # Capture client IP for MyProxyAPI whitelist_ip requirement
        meta[:payment_debug] = payment_method == 'wallet' ? 'balance' : (params[:gateway] || 'rexpay')

        # Create order
        order = Order.new(
          orderable: current_actor,
          product: product,
          product_pricing: pricing,
          quantity: params[:quantity] || 1,
          metadata: meta,
          status: 'pending'
        )

        return render json: { errors: order.errors }, status: :unprocessable_entity unless order.save

        original_total = order.total_amount.to_f

        # ── Apply Promo Code or Affiliate discount ──────────────────────────────
        promo_discount = 0
        promo_code_record = nil
        affiliate_record = nil
        applied_code_string = nil

        if promo_code_input.present?
          promo_code_record = PromoCode.find_by('UPPER(code) = ?', promo_code_input)

          if promo_code_record.present?
            if !promo_code_record.usable?
              order.destroy
              return render json: { error: 'This promo code has expired or reached its usage limit' }, status: :unprocessable_entity
            else
              promo_discount = promo_code_record.calculate_discount(original_total)
              applied_code_string = promo_code_record.code
            end
          else
            affiliate_record = Affiliate.active.find_by('UPPER(referral_code) = ?', promo_code_input)
            if affiliate_record.present?
              if current_actor.respond_to?(:affiliate_referrals) && current_actor.affiliate_referrals.pending.exists?
                order.destroy
                return render json: { error: 'You are already receiving an affiliate discount automatically.' }, status: :unprocessable_entity
              end
              promo_discount = affiliate_record.calculate_discount(original_total)
              applied_code_string = affiliate_record.referral_code
            else
              order.destroy
              return render json: { error: 'Invalid promo code' }, status: :unprocessable_entity
            end
          end
        end

        final_amount = [original_total - promo_discount, 0].max.round(2)

        # Update order total and metadata to reflect discount
        if promo_discount.positive?
          order.update_columns(
            total_amount: final_amount,
            metadata: order.metadata.merge(
              'promo_code' => applied_code_string,
              'promo_discount' => promo_discount,
              'original_total' => original_total
            )
          )
        end

        if payment_method == 'wallet'
          # Pay from wallet balance
          wallet = current_actor.wallet

          if wallet.nil? || wallet.balance < final_amount
            order.update(status: 'failed')
            return render json: { error: "Insufficient balance. Required: $#{final_amount}, Available: $#{wallet&.balance || 0}" },
                          status: :payment_required
          end

          # Deduct balance and provision
          begin
            ActiveRecord::Base.transaction do
              # Record promo code usage
              promo_code_record&.record_use! if promo_discount.positive?
            end

            # Provision in the background. Provisioning can take minutes — the
            # provider needs time to assign IPs (OrderProvisioningService sleeps
            # while polling) — so it must NOT run inline, or the web/proxy timeout
            # kills it mid-provision and strands the order in `processing`. The
            # job's process! performs the wallet debit + provisioning.
            OrderProvisioningJob.perform_later(order.id, current_actor.id, current_actor.class.name)
            render json: serialize_order(order.reload).merge(
              available_balance: current_actor.wallet&.balance.to_f,
              promo_discount: promo_discount.positive? ? promo_discount : nil
            ), status: :created
          rescue StandardError => e
            order.fail! if order.may_fail?
            render json: { error: e.message }, status: :unprocessable_entity
          end

        else
          # Redirect to payment gateway
          gateway = params[:gateway] || 'rexpay'

          # Record promo code usage for gateway payments
          promo_code_record&.record_use! if promo_discount.positive?

          payment_data = generate_order_payment_link(gateway, order, final_amount)

          render json: {
            order: serialize_order(order),
            payment_url: payment_data[:url],
            payment_amount: payment_data[:amount],
            payment_currency: payment_data[:currency],
            promo_discount: promo_discount.positive? ? promo_discount : nil,
            message: 'Complete payment to activate order'
          }, status: :accepted
        end
      end

      # POST /web/api/orders/checkout_cart
      def checkout_cart
        items = params[:items] || []
        payment_method = params[:payment_method] || 'wallet'
        gateway = params[:gateway] || 'rexpay'
        promo_code_input = params[:promo_code]&.strip&.upcase

        return render json: { error: 'Cart is empty' }, status: :bad_request if items.empty?

        # Calculate total
        total_amount = 0
        orders_to_create = []

        items.each do |item|
          product = Product.for_ecommerce.find_by(id: item[:product_id] || item['product_id'])
          next unless product

          # Use active pricing or default to unit price logic if dynamic
          pricing = product.product_pricings.find_by(active: true) || product.product_pricings.first

          # Determine debug label: wallet = 'balance', gateway = gateway name
          payment_debug = payment_method == 'wallet' ? 'balance' : gateway

          order = Order.new(
            orderable: current_actor,
            product: product,
            product_pricing: pricing,
            quantity: item[:quantity] || item['quantity'] || 1,
            metadata: (item[:metadata] || item['metadata'] || {}).merge(
              'client_ip' => request.remote_ip,
              'payment_debug' => payment_debug,
              'period' => item[:period] || item['period'] || item.dig(:metadata, :period) || item.dig('metadata', 'period'),
              'locationId' => item[:locationId] || item['locationId'] || item.dig(:metadata, :locationId) || item.dig('metadata', 'locationId'),
              'locationsString' => item[:locationsString] || item['locationsString'] || item.dig(:metadata, :locationsString) || item.dig('metadata', 'locationsString'),
              'protocol' => item[:protocol] || item['protocol'] || item.dig(:metadata, :protocol) || item.dig('metadata', 'protocol'),
              'target_section_id' => item[:target_section_id] || item['target_section_id'],
              'target_id' => item[:target_id] || item['target_id'],
              'resi' => item[:resi] || item['resi'],
              'selected_country_id' => item[:selected_country_id] || item['selected_country_id'],
              'globalCountry' => item[:globalCountry] || item['globalCountry'],
              'globalTarget' => item[:globalTarget] || item['globalTarget'],
              'globalTargetSectionId' => item[:globalTargetSectionId] || item['globalTargetSectionId'],
              'residentalRotatingConfig' => item[:residentalRotatingConfig] || item['residentalRotatingConfig'],
              'auto_renew' => item[:metadata]&.[](:auto_renew) || item['metadata']&.[]('auto_renew')
            ).compact,
            status: 'pending'
          )

          order.calculate_total_amount # Securely recalculate based on backend logic
          total_amount += order.total_amount.to_f
          orders_to_create << order
        end

        if orders_to_create.empty?
          return render json: { error: 'Invalid items or products not found' },
                        status: :unprocessable_entity
        end

        # ── Apply Promo Code or Affiliate discount ──────────────────────────────
        promo_discount = 0
        promo_code_record = nil
        nil
        applied_code_string = nil

        if promo_code_input.present?
          promo_code_record = PromoCode.find_by('UPPER(code) = ?', promo_code_input)

          if promo_code_record.present?
            return render json: { error: 'This promo code has expired or reached its usage limit' }, status: :unprocessable_entity unless promo_code_record.usable?

            promo_discount = promo_code_record.calculate_discount(total_amount)
            applied_code_string = promo_code_record.code

          else
            affiliate_record = Affiliate.active.find_by('UPPER(referral_code) = ?', promo_code_input)
            return render json: { error: 'Invalid promo code' }, status: :unprocessable_entity unless affiliate_record.present?
            if current_actor.respond_to?(:affiliate_referrals) && current_actor.affiliate_referrals.pending.exists?
              return render json: { error: 'You are already receiving an affiliate discount automatically.' }, status: :unprocessable_entity
            end

            promo_discount = affiliate_record.calculate_discount(total_amount)
            applied_code_string = affiliate_record.referral_code

          end
        end

        # ── Affiliate Referral discount (informational) ───────────
        # NOTE: PricingService.calculate_total already applies the affiliate
        # discount to each order's total_amount, so we do NOT subtract it again.
        # We only track the referral for commission recording and display.
        affiliate_discount = 0
        referral = current_actor.affiliate_referrals.pending.first if current_actor.respond_to?(:affiliate_referrals)
        if referral && !AffiliateService.halted?
          affiliate = referral.affiliate
          discount_pct = affiliate.discount_rate / 100.0
          # Calculate what the affiliate discount was (for display/metadata)
          # This amount is already baked into total_amount by PricingService
          affiliate_discount = (total_amount * discount_pct / (1.0 - discount_pct)).round(2)
        end

        # Calculate final amount — only promo discount is subtracted here
        # (affiliate discount is already in each order's total_amount)
        total_discount = promo_discount
        final_amount = [total_amount - promo_discount, 0].max.round(2)

        if payment_method == 'wallet'
          wallet = current_actor.wallet
          if wallet.nil? || wallet.balance < final_amount
            return render json: { error: "Insufficient balance. Required: $#{final_amount}, Available: $#{wallet&.balance || 0}" },
                          status: :payment_required
          end

          created_orders = []
          ActiveRecord::Base.transaction do
            # Create all orders
            orders_to_create.each(&:save!)

            # Distribute discounts proportionally across orders so each order's
            # total_amount reflects the discounted price the system should use.
            if total_discount.positive?
              remaining_discount = total_discount
              orders_to_create.each_with_index do |order, idx|
                if idx == orders_to_create.size - 1
                  # Last order gets the remainder to avoid rounding drift
                  order_discount = remaining_discount
                else
                  proportion = order.total_amount.to_f / total_amount
                  order_discount = (total_discount * proportion).round(2)
                  remaining_discount -= order_discount
                end

                new_total = [order.total_amount.to_f - order_discount, 0].max.round(2)
                order.update_columns(
                  total_amount: new_total,
                  metadata: order.metadata.merge(
                    'promo_code' => applied_code_string,
                    'promo_discount' => promo_discount.positive? ? promo_discount : nil,
                    'affiliate_discount' => affiliate_discount.positive? ? affiliate_discount : nil,
                    'original_total' => order.total_amount_before_type_cast
                  ).compact
                )
              end
            end

            # Record promo code usage
            promo_code_record&.record_use! if promo_discount.positive?

            # Record affiliate referral conversion
            if referral && affiliate_discount.positive?
              referral.update!(referee_discount_applied: affiliate_discount)
            end

            transaction = Transaction.create!(
              transactable: current_actor,
              reference: current_actor, # Virtual cart, self-reference
              amount: final_amount,
              transaction_type: 'debit',
              status: 'success',
              currency: 'USD',
              payment_gateway: 'wallet',
              description: "Virtual Cart Checkout (#{orders_to_create.count} items)#{promo_discount.positive? ? " | Promo: -$#{promo_discount}" : ''}#{affiliate_discount.positive? ? " | Referral: -$#{affiliate_discount}" : ''}",
              metadata: { order_ids: orders_to_create.map(&:id) }
            )

            wallet.debit!(final_amount, 'Cart Checkout', {}, transaction)

            # Record affiliate commission after successful checkout
            if referral && !AffiliateService.halted?
              orders_to_create.each do |order|
                AffiliateService.record_commission!(order)
              end
            end
          end

          # Provision in the background. Provisioning can take minutes — the
          # provider needs time to assign IPs (OrderProvisioningService sleeps
          # while polling) — so it must NOT run inline in the request, or the
          # web/proxy timeout kills it mid-provision and strands the order in
          # `processing` (charged, no proxy). Balance was already debited above,
          # hence skip_payment: true.
          orders_to_create.each do |order|
            OrderProvisioningJob.perform_later(order.id, current_actor.id, current_actor.class.name, skip_payment: true)
            created_orders << order
          end

          render json: {
            message: 'Checkout successful',
            orders: created_orders.map { |o| serialize_order(o.reload) },
            available_balance: current_actor.wallet&.balance.to_f,
            promo_discount: promo_discount.positive? ? promo_discount : nil,
            affiliate_discount: affiliate_discount.positive? ? affiliate_discount : nil,
            total_discount: total_discount.positive? ? total_discount : nil
          }, status: :created
        else
          # Gateway
          checkout_session = nil

          ActiveRecord::Base.transaction do
            checkout_session = CheckoutSession.create!(
              orderable: current_actor,
              total_amount: final_amount,
              payment_method: gateway,
              status: 'pending',
              metadata: {
                item_count: orders_to_create.count,
                items: items,
                promo_code: promo_code_record&.code,
                promo_discount: promo_discount.positive? ? promo_discount : nil,
                affiliate_discount: affiliate_discount.positive? ? affiliate_discount : nil,
                original_total: total_amount,
                final_total: final_amount
              }
            )

            checkout_session.generate_reference!

            # Record promo code usage upfront for gateway payments
            promo_code_record&.record_use! if promo_discount.positive?
          end

          payment_data = generate_session_payment_link(gateway, checkout_session, final_amount)

          unless payment_data && payment_data[:url]
            raise StandardError, "Failed to generate payment link from #{gateway}. Check gateway credentials or logs."
          end

          render json: {
            message: 'Complete payment to activate orders',
            payment_url: payment_data[:url],
            payment_amount: payment_data[:amount],
            payment_currency: payment_data[:currency],
            reference: checkout_session.gateway_reference,
            checkout_session_id: checkout_session.id,
            promo_discount: promo_discount.positive? ? promo_discount : nil,
            affiliate_discount: affiliate_discount.positive? ? affiliate_discount : nil,
            total_discount: total_discount.positive? ? total_discount : nil
          }, status: :accepted
        end
      rescue StandardError => e
        Rails.logger.error("Cart Checkout Error: #{e.message}")
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # GET /web/api/orders/:id/credentials
      def credentials
        order = current_actor.orders.find(params[:id])

        return render json: { error: 'Order not active' }, status: :bad_request unless order.status == 'active'

        case order.product.product_type
        when 'vps', 'rdp'
          vm = order.vm
          render json: {
            type: 'vm',
            host: vm&.dns_name || vm&.ip_address,
            username: vm&.ssh_username,
            password: vm&.ssh_password,
            ssh_port: vm&.ssh_port || 22,
            status: vm&.status
          }
        when 'proxy'
          service = ProxyManagementService.new(order)
          creds = service.credentials
          if creds
            render json: creds
          else
            proxy = order.proxy
            render json: {
              type: 'proxy',
              ip: proxy&.ip_address,
              port: proxy&.port,
              username: proxy&.username,
              password: proxy&.password,
              protocol: proxy&.protocol
            }
          end
        when 'esim'
          esim = order.esim_order&.esim
          render json: {
            type: 'esim',
            iccid: esim&.iccid,
            qr_code: esim&.qr_code_data,
            activation_code: esim&.activation_code,
            phone_number: esim&.msisdn,
            pin1: esim&.pin1,
            puk1: esim&.puk1
          }
        when 'vpn'
          if order.product.provider_type == 'myproxyapi' && order.metadata['my_proxy_api_response'].present?
            api_res = order.metadata['my_proxy_api_response']
            render json: {
              type: 'vpn',
              server: api_res['server'] || api_res['ip'] || api_res['host'],
              protocol: api_res['protocol'] || 'VPN',
              username: api_res['username'],
              password: api_res['password']
            }
          else
            vpn = order.vpn_account
            render json: {
              type: 'vpn',
              server: vpn&.server,
              protocol: vpn&.protocol,
              username: vpn&.username,
              password: vpn&.password
            }
          end
        else
          render json: { error: 'No credentials available' }, status: :not_found
        end
      end

      # POST /web/api/orders/:id/renew
      def renew
        order = current_actor.orders.find(params[:id])

        begin
          service = OrderRenewalService.new(order, current_actor)
          if service.process!
            render json: { message: 'Order renewed successfully', order: serialize_order(order) }
          else
            render json: { error: 'Renewal failed' }, status: :unprocessable_entity
          end
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # POST /web/api/orders/:id/reorder
      def reorder
        order = current_actor.orders.find(params[:id])

        unless order.reorderable?(current_actor)
          return render json: { error: 'Reordering this expired external product is not allowed for resellers.' },
                        status: :forbidden
        end

        # Reordering creates a NEW order based on the old one
        new_order = Order.new(
          orderable: current_actor,
          product: order.product,
          product_pricing: order.product_pricing,
          quantity: order.quantity,
          metadata: order.metadata.merge(is_reorder: true, original_order_id: order.id),
          status: 'pending'
        )

        if new_order.save
          begin
            # If they have balance, provision in the background (provider IP
            # assignment makes provisioning take minutes — running it inline lets
            # the web/proxy timeout strand the order in `processing`). The job's
            # process! performs the wallet debit + provisioning.
            if current_actor.wallet&.balance.to_f >= new_order.total_amount
              OrderProvisioningJob.perform_later(new_order.id, current_actor.id, current_actor.class.name)
              render json: serialize_order(new_order.reload), status: :created
            else
              render json: {
                order: serialize_order(new_order),
                error: 'Insufficient balance for automatic processing. Please top up.'
              }, status: :accepted
            end
          rescue StandardError => e
            new_order.fail! if new_order.may_fail?
            render json: { error: e.message }, status: :unprocessable_entity
          end
        else
          render json: { errors: new_order.errors }, status: :unprocessable_entity
        end
      end

      # POST /web/api/orders/:id/update_subscription
      def update_subscription
        order = current_actor.orders.find(params[:id])
        auto_renew = params[:auto_renew]
        renewal_method = params[:renewal_method]

        ActiveRecord::Base.transaction do
          # Update order metadata
          order.metadata['auto_renew'] = ActiveRecord::Type::Boolean.new.cast(auto_renew) if params.key?(:auto_renew)
          order.metadata['renewal_method'] = renewal_method if renewal_method.present?
          order.save!

          # Update all provisioned resources metadata
          order.all_provisioned_resources.each do |resource|
            resource.metadata ||= {}
            resource.metadata['auto_renew'] = order.metadata['auto_renew'] if params.key?(:auto_renew)
            resource.metadata['renewal_method'] = order.metadata['renewal_method'] if renewal_method.present?
            resource.save!
          end
        end

        render json: {
          message: 'Subscription settings updated successfully',
          order: serialize_order(order.reload)
        }
      end

      # GET /web/api/orders/:id/download_ovpn
      def download_ovpn
        order = current_actor.orders.find(params[:id])

        unless order.product.product_type == 'vpn' && order.product.provider_type == 'myproxyapi'
          return render json: { error: 'OVPN download not available for this order' }, status: :bad_request
        end

        # Serve from Active Storage if already cached
        if order.ovpn_config.attached?
          send_data order.ovpn_config.download,
                    filename: order.ovpn_config.filename.to_s,
                    type: order.ovpn_config.content_type,
                    disposition: 'attachment'
          return
        end

        # Fallback: fetch from API and store for future requests
        api_res = order.metadata['my_proxy_api_response']
        provider_order_id = api_res&.dig('order',
                                         'order_id') || api_res&.dig('order_id') || api_res&.dig('data', 'order_id')

        unless provider_order_id.present?
          return render json: { error: 'Provider order ID not found' }, status: :not_found
        end

        begin
          client = MyProxyApiClient.new
          ovpn_content = client.download_ovpn(provider_order_id)

          order.ovpn_config.attach(
            io: StringIO.new(ovpn_content),
            filename: "vpn-#{provider_order_id}.ovpn",
            content_type: 'application/x-openvpn-profile'
          )

          send_data ovpn_content,
                    filename: "vpn-#{provider_order_id}.ovpn",
                    type: 'application/x-openvpn-profile',
                    disposition: 'attachment'
        rescue StandardError => e
          render json: { error: "Failed to download OVPN: #{e.message}" }, status: :service_unavailable
        end
      end

      # GET /web/api/orders/:id/download_invoice
      def download_invoice
        order = current_actor.orders.find(params[:id])

        # Serve from Active Storage if already generated
        if order.invoice_pdf.attached?
          send_data order.invoice_pdf.download,
                    filename: order.invoice_pdf.filename.to_s,
                    type: 'application/pdf',
                    disposition: 'attachment'
          return
        end

        # Generate on-demand and store
        begin
          InvoicePdfService.new(order).generate_and_attach!
          send_data order.invoice_pdf.download,
                    filename: order.invoice_pdf.filename.to_s,
                    type: 'application/pdf',
                    disposition: 'attachment'
        rescue StandardError => e
          render json: { error: "Failed to generate invoice: #{e.message}" }, status: :service_unavailable
        end
      end

      # POST /web/api/orders/:id/change_protocol
      def change_protocol
        order = current_actor.orders.find(params[:id])
        begin
          result = ProxyManagementService.new(order).change_protocol(params[:protocol])
          render json: result
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # POST /web/api/orders/:id/update_credentials
      def update_credentials
        order = current_actor.orders.find(params[:id])
        begin
          result = ProxyManagementService.new(order).update_credentials(params[:username], params[:password])
          render json: result.merge(order: serialize_order(order.reload))
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # POST /web/api/orders/:id/rotate_ip
      def rotate_ip
        order = current_actor.orders.find(params[:id])
        begin
          result = ProxyManagementService.new(order).rotate_ip
          render json: result.merge(order: serialize_order(order.reload))
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # POST /web/api/orders/:id/whitelist
      def whitelist_add
        order = current_actor.orders.find(params[:id])
        begin
          result = ProxyManagementService.new(order).whitelist_add(params[:ip], params[:description])
          render json: result
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # DELETE /web/api/orders/:id/whitelist
      def whitelist_delete
        order = current_actor.orders.find(params[:id])
        begin
          result = ProxyManagementService.new(order).whitelist_delete(params[:ip])
          render json: result
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # GET /web/api/orders/:id/download_rdp_config
      def download_rdp_config
        order = current_actor.orders.find(params[:id])

        unless %w[vps rdp vm].include?(order.product.product_type)
          return render json: { error: 'RDP config not available for this order type' }, status: :bad_request
        end

        # Serve from Active Storage if cached
        if order.rdp_config.attached?
          send_data order.rdp_config.download,
                    filename: order.rdp_config.filename.to_s,
                    type: 'application/rdp',
                    disposition: 'attachment'
          return
        end

        # Generate on-demand from VM data
        vm = order.vm
        unless vm&.ip_address.present?
          return render json: { error: 'VM is not yet provisioned or has no IP address' }, status: :not_found
        end

        begin
          RdpConfigService.new(vm).generate_and_attach!(order)
          send_data order.rdp_config.download,
                    filename: order.rdp_config.filename.to_s,
                    type: 'application/rdp',
                    disposition: 'attachment'
        rescue StandardError => e
          render json: { error: "Failed to generate RDP config: #{e.message}" }, status: :service_unavailable
        end
      end

      # POST /web/api/orders/:id/claim_crypto_refund
      def claim_crypto_refund
        order = current_actor.orders.find(params[:id])
        address = params[:address]
        network = params[:network]

        return render json: { error: 'Address is required' }, status: :unprocessable_entity if address.blank?

        order.with_lock do
          if order.status != 'failed'
            return render json: { error: 'Order must be failed to claim refund' }, status: :unprocessable_entity
          end

          checkout = order.checkout_session
          unless %w[plisio hundredpay heleket].include?(checkout&.gateway)
            return render json: { error: 'This order does not qualify for a crypto refund.' }, status: :unprocessable_entity
          end

          # Failsafe for external API products
          is_external_api_product = %w[proxy vpn].include?(order.product.product_type)
          if is_external_api_product && order.provider_order_id.present?
            # API processed it, block crypto withdrawal and open ticket
            ticket = current_actor.tickets.create!(
              subject: "Crypto Refund Request Intercepted - External Order ##{order.order_number}",
              priority: 'high',
              order_id: order.id,
              user_type: current_actor.is_a?(Reseller) ? 'reseller' : 'user'
            )
            ticket.ticket_messages.create!(
              sender: current_actor,
              body: "Automated Crypto Refund Blocked: Order failed locally but was processed externally (Provider Order ID: #{order.provider_order_id}). Attempted crypto address: #{address} (#{network}). Please review manually."
            )
            NotificationService.notify_staff(
              category: 'warning',
              title: 'Crypto Refund Intercepted',
              message: "#{current_actor.email} attempted crypto refund for processed external order ##{order.order_number}.",
              metadata: { order_id: order.id, ticket_id: ticket.id }
            )
            return render json: { error: 'This order was processed by our external provider. For security, automated crypto refunds are blocked. A support ticket has been created for manual review.' }, status: :unprocessable_entity
          end

          # Dispatch actual crypto withdrawal
          begin
            case checkout.gateway
            when 'plisio'
              PlisioService.new.withdraw(order.total_amount, network || 'USDT', address, "REFUND-#{order.order_number}")
            when 'heleket'
              HeleketService.new.create_withdrawal(order.total_amount, network || 'USDT', address)
            when 'hundredpay'
              return render json: { error: 'HundredPay refunds must be claimed via support momentarily.' }, status: :unprocessable_entity
            end

            # Atomically mark refunded
            order.refund!
            record_audit_log('order.crypto_refund_claimed', order, { address: address, network: network })

            render json: { message: 'Crypto refund successfully claimed and dispatched.' }
          rescue StandardError => e
            render json: { error: "Failed to dispatch crypto refund: #{e.message}" }, status: :service_unavailable
          end
        end
      end

      # POST /web/api/orders/:id/refund
      # Allows users to refund failed orders. External API products are intercepted if already processed.
      def refund
        order = current_actor.orders.find(params[:id])

        unless order.failed?
          return render json: { error: 'Order is not in a failed state. Only failed orders can be refunded.' }, status: :unprocessable_entity
        end

        is_external_api_product = %w[proxy vpn].include?(order.product.product_type)

        if is_external_api_product && order.provider_order_id.present?
          # Intercept: API processed it, we can't auto-refund without manual check
          begin
            ActiveRecord::Base.transaction do
              ticket = current_actor.tickets.create!(
                subject: "Refund Request for Processed External Order ##{order.order_number}",
                priority: 'high',
                order_id: order.id,
                user_type: current_actor.is_a?(Reseller) ? 'reseller' : 'user'
              )
              ticket.ticket_messages.create!(
                sender: current_actor,
                body: "Automated Refund Request: This order failed locally but was processed by the external API (Provider Order ID: #{order.provider_order_id}). Manual review required."
              )

              NotificationService.notify_staff(
                category: 'warning',
                title: 'Manual User Refund Required',
                message: "#{current_actor.email} requested refund for processed external order ##{order.order_number}.",
                metadata: { order_id: order.id, ticket_id: ticket.id }
              )
            end

            return render json: {
              error: 'This order was processed by our external provider before failing locally. A high-priority support ticket has been created for manual refund review.'
            }, status: :unprocessable_entity
          rescue StandardError => e
            return render json: { error: "Failed to generate support ticket: #{e.message}" }, status: :unprocessable_entity
          end
        end

        # Proceed with standard refund
        begin
          RefundService.new(order).process!(refund_method: 'wallet')
          render json: { message: 'Order successfully refunded to your wallet balance.', order: serialize_order(order.reload) }
        rescue StandardError => e
          render json: { error: "Refund failed: #{e.message}" }, status: :unprocessable_entity
        end
      end

      private

      # Extract the provider's order ID from stored metadata.
      # Prefers the directly-stored provider_order_id (set during provisioning),
      # then falls back to digging into the API response.
      def extract_provider_order_id(order)
        order.metadata&.dig('provider_order_id') ||
          order.metadata&.dig('my_proxy_api_response', 'order', 'order_id') ||
          order.metadata&.dig('my_proxy_api_response', 'order_id') ||
          order.metadata&.dig('my_proxy_api_response', 'data', 'order_id')
      end

      def serialize_order(order)
        resource = order.provisioned_resource

        base = {
          id: order.id,
          order_number: order.try(:order_number) || [order.id, order.created_at.to_i].join('-'),
          product_id: order.product_id,
          product_name: order.product.name,
          product_type: order.product.product_type,
          proxy_type: order.product.product_category&.slug,
          country: order.product.metadata&.dig('location_name') || order.product.metadata&.dig('location_code'),
          bandwidth_gb: order.product.metadata&.dig('data_gb') || 0,
          ips_included: order.product.metadata&.dig('ips_included') || 0,
          total_amount: order.total_amount,
          amount: order.total_amount,
          currency: order.product_pricing&.currency || 'USD',
          currency_code: order.product_pricing&.currency || 'USD',
          status: if %w[vps rdp vm].include?(order.product.product_type)
                    order.status
                  else
                    (order.status == 'active' ? 'completed' : order.status)
                  end,
          created_at: order.created_at,
          expires_at: resource.try(:expires_at) || order.expires_at || (order.created_at + 30.days),
          reorderable: order.reorderable?(current_actor),
          payment_method: order.checkout_session&.gateway || 'wallet',
          auto_renew: resource.try(:metadata)&.dig('auto_renew') || order.metadata['auto_renew'],
          renewal_method: resource.try(:metadata)&.dig('renewal_method') || order.metadata['payment_debug'] || order.metadata['renewal_method'] || 'wallet',
          metadata: order.metadata.except(*INTERNAL_ORDER_METADATA_KEYS).merge(order.product.public_metadata),
          review_pending: order.metadata['meisim_review_required'] == true,
          duration: order.product_pricing&.duration_value ? (order.product_pricing.duration_value / 30.0).ceil : 1,
          transaction_id: order.metadata&.dig('transaction_id') || order.id
        }

        # Include product-specific details
        case order.product.product_type
        when 'proxy'
          if order.product.provider_type == 'myproxyapi' && order.metadata['my_proxy_api_response'].present?
            api_res = order.metadata['my_proxy_api_response']
            base[:proxy_details] = api_res

            # Handle both single record and multiple records (array)
            records = api_res.is_a?(Array) ? api_res : [api_res]
            first_rec = records.first || {}

            # Extract from nested view-order structure if present
            # { order: {}, ips: [...], config: { auth_user_pass: {} } }
            auth = first_rec.dig('config', 'auth_user_pass') || {}

            all_ips = records.flat_map do |rec|
              rec['ips'] || [rec['ip']].compact
            end.uniq

            all_ips_info = records.flat_map do |rec|
              rec['ips_info'] || []
            end

            base[:credentials] = {
              username: auth['username'] || first_rec['username'],
              password: auth['password'] || first_rec['password'],
              endpoints: all_ips
            }
            base[:ips_info] = all_ips_info
            # Extract expiry from nested order details
            base[:expires_at] ||= first_rec.dig('order', 'end_time') || first_rec['expires_at']
            base[:provider_order_id] = first_rec.dig('order', 'order_id') || first_rec.dig('data', 'order_id') || first_rec['order_id']
          else
            base[:proxy_details] = resource&.as_json || {}
            base[:credentials] = {
              username: resource&.try(:username),
              password: resource&.try(:password),
              endpoints: [resource&.try(:ip_address)].compact
            }
          end
        when 'vpn'
          if order.product.provider_type == 'myproxyapi' && order.metadata['my_proxy_api_response'].present?
            api_res = order.metadata['my_proxy_api_response']
            base[:vpn_details] = api_res
            auth = api_res.dig('config', 'auth_user_pass') || {}
            ips = api_res['ips'] || []
            base[:credentials] = {
              username: auth['username'] || api_res['username'],
              password: auth['password'] || api_res['password'],
              server: ips.first&.split(':')&.first || api_res['server'] || api_res['ip'] || api_res['host'],
              endpoints: ips
            }
            base[:expires_at] ||= api_res.dig('order', 'end_time')
            base[:provider_order_id] = api_res.dig('order', 'order_id') || api_res.dig('data', 'order_id')
          else
            base[:vpn_details] = resource&.as_json || {}
            base[:credentials] = {
              username: resource&.try(:username),
              password: resource&.try(:password),
              server: resource&.try(:server)
            }
          end
        when 'vps', 'rdp', 'vm'
          base[:vm_details] = resource&.as_json || {}
          base[:vm_id] = resource&.proxmox_vm_id&.to_i
          base[:hostname] = resource&.hostname || "vm-#{resource&.id}"
          base[:node] = resource&.proxmox_node || 'N/A'
          base[:os_template] = order.product.metadata&.dig('os_template') || 'ubuntu-22.04'
          base[:service_type] = order.product.metadata&.dig('vm_type') || 'residential'
          base[:management_type] = 'unmanaged'
          base[:ip_address] = resource&.ip_address
          base[:dns_name] = resource&.dns_name
          base[:ssh_port] = resource&.ssh_port || 22
          base[:rdp_port] = resource&.rdp_port || (order.product.product_type == 'rdp' ? 3389 : nil)
          base[:concurrent_users] = order.product.metadata&.dig('concurrent_users') || 1
          base[:activated_at] = resource&.try(:provisioned_at) || resource&.created_at
          base[:credentials] = {
            username: resource&.try(:ssh_username) || resource&.try(:rdp_username) || 'root',
            password: resource&.try(:root_password) || resource&.try(:ssh_password) || resource&.try(:rdp_password_encrypted),
            ip: resource&.try(:ip_address),
            port: resource&.try(:ssh_port) || resource&.try(:rdp_port) || 22
          }
        when 'esim'
          base[:esim_order_no] = resource&.provider_order_no
          base[:package_code] = resource&.package_code
          base[:package_slug] = order.product.product_category&.slug
          base[:package_name] = order.product.name
          base[:quantity] = 1 # Default for standard eSIM

          base[:profiles] = resource&.esims&.map do |esim|
            {
              id: esim.id,
              iccid: esim.iccid,
              qr_code_data: esim.qr_code_data,
              qr_code_url: esim.qr_code_data,
              activation_code: esim.activation_code,
              phone_number: esim.msisdn,
              pin1: esim.pin1,
              puk1: esim.puk1,
              total_volume: (esim.data_total_bytes.to_i / (1024 * 1024)).to_i, # MB
              used_volume: (esim.data_used_bytes.to_i / (1024 * 1024)).to_i,
              location_name: resource.country_code || 'Global',
              expired_time: esim.expires_at,
              status: esim.status
            }
          end
          base[:credentials_list] = base[:profiles]
        end

        # Download availability flags
        base[:has_invoice] = order.invoice_pdf.attached? || true # can always generate on-demand
        base[:has_ovpn_config] =
          order.ovpn_config.attached? || (order.product.product_type == 'vpn' && order.product.provider_type == 'myproxyapi')
        base[:has_rdp_config] = %w[vps rdp vm].include?(order.product.product_type)

        base
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count
        }
      end

      def generate_order_payment_link(gateway, order, amount)
        callback_url = "#{ENV['APP_URL']}/webhooks/#{gateway}"

        case gateway
        when 'rexpay'
          # RexPay (Nigerian account) charges NGN; gross up so the customer pays the fee.
          amount_ngn = RexpayService.ngn_charge_amount(amount)
          frontend_callback_url = "#{ENV['FRONTEND_URL']}/payments/success?payment=rexpay&type=order&order_id=#{order.id}&amount=#{amount}&product_type=#{order.product.product_type}"
          # Alphanumeric — RexPay rejects `_`/`-`. The de-hyphenated UUID is still
          # a valid Postgres uuid on lookup; the webhook recovers it by prefix.
          reference = "ORD#{order.id.delete('-')}#{SecureRandom.hex(4)}"
          {
            url: RexpayService.new.create_payment(
              email: current_actor.email,
              amount: amount_ngn,
              currency: 'NGN',
              reference: reference,
              callback_url: RexpayService.webhook_callback_url(reference, frontend_callback_url)
            )[:payment_url],
            amount: amount_ngn,
            currency: 'NGN'
          }
        when 'plisio'
          {
            url: PlisioService.new.create_invoice(
              order_number: "ORD_#{order.id}",
              amount: amount,
              currency: 'USD',
              callback_url: callback_url,
              email: current_actor.email
            )[:url],
            amount: amount,
            currency: 'USD'
          }
        when 'payvra'
          {
            url: PayvraService.new.create_invoice(
              order_number: "ORD_#{order.id}",
              amount: amount,
              currency: 'USD',
              callback_url: callback_url,
              email: current_actor.email
            )[:url],
            amount: amount,
            currency: 'USD'
          }
        when 'heleket'
          {
            url: HeleketService.new.create_invoice(
              order_number: "ORD_#{order.id}",
              amount: amount,
              currency: 'USD',
              callback_url: callback_url,
              email: current_actor.email
            )[:url],
            amount: amount,
            currency: 'USD'
          }
        when 'hundredpay'
          {
            url: HundredpayService.new.create_invoice(
              amount: amount,
              currency: 'USD',
              order_number: "ORD_#{order.id}",
              callback_url: callback_url,
              email: current_actor.email,
              phone: current_actor.try(:phone),
              country: current_actor.try(:country)
            )[:url],
            amount: amount,
            currency: 'USD'
          }
        end
      end

      def generate_session_payment_link(gateway, session, amount)
        callback_url = "#{ENV['APP_URL']}/webhooks/#{gateway}"
        reference = session.gateway_reference

        case gateway
        when 'rexpay'
          # RexPay (Nigerian account) charges NGN; gross up so the customer pays the fee.
          amount_ngn = RexpayService.ngn_charge_amount(amount)
          frontend_callback_url = "#{ENV['FRONTEND_URL']}/payments/success?payment=rexpay&type=cart_checkout&checkout_session_id=#{session.id}&amount=#{amount}&product_type=mixed"
          {
            url: RexpayService.new.create_payment(
              email: current_actor.email,
              amount: amount_ngn,
              currency: 'NGN',
              reference: reference,
              callback_url: RexpayService.webhook_callback_url(reference, frontend_callback_url)
            )[:payment_url],
            amount: amount_ngn,
            currency: 'NGN'
          }
        when 'plisio'
          {
            url: PlisioService.new.create_invoice(
              order_number: reference,
              amount: amount,
              currency: 'USD',
              callback_url: callback_url,
              email: current_actor.email
            )[:url],
            amount: amount,
            currency: 'USD'
          }
        when 'payvra'
          {
            url: PayvraService.new.create_invoice(
              order_number: reference,
              amount: amount,
              currency: 'USD',
              callback_url: callback_url,
              email: current_actor.email
            )[:url],
            amount: amount,
            currency: 'USD'
          }
        when 'heleket'
          {
            url: HeleketService.new.create_invoice(
              order_number: reference,
              amount: amount,
              currency: 'USD',
              callback_url: callback_url,
              email: current_actor.email
            )[:url],
            amount: amount,
            currency: 'USD'
          }
        when 'hundredpay'
          {
            url: HundredpayService.new.create_invoice(
              amount: amount,
              currency: 'USD',
              order_number: reference,
              callback_url: callback_url,
              email: current_actor.email,
              phone: current_actor.try(:phone),
              country: current_actor.try(:country)
            )[:url],
            amount: amount,
            currency: 'USD'
          }
        end
      end
    end
  end
end
