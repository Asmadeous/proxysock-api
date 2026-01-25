module Api
  module V1
    class ProductsController < BaseController
      def index
        # Enforce that resellers only see products available to them
        products = Product.for_resellers
        
        # Optional filtering by category
        if params[:category_id]
          products = products.where(product_category_id: params[:category_id])
        end
        
        render json: products
      end

      def show
        # Enforce scoping on show as well
        product = Product.for_resellers.find(params[:id])
        render json: product
      end
      
      def pricing
        product = Product.for_resellers.find(params[:id])
        render json: product.product_pricings
      end
    end
  end
end
