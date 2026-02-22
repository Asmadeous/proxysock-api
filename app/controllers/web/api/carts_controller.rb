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
        item.unit_price = pricing.selling_price
        item.total_price = item.quantity * item.unit_price

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
        # Ensure user is logged in
        return render json: { error: 'Authentication required' }, status: :unauthorized unless current_user

        payment_method = params[:payment_method] || 'wallet'
        result = CartCheckoutService.new(current_user, @cart, payment_method: payment_method).process!

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
        # Find active cart for user or session
        @cart = if current_user
                  Cart.find_or_create_by(user: current_user, status: 'active')
                else
                  # Guest cart logic (requires SessionTracking to have guest user or link by session_id)
                  # For now, require login or link to session if Cart model supports session_id
                  Cart.find_or_create_by(session_id: current_session&.session_id, status: 'active')

                  # If creating for session without user, ensure User is optional in Cart model
                  # Schema says `user_id` null: false in Cart? Let's check schema.
                end
      end
    end
  end
end
