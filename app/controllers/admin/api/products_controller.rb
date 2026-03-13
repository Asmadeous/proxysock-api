# frozen_string_literal: true

module Admin
  module Api
    class ProductsController < BaseController
      before_action :set_product, only: %i[show update destroy]

      def index
        products = Product.all

        products = products.where('name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        if params[:product_type].present?
          if params[:product_type] == 'proxy'
            products = products.where(product_type: Product::PROXY_TYPES)
          else
            products = products.where(product_type: params[:product_type])
          end
        end
        products = products.where(provider: params[:provider]) if params[:provider].present?
        products = products.where(active: params[:active]) if params[:active].present?

        products = products.order(created_at: :desc)
        render json: { products: products }
      end

      def show
        render json: { product: @product }
      end

      def create
        product = Product.new(product_params)

        if product.save
          begin
            AuditLog.create(action: 'create_product', user_id: current_employee.id, user_type: 'Employee',
                            auditable: product)
          rescue StandardError
            nil
          end
          render json: { product: product }, status: :created
        else
          render json: { errors: product.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @product.update(product_params)
          begin
            AuditLog.create(action: 'update_product', user_id: current_employee.id, user_type: 'Employee',
                            auditable: @product)
          rescue StandardError
            nil
          end
          render json: { product: @product }
        else
          render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @product.destroy
        begin
          AuditLog.create(action: 'delete_product', user_id: current_employee.id, user_type: 'Employee',
                          metadata: { product_name: @product.name })
        rescue StandardError
          nil
        end
        head :no_content
      end

      def sync_inhouse
        InHouseProductSyncService.new.sync
        render json: { message: 'In-house products synced successfully' }
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def sync_external
        # Sync MyProxyApi
        ProductSyncService.new.sync_all_products
        # Sync EsimAccess
        EsimSyncService.new.sync_packages!
        
        render json: { message: 'External products synced successfully' }
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def set_product
        @product = Product.find(params[:id])
      end

      def product_params
        params.require(:product).permit(
          :name, :description, :product_type, :provider, :stock_status,
          :active, metadata: {},
                   product_pricings_attributes: %i[
                     id selling_price api_price reseller_selling_price
                     user_selling_price currency duration_type
                     duration_value active _destroy
                   ]
        )
      end
    end
  end
end
