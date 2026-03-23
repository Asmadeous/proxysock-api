# frozen_string_literal: true

module Admin
  module Api
    class OrdersController < Admin::Api::BaseController
      before_action :set_order, only: %i[show refund rescue_order credentials update_credentials change_protocol rotate_ip whitelist_add whitelist_delete renew reorder]

      # GET /admin/api/orders
      def index
        orders = Order.preload(:product, :orderable).order(created_at: :desc)
        orders = orders.joins(:product).where(products: { product_type: params[:product_type] }) if params[:product_type].present?
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
            processing: Order.where(status: 'processing').count,
            by_type: Order.joins(:product).group('products.product_type').count,
            revenue_by_type: Order.joins(:product).group('products.product_type').sum(:total_amount)
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
        return render json: { error: 'Order has already been refunded' }, status: :unprocessable_entity if @order.status == 'refunded'
        return render json: { error: 'Nothing to refund' }, status: :unprocessable_entity unless @order.total_amount.positive?

        refund_method = params[:refund_method] || 'wallet'
        checkout = @order.checkout_session

        if refund_method == 'original' && checkout&.gateway.present?
          # Attempt gateway refund
          begin
            gateway_refund!(checkout, @order)
            @order.update!(status: 'refunded')
            record_audit_log('order.refunded', @order, { method: 'gateway', gateway: checkout.gateway })
            render json: { message: "Refunded via #{checkout.gateway}", order: order_json(@order) }
          rescue StandardError => e
            render json: { error: "Gateway refund failed: #{e.message}. Use wallet refund instead." }, status: :unprocessable_entity
          end
        else
          # Wallet refund (works for all order types)
          entity = @order.orderable
          wallet = entity&.main_wallet || entity&.wallet
          if wallet
            wallet.credit!(@order.total_amount, "Refund for order ##{@order.id}")
            @order.update!(status: 'refunded')
            record_audit_log('order.refunded', @order, { method: 'wallet' })
            render json: { message: 'Refunded to wallet', order: order_json(@order) }
          else
            render json: { error: 'No wallet found for this entity' }, status: :unprocessable_entity
          end
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

      # GET /admin/api/orders/:id/credentials
      def credentials
        service = ProxyManagementService.new(@order)
        creds = service.credentials
        if creds
          render json: creds
        else
          render json: { error: 'No proxy credentials found or product not supported' }, status: :not_found
        end
      end

      # POST /admin/api/orders/:id/update_credentials
      def update_credentials
        require_role!('admin', 'manager', 'support')
        begin
          result = ProxyManagementService.new(@order).update_credentials(params[:username], params[:password])
          record_audit_log('order.proxy_credentials_updated', @order, { username: params[:username] })
          render json: result.merge(order: order_json(@order.reload))
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # POST /admin/api/orders/:id/change_protocol
      def change_protocol
        require_role!('admin', 'manager', 'support')
        begin
          result = ProxyManagementService.new(@order).change_protocol(params[:protocol])
          record_audit_log('order.proxy_protocol_changed', @order, { protocol: params[:protocol] })
          render json: result.merge(order: order_json(@order.reload))
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # POST /admin/api/orders/:id/rotate_ip
      def rotate_ip
        require_role!('admin', 'manager', 'support')
        begin
          result = ProxyManagementService.new(@order).rotate_ip
          record_audit_log('order.proxy_ip_rotated', @order)
          render json: result.merge(order: order_json(@order.reload))
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # POST /admin/api/orders/:id/whitelist
      def whitelist_add
        require_role!('admin', 'manager', 'support')
        begin
          result = ProxyManagementService.new(@order).whitelist_add(params[:ip], params[:description])
          record_audit_log('order.proxy_whitelist_added', @order, { ip: params[:ip] })
          render json: result
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # DELETE /admin/api/orders/:id/whitelist
      def whitelist_delete
        require_role!('admin', 'manager', 'support')
        begin
          result = ProxyManagementService.new(@order).whitelist_delete(params[:ip])
          record_audit_log('order.proxy_whitelist_deleted', @order, { ip: params[:ip] })
          render json: result
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # POST /admin/api/orders/:id/renew
      def renew
        require_admin!
        begin
          service = OrderRenewalService.new(@order, @order.orderable)
          if service.process!
            record_audit_log('order.renewed', @order)
            render json: { message: 'Order renewed successfully', order: order_json(@order) }
          else
            render json: { error: 'Renewal failed' }, status: :unprocessable_entity
          end
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # POST /admin/api/orders/:id/reorder
      def reorder
        require_admin!
        # Reordering creates a NEW order based on the old one
        new_order = Order.new(
          orderable: @order.orderable,
          product: @order.product,
          product_pricing: @order.product_pricing,
          quantity: @order.quantity,
          metadata: @order.metadata.merge(is_reorder: true, original_order_id: @order.id),
          status: 'pending'
        )

        if new_order.save
          begin
            # Admins can process immediately regardless of balance if they want, 
            # but here we follow the standard logic:
            OrderProvisioningService.new(new_order, @order.orderable).process!
            record_audit_log('order.reordered', @order, { new_order_id: new_order.id })
            render json: order_json(new_order.reload), status: :created
          rescue StandardError => e
            new_order.fail! if new_order.may_fail?
            render json: { error: e.message }, status: :unprocessable_entity
          end
        else
          render json: { errors: new_order.errors }, status: :unprocessable_entity
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

        # Payment method info
        checkout = o.checkout_session
        if checkout
          data[:payment_method] = checkout.gateway
          data[:checkout_session_id] = checkout.id
        else
          data[:payment_method] = 'balance'
        end

        data
      end
    end

    private

    def gateway_refund!(checkout, order)
      case checkout.gateway
      when 'paystack'
        PaystackService.new.refund(checkout.gateway_reference, order.total_amount)
      when 'plisio'
        # Plisio does not support refunds via API — manual process
        raise 'Plisio refunds must be processed manually'
      when 'payvra'
        PayvraService.new.refund(checkout.gateway_reference, order.total_amount)
      when 'hundredpay'
        raise 'HundredPay refunds must be processed manually'
      else
        raise "Unsupported gateway: #{checkout.gateway}"
      end
    end
  end
end
