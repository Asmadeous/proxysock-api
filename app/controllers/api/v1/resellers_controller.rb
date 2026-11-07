# frozen_string_literal: true

module Api
  module V1
    class ResellersController < BaseController
      include JwtAuthenticated

      def summary_counts
        # Managed users' pending orders
        managed_order_count = Order.where(orderable: current_reseller.managed_users)
                                   .where(status: 'pending').count

        # New managed users today
        new_users_today = current_reseller.managed_users
                                          .where('created_at >= ?', Time.current.beginning_of_day).count

        # Unread notifications
        unread_notifications = current_reseller.notifications.unread.count

        # Withdrawable profit (Infrastructure only)
        withdrawable = current_reseller.infrastructure? ? current_reseller.withdrawable_profit.to_f : 0

        render json: {
          orders: managed_order_count,
          users: new_users_today,
          notifications: unread_notifications,
          withdrawable_profit: withdrawable
        }
      end

      # Always the authenticated reseller's own record; the :id segment is ignored
      # so one reseller can never read another's profile.
      def show
        render json: serialize_reseller(current_reseller)
      end

      def update
        # profile_picture_url is derived from the attached avatar (Reseller#profile_picture_url).
        if current_reseller.update(reseller_params)
          render json: serialize_reseller(current_reseller)
        else
          render json: { errors: current_reseller.errors }, status: :unprocessable_entity
        end
      end

      def rotate_dedicated_api_key
        unless current_reseller.infrastructure?
          return render json: { error: 'Dedicated API key rotation is only available for Enterprise resellers' }, status: :forbidden
        end

        current_reseller.generate_dedicated_api_key
        if current_reseller.save
          render json: { dedicated_api_key: current_reseller.dedicated_api_key }
        else
          render json: { errors: current_reseller.errors }, status: :unprocessable_entity
        end
      end

      def deposit
        amount = params[:amount].to_f
        gateway = params[:gateway]
        currency = params[:currency] || 'USD'

        min = current_reseller.min_deposit_amount
        return render json: { error: "Minimum deposit is $#{min}" }, status: :bad_request if amount < min
        return render json: { error: 'Invalid gateway' }, status: :bad_request unless %w[rexpay plisio hundredpay fastspring heleket].include?(gateway)

        # Create Pending Deposit. Only RexPay charges in NGN, so only it needs the
        # exchange rate stored (captured now so the webhook uses the same rate).
        transaction_ref = "DEP#{SecureRandom.hex(8)}" # alphanumeric — RexPay rejects `_`
        metadata = { transaction_ref: transaction_ref }
        metadata[:exchange_rate] = FixerService.get_rate('USD', 'NGN') if gateway == 'rexpay'
        deposit = Deposit.create!(
          depositable: current_reseller,
          amount: amount,
          gateway: gateway,
          status: 'pending',
          metadata: metadata
        )

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

      # Explicit allowlist: never render the raw model (password_digest, api_key_hash,
      # reset/unlock/confirmation tokens). dedicated_api_key is shown to its owner on
      # the Settings page; permanent_api_key is not needed here (auth/me returns it).
      def serialize_reseller(reseller)
        {
          id: reseller.id,
          email: reseller.email,
          username: reseller.username,
          company_name: reseller.company_name,
          reseller_type: reseller.reseller_type,
          balance: reseller.balance,
          earnings_balance: reseller.earnings_balance,
          dedicated_api_key: reseller.dedicated_api_key,
          subscription_fee: reseller.subscription_fee,
          subscription_expires_at: reseller.subscription_expires_at,
          customer_email: reseller.customer_email,
          allowed_product_category_id: reseller.allowed_product_category_id,
          allowed_product_category_name: reseller.allowed_product_category&.name,
          country: reseller.country,
          country_code: reseller.country_code,
          city: reseller.city,
          profile_picture_url: reseller.profile_picture_url
        }
      end

      def generate_payment_link(gateway, deposit, amount, currency)
        frontend_callback_url = "#{ENV['FRONTEND_URL']}/reseller/wallet"

        case gateway
        when 'rexpay'
          # RexPay (Nigerian account) charges NGN; gross up so the customer pays the fee.
          amount_ngn = RexpayService.ngn_charge_amount(amount)
          result = RexpayService.new.create_payment(
            email: current_reseller.email,
            amount: amount_ngn,
            currency: 'NGN',
            reference: deposit.metadata['transaction_ref'],
            callback_url: RexpayService.webhook_callback_url(deposit.metadata['transaction_ref'], frontend_callback_url)
          )
          { url: result[:payment_url], amount: amount_ngn, currency: 'NGN' }
        when 'plisio'
          service = PlisioService.new
          result = service.create_invoice(
            amount: amount,
            currency: currency,
            order_number: deposit.metadata['transaction_ref'],
            callback_url: frontend_callback_url,
            email: current_reseller.email,
            phone: current_reseller.try(:phone) || current_reseller.metadata.to_h['phone'],
            country: current_reseller.try(:country) || current_reseller.metadata.to_h['country']
          )
          { url: result[:url], amount: amount, currency: 'USD' }
        when 'heleket'
          service = HeleketService.new
          result = service.create_invoice(
            amount: amount,
            currency: currency,
            order_number: deposit.metadata['transaction_ref'],
            callback_url: frontend_callback_url,
            email: current_reseller.email
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
            callback_url: frontend_callback_url,
            email: current_reseller.email,
            phone: current_reseller.try(:phone) || current_reseller.metadata.to_h['phone'],
            country: current_reseller.try(:country) || current_reseller.metadata.to_h['country']
          )
          deposit.metadata['hundredpay_charge_id'] = result[:txn_id]
          deposit.save!
          { url: result[:url], amount: amount, currency: 'USD' }
        when 'fastspring'
          service = FastspringService.new
          ref = deposit.metadata['transaction_ref']
          product_path = service.create_dynamic_product(ref, amount, "Reseller Deposit (#{ref})")
          fs_session_id = service.create_session(current_reseller.email, product_path, {
                                                   deposit_id: deposit.id,
                                                   reference: ref,
                                                   reseller_id: current_reseller.id
                                                 })
          store_url = ENV['FASTSPRING_STORE_URL'] || 'https://proxysock.onfastspring.com'
          { url: "#{store_url.chomp('/')}/session/#{fs_session_id}", amount: amount, currency: 'USD' }
        end
      end

      # Email is the login identity and is not self-service (no re-verification flow
      # exists), so it is deliberately not permitted here.
      def reseller_params
        params.require(:reseller).permit(:company_name, :username, :country, :country_code, :city, :avatar)
      end
    end
  end
end
