# frozen_string_literal: true

module Api
  module V1
    class BillingController < BaseController
      def balance
        wallet = current_reseller.main_wallet || current_reseller.create_main_wallet!(wallet_type: 'main')
        earnings_wallet = current_reseller.earnings_wallet || current_reseller.create_earnings_wallet!(wallet_type: 'earnings')

        render json: {
          balance: wallet.balance.to_f,
          earnings_balance: earnings_wallet.balance.to_f,
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

      def transfer_earnings
        amount = params[:amount].to_d
        return render json: { error: 'Invalid amount' }, status: :bad_request if amount <= 0

        begin
          AffiliateService.new(current_reseller).transfer_to_main_wallet!(amount)
          render json: { message: 'Transfer successful' }
        rescue AffiliateService::InsufficientBalanceError => e
          render json: { error: e.message }, status: :unprocessable_entity
        rescue StandardError => e
          render json: { error: e.message }, status: :internal_server_error
        end
      end

      def request_payout
        amount = params[:amount].to_d
        method = params[:payment_method] || 'bank_transfer'
        details = params[:payment_details] || {}

        return render json: { error: 'Invalid amount' }, status: :bad_request if amount <= 0

        begin
          earnings_wallet = current_reseller.earnings_wallet
          raise 'No earnings wallet found' unless earnings_wallet
          raise 'Insufficient earnings balance' if earnings_wallet.balance < amount

          payout = nil
          ActiveRecord::Base.transaction do
            # Debit the earnings wallet
            earnings_wallet.debit!(amount, "Payout request — #{method}", {
                                     payment_method: method,
                                     payment_details: details
                                   })

            # If the reseller has an affiliate, create a formal AffiliatePayout
            if current_reseller.affiliate.present?
              payout = AffiliatePayout.create!(
                affiliate: current_reseller.affiliate,
                amount: amount,
                payment_method: method,
                payment_details: details,
                status: 'pending'
              )
            end
          end

          render json: {
            message: 'Payout request submitted',
            payout_id: payout&.id,
            amount: amount,
            method: method,
            status: 'pending'
          }, status: :created
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end
    end
  end
end
