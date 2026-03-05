# frozen_string_literal: true

module Admin
  module Api
    class ProductsController < BaseController
      before_action :set_product, only: %i[show update destroy]

      def index
        products = Product.all
        
        products = products.where('name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        products = products.where(product_type: params[:product_type]) if params[:product_type].present?
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
          AuditLog.create(action: 'create_product', user_id: current_employee.id, user_type: 'Employee', auditable: product) rescue nil
          render json: { product: product }, status: :created
        else
          render json: { errors: product.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @product.update(product_params)
          AuditLog.create(action: 'update_product', user_id: current_employee.id, user_type: 'Employee', auditable: @product) rescue nil
          render json: { product: @product }
        else
          render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @product.destroy
        AuditLog.create(action: 'delete_product', user_id: current_employee.id, user_type: 'Employee', metadata: { product_name: @product.name }) rescue nil
        head :no_content
      end

      private

      def set_product
        @product = Product.find(params[:id])
      end

      def product_params
        params.require(:product).permit(
          :name, :description, :product_type, :provider, :stock_status,
          :active, metadata: {},
          product_pricings_attributes: [
            :id, :selling_price, :api_price, :reseller_selling_price, 
            :user_selling_price, :currency, :duration_type, 
            :duration_value, :active, :_destroy
          ]
        )
      end
    end
  end
end
