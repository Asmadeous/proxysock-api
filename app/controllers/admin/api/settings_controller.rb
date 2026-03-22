# frozen_string_literal: true

module Admin
  module Api
    class SettingsController < Admin::Api::BaseController
      # POST /admin/api/settings/credit_wallet
      def credit_wallet
        require_admin!
        entity = find_entity!
        wallet = entity.main_wallet || entity.create_main_wallet!(wallet_type: 'main')

        amount = params[:amount].to_d
        return render json: { error: 'Amount must be positive' }, status: :unprocessable_entity unless amount.positive?

        wallet.credit!(amount, params[:description] || "Admin credit by #{current_employee.email}")
        record_audit_log('wallet.admin_credit', entity, { amount: amount, description: params[:description] })

        render json: {
          message: "Credited $#{amount} to #{entity.email}",
          new_balance: wallet.reload.balance
        }
      end

      # POST /admin/api/settings/debit_wallet
      def debit_wallet
        require_admin!
        entity = find_entity!
        wallet = entity.main_wallet

        return render json: { error: 'No wallet found' }, status: :not_found unless wallet

        amount = params[:amount].to_d
        return render json: { error: 'Amount must be positive' }, status: :unprocessable_entity unless amount.positive?
        return render json: { error: 'Insufficient balance' }, status: :unprocessable_entity if wallet.balance < amount

        wallet.debit!(amount, params[:description] || "Admin debit by #{current_employee.email}")
        record_audit_log('wallet.admin_debit', entity, { amount: amount, description: params[:description] })

        render json: {
          message: "Debited $#{amount} from #{entity.email}",
          new_balance: wallet.reload.balance
        }
      end

      # GET /admin/api/settings/product_categories
      def product_categories
        categories = ProductCategory.all.order(:name)
        render json: {
          categories: categories.map { |c| { id: c.id, name: c.name, slug: c.slug, products_count: c.products.count } }
        }
      end

      # POST /admin/api/settings/create_product_category
      def create_product_category
        require_admin!
        category = ProductCategory.create!(name: params[:name], slug: params[:slug] || params[:name].parameterize)
        record_audit_log('product_category.created', category)
        render json: { id: category.id, name: category.name, slug: category.slug }, status: :created
      end

      # GET /admin/api/settings/system_info
      def system_info
        require_admin!
        render json: {
          environment: Rails.env,
          ruby_version: RUBY_VERSION,
          rails_version: Rails::VERSION::STRING,
          total_users: User.count,
          total_resellers: Reseller.count,
          total_orders: Order.count,
          total_products: Product.count,
          active_subscriptions: Reseller.where('subscription_expires_at > ?', Time.current).count,
          gateways: {
            paystack: ENV['PAYSTACK_SECRET_KEY'].present?,
            plisio: ENV['PLISIO_API_KEY'].present?,
            payvra: ENV['PAYVRA_API_KEY'].present?,
            hundredpay: ENV['HUNDREDPAY_API_KEY'].present?
          }
        }
      end

      private

      def find_entity!
        entity = if params[:entity_type] == 'Reseller'
                   Reseller.find_by(id: params[:entity_id]) || Reseller.find_by(email: params[:email])
                 else
                   User.find_by(id: params[:entity_id]) || User.find_by(email: params[:email])
                 end
        render(json: { error: 'Entity not found' }, status: :not_found) && return unless entity
        entity
      end
    end
  end
end
