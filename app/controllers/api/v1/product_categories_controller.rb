# frozen_string_literal: true

module Api
  module V1
    class ProductCategoriesController < BaseController
      include JwtAuthenticated

      # GET /api/v1/product_categories
      def index
        categories = if current_reseller.single_product?
                       ProductCategory.where(id: current_reseller.allowed_product_category_id).order(name: :asc)
                     else
                       ProductCategory.all.order(name: :asc)
                     end

        render json: {
          categories: categories.map do |c|
            {
              id: c.id,
              name: c.name,
              slug: c.slug,
              description: c.description
            }
          end
        }
      end
    end
  end
end
