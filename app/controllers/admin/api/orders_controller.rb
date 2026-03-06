# frozen_string_literal: true

module Admin
  module Api
    class OrdersController < Admin::Api::BaseController
      before_action :set_order, only: %i[show refund rescue_order]

      # GET /admin/api/orders
      def index
        orders = Order.includes(:product, :orderable).order(created_at: :desc)
        orders = orders.where(status: params[:status]) if params[:status].present?
        orders = orders.where(orderable_type: params[:entity_type]) if params[:entity_type].present?
        orders = orders.where('id::text ILIKE :q', q: "%#{params[:q]}%") if params[:q].present?

        page_num = (params[:page] || 1).to_i
        per_page = (params[:per] || 25).to_i
        orders = orders.page(page_num).per(per_page)

        render json: {
          orders: orders.map { |o| order_json(o) },
          total: orders.total_count,
          page: orders.current_page,
          stats: {
            total: Order.count,
            active: Order.where(status: 'active').count,
            pending: Order.where(status: 'pending').count,
            failed: Order.where(status: %w[failed error]).count,
            processing: Order.where(status: 'processing').count
          }
        }
      end

      # GET /admin/api/orders/:id
      def show
        render json: order_json(@order, full: true)
      end

      # POST /admin/api/orders/:id/refund
      def refund
        require_admin!
        wallet = @order.orderable&.wallet
        if wallet && @order.total_amount.positive?
          wallet.credit!(@order.total_amount, description: "Refund for order ##{@order.id}")
          @order.update!(status: 'refunded')
          record_audit_log('order.refunded', @order)
          render json: { message: 'Order refunded', order: order_json(@order) }
        else
          render json: { error: 'Cannot refund this order' }, status: :unprocessable_entity
        end
      end

      # POST /admin/api/orders/:id/rescue
      def rescue_order
        require_role!('admin', 'manager', 'support')

        begin
          # Re-provision the order
          OrderProvisioningService.new(@order).provision!
          @order.reload
          record_audit_log('order.rescued', @order)
          render json: { message: 'Order rescued and re-provisioned', order: order_json(@order) }
        rescue StandardError => e
          record_audit_log('order.rescue_failed', @order, { error: e.message })
          render json: { error: "Rescue failed: #{e.message}" }, status: :unprocessable_entity
        end
      end

      private

      def set_order
        @order = Order.find(params[:id])
      end

      def order_json(o, full: false)
        entity = o.orderable
        data = {
          id: o.id,
          status: o.status,
          product_name: o.product&.name,
          product_type: o.product&.product_type,
          total_amount: o.total_amount,
          quantity: o.quantity,
          entity_type: o.orderable_type,
          entity_name: entity.respond_to?(:company_name) ? entity.company_name : "#{entity&.first_name} #{entity&.last_name}",
          entity_email: entity&.email,
          created_at: o.created_at,
          updated_at: o.updated_at
        }
        if full
          data[:product] = {
            id: o.product&.id,
            name: o.product&.name,
            type: o.product&.product_type
          }
          data[:provisioned] = case o.product&.product_type
                               when 'esim' then o.esim_order&.as_json(only: %i[id esim_provider esim_type status])
                               when 'vps' then o.vm_order&.as_json(only: %i[id status])
                               end
        end
        data
      end
    end
  end
end
