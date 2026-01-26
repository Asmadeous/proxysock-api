module Web
  module Api
    class WalletsController < BaseController
      include JwtAuthenticated

      # GET /web/api/wallet
      def show
        wallet = current_user.wallet
        
        render json: {
          balance: wallet&.balance || 0.0,
          currency: 'USD',
          recent_transactions: wallet&.wallet_transactions&.order(created_at: :desc)&.limit(10)&.map do |t|
            {
              id: t.id,
              amount: t.amount,
              type: t.transaction_type,
              description: t.description,
              created_at: t.created_at
            }
          end || []
        }
      end

      # POST /web/api/wallet/deposit
      def deposit
        amount = params[:amount].to_f
        gateway = params[:gateway] # 'paystack', 'plisio', 'payvra'
        currency = params[:currency] || 'USD'
        
        return render json: { error: 'Invalid amount' }, status: :bad_request if amount <= 0
        return render json: { error: 'Invalid gateway' }, status: :bad_request unless %w[paystack plisio payvra].include?(gateway)
        
        # Create pending deposit
        deposit = Deposit.create!(
          depositable: current_user,
          amount: amount,
          gateway: gateway,
          status: 'pending',
          transaction_id: "DEP_#{SecureRandom.hex(8)}"
        )
        
        # Generate payment link based on gateway
        payment_url = generate_payment_link(gateway, deposit, amount, currency)
        
        render json: {
          message: 'Deposit initiated',
          deposit_id: deposit.id,
          transaction_ref: deposit.transaction_id,
          payment_url: payment_url
        }
      end

      private

      def generate_payment_link(gateway, deposit, amount, currency)
        callback_url = "#{ENV['APP_URL']}/webhooks/#{gateway}"
        
        case gateway
        when 'paystack'
          service = PaystackService.new
          result = service.initialize_transaction(
            email: current_user.email,
            amount: (amount * 100).to_i, # Paystack uses kobo/cents
            reference: deposit.transaction_id,
            callback_url: callback_url,
            metadata: { deposit_id: deposit.id, user_id: current_user.id }
          )
          result[:authorization_url]
          
        when 'plisio'
          service = PlisioService.new
          result = service.create_invoice(
            order_number: deposit.transaction_id,
            amount: amount,
            currency: currency,
            callback_url: callback_url,
            email: current_user.email
          )
          result[:invoice_url]
          
        when 'payvra'
          service = PayvraService.new
          result = service.create_payment(
            amount: amount,
            currency: currency,
            reference: deposit.transaction_id,
            callback_url: callback_url
          )
          result[:payment_url]
        end
      end
    end
  end
end
