module Api
  module V1
    class ProductsController < BaseController
      include JwtAuthenticated

      # GET /api/v1/products
      def index
        # Cache key: products/reseller/index/[page]/[category]
        # Include current_reseller.id in cache key if pricing depends on reseller tier!
        # Assuming for now list is generic, but if pricing is customized per reseller, adding ID is safer.
        # Although serialize_product below fetches 'selling_price', usually that's base.
        # If dynamic pricing is applied in serializer, we need separate cache per reseller or just cache the list and apply pricing mapped in memory?
        # For efficiency, cache the base list, then map pricing? OR cache per reseller if traffic low?
        # Safe bet: Cache list without prices if possible, or include tier in key.
        # Let's assume standard pricing for now.
        
        cache_key = "products/reseller/index/#{params[:page] || 1}/#{params[:category_id] || 'all'}"
        
        products_json = Rails.cache.fetch(cache_key, expires_in: 10.minutes) do
          scope = Product.for_resellers.includes(:product_pricings, :product_category)
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
        
        # NOTE: If we need custom reseller pricing on top of this cached JSON, we'd need to parse and modifying it, defeating cache purpose somewhat.
        # Better: Cache the DB query result (Record set) less effective?
        # Compromise: Cache the JSON. If dynamic pricing needed later, we move pricing calc to client or use Tier-based keys.
        
        render json: products_json
      end

      # GET /api/v1/products/:id
      def show
        cache_key = "products/reseller/show/#{params[:id]}"
        
        product_json = Rails.cache.fetch(cache_key, expires_in: 10.minutes) do
           product = Product.for_resellers.find(params[:id])
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
          category: product.product_category&.name,
          base_price: pricing&.selling_price, 
          currency: pricing&.currency,
          provider_type: product.provider
        }
      end
    end
  end
end
