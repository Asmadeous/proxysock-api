# frozen_string_literal: true

module Api
  module V1
    class OrdersController < BaseController
      include JwtAuthenticated

      # GET /api/v1/orders
      def index
        # Resellers can see all their orders.
        # Infrastructure resellers also see orders from all their managed users.
        scope = order_scope.includes(:product, :vm_order, :vpn_order, :mobile_proxy_order, :static_datacenter_proxy_order, :static_residential_proxy_order, :residential_rotating_proxy_order)

        if params[:product_type].present?
          types = params[:product_type].split(',')
          scope = scope.joins(:product).where(products: { product_type: types })
        end

        if params[:category_slug].present?
          scope = scope.joins(product: :product_category).where(product_categories: { slug: params[:category_slug] })
        end

        if params[:category_id].present?
          scope = scope.joins(:product).where(products: { product_category_id: params[:category_id] })
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
        order = order_scope.find(params[:id])
        render json: serialize_order(order)
      end

      # GET /api/v1/orders/stats
      def stats
        orders = order_scope

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
            product_name: o.product_display_name
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
        product_scope = current_reseller.infrastructure? ? Product.all : Product.for_resellers

        # Single product resellers can only order from their allowed category
        if current_reseller.single_product?
          product_scope = product_scope.where(product_category_id: current_reseller.allowed_product_category_id)
        end

        product = product_scope.find(params[:product_id])

        pricing = product.product_pricings.find_by(active: true)
        return render json: { error: 'Product pricing not available' }, status: :not_found unless pricing

        if current_reseller.balance_based?
          create_api_only_order(product, pricing)
        else
          create_infrastructure_order(product, pricing)
        end
      rescue ActiveRecord::RecordNotFound => e
        raise e
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
        gateway = params[:gateway] || 'rexpay'
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

          unless order.valid?
            return render json: { errors: order.errors, product_id: product.id }, status: :unprocessable_entity
          end

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
        order = order_scope.find(params[:id])
        return if render_myproxyapi_credentials(order)

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
        when *Product::PROXY_TYPES
          # Dynamic credential mapping for various proxy models
          # MobileProxy, StaticDatacenterProxy, GlobalIspProxy, etc.
          proxies = if resource.respond_to?(:proxies)
                      resource.proxies
                    elsif resource.respond_to?(:global_isp_proxies)
                      resource.global_isp_proxies
                    elsif resource.respond_to?(:static_isp_proxies)
                      resource.static_isp_proxies
                    elsif resource.respond_to?(:esims)
                      resource.esims
                    else
                      [resource]
                    end

          render json: {
            type: 'proxy',
            order_id: order.id,
            proxies: proxies.map do |p|
              {
                ip_address: p.try(:ip_address),
                port: p.try(:port),
                username: p.try(:username),
                password: p.try(:password),
                country_code: p.try(:country_code),
                status: p.try(:status),
                # eSIM specific
                iccid: p.try(:iccid),
                activation_code: p.try(:activation_code),
                qr_code_url: p.try(:qr_code_data)
              }.compact
            end
          }
        when 'esim'
          render json: {
            type: 'esim',
            order_id: order.id,
            esims: resource.esims.map do |e|
              {
                iccid: e.iccid,
                activation_code: e.activation_code,
                qr_code_url: e.qr_code_data,
                phone_number: e.msisdn,
                status: e.esim_status,
                expires_at: e.expires_at
              }
            end
          }
        else
          render json: { error: 'Credentials not supported for this product type' }, status: :bad_request
        end
      end

      # POST /api/v1/orders/:id/renew
      def renew
        order = order_scope.find(params[:id])

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

      # POST /api/v1/orders/:id/update_subscription
      def update_subscription
        order = order_scope.find(params[:id])

        order.metadata ||= {}
        order.metadata['auto_renew'] = params[:auto_renew] if params.key?(:auto_renew)
        order.metadata['renewal_method'] = params[:renewal_method] if params.key?(:renewal_method)

        if order.save
          # Propagate to provisioned resource if applicable
          if order.provisioned_resource.respond_to?(:update!)
            resource_meta = order.provisioned_resource.metadata.to_h
            resource_meta['service_renewal_metadata'] ||= {}
            resource_meta['service_renewal_metadata']['auto_renew'] = order.metadata['auto_renew']
            resource_meta['service_renewal_metadata']['renewal_method'] = order.metadata['renewal_method']
            order.provisioned_resource.update!(metadata: resource_meta)
          end

          render json: {
            message: 'Subscription settings updated successfully',
            auto_renew: order.metadata['auto_renew'],
            renewal_method: order.metadata['renewal_method']
          }
        else
          render json: { error: order.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/orders/:id/cancel
      # Resellers can cancel orders within 1 hour of creation
      def cancel
        order = order_scope.find(params[:id])

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
            current_reseller.main_wallet.credit!(refund_amount, "Refund for cancelled order ##{order.order_number}")
          end

          order.update!(status: 'cancelled')

          # For external API products (proxies), alert admin via email
          is_external_api_product = order.product&.provider_type.to_s.downcase.include?('api') ||
                                    order.product&.proxy?
          if is_external_api_product
            saved_order = order
            saved_reseller = current_reseller
            ActiveRecord.after_all_transactions_commit do
              ResellerMailer.order_cancelled_admin_notification(saved_order, saved_reseller).deliver_later
            end
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

      # POST /api/v1/orders/:id/refund
      # Resellers can refund failed orders to their wallet, except for external API products that have already been processed.
      def refund
        order = order_scope.find(params[:id])

        unless order.failed?
          return render json: { error: 'Order is not in a failed state. You can only refund failed orders.' }, status: :unprocessable_entity
        end

        is_external_api_product = %w[proxy vpn].include?(order.product.product_type)

        if is_external_api_product && order.provider_order_id.present?
          # The external API processed this order before the local failure. Halt automated refund and generate a ticket.
          begin
            ActiveRecord::Base.transaction do
              ticket = current_reseller.tickets.create!(
                subject: "Refund Request for External Order ##{order.order_number}",
                priority: 'high',
                order_id: order.id,
                user_type: 'reseller'
              )
              ticket.ticket_messages.create!(
                sender: current_reseller,
                body: "Automated Refund Request: This order could not be automatically refunded because the external API has already processed it (Provider Order ID: #{order.provider_order_id}). Please investigate and process manually."
              )

              NotificationService.notify_staff(
                category: 'warning',
                title: 'Manual Refund Required',
                message: "Reseller requested refund for processed external order ##{order.order_number}.",
                metadata: { order_id: order.id, ticket_id: ticket.id }
              )
            end

            return render json: {
              error: 'External provider processed this order before local failure. A high-priority support ticket has been created for manual admin review.'
            }, status: :unprocessable_entity
          rescue StandardError => e
            return render json: { error: "Failed to generate support ticket for refund: #{e.message}" }, status: :unprocessable_entity
          end
        end

        # Safe to refund locally
        begin
          RefundService.new(order).process!(refund_method: 'wallet')
          render json: { message: 'Order successfully refunded to wallet', order: serialize_order(order.reload) }
        rescue StandardError => e
          render json: { error: "Refund failed: #{e.message}" }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/orders/:id/reorder
      def reorder
        original_order = order_scope.find(params[:id])
        product = original_order.product
        pricing = product.product_pricings.find_by(active: true) || product.product_pricings.first

        return render json: { error: 'Product pricing not available' }, status: :not_found unless pricing

        metadata = original_order.metadata.except('order_id', 'provider_order_id', 'my_proxy_api_response')
        if current_reseller.balance_based?
          # Re-create the order with original metadata (removing IDs)
          create_api_only_order(product, pricing, metadata)
        else
          # infrastructure: Return a checkout link for the same product
          create_infrastructure_order(product, pricing, metadata)
        end
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def serialize_order(order)
        resource = order.provisioned_resource
        details = order.product.product_type == 'esim' && order.esim_order ? order.esim_order.listing_details : {}
        {
          id: order.id,
          order_number: order.order_number,
          product_id: order.product_id,
          product_name: order.product_display_name,
          product_type: order.product.product_type,
          proxy_type: order.metadata.to_h['proxy_type'],
          quantity: order.quantity,
          total_amount: order.total_amount,
          status: order.status,
          auto_renew: !order.metadata.to_h['auto_renew'].nil?,
          renewal_method: order.metadata.to_h['renewal_method'] || 'wallet',
          resource_status: resource&.status,
          topup_eligible: EsimTopupService.eligible?(order),
          # Conditional attributes based on resource availability
          ip_address: resource.try(:ip_address) || resource.try(:server_ip),
          expires_at: resource.try(:expires_at) || order.metadata.to_h['expires_at'],
          created_at: order.created_at
        }.merge(details)
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count
        }
      end

      # Centralized order scope for hierarchical reseller management
      def order_scope
        if current_reseller.infrastructure?
          # Infrastructure resellers see their own orders + their managed users' orders
          managed_user_ids = current_reseller.managed_user_ids
          Order.where(
            "(orderable_type = 'Reseller' AND orderable_id = ?) OR (orderable_type = 'User' AND orderable_id IN (?))",
            current_reseller.id, managed_user_ids
          )
        else
          # Standard resellers see ONLY their own direct orders
          current_reseller.orders
        end
      end

      # ── api_only: Balance-based order ──
      # Deducts from main_wallet, provisions immediately, returns credentials in JSON.
      def create_api_only_order(product, pricing, custom_metadata = nil)
        orderable_actor = current_reseller
        if params[:user_id].present? && custom_metadata.nil?
          orderable_actor = current_reseller.managed_users.find(params[:user_id])
        end

        @order = Order.new(
          orderable: orderable_actor,
          product_id: product.id,
          product_pricing_id: pricing.id,
          quantity: params[:quantity] || 1,
          metadata: (custom_metadata || params[:metadata] || {}).merge(
            'client_ip' => request.remote_ip,
            'payment_debug' => 'reseller_balance',
            'target_section_id' => params[:target_section_id],
            'target_id' => params[:target_id],
            'resi' => params[:resi],
            'selected_country_id' => params[:selected_country_id]
          ).compact,
          status: 'pending'
        )

        return render json: { errors: @order.errors }, status: :unprocessable_entity unless @order.save

        Order.transaction do
          ResellerOrder.create!(
            reseller: current_reseller,
            order_id: @order.id,
            orderable: current_reseller
          )
        end

        OrderProvisioningJob.perform_later(@order.id, current_reseller.id)

        render json: {
          id: @order.id,
          order_number: @order.order_number,
          status: 'pending',
          message: 'Order received and provisioning has started. Please wait a minute for credentials to appear.',
          available_balance: current_reseller.main_wallet&.balance.to_f
        }, status: :accepted
      end

      # ── infrastructure: Gateway-based order ──
      # Creates a CheckoutSession, returns payment link. Customer email receives credentials after payment.
      def create_infrastructure_order(product, pricing, custom_metadata = nil)
        gateway = params[:gateway] || 'rexpay'
        customer_email = params[:customer_email] || (custom_metadata ? custom_metadata['customer_email'] : nil)

        return render json: { error: 'customer_email is required for infrastructure orders' }, status: :bad_request if customer_email.blank?

        payment_debug = "reseller_#{gateway}"

        order = Order.new(
          orderable: current_reseller,
          product_id: product.id,
          product_pricing_id: pricing.id,
          quantity: params[:quantity] || 1,
          metadata: (custom_metadata || params[:metadata] || {}).merge(
            'client_ip' => request.remote_ip,
            'payment_debug' => payment_debug,
            'customer_email' => customer_email,
            'credentials_email' => customer_email
          ),
          status: 'pending'
        )

        return render json: { errors: order.errors }, status: :unprocessable_entity unless order.valid?

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
          product_name: order.product_display_name,
          total_amount: total,
          customer_email: customer_email
        }, status: :accepted
      end

      # Serialize credentials for JSON response (api_only resellers)
      # MyProxyAPI proxies have no local proxy records; their details live on the order.
      def render_myproxyapi_credentials(order)
        return false unless Product::PROXY_TYPES.include?(order.product.product_type) &&
                            order.product.provider_type == 'myproxyapi'

        details = ProxyManagementService.connection_details(order)
        return false unless details

        proxies = details[:endpoints].map do |endpoint|
          ip, port, username, password = endpoint.to_s.split(':', 4)
          { ip_address: ip, port: port, username: username.presence || details[:username],
            password: password.presence || details[:password] }.compact
        end
        render json: { type: 'proxy', order_id: order.id, protocol: details[:protocol], proxies: proxies }
        true
      end

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
        when 'esim'
          base.merge(
            type: 'esim',
            esims: resource.esims.map do |e|
              {
                iccid: e.iccid,
                activation_code: e.activation_code,
                qr_code_url: e.qr_code_data
              }
            end
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
        reference = session.gateway_reference
        # Use customer email for infrastructure, fall back to reseller email
        email = customer_email.presence || current_reseller.email
        frontend_callback_url = "#{ENV['FRONTEND_URL']}/payments/success?payment=#{gateway}&type=reseller_cart_checkout&checkout_session_id=#{session.id}&amount=#{amount}"

        case gateway
        when 'rexpay'
          # RexPay (Nigerian account) charges NGN; gross up so the customer pays the fee.
          amount_ngn = RexpayService.ngn_charge_amount(amount)
          frontend_callback_url = "#{ENV['FRONTEND_URL']}/payments/success?payment=rexpay&type=reseller_cart_checkout&checkout_session_id=#{session.id}&amount=#{amount}"
          {
            url: RexpayService.new.create_payment(
              email: email,
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
              callback_url: frontend_callback_url,
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
              callback_url: frontend_callback_url,
              email: email,
              phone: current_reseller.try(:phone) || current_reseller.metadata.to_h['phone'],
              country: current_reseller.try(:country) || current_reseller.metadata.to_h['country']
            )[:url],
            amount: amount,
            currency: 'USD'
          }
        end
      end
    end
  end
end
