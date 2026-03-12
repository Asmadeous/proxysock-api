# frozen_string_literal: true

module Api
  module V1
    class OrdersController < BaseController
      include JwtAuthenticated

      # GET /api/v1/orders
      def index
        # Resellers can see all their orders
        # Using ResellerOrder as the primary query base to get all products they've purchased for resale
        scope = current_reseller.orders
                                .includes(:product, :vm_order, :vpn_order, :mobile_proxy_order, :static_datacenter_proxy_order, :static_residential_proxy_order, :residential_rotating_proxy_order)

        if params[:product_type].present?
          types = params[:product_type].split(',')
          scope = scope.joins(:product).where(products: { product_type: types })
        end

        orders = scope.order(created_at: :desc)
                      .page(params[:page])
                      .per(20)
        render json: {
          orders: orders.map { |o| serialize_order(o) },
          meta: pagination_meta(orders)
        }
      end

      # GET /api/v1/orders/:id
      def show
        order = current_reseller.orders.find(params[:id])
        render json: serialize_order(order)
      end

      # GET /api/v1/orders/stats
      def stats
        orders = current_reseller.orders

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
          total_spent: orders.sum(:total_amount).to_f,
          balance: (current_reseller.wallet&.balance || 0).to_f,
          earnings_balance: (current_reseller.earnings_wallet&.balance || 0).to_f,
          type_stats: type_stats,
          recent_orders: recent_orders
        }
      end

      # POST /api/v1/orders
      # - api_only resellers: deducts from balance, provisions immediately, returns credentials JSON
      # - infrastructure resellers: creates checkout session, returns gateway payment link
      def create
        product = Product.for_resellers.find(params[:product_id])

        pricing = product.product_pricings.find_by(active: true)
        return render json: { error: 'Product pricing not available' }, status: :not_found unless pricing

        if current_reseller.api_only?
          create_api_only_order(product, pricing)
        else
          create_infrastructure_order(product, pricing)
        end
      rescue StandardError => e
        Rails.logger.error("Reseller Order Error: #{e.message}")
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # POST /api/v1/orders/checkout_cart
      # Infrastructure resellers only — batch-order multiple products via gateway.
      # api_only resellers should use POST /api/v1/orders individually.
      def checkout_cart
        unless current_reseller.infrastructure?
          return render json: { error: 'Cart checkout is only available for infrastructure resellers. Use POST /api/v1/orders for single orders.' },
                        status: :forbidden
        end

        items = params[:items] || []
        gateway = params[:gateway] || 'paystack'
        customer_email = params[:customer_email]

        return render json: { error: 'Cart is empty' }, status: :bad_request if items.empty?
        return render json: { error: 'customer_email is required for infrastructure orders' }, status: :bad_request if customer_email.blank?

        payment_debug = "reseller_#{gateway}"

        # Build and validate cart items
        total_amount = 0
        validated_items = []

        items.each do |item|
          product = Product.for_resellers.find_by(id: item[:product_id] || item['product_id'])
          next unless product

          pricing = product.product_pricings.find_by(active: true) || product.product_pricings.first
          next unless pricing

          order = Order.new(
            orderable: current_reseller,
            product: product,
            product_pricing: pricing,
            quantity: item[:quantity] || item['quantity'] || 1,
            metadata: (item[:metadata] || item['metadata'] || {}).merge(
              'client_ip' => request.remote_ip,
              'payment_debug' => payment_debug,
              'customer_email' => customer_email,
              'credentials_email' => customer_email
            ),
            status: 'pending'
          )

          order.calculate_total_amount
          total_amount += order.total_amount.to_f
          validated_items << {
            product_id: product.id,
            quantity: order.quantity,
            metadata: order.metadata
          }
        end

        if validated_items.empty?
          return render json: { error: 'No valid products found in cart' }, status: :unprocessable_entity
        end

        # Create CheckoutSession for gateway payment
        checkout_session = nil

        ActiveRecord::Base.transaction do
          checkout_session = CheckoutSession.create!(
            orderable: current_reseller,
            total_amount: total_amount,
            payment_method: gateway,
            status: 'pending',
            metadata: {
              item_count: validated_items.count,
              items: validated_items,
              reseller_id: current_reseller.id,
              customer_email: customer_email,
              payment_debug: payment_debug
            }
          )

          checkout_session.generate_reference!
        end

        payment_data = generate_reseller_payment_link(gateway, checkout_session, total_amount, customer_email)

        unless payment_data && payment_data[:url]
          raise StandardError, "Failed to generate payment link from #{gateway}."
        end

        render json: {
          message: 'Complete payment to activate orders',
          payment_url: payment_data[:url],
          payment_amount: payment_data[:amount],
          payment_currency: payment_data[:currency],
          reference: checkout_session.gateway_reference,
          checkout_session_id: checkout_session.id,
          total_items: validated_items.count,
          total_amount: total_amount,
          customer_email: customer_email
        }, status: :accepted
      rescue StandardError => e
        Rails.logger.error("Reseller Cart Checkout Error: #{e.message}")
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # GET /api/v1/orders/:id/credentials
      # Returns credentials dynamically based on product type
      def credentials
        order = current_reseller.orders.find(params[:id])
        resource = order.provisioned_resource

        unless resource
          return render json: { error: 'Resource not found or not yet provisioned', status: order.status },
                        status: :accepted
        end

        case order.product.product_type
        when 'vm', 'vps'
          unless resource.status == 'active'
            return render json: { error: 'VM not yet provisioned', status: resource.status }, status: :accepted
          end

          render json: {
            type: 'vm',
            order_id: order.id,
            vm_id: resource.id,
            ip_address: resource.ip_address,
            ssh_port: resource.ssh_port || 22,
            ssh_username: resource.ssh_username,
            ssh_password: resource.ssh_password,
            rdp_port: resource.rdp_port,
            status: resource.status,
            proxmox_vm_id: resource.proxmox_vm_id
          }
        when 'vpn'
          render json: {
            type: 'vpn',
            order_id: order.id,
            vpn_id: resource.id,
            username: resource.username,
            password: resource.password,
            server_ip: resource.server_ip,
            status: resource.status
          }
        when 'proxy'
          # Dynamic credential mapping mapping for various proxy models
          # MobileProxy, StaticDatacenterProxy, etc.
          render json: {
            type: 'proxy',
            order_id: order.id,
            proxy_type: resource.class.name,
            proxy_id: resource.id,
            ip_address: resource.try(:ip_address),
            port: resource.try(:port),
            username: resource.try(:username),
            password: resource.try(:password),
            country_code: resource.try(:country_code),
            status: resource.status
          }
        else
          render json: { error: 'Credentials not supported for this product type' }, status: :bad_request
        end
      end

      # POST /api/v1/orders/:id/renew
      def renew
        order = current_reseller.orders.find(params[:id])

        # Double check reseller restriction (already handled by model but safe to be explicit)
        unless order.product.product_type == 'vm'
          return render json: { error: 'Only VMs can be renewed via this endpoint' }, status: :forbidden
        end

        begin
          service = OrderRenewalService.new(order, current_reseller)
          if service.process!
            render json: { message: 'Order renewed successfully', order: serialize_order(order) }
          else
            render json: { error: 'Renewal failed' }, status: :unprocessable_entity
          end
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/orders/:id/cancel
      # Resellers can cancel orders within 1 hour of creation
      def cancel
        order = current_reseller.orders.find(params[:id])

        # Check if order can be cancelled
        unless %w[pending active processing completed delivered allocated].include?(order.status)
          return render json: { error: "Order with status '#{order.status}' cannot be cancelled" },
                        status: :unprocessable_entity
        end

        # Enforce 1-hour cancellation window
        if order.created_at < 1.hour.ago
          return render json: { error: 'Cancellation window has expired. Orders can only be cancelled within 1 hour of purchase.' },
                        status: :forbidden
        end

        Order.transaction do
          # Refund to reseller balance
          refund_amount = order.total_amount.to_f
          if refund_amount.positive? && current_reseller.main_wallet
            current_reseller.main_wallet.update!(
              balance: current_reseller.main_wallet.balance + refund_amount
            )
          end

          order.update!(status: 'cancelled')

          # For external API products (proxies), alert admin via email
          is_external_api_product = order.product&.provider_type.to_s.downcase.include?('api') ||
                                    order.product&.product_type == 'proxy'
          if is_external_api_product
            ResellerMailer.order_cancelled_admin_notification(order, current_reseller).deliver_later
          end
        end

        render json: {
          message: 'Order cancelled and refunded successfully',
          order: serialize_order(order.reload),
          refunded_amount: order.total_amount.to_f
        }
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def serialize_order(order)
        resource = order.provisioned_resource
        {
          id: order.id,
          product_id: order.product_id,
          product_name: order.product.name,
          product_type: order.product.product_type,
          quantity: order.quantity,
          total_amount: order.total_amount,
          status: order.status,
          resource_status: resource&.status,
          # Conditional attributes based on resource availability
          ip_address: resource.try(:ip_address) || resource.try(:server_ip),
          created_at: order.created_at
        }
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count
        }
      end

      # ── api_only: Balance-based order ──
      # Deducts from main_wallet, provisions immediately, returns credentials in JSON.
      def create_api_only_order(product, pricing)
        @order = Order.new(
          orderable: current_reseller,
          product_id: product.id,
          product_pricing_id: pricing.id,
          quantity: params[:quantity] || 1,
          metadata: (params[:metadata] || {}).merge(
            'client_ip' => request.remote_ip,
            'payment_debug' => 'reseller_balance'
          ),
          status: 'pending'
        )

        return render json: { errors: @order.errors }, status: :unprocessable_entity unless @order.save

        Order.transaction do
          ResellerOrder.create!(
            reseller: current_reseller,
            order_id: @order.id,
            orderable: current_reseller
          )

          OrderProvisioningService.new(@order, current_reseller).process!
        end

        @order.reload
        resource = @order.provisioned_resource

        render json: {
          message: 'Order completed',
          order: serialize_order(@order),
          credentials: resource ? serialize_credentials(@order, resource) : nil,
          available_balance: current_reseller.main_wallet&.balance.to_f
        }, status: :created
      end

      # ── infrastructure: Gateway-based order ──
      # Creates a CheckoutSession, returns payment link. Customer email receives credentials after payment.
      def create_infrastructure_order(product, pricing)
        gateway = params[:gateway] || 'paystack'
        customer_email = params[:customer_email]

        return render json: { error: 'customer_email is required for infrastructure orders' }, status: :bad_request if customer_email.blank?

        payment_debug = "reseller_#{gateway}"

        order = Order.new(
          orderable: current_reseller,
          product_id: product.id,
          product_pricing_id: pricing.id,
          quantity: params[:quantity] || 1,
          metadata: (params[:metadata] || {}).merge(
            'client_ip' => request.remote_ip,
            'payment_debug' => payment_debug,
            'customer_email' => customer_email,
            'credentials_email' => customer_email
          ),
          status: 'pending'
        )

        order.calculate_total_amount
        total = order.total_amount.to_f

        checkout_session = nil
        ActiveRecord::Base.transaction do
          checkout_session = CheckoutSession.create!(
            orderable: current_reseller,
            total_amount: total,
            payment_method: gateway,
            status: 'pending',
            metadata: {
              item_count: 1,
              items: [{
                product_id: product.id,
                quantity: order.quantity,
                metadata: order.metadata
              }],
              reseller_id: current_reseller.id,
              customer_email: customer_email,
              payment_debug: payment_debug
            }
          )

          checkout_session.generate_reference!
        end

        payment_data = generate_reseller_payment_link(gateway, checkout_session, total, customer_email)

        unless payment_data && payment_data[:url]
          raise StandardError, "Failed to generate payment link from #{gateway}."
        end

        render json: {
          message: 'Complete payment to activate order',
          payment_url: payment_data[:url],
          payment_amount: payment_data[:amount],
          payment_currency: payment_data[:currency],
          reference: checkout_session.gateway_reference,
          checkout_session_id: checkout_session.id,
          product_name: product.name,
          total_amount: total,
          customer_email: customer_email
        }, status: :accepted
      end

      # Serialize credentials for JSON response (api_only resellers)
      def serialize_credentials(order, resource)
        base = { order_id: order.id, status: resource.status }

        case order.product.product_type
        when 'proxy'
          base.merge(
            type: 'proxy',
            proxy_type: resource.class.name,
            ip_address: resource.try(:ip_address),
            port: resource.try(:port),
            username: resource.try(:username),
            password: resource.try(:password),
            country_code: resource.try(:country_code)
          )
        when 'vpn'
          base.merge(
            type: 'vpn',
            username: resource.try(:username),
            password: resource.try(:password),
            server_ip: resource.try(:server_ip)
          )
        else
          base.merge(
            type: order.product.product_type,
            ip_address: resource.try(:ip_address) || resource.try(:server_ip)
          )
        end
      end

      def generate_reseller_payment_link(gateway, session, amount, customer_email = nil)
        callback_url = "#{ENV['APP_URL']}/webhooks/#{gateway}"
        reference = session.gateway_reference
        # Use customer email for infrastructure, fall back to reseller email
        email = customer_email.presence || current_reseller.email

        case gateway
        when 'paystack'
          exchange_rate = FixerService.get_rate('USD', 'NGN')
          amount_ngn = (amount * exchange_rate).round(2)
          frontend_callback_url = "#{ENV['FRONTEND_URL']}/payments/success?payment=paystack&type=reseller_cart_checkout&checkout_session_id=#{session.id}&amount=#{amount}"
          {
            url: PaystackService.new.initialize_transaction(
              email: email,
              amount: (amount_ngn * 100).to_i,
              reference: reference,
              callback_url: frontend_callback_url,
              metadata: { checkout_session_id: session.id, reseller_id: current_reseller.id, type: 'reseller_checkout' }
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
              email: email
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
              email: email
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
              email: email
            )[:url],
            amount: amount,
            currency: 'USD'
          }
        end
      end
    end
  end
end
