# frozen_string_literal: true

module Api
  module V1
    class ProductsController < BaseController
      include JwtAuthenticated

      # GET /api/v1/products
      def index
        cache_key = "products/reseller/index/#{params[:page] || 1}/#{params[:category_id] || 'all'}/#{params[:product_type] || 'all'}/#{params[:category_slug] || 'all'}"

        products_json = Rails.cache.fetch(cache_key, expires_in: 10.minutes) do
          scope = Product.for_resellers.includes(:product_pricings, :product_category)
          scope = scope.where(product_category_id: params[:category_id]) if params[:category_id].present?

          if params[:product_type].present?
            types = params[:product_type].split(',')
            scope = scope.where(product_type: types)
          end

          if params[:category_slug].present?
            scope = scope.joins(:product_category).where(product_categories: { slug: params[:category_slug] })
          end

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

      # GET /api/v1/products/:id
      def show
        cache_key = "products/reseller/show/#{params[:id]}"

        product_json = Rails.cache.fetch(cache_key, expires_in: 10.minutes) do
          product = Product.for_resellers.find(params[:id])
          { product: serialize_product(product) }.to_json
        end

        render json: product_json
      end

      private

      def serialize_product(product)
        # Use find to leverage preloaded product_pricings instead of find_by
        pricing = product.product_pricings.find(&:active)
        {
          id: product.id,
          name: product.name,
          category: product.product_category&.name,
          base_price: pricing&.selling_price.to_f,
          currency: pricing&.currency || 'USD',
          provider_type: product.provider,
          product_type: product.product_type
        }
      end
    end
  end
end
