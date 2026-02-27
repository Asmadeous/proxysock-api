# frozen_string_literal: true

module Web
  module Api
    class BillingController < BaseController
      # GET /web/api/billing/balance
      def balance
        wallet = current_actor.wallet
        return render json: { error: 'Wallet not found' }, status: :not_found unless wallet

        cache_key = "#{current_actor.class.name.downcase}_#{current_actor.id}_wallet_balance_v1_#{wallet.updated_at.to_i}"

        balance_json = Rails.cache.fetch(cache_key, expires_in: 24.hours) do
          {
            available_balance: wallet.balance.to_f,
            currency: wallet.currency,
            total_deposited: wallet.wallet_transactions.where('amount > 0').sum(:amount).to_f,
            total_spent: wallet.wallet_transactions.where('amount < 0').sum(:amount).to_f.abs
          }
        end

        render json: balance_json
      end

      # GET /web/api/billing/transactions
      def transactions
        wallet = current_actor.wallet
        txns = wallet&.wallet_transactions&.order(created_at: :desc) || []
        
        # Include deposits that haven't been completed (completed ones are already in wallet_transactions)
        deps = current_actor.deposits.where.not(status: 'completed').order(created_at: :desc)

        all_items = (txns.to_a + deps.to_a).sort_by(&:created_at).reverse
        paginated_items = Kaminari.paginate_array(all_items).page(params[:page]).per(50)

        render json: {
          transactions: paginated_items.map { |item|
            if item.is_a?(WalletTransaction)
              {
                id: item.id,
                amount: item.amount.to_f,
                description: item.description,
                transaction_type: item.transaction_type,
                status: 'completed',
                created_at: item.created_at
              }
            else # Deposit (Pending or Failed)
              {
                id: "dep_#{item.id}",
                amount: item.amount.to_f,
                description: "Deposit via #{item.gateway}",
                transaction_type: 'deposit',
                status: item.status,
                created_at: item.created_at
              }
            end
          },
          meta: {
            current_page: paginated_items.current_page,
            total_pages: paginated_items.total_pages,
            total_count: paginated_items.total_count
          }
        }
      end
    end
  end
end
