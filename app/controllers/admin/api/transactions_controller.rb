# frozen_string_literal: true

module Admin
  module Api
    class TransactionsController < BaseController
      # GET /admin/api/transactions
      def index
        transactions = Transaction.all.order(created_at: :desc)

        # Filtering
        transactions = transactions.where(status: params[:status]) if params[:status].present?
        transactions = transactions.joins(:wallet).where(wallets: { owner_type: params[:entity_type] }) if params[:entity_type].present?
        transactions = transactions.where('wallet_transactions.id::text ILIKE ?', "%#{params[:q]}%") if params[:q].present?

        page_num = (params[:page] || 1).to_i
        per_page = (params[:per] || 50).to_i
        transactions = transactions.page(page_num).per(per_page)

        render json: {
          transactions: transactions,
          total: transactions.total_count,
          page: transactions.current_page
        }
      end

      # GET /admin/api/transactions/:id
      def show
        transaction = Transaction.find(params[:id])
        render json: transaction
      end
    end
  end
end
