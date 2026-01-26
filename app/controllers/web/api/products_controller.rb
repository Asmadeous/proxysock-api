module Web
  module Api
    class ProductsController < BaseController
      skip_before_action :verify_authenticity_token
      
      # GET /web/api/products
      def index
        # Cache key: products/web/index/[page]/[category]
        cache_key = "products/web/index/#{params[:page] || 1}/#{params[:category_id] || 'all'}"
        
        products_json = Rails.cache.fetch(cache_key, expires_in: 10.minutes) do
          scope = Product.for_ecommerce.includes(:product_pricings, :product_category)
          scope = scope.where(product_category_id: params[:category_id]) if params[:category_id].present?
          
          paginated = scope.page(params[:page]).per(20)
          
          {
            products: paginated.map { |p| serialize_product(p) },
            meta: {
              current_page: paginated.current_page,
              total_pages: paginated.total_pages,
              total_count: paginated.total_count
            }
          }.to_json
        end
        
        render json: products_json
      end

      # GET /web/api/products/:id
      def show
        cache_key = "products/web/show/#{params[:id]}"
        
        product_json = Rails.cache.fetch(cache_key, expires_in: 10.minutes) do
           product = Product.for_ecommerce.find(params[:id])
           { product: serialize_product(product) }.to_json
        end
        
        render json: product_json
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Product not found' }, status: :not_found
      end

      private

      def serialize_product(product)
        pricing = product.product_pricings.find_by(active: true)
        {
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.product_category&.name,
          price: pricing&.selling_price,
          currency: pricing&.currency,
          provider_type: product.provider
        }
      end
    end
  end
end
