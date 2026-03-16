# frozen_string_literal: true

module Web
  module Api
    class ProductsController < BaseController
      # Products are a public catalog — no auth required
      skip_before_action :authenticate_request, only: %i[index show]

      # GET /web/api/products
      def index
        stats = Product.unscoped.select('COUNT(*) as count, MAX(updated_at) as last_updated').take
        cache_version = "#{stats.count}-#{stats.last_updated.to_i}"

        cache_key = "products/web/index_v6/#{cache_version}/#{params[:page] || 1}/#{params[:category_id] || 'all'}/#{params[:category_slug] || 'all'}/#{params[:product_type] || 'all'}/#{params[:per_page] || 100}"

        products_json = Rails.cache.fetch(cache_key, expires_in: 24.hours) do
          scope = Product.where(active: true).includes(:product_pricings, :product_category)
          scope = scope.where(product_category_id: params[:category_id]) if params[:category_id].present?

          if params[:category_slug].present?
            slugs = params[:category_slug].split(',')
            scope = scope.joins(:product_category).where(product_categories: { slug: slugs })
          end

          if params[:product_type].present?
            # If 'proxy' is requested, include all granular proxy types
            scope = if params[:product_type] == 'proxy'
                      scope.where(product_type: Product::PROXY_TYPES)
                    else
                      scope.where(product_type: params[:product_type])
                    end
          end

          if params[:per_page] == 'all'
            paginated = scope
            meta = { current_page: 1, total_pages: 1, total_count: scope.size }
          else
            per_page = (params[:per_page] || 100).to_i
            paginated = scope.page(params[:page]).per(per_page)
            meta = {
              current_page: paginated.current_page,
              total_pages: paginated.total_pages,
              total_count: paginated.total_count
            }
          end

          {
            products: paginated.map { |p| serialize_product(p) },
            meta: meta
          }.to_json
        end

        render json: products_json
      end

      # GET /web/api/products/:id
      def show
        product = Product.where(active: true).find(params[:id])
        cache_key = "products/web/show/#{product.id}/#{product.updated_at.to_i}"

        product_json = Rails.cache.fetch(cache_key, expires_in: 24.hours) do
          { product: serialize_product(product) }.to_json
        end

        render json: product_json
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Product not found' }, status: :not_found
      end

      private

      def serialize_product(product)
        pricings = product.product_pricings.select(&:active)
        default_pricing = pricings.first

        base_data = {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          product_type: product.product_type,
          category: product.product_category&.name,
          category_slug: product.product_category&.slug,
          price: default_pricing&.user_selling_price || default_pricing&.selling_price,
          api_price: default_pricing&.api_price,
          currency: default_pricing&.currency,
          provider_type: product.provider_type,
          provider: product.provider,
          pricings: pricings.map { |p| serialize_pricing(p) }
        }

        # Merge metadata (which contains cpu, ram, storage specs for VMs, or data/days for eSIMs)
        base_data.merge!(product.metadata.symbolize_keys) if product.metadata.is_a?(Hash)

        # Proxy-specific metadata defaults if missing
        if product.proxy?
          base_data[:ips_included] ||= 0
          base_data[:gb_min] ||= 0
          base_data[:gb_max] ||= 0
          base_data[:billing_type] ||= 'monthly'
        end

        base_data
      end

      def serialize_pricing(pricing)
        {
          id: pricing.id,
          duration_type: pricing.duration_type,
          duration_value: pricing.duration_value,
          api_price: pricing.api_price.to_f,
          selling_price: pricing.selling_price.to_f,
          user_selling_price: pricing.user_selling_price.to_f,
          reseller_selling_price: pricing.reseller_selling_price.to_f,
          currency: pricing.currency
        }
      end
    end
  end
end
