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

        active_statuses = ['active', 'processing', 'completed', 'delivered', 'allocated']
        pending_statuses = ['pending', 'provisioning', 'awaiting_payment']
        expired_statuses = ['expired', 'suspended', 'cancelled']
        failed_statuses = ['failed', 'error', 'stopped']

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
        ['proxy', 'vpn', 'vps', 'esim', 'rdp', 'usa_esim'].each do |type|
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
      # Resellers can order any available product
      def create
        product = Product.for_resellers.find(params[:product_id])

        pricing = product.product_pricings.find_by(active: true)
        return render json: { error: 'Product pricing not available' }, status: :not_found unless pricing

        Order.transaction do
          @order = Order.new(
            orderable: current_reseller,
            product: product,
            product_pricing: pricing,
            quantity: params[:quantity] || 1,
            status: 'pending'
          )

          if @order.save
            # Create the parallel ResellerOrder linking the purchase
            ResellerOrder.create!(
              reseller: current_reseller,
              order_id: @order.id,
              orderable: current_reseller # Initially, the reseller owns it
            )

            begin
              # Process order (checks balance, deducts, provisions)
              OrderProvisioningService.new(@order, current_reseller).process!
              render json: serialize_order(@order.reload), status: :created
            rescue StandardError => e
              # Rollback transaction on provisioning failure to prevent orphaned orders
              raise ActiveRecord::Rollback
              render json: { error: e.message }, status: :unprocessable_entity
            end
          else
            render json: { errors: @order.errors }, status: :unprocessable_entity
          end
        end
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # GET /api/v1/orders/:id/credentials
      # Returns credentials dynamically based on product type
      def credentials
        order = current_reseller.orders.find(params[:id])
        resource = order.provisioned_resource

        unless resource
          return render json: { error: 'Resource not found or not yet provisioned', status: order.status }, status: :accepted
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
          return render json: { error: "Order with status '#{order.status}' cannot be cancelled" }, status: :unprocessable_entity
        end

        # Enforce 1-hour cancellation window
        if order.created_at < 1.hour.ago
          return render json: { error: 'Cancellation window has expired. Orders can only be cancelled within 1 hour of purchase.' }, status: :forbidden
        end

        Order.transaction do
          # Refund to reseller balance
          refund_amount = order.total_amount.to_f
          if refund_amount > 0 && current_reseller.main_wallet
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
    end
  end
end
