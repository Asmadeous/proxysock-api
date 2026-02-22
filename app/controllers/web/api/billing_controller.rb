# frozen_string_literal: true

module Web
  module Api
    class BillingController < BaseController
      # GET /web/api/billing/balance
      def balance
        cache_key = "user_#{current_user.id}_wallet_balance"

        balance_json = Rails.cache.fetch(cache_key, expires_in: 2.minutes) do
          wallet = current_user.wallet || current_user.create_wallet!
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
        wallet = current_user.wallet
        return render(json: { transactions: [] }) unless wallet

        txns = wallet.wallet_transactions.order(created_at: :desc).page(params[:page]).per(50)
        render json: {
          transactions: txns.map { |t|
            {
              id: t.id,
              amount: t.amount.to_f,
              description: t.description,
              transaction_type: t.transaction_type,
              created_at: t.created_at
            }
          },
          meta: {
            current_page: txns.current_page,
            total_pages: txns.total_pages,
            total_count: txns.total_count
          }
        }
      end
    end
  end
end
