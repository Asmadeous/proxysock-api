# frozen_string_literal: true

module Admin
  module Api
    class ProductsController < BaseController
      before_action :set_product, only: %i[show update destroy]

      def index
        products = Product.all

        products = products.where('name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        if params[:product_type].present?
          products = case params[:product_type]
                     when 'proxy'
                       products.where(product_type: Product::PROXY_TYPES)
                     else
                       products.where(product_type: params[:product_type])
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

      def sync_proxies
        ProductSyncService.new.sync_all_products
        render json: { message: 'Proxies synced successfully. Residential-rotating geo data refresh queued in the background.' }
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def sync_esims
        EsimSyncService.new.sync_packages!
        render json: { message: 'eSIMs synced successfully' }
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def sync_vps
        InHouseProductSyncService.new.sync(type: 'vps')
        render json: { message: 'Cloud VPS products synced successfully' }
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def sync_rdp
        InHouseProductSyncService.new.sync(type: 'rdp')
        render json: { message: 'RDP products synced successfully' }
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def sync_vpn
        InHouseProductSyncService.new.sync(type: 'vpn')
        render json: { message: 'VPN products synced successfully' }
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
