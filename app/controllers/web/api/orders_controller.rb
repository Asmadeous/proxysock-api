# frozen_string_literal: true

module Web
  module Api
    class OrdersController < BaseController
      include JwtAuthenticated

      # GET /web/api/orders
      def index
        scope = current_user.orders.includes(:product, :product_pricing).order(created_at: :desc)
        
        if params[:type].present?
          scope = scope.joins(:product).where(products: { product_type: params[:type] })
        end

        orders = scope.limit(20)
        
        render json: {
          orders: orders.map { |o| serialize_order(o) },
          meta: { total_count: orders.count }
        }
      end

      # GET /web/api/orders/:id
      def show
        order = current_user.orders.find(params[:id])
        render json: serialize_order(order)
      end

      # POST /web/api/orders
      def create
        product = Product.for_ecommerce.find(params[:product_id])
        pricing = product.product_pricings.find_by(active: true)
        payment_method = params[:payment_method] || 'wallet' # 'wallet' or 'gateway'

        # Create order
        order = Order.new(
          orderable: current_user,
          product: product,
          product_pricing: pricing,
          quantity: params[:quantity] || 1,
          status: 'pending'
        )

        return render json: { errors: order.errors }, status: :unprocessable_entity unless order.save

        total = order.total_amount

        if payment_method == 'wallet'
          # Pay from wallet balance
          wallet = current_user.wallet

          if wallet.nil? || wallet.balance < total
            order.update(status: 'failed')
            return render json: { error: "Insufficient balance. Required: #{total}, Available: #{wallet&.balance || 0}" },
                          status: :payment_required
          end

          # Deduct balance and provision
          begin
            # Service handles debit and provisioning
            OrderProvisioningService.new(order, current_user).process!
            render json: serialize_order(order.reload), status: :created
          rescue StandardError => e
            order.fail! if order.may_fail?
            render json: { error: e.message }, status: :unprocessable_entity
          end

        else
          # Redirect to payment gateway
          gateway = params[:gateway] || 'paystack'
          payment_url = generate_order_payment_link(gateway, order, total)

          render json: {
            order: serialize_order(order),
            payment_url: payment_url,
            message: 'Complete payment to activate order'
          }, status: :accepted
        end
      end

      # GET /web/api/orders/:id/credentials
      def credentials
        order = current_user.orders.find(params[:id])

        return render json: { error: 'Order not active' }, status: :bad_request unless order.status == 'active'

        case order.product.product_type
        when 'vm'
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
          proxy = order.proxy
          render json: {
            type: 'proxy',
            ip: proxy&.ip_address,
            port: proxy&.port,
            username: proxy&.username,
            password: proxy&.password,
            protocol: proxy&.protocol
          }
        when 'esim'
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
          vpn = order.vpn_account
          render json: {
            type: 'vpn',
            server: vpn&.server,
            protocol: vpn&.protocol,
            username: vpn&.username,
            password: vpn&.password
          }
        else
          render json: { error: 'No credentials available' }, status: :not_found
        end
      end

      # POST /web/api/orders/:id/renew
      def renew
        order = current_user.orders.find(params[:id])

        begin
          service = OrderRenewalService.new(order, current_user)
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
        {
          id: order.id,
          order_number: order.order_number,
          product_id: order.product_id,
          product_name: order.product.name,
          product_type: order.product.product_type,
          total_amount: order.total_amount,
          currency: order.currency,
          status: order.status,
          created_at: order.created_at,
          expires_at: order.expires_at,
          metadata: order.metadata
        }
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count
        }
      end

      def generate_order_payment_link(gateway, order, amount)
        # Similar to deposit but for orders
        callback_url = "#{ENV['APP_URL']}/webhooks/#{gateway}"

        case gateway
        when 'paystack'
          PaystackService.new.initialize_transaction(
            email: current_user.email,
            amount: (amount * 100).to_i,
            reference: "ORD_#{order.id}_#{SecureRandom.hex(4)}",
            callback_url: callback_url,
            metadata: { order_id: order.id, user_id: current_user.id, type: 'order' }
          )[:authorization_url]
        when 'plisio'
          PlisioService.new.create_invoice(
            order_number: "ORD_#{order.id}",
            amount: amount,
            currency: 'USD',
            callback_url: callback_url,
            email: current_user.email
          )[:invoice_url]
        when 'payvra'
          PayvraService.new.create_payment(
            amount: amount,
            currency: 'USD',
            reference: "ORD_#{order.id}",
            callback_url: callback_url
          )[:payment_url]
        end
      end
    end
  end
end
