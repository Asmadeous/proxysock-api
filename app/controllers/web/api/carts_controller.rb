# frozen_string_literal: true

module Web
  module Api
    class CartsController < BaseController
      include SessionTracking

      before_action :ensure_cart

      def show
        render json: {
          cart: @cart,
          items: @cart.cart_items.includes(:product, :product_pricing)
        }
      end

      def add_item
        product = Product.find(params[:product_id])
        pricing = ProductPricing.find(params[:pricing_id])
        quantity = params[:quantity].to_i

        item = @cart.cart_items.find_or_initialize_by(product: product, product_pricing: pricing)
        item.quantity = (item.quantity || 0) + quantity
        item.metadata = (item.metadata || {}).merge(params[:metadata] || {})

        # Calculate secure prices
        pricing_service = PricingService.new(
          current_actor,
          product,
          pricing,
          quantity: item.quantity,
          metadata: item.metadata
        )

        item.unit_price = pricing.selling_price # Base unit price
        item.total_price = pricing_service.calculate_total # Final actor-specific price

        if item.save
          render json: { message: 'Item added', cart_item: item }
        else
          render json: { error: item.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def remove_item
        item = @cart.cart_items.find(params[:item_id])
        item.destroy
        render json: { message: 'Item removed' }
      end

      def checkout
        # Ensure actor is logged in
        return render json: { error: 'Authentication required' }, status: :unauthorized unless current_actor

        payment_method = params[:payment_method] || 'wallet'
        result = CartCheckoutService.new(current_actor, @cart, payment_method: payment_method).process!

        if result[:success]
          if result[:payment_url]
            # Gateway payment - return payment URL
            render json: {
              message: 'Redirect to payment gateway',
              payment_url: result[:payment_url],
              reference: result[:reference],
              checkout_session_id: result[:checkout_session_id]
            }, status: :accepted
          else
            # Wallet payment - immediate success
            render json: {
              message: 'Checkout successful',
              orders: result[:orders].map { |o| { id: o.id, status: o.status } }
            }, status: :created
          end
        else
          render json: { error: result[:error] }, status: :unprocessable_entity
        end
      end

      private

      def ensure_cart
        # Find active cart for actor or session
        @cart = if current_actor
                  Cart.find_or_create_by(orderable: current_actor, status: 'active')
                else
                  # Guest cart logic
                  Cart.find_or_create_by(session_id: current_session&.session_id, status: 'active')
                end
      end
    end
  end
end
