# frozen_string_literal: true

module Api
  module V1
    class OrdersController < BaseController
      include JwtAuthenticated

      # GET /api/v1/orders
      def index
        # Resellers can only see their VM orders
        orders = current_reseller.orders.joins(:product).where(products: { product_type: 'vm' })
                                 .includes(:product, :vm).order(created_at: :desc).page(params[:page]).per(20)
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
      # RESELLERS CAN ONLY ORDER VMs
      def create
        product = Product.for_resellers.vms.find(params[:product_id])

        pricing = product.product_pricings.find_by(active: true)
        return render json: { error: 'Product pricing not available' }, status: :not_found unless pricing

        order = Order.new(
          orderable: current_reseller,
          product: product,
          product_pricing: pricing,
          quantity: params[:quantity] || 1,
          status: 'pending'
        )

        if order.save
          begin
            # Process order (checks balance, deducts, provisions)
            OrderProvisioningService.new(order, current_reseller).process!
            render json: serialize_order(order.reload), status: :created
          rescue StandardError => e
            render json: { error: e.message }, status: :unprocessable_entity
          end
        else
          render json: { errors: order.errors }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/orders/:id/credentials
      # RESELLERS ONLY GET VM CREDENTIALS
      def credentials
        order = current_reseller.orders.find(params[:id])

        unless order.product.product_type == 'vm'
          return render json: { error: 'Credentials only available for VM orders' }, status: :bad_request
        end

        vm = order.vm

        unless vm && vm.status == 'active'
          return render json: { error: 'VM not yet provisioned', status: vm&.status }, status: :accepted
        end

        render json: {
          type: 'vm',
          order_id: order.id,
          vm_id: vm.id,
          ip_address: vm.ip_address,
          ssh_port: vm.ssh_port || 22,
          ssh_username: vm.ssh_username,
          ssh_password: vm.ssh_password,
          rdp_port: vm.rdp_port,
          status: vm.status,
          proxmox_vm_id: vm.proxmox_vm_id
        }
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
        vm = order.vm
        {
          id: order.id,
          product_id: order.product_id,
          product_name: order.product.name,
          total_amount: order.total_amount,
          status: order.status,
          vm_status: vm&.status,
          vm_ip: vm&.ip_address,
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
