module Api
  module V1
    class BillingController < BaseController
      def balance
        wallet = current_reseller.wallet || current_reseller.create_wallet(balance: 0.0)
        render json: { 
          balance: wallet.balance.to_f, 
          currency: wallet.currency 
        }
      end
      
      def transactions
        wallet = current_reseller.wallet
        return render json: { transactions: [] } unless wallet
        
        transactions = wallet.wallet_transactions.order(created_at: :desc).page(params[:page]).per(20)
        
        render json: {
          transactions: transactions,
          meta: {
            current_page: transactions.current_page,
            total_pages: transactions.total_pages,
            total_count: transactions.total_count
          }
        }
      end
      
      def history
        # Aggregated monthly billing history
        # Assuming BillingHistory model exists or we generate it on fly
        histories = BillingHistory.where(billable: current_reseller).order(billing_period_start: :desc)
        render json: { history: histories }
      end
    end
  end
end
