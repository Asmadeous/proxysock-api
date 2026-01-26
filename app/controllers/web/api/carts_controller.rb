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
      
      private
      
      def ensure_cart
        # Find active cart for user or session
        if current_user
          @cart = Cart.find_or_create_by(user: current_user, status: 'active')
        else
          # Guest cart logic (requires SessionTracking to have guest user or link by session_id)
          # For now, require login or link to session if Cart model supports session_id
          @cart = Cart.find_or_create_by(session_id: current_session&.session_id, status: 'active')
          
          # If creating for session without user, ensure User is optional in Cart model
          # Schema says `user_id` null: false in Cart? Let's check schema.
        end
      end
    end
  end
end
