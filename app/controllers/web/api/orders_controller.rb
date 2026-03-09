# frozen_string_literal: true

module Web
  module Api
    class OrdersController < BaseController
      include JwtAuthenticated

      # GET /web/api/orders
      def index
        scope = current_actor.orders.includes(:product, :product_pricing)

        if params[:product_type].present?
          types = params[:product_type].split(',')
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
          orders = orders.where('created_at >= ?', days.days.ago)
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
        %w[proxy vpn vps esim rdp usa_esim].each do |type|
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
          next unless type_stats.key?(type)

          type_stats[type][:total] += count
          if active_statuses.include?(status)
            type_stats[type][:active] += count
          elsif pending_statuses.include?(status)
            type_stats[type][:pending] += count
          elsif expired_statuses.include?(status)
            type_stats[type][:expired] += count
          elsif failed_statuses.include?(status)
            type_stats[type][:failed] += count
          end
        end

        current_month = Time.current.beginning_of_month
        last_month = 1.month.ago.beginning_of_month

        total_spent = orders.sum(:total_amount).to_f
        monthly_spending = orders.where('created_at >= ?', current_month).sum(:total_amount).to_f
        last_month_spending = orders.where(created_at: last_month...current_month).sum(:total_amount).to_f

        recent_orders = orders.includes(:product).order(created_at: :desc).limit(10).map do |o|
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

        # Extract frontend parameters
        meta = params[:metadata] || {}
        meta[:period] = params[:period] if params[:period].present?
        meta[:locationsString] = params[:locationsString] if params[:locationsString].present?
        meta[:protocol] = params[:protocol] if params[:protocol].present?
        meta[:client_ip] = request.remote_ip # Capture client IP for MyProxyAPI whitelist_ip requirement

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

        total = order.total_amount

        if payment_method == 'wallet'
          # Pay from wallet balance
          wallet = current_actor.wallet

          if wallet.nil? || wallet.balance < total
            order.update(status: 'failed')
            return render json: { error: "Insufficient balance. Required: #{total}, Available: #{wallet&.balance || 0}" },
                          status: :payment_required
          end

          # Deduct balance and provision
          begin
            # Service handles debit and provisioning
            OrderProvisioningService.new(order, current_actor).process!
            render json: serialize_order(order.reload).merge(available_balance: current_actor.wallet&.balance.to_f),
                   status: :created
          rescue StandardError => e
            order.fail! if order.may_fail?
            render json: { error: e.message }, status: :unprocessable_entity
          end

        else
          # Redirect to payment gateway
          gateway = params[:gateway] || 'paystack'
          payment_data = generate_order_payment_link(gateway, order, total)

          render json: {
            order: serialize_order(order),
            payment_url: payment_data[:url],
            payment_amount: payment_data[:amount],
            payment_currency: payment_data[:currency],
            message: 'Complete payment to activate order'
          }, status: :accepted
        end
      end

      # POST /web/api/orders/checkout_cart
      def checkout_cart
        items = params[:items] || []
        payment_method = params[:payment_method] || 'wallet'
        gateway = params[:gateway] || 'paystack'

        return render json: { error: 'Cart is empty' }, status: :bad_request if items.empty?

        # Calculate total
        total_amount = 0
        orders_to_create = []

        items.each do |item|
          product = Product.for_ecommerce.find_by(id: item[:product_id] || item['product_id'])
          next unless product

          # Use active pricing or default to unit price logic if dynamic
          pricing = product.product_pricings.find_by(active: true) || product.product_pricings.first

          order = Order.new(
            orderable: current_actor,
            product: product,
            product_pricing: pricing,
            quantity: item[:quantity] || item['quantity'] || 1,
            metadata: item[:metadata] || item['metadata'] || {},
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

        if payment_method == 'wallet'
          wallet = current_actor.wallet
          if wallet.nil? || wallet.balance < total_amount
            return render json: { error: "Insufficient balance. Required: #{total_amount}, Available: #{wallet&.balance || 0}" },
                          status: :payment_required
          end

          created_orders = []
          ActiveRecord::Base.transaction do
            # Create all orders
            orders_to_create.each(&:save!)
            transaction = Transaction.create!(
              transactable: current_actor,
              reference: current_actor, # Virtual cart, self-reference
              amount: total_amount,
              transaction_type: 'debit',
              status: 'success',
              currency: 'USD',
              description: "Virtual Cart Checkout (#{orders_to_create.count} items)"
            )

            wallet.debit!(total_amount, 'Cart Checkout', {}, transaction)
            # Provision each
            orders_to_create.each do |order|
              OrderProvisioningService.new(order, current_actor).process_without_deduction!
              created_orders << order
            end
          end

          render json: {
            message: 'Checkout successful',
            orders: created_orders.map { |o| serialize_order(o.reload) },
            available_balance: current_actor.wallet&.balance.to_f
          }, status: :created
        else
          # Gateway
          checkout_session = nil
          created_orders = []

          ActiveRecord::Base.transaction do
            checkout_session = CheckoutSession.create!(
              orderable: current_actor,
              total_amount: total_amount,
              payment_method: gateway,
              status: 'pending',
              metadata: { item_count: orders_to_create.count, items: items }
            )

            checkout_session.generate_reference!
          end

          payment_data = generate_session_payment_link(gateway, checkout_session, total_amount)

          unless payment_data && payment_data[:url]
            raise StandardError, "Failed to generate payment link from #{gateway}. Check gateway credentials or logs."
          end

          render json: {
            message: 'Complete payment to activate orders',
            payment_url: payment_data[:url],
            payment_amount: payment_data[:amount],
            payment_currency: payment_data[:currency],
            reference: checkout_session.gateway_reference,
            checkout_session_id: checkout_session.id
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
            ip: vm&.ip_address,
            username: vm&.ssh_username,
            password: vm&.ssh_password,
            ssh_port: vm&.ssh_port || 22,
            status: vm&.status
          }
        when 'proxy'
          if order.product.provider_type == 'myproxyapi' && order.metadata['my_proxy_api_response'].present?
            api_res = order.metadata['my_proxy_api_response']
            render json: {
              type: 'proxy',
              ip: api_res['ip'],
              port: api_res['port'] || api_res['http_port'] || api_res['socks5_port'],
              username: api_res['username'],
              password: api_res['password'],
              protocol: order.metadata['protocol'] || 'http',
              provider_order_id: api_res['order_id']
            }
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
        when 'esim', 'usa_esim'
          esim = order.esim_order&.esim
          render json: {
            type: 'esim',
            iccid: esim&.iccid,
            qr_code: esim&.qr_code_data,
            activation_code: esim&.activation_code,
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
            # If they have balance, process immediately (similar to create)
            if current_actor.wallet&.balance.to_f >= new_order.total_amount
              OrderProvisioningService.new(new_order, current_actor).process!
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

      private

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
          status: order.status == 'active' ? 'completed' : order.status,
          created_at: order.created_at,
          expires_at: resource.try(:expires_at),
          reorderable: order.reorderable?(current_actor),
          payment_method: 'wallet'
        }

        # Include product-specific details
        case order.product.product_type
        when 'proxy'
          if order.product.provider_type == 'myproxyapi' && order.metadata['my_proxy_api_response'].present?
            api_res = order.metadata['my_proxy_api_response']
            base[:proxy_details] = api_res
            # Extract from nested view-order structure: { order: {}, ips: [...], config: { auth_user_pass: {} } }
            auth = api_res.dig('config', 'auth_user_pass') || {}
            ips = api_res['ips'] || []
            ips_info = api_res['ips_info'] || []
            base[:credentials] = {
              username: auth['username'] || api_res['username'],
              password: auth['password'] || api_res['password'],
              endpoints: ips.presence || [api_res['ip']].compact
            }
            base[:ips_info] = ips_info
            # Extract expiry from nested order details
            base[:expires_at] ||= api_res.dig('order', 'end_time')
            base[:provider_order_id] = api_res.dig('order', 'order_id') || api_res.dig('data', 'order_id')
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
        when 'vps', 'rdp'
          base[:vm_details] = resource&.as_json || {}
          base[:credentials] = {
            username: resource&.try(:ssh_username),
            password: resource&.try(:ssh_password),
            ip: resource&.try(:ip_address),
            port: resource&.try(:ssh_port)
          }
        when 'esim'
          base[:esim_details] = resource&.as_json || {}
          base[:credentials_list] = resource&.esims&.map do |esim|
            {
              id: esim.id,
              iccid: esim.iccid,
              qr_code: esim.qr_code_data,
              activation_code: esim.activation_code,
              pin1: esim.pin1,
              puk1: esim.puk1,
              status: esim.status
            }
          end
          # Keep legacy field for backwards compatibility if needed
          base[:credentials] = base[:credentials_list]&.first
        when 'usa_esim'
          base[:credentials_list] = resource&.usa_esim_credentials&.map do |credential|
            {
              id: credential.id,
              iccid: credential.iccid,
              qr_code: credential.qr_code,
              qr_activation_code: credential.qr_activation_code,
              pin1: credential.send('PIN1'),
              pin2: credential.send('PIN2'),
              puk1: credential.send('PUK1'),
              puk2: credential.send('PUK2'),
              zip_code: credential.zip_code,
              status: credential.status
            }
          end
          base[:credentials] = base[:credentials_list]&.first
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
        when 'paystack'
          exchange_rate = FixerService.get_rate('USD', 'NGN')
          amount_ngn = (amount * exchange_rate).round(2)
          frontend_callback_url = "#{ENV['FRONTEND_URL']}/payments/success?payment=paystack&type=order&order_id=#{order.id}&amount=#{amount}"
          {
            url: PaystackService.new.initialize_transaction(
              email: current_actor.email,
              amount: (amount_ngn * 100).to_i, # in kobo
              reference: "ORD_#{order.id}_#{SecureRandom.hex(4)}",
              callback_url: frontend_callback_url,
              metadata: { order_id: order.id, user_id: current_actor.id, type: 'order' }
            )[:authorization_url],
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
            )[:invoice_url],
            amount: amount,
            currency: 'USD'
          }
        when 'payvra'
          {
            url: PayvraService.new.create_payment(
              amount: amount,
              currency: 'USD',
              reference: "ORD_#{order.id}",
              callback_url: callback_url
            )[:payment_url],
            amount: amount,
            currency: 'USD'
          }
        end
      end

      def generate_session_payment_link(gateway, session, amount)
        callback_url = "#{ENV['APP_URL']}/webhooks/#{gateway}"
        reference = session.gateway_reference

        case gateway
        when 'paystack'
          exchange_rate = FixerService.get_rate('USD', 'NGN')
          amount_ngn = (amount * exchange_rate).round(2)
          frontend_callback_url = "#{ENV['FRONTEND_URL']}/payments/success?payment=paystack&type=cart_checkout&checkout_session_id=#{session.id}&amount=#{amount}"
          {
            url: PaystackService.new.initialize_transaction(
              email: current_actor.email,
              amount: (amount_ngn * 100).to_i, # in kobo
              reference: reference,
              callback_url: frontend_callback_url,
              metadata: { checkout_session_id: session.id, user_id: current_actor.id, type: 'cart_checkout' }
            )[:authorization_url],
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
            )[:invoice_url],
            amount: amount,
            currency: 'USD'
          }
        when 'payvra'
          {
            url: PayvraService.new.create_payment(
              amount: amount,
              currency: 'USD',
              reference: reference,
              callback_url: callback_url
            )[:payment_url],
            amount: amount,
            currency: 'USD'
          }
        end
      end
    end
  end
end
