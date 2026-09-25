# frozen_string_literal: true

module Web
  module Api
    class ProductsController < BaseController
      # Products are a public catalog — no auth required
      skip_before_action :authenticate_request, only: %i[index show residential_rotating_countries]

      # GET /web/api/products
      def index
        cache_version = Product.catalog_cache_version

        cache_key = "products/web/index_v8/#{price_audience}/#{cache_version}/#{params[:page] || 1}/#{params[:category_id] || 'all'}/#{params[:category_slug] || 'all'}/#{params[:product_type] || 'all'}/#{params[:per_page] || 100}"

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
        cache_key = "products/web/show_v3/#{price_audience}/#{product.id}/#{product.cache_version}"

        product_json = Rails.cache.fetch(cache_key, expires_in: 24.hours) do
          { product: serialize_product(product) }.to_json
        end

        render json: product_json
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Product not found' }, status: :not_found
      end

      # GET /web/api/residential-rotating/countries
      # All four endpoints read from the rr_* DB tables (populated by
      # ResidentialRotatingGeoSync) — never the provider on a user request.

      def residential_rotating_countries
        countries = RrCountry.main.alphabetical.map { |c| { id: c.code, name: c.name } }
        render json: { countries: countries }
      end

      def residential_rotating_states
        states = RrState.for_country(params[:country]).alphabetical.map { |s| { id: s.slug, name: s.name.to_s.titleize } }
        render json: { states: states }
      end

      # Cities are lazy-cached: the service fetches+stores them on first access,
      # then serves from the DB.
      def residential_rotating_cities
        cities = ResidentialRotatingGeoSync.new.cities_for(params[:country], params[:state])
        render json: { cities: cities.alphabetical.map { |c| { id: c.slug, name: c.name.to_s.titleize } } }
      rescue StandardError => e
        Rails.logger.error("[residential_rotating_cities] #{e.message}")
        render json: { cities: [] }
      end

      # ~5k ISPs/country — searchable + paginated (trigram-indexed ILIKE).
      def residential_rotating_isps
        scope = RrIsp.for_country(params[:country]).search(params[:q]).alphabetical
        page = scope.page(params[:page] || 1).per([(params[:per] || 50).to_i, 100].min)
        render json: {
          isps: page.map { |i| { id: i.external_id, name: i.name, asn: i.asn } },
          meta: { current_page: page.current_page, total_pages: page.total_pages, total_count: page.total_count }
        }
      end

      private

      # The catalog is public, so reseller prices go only to a request carrying a
      # valid reseller token. The token is decoded without being consumed, so a
      # rotating reseller token stays usable for the caller's next request.
      def price_audience
        @price_audience ||= reseller_viewer? ? 'reseller' : 'public'
      end

      def reseller_viewer?
        token = request.headers['Authorization']&.split(' ')&.last
        return false if token.blank?
        return Reseller.exists?(dedicated_api_key: token) if token.start_with?('ps_live_')

        payload = jwt_decode(token)
        reseller = payload[:reseller_id] && Reseller.find_by(id: payload[:reseller_id])
        return false unless reseller

        payload[:token_version].nil? || reseller.token_version.nil? || payload[:token_version] >= reseller.token_version
      rescue JWT::DecodeError
        false
      end

      def serialize_product(product)
        pricings = product.product_pricings.select(&:active)
        default_pricing = pricings.first

        base_data = {
          id: product.id,
          name: product.display_name(default_pricing&.user_selling_price || default_pricing&.selling_price),
          slug: product.slug,
          description: product.description,
          product_type: product.product_type,
          category: product.product_category&.name,
          category_slug: product.product_category&.slug,
          price: default_pricing&.user_selling_price || default_pricing&.selling_price,
          currency: default_pricing&.currency,
          provider_type: product.provider_type,
          provider: product.provider,
          pricings: pricings.map { |p| serialize_pricing(p) }
        }

        # Merge metadata (which contains cpu, ram, storage specs for VMs, or data/days for eSIMs)
        base_data.merge!(product.public_metadata.symbolize_keys)

        # Proxy-specific metadata defaults if missing
        if product.proxy?
          base_data[:ips_included] ||= 0
          base_data[:gb_min] ||= 0
          base_data[:gb_max] ||= 0
          base_data[:billing_type] ||= 'monthly'

          if product.product_category&.slug == 'residential-rotating'
            config = product.product_category.metadata&.dig('residential_rotating_config') || product.product_category.metadata&.dig(:residential_rotating_config)
            base_data[:residential_rotating_config] = config if config.present?
          end
        end

        base_data
      end

      def serialize_pricing(pricing)
        user_price = (pricing.user_selling_price || pricing.selling_price).to_f
        data = {
          id: pricing.id,
          duration_type: pricing.duration_type,
          duration_value: pricing.duration_value,
          selling_price: user_price,
          user_selling_price: user_price,
          currency: pricing.currency
        }
        return data unless price_audience == 'reseller'

        data.merge(selling_price: pricing.selling_price.to_f, reseller_selling_price: pricing.reseller_selling_price.to_f)
      end
    end
  end
end
