# frozen_string_literal: true

module Web
  module Api
    class BillingController < BaseController
      # GET /web/api/billing/balance
      def balance
        wallet = current_actor.wallet
        return render json: { available_balance: 0.0, currency: 'USD' } unless wallet

        # Simplified cache key - touch: true on transactions will update wallet.updated_at
        cache_key = "billing_balance_#{current_actor.class.name}_#{current_actor.id}_#{wallet.updated_at.to_i}"

        balance_json = Rails.cache.fetch(cache_key, expires_in: 1.hour) do
          {
            available_balance: wallet.balance.to_f,
            currency: wallet.currency || 'USD',
            total_deposited: wallet.wallet_transactions.where(transaction_type: 'credit').sum(:amount).to_f,
            total_spent: wallet.wallet_transactions.where(transaction_type: 'debit').sum(:amount).to_f.abs
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
      # POST /web/api/billing/verify_and_sync
      def verify_and_sync
        deposit = current_actor.deposits.find_by(id: params[:deposit_id])
        return render json: { error: 'Deposit not found' }, status: :not_found unless deposit

        # Call the sync service
        sync_result = DepositSyncService.new(deposit).sync!

        render json: {
          success: true,
          status: deposit.status,
          message: sync_result ? "Deposit successfully synced and balance updated." : "Deposit status checked. No changes made."
        }
      rescue StandardError => e
        render json: { error: "Sync failed: #{e.message}" }, status: :internal_server_error
      end
    end
  end
end
