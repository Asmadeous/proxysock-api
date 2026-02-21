# frozen_string_literal: true

module Web
  module Api
    class ProductsController < BaseController
      # Products are a public catalog — no auth required
      skip_before_action :authenticate_request, only: %i[index show]

      # GET /web/api/products
      def index
        cache_key = "products/web/index/#{params[:page] || 1}/#{params[:category_id] || 'all'}/#{params[:product_type] || 'all'}"

        products_json = Rails.cache.fetch(cache_key, expires_in: 10.minutes) do
          scope = Product.where(active: true).includes(:product_pricings, :product_category)
          scope = scope.where(product_category_id: params[:category_id]) if params[:category_id].present?

          if params[:product_type].present?
            product_type = params[:product_type]

            case product_type
            when 'vps'
              # Frontend may use 'vps' but DB stores as 'vm'
              scope = scope.where(product_type: 'vm')
            when 'rdp'
              # RDP products stored as 'vm' with rdp metadata flag, or as explicit 'rdp' if it exists
              scope = scope.where(product_type: %w[rdp vm])
                           .where("product_type = 'rdp' OR metadata->>'rdp' = 'true'")
            else
              # Handles: proxy, esim, usa_esim, vpn, etc.
              scope = scope.where(product_type: product_type)
            end
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

      # GET /web/api/products/:id
      def show
        cache_key = "products/web/show/#{params[:id]}"

        product_json = Rails.cache.fetch(cache_key, expires_in: 10.minutes) do
          product = Product.where(active: true).find(params[:id])
          { product: serialize_product(product) }.to_json
        end

        render json: product_json
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Product not found' }, status: :not_found
      end

      private

      def serialize_product(product)
        pricing = product.product_pricings.find_by(active: true)

        base_data = {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          product_type: product.product_type,
          category: product.product_category&.name,
          price: pricing&.selling_price,
          currency: pricing&.currency,
          provider_type: product.provider_type
        }

        # Merge metadata (which contains cpu, ram, storage specs for VMs, or data/days for eSIMs)
        if product.metadata.is_a?(Hash)
          base_data.merge!(product.metadata.symbolize_keys)
        end

        base_data
      end
    end
  end
end
