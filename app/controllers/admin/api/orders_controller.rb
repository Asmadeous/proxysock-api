# frozen_string_literal: true

module Admin
  module Api
    class OrdersController < Admin::Api::BaseController
      before_action :set_order, only: %i[show update destroy refund rescue_order credentials update_credentials change_protocol rotate_ip whitelist_add whitelist_delete renew reorder]

      # POST /admin/api/orders
      # Admin-initiated purchase: finds user by email, creates order, provisions without payment.
      def create
        require_admin!

        product = Product.find(params[:product_id])
        pricing = product.product_pricings.find_by(active: true)
        return render json: { error: 'No active pricing for this product' }, status: :not_found unless pricing

        email = params[:customer_email].to_s.strip.downcase
        return render json: { error: 'customer_email is required' }, status: :bad_request if email.blank?

        user = User.find_by(email: email)
        return render json: { error: "No user found with email: #{email}" }, status: :not_found unless user

        # Ensure user has a wallet for provisioning service compatibility
        user.create_wallet! unless user.wallet

        order = Order.create!(
          orderable: user,
          product: product,
          product_pricing: pricing,
          quantity: params[:quantity] || 1,
          metadata: {
            'admin_provisioned' => true,
            'provisioned_by' => current_employee.id,
            'credentials_email' => email,
            'client_ip' => request.remote_ip
          }.merge(params[:metadata]&.to_unsafe_h || {}),
          status: 'pending'
        )

        OrderProvisioningJob.perform_later(order.id, user.id, 'User')
        record_audit_log('order.admin_created', order, { customer_email: email, product_name: product.name })

        render json: {
          message: "Order ##{order.order_number} created. Provisioning started — credentials will be emailed to #{email}.",
          order: order_json(order)
        }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # GET /admin/api/orders
      def index
        orders = Order.preload(:product, :orderable).order(created_at: :desc)

        if params[:product_type].present?
          orders = case params[:product_type]
                   when 'proxy'
                     orders.joins(:product).where(products: { product_type: Product::PROXY_TYPES })
                   when 'esim'
                     orders.joins(:product).where(products: { product_type: 'esim' })
                   else
                     orders.joins(:product).where(products: { product_type: params[:product_type] })
                   end
        end

        orders = orders.where(status: params[:status]) if params[:status].present?
        orders = orders.where(orderable_type: params[:entity_type]) if params[:entity_type].present?
        orders = orders.where('id::text ILIKE :q', q: "%#{params[:q]}%") if params[:q].present?

        page_num = (params[:page] || 1).to_i
        per_page = (params[:per] || 25).to_i
        orders = orders.page(page_num).per(per_page)

        # Aggregate stats manually to handle grouped types correctly
        raw_stats = Order.joins(:product).group('products.product_type').count
        raw_revenue = Order.joins(:product).group('products.product_type').sum(:total_amount)

        by_type = {
          'proxy' => raw_stats.slice(*Product::PROXY_TYPES).values.sum,
          'esim' => raw_stats['esim'] || 0,
          'rdp' => raw_stats['rdp'] || 0,
          'vps' => raw_stats['vps'] || 0,
          'vpn' => raw_stats['vpn'] || 0
        }

        revenue_by_type = {
          'proxy' => raw_revenue.slice(*Product::PROXY_TYPES).values.sum,
          'esim' => raw_revenue['esim'] || 0,
          'rdp' => raw_revenue['rdp'] || 0,
          'vps' => raw_revenue['vps'] || 0,
          'vpn' => raw_revenue['vpn'] || 0
        }

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
            by_type: by_type,
            revenue_by_type: revenue_by_type
          }
        }
      end

      # GET /admin/api/orders/:id
      def show
        render json: order_json(@order, full: true)
      end

      # PATCH/PUT /admin/api/orders/:id
      # Admin free-edit. Applied via update_columns so it bypasses AASM guards AND
      # the before_save :calculate_total_amount callback — the admin's status and
      # total_amount stick verbatim. NOTE: a free status change here intentionally
      # does NOT trigger provisioning/refund/deprovision side effects.
      VALID_STATUSES = %w[pending awaiting_payment processing active expired cancelled failed refunded].freeze

      def update
        require_admin!

        permitted = params.permit(
          :status, :quantity, :expires_at, :total_amount, :currency, :provider_order_id
        ).to_h.symbolize_keys

        # metadata is free-form jsonb — allow full replacement of the blob
        if params[:metadata].present?
          permitted[:metadata] = params[:metadata].respond_to?(:to_unsafe_h) ? params[:metadata].to_unsafe_h : params[:metadata]
        end

        return render json: { error: 'No editable fields provided' }, status: :unprocessable_entity if permitted.blank?

        if permitted[:status].present? && VALID_STATUSES.exclude?(permitted[:status])
          return render json: { error: "Invalid status. Allowed: #{VALID_STATUSES.join(', ')}" }, status: :unprocessable_entity
        end

        @order.update_columns(permitted.merge(updated_at: Time.current))
        record_audit_log('order.updated', @order, { changed: permitted.keys })

        render json: order_json(@order.reload, full: true)
      rescue ActiveRecord::StatementInvalid, ArgumentError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # DELETE /admin/api/orders/:id
      # Soft-cancel: keep the order + financial/audit record, just mark it cancelled.
      # Pass deprovision=true to also tear down provisioned provider resources.
      def destroy
        require_admin!

        if @order.may_cancel?
          @order.cancel!
        else
          # Terminal states (expired/failed/refunded) don't allow the AASM cancel event.
          @order.update_columns(status: 'cancelled', updated_at: Time.current)
        end

        # No unified cross-provider teardown exists yet; record the intent so the
        # existing per-resource cleanup jobs / an operator can act on it. The
        # cancelled status already excludes the order from active provisioning.
        deprovision = ActiveRecord::Type::Boolean.new.cast(params[:deprovision])
        if deprovision
          @order.update_columns(
            metadata: (@order.metadata || {}).merge('deprovision_requested_at' => Time.current.iso8601),
            updated_at: Time.current
          )
        end

        record_audit_log('order.cancelled', @order, { deprovision: !!deprovision })
        render json: { message: "Order ##{@order.order_number} cancelled.", order: order_json(@order) }
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # POST /admin/api/orders/:id/refund
      def refund
        require_admin!
        return render json: { error: 'Order has already been refunded' }, status: :unprocessable_entity if @order.status == 'refunded'
        return render json: { error: 'Nothing to refund' }, status: :unprocessable_entity unless @order.total_amount.positive?

        refund_method = params[:refund_method] || 'wallet'
        checkout = @order.checkout_session

        if refund_method == 'original' && checkout&.payment_method.present?
          # Attempt gateway refund
          begin
            gateway_refund!(checkout, @order)
            @order.update!(status: 'refunded')
            record_audit_log('order.refunded', @order, { method: 'gateway', gateway: checkout.payment_method })
            render json: { message: "Refunded via #{checkout.payment_method}", order: order_json(@order) }
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
            # Provision in the background — provider IP assignment can take minutes
            # and would block this admin request past the proxy timeout. The job's
            # process! handles debit + provisioning.
            OrderProvisioningJob.perform_later(new_order.id, @order.orderable.id, @order.orderable.class.name)
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
          data[:order_number]     = o.order_number
          data[:currency]         = o.currency
          data[:expires_at]       = o.expires_at
          data[:provider_order_id] = o.provider_order_id
          data[:metadata]         = o.metadata
          data[:credentials]      = o.credentials

          data[:product] = {
            id: o.product&.id,
            name: o.product&.name,
            type: o.product&.product_type,
            provider_type: o.product&.provider_type,
            slug: o.product&.slug
          }

          if (pr = o.product_pricing)
            data[:pricing] = {
              duration_type: pr.duration_type,
              duration_value: pr.duration_value,
              selling_price: pr.selling_price,
              user_selling_price: pr.try(:user_selling_price),
              cost_price: pr.try(:cost_price),
              currency: pr.currency
            }
          end

          data[:customer] = {
            id: entity&.id,
            type: o.orderable_type,
            email: entity&.email,
            name: data[:entity_name]
          }

          data[:provisioned] = provisioned_details(o)

          data[:timeline] = AuditLog.where(auditable: o).order(created_at: :desc).limit(20).map do |log|
            { action: log.action, user_type: log.user_type, user_id: log.user_id, changes: log.object_changes, created_at: log.created_at }
          end
        end

        # Payment method info
        checkout = o.checkout_session
        if checkout
          data[:payment_method] = checkout.payment_method
          data[:checkout_session_id] = checkout.id
        else
          data[:payment_method] = 'balance'
        end

        data
      end

      # Serializes whichever provisioned resource(s) exist for this order so the
      # admin detail modal can show IPs / credentials / status across every product
      # type, not just esim/vps. has_one associations return nil when absent.
      def provisioned_details(o)
        out = {}
        # Per-association rescue: a broken/legacy association reflection on one
        # product type must never blow up the whole detail view.
        add = lambda do |key, &blk|
          val = begin
            blk.call
          rescue StandardError
            nil
          end
          out[key] = val.as_json if val.present?
        end

        add.call(:mobile_proxies)      { o.mobile_proxies.to_a.presence || o.mobile_proxy_order }
        add.call(:static_datacenter)   { o.static_datacenter_proxy_order }
        add.call(:static_isp)          { o.static_isp_proxy_order }
        add.call(:static_residential)  { o.static_residential_proxy_order }
        add.call(:residential_rotating){ o.residential_rotating_proxy_order }
        add.call(:premium_isp)         { o.premium_isp_proxy_order }
        add.call(:vpn)                 { o.vpn_order }
        add.call(:global_isp)          { o.global_isp_proxies.to_a.presence }
        add.call(:esim)                { o.esim_order }
        add.call(:vm)                  { o.vm_order }
        out.presence
      end
    end

    private

    def gateway_refund!(checkout, order)
      case checkout.payment_method
      when 'rexpay'
        # RexPay exposes no refund API — reverse the charge from the RexPay dashboard
        raise 'RexPay refunds must be processed manually from the RexPay dashboard'
      when 'plisio'
        # Plisio does not support refunds via API — manual process
        raise 'Plisio refunds must be processed manually'
      when 'payvra'
        PayvraService.new.refund(checkout.gateway_reference, order.total_amount)
      when 'hundredpay'
        raise 'HundredPay refunds must be processed manually'
      else
        raise "Unsupported gateway: #{checkout.payment_method}"
      end
    end
  end
end
