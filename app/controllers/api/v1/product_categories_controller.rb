# frozen_string_literal: true

module Api
  module V1
    class ProductCategoriesController < BaseController
      include JwtAuthenticated

      # GET /api/v1/product_categories
      def index
        categories = ProductCategory.all.order(name: :asc)
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
