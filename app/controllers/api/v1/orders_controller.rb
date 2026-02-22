# frozen_string_literal: true

module Api
  module V1
    class OrdersController < BaseController
      include JwtAuthenticated

      # GET /api/v1/orders
      def index
        # Resellers can see all their orders
        # Using ResellerOrder as the primary query base to get all products they've purchased for resale
        orders = current_reseller.orders
                                 .includes(:product, :vm_order, :vpn_order, :mobile_proxy_order, :static_datacenter_proxy_order, :static_residential_proxy_order, :residential_rotating_proxy_order)
                                 .order(created_at: :desc)
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
