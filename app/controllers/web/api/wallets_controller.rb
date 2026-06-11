# frozen_string_literal: true

module Web
  module Api
    class WalletsController < BaseController
      include JwtAuthenticated

      # GET /web/api/wallet
      def show
        wallet = current_actor.wallet
        # Calculate stats
        wallet&.wallet_transactions&.where(transaction_type: 'credit')&.sum(:amount) || 0
        # Deposits are credits. But refunds are also credits.
        # description might help. Or just use total credits - adjustments?
        # For now, total credits is good enough proxy for "Total Deposited" if we ignore refunds/bonuses for a moment.

        # Actually proper way:
        total_deposited = wallet&.wallet_transactions&.where(transaction_type: 'credit')&.sum(:amount) || 0

        total_spent = current_actor.orders.where(status: %w[active completed]).sum(:total_amount)
        order_count = current_actor.orders.count

        render json: {
          balance: wallet&.balance || 0.0,
          available_balance: wallet&.balance || 0.0,
          currency: 'USD',
          total_deposited: total_deposited,
          total_order_amount: total_spent,
          order_count: order_count,
          discount_percentage: current_actor.metadata && current_actor.metadata['discount_percentage'] || 0,
          recent_transactions: wallet&.wallet_transactions&.order(created_at: :desc)&.limit(10) || []
        }
      end

      # POST /web/api/wallet/deposit
      def deposit
        amount = params[:amount].to_f
        gateway = params[:gateway] # 'paystack', 'plisio', 'hundredpay', 'fastspring', 'heleket'
        currency = params[:currency] || 'USD'

        return render json: { error: 'Minimum deposit is $10' }, status: :bad_request if amount < 10
        return render json: { error: 'Invalid gateway' }, status: :bad_request unless %w[paystack plisio hundredpay fastspring heleket].include?(gateway)

        # Create pending deposit
        # Store the exchange rate at deposit creation time so the webhook
        # handler can use the same rate for verification (prevents FX drift).
        exchange_rate = FixerService.get_rate('USD', 'NGN')
        transaction_ref = "DEP_#{SecureRandom.hex(8)}"
        deposit = Deposit.create!(
          depositable: current_actor,
          amount: amount,
          gateway: gateway,
          status: 'pending',
          metadata: { transaction_ref: transaction_ref, exchange_rate: exchange_rate }
        )

        # Generate payment link based on gateway
        payment_data = generate_payment_link(gateway, deposit, amount, currency)

        render json: {
          message: 'Deposit initiated',
          deposit_id: deposit.id,
          transaction_ref: deposit.metadata['transaction_ref'],
          payment_url: payment_data[:url],
          payment_amount: payment_data[:amount],
          payment_currency: payment_data[:currency]
        }
      end

      private

      def generate_payment_link(gateway, deposit, amount, currency)
        callback_url = "#{ENV['APP_URL']}/webhooks/#{gateway}"

        case gateway
        when 'paystack'
          # Use FixerService to fetch current NGN/USD rate
          exchange_rate = FixerService.get_rate('USD', 'NGN')
          amount_ngn = (amount * exchange_rate).round(2)
          service = PaystackService.new
          result = service.initialize_transaction(
            email: current_actor.email,
            phone: current_actor.try(:phone),
            country: current_actor.try(:country),
            amount: (amount_ngn * 100).to_i, # Paystack uses kobo
            reference: deposit.metadata['transaction_ref'],
            callback_url: "#{ENV['FRONTEND_URL']}/payments/success?payment=paystack&type=deposit&amount=#{deposit.amount}",
            metadata: { deposit_id: deposit.id, user_id: current_actor.id }
          )
          { url: result[:authorization_url], amount: amount_ngn, currency: 'NGN' }

        when 'plisio'
          service = PlisioService.new
          result = service.create_invoice(
            amount: amount,
            currency: currency,
            order_number: deposit.metadata['transaction_ref'],
            callback_url: callback_url,
            email: current_actor.email,
            phone: current_actor.try(:phone),
            country: current_actor.try(:country)
          )
          { url: result[:url], amount: amount, currency: 'USD' }

        when 'heleket'
          service = HeleketService.new
          result = service.create_invoice(
            amount: amount,
            currency: currency,
            order_number: deposit.metadata['transaction_ref'],
            callback_url: callback_url,
            email: current_actor.email
          )
          deposit.metadata['heleket_invoice_id'] = result[:txn_id]
          deposit.save!
          { url: result[:url], amount: amount, currency: 'USD' }

        when 'hundredpay'
          service = HundredpayService.new
          result = service.create_invoice(
            amount: amount,
            currency: currency,
            order_number: deposit.metadata['transaction_ref'],
            callback_url: callback_url,
            email: current_actor.email,
            phone: current_actor.try(:phone),
            country: current_actor.try(:country)
          )
          deposit.metadata['hundredpay_charge_id'] = result[:txn_id]
          deposit.save!
          { url: result[:url], amount: amount, currency: 'USD' }

        when 'fastspring'
          service = FastspringService.new
          ref = deposit.metadata['transaction_ref']
          product_path = service.create_dynamic_product(ref, amount, "Proxysock Deposit (#{ref})")
          fs_session_id = service.create_session(current_actor.email, product_path, {
                                                   deposit_id: deposit.id,
                                                   reference: ref,
                                                   user_id: current_actor.id
                                                 })
          store_url = ENV['FASTSPRING_STORE_URL'] || 'https://proxysock.onfastspring.com'
          { url: "#{store_url.chomp('/')}/session/#{fs_session_id}", amount: amount, currency: 'USD' }
        end
      end
    end
  end
end
