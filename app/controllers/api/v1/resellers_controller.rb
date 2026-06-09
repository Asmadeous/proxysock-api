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

      def index
        resellers = Reseller.page(params[:page]).per(params[:per] || 25)
        render json: {
          resellers: resellers,
          total: Reseller.count
        }
      end

      def show
        render json: current_reseller
      end

      def update
        if current_reseller.update(reseller_params)
          if current_reseller.avatar.attached?
            proxy_path = Rails.application.routes.url_helpers.rails_storage_proxy_path(current_reseller.avatar, only_path: true)
            current_reseller.update_column(:profile_picture_url, proxy_path)
          end
          render json: current_reseller
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
        return render json: { error: 'Invalid gateway' }, status: :bad_request unless %w[paystack plisio
                                                                                         payvra hundredpay fastspring heleket].include?(gateway)

        # Create Pending Deposit
        transaction_ref = "DEP_#{SecureRandom.hex(8)}"
        deposit = Deposit.create!(
          depositable: current_reseller,
          amount: amount,
          gateway: gateway,
          status: 'pending',
          metadata: { transaction_ref: transaction_ref }
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

      def generate_payment_link(gateway, deposit, amount, currency)
        frontend_callback_url = "#{ENV['FRONTEND_URL']}/reseller/wallet"

        case gateway
        when 'paystack'
          exchange_rate = FixerService.get_rate('USD', 'NGN')
          amount_ngn = (amount * exchange_rate).round(2)
          service = PaystackService.new
          result = service.initialize_transaction(
            email: current_reseller.email,
            phone: current_reseller.try(:phone) || current_reseller.metadata.to_h['phone'],
            country: current_reseller.try(:country) || current_reseller.metadata.to_h['country'],
            amount: (amount_ngn * 100).to_i,
            reference: deposit.metadata['transaction_ref'],
            callback_url: "#{ENV['FRONTEND_URL']}/reseller/wallet",
            metadata: { deposit_id: deposit.id, reseller_id: current_reseller.id }
          )
          { url: result[:authorization_url], amount: amount_ngn, currency: 'NGN' }
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
        when 'payvra'
          service = PayvraService.new
          result = service.create_invoice(
            amount: amount,
            currency: currency,
            order_number: deposit.metadata['transaction_ref'],
            callback_url: frontend_callback_url,
            email: current_reseller.email,
            phone: current_reseller.try(:phone) || current_reseller.metadata.to_h['phone'],
            country: current_reseller.try(:country) || current_reseller.metadata.to_h['country']
          )
          # Store Payvra's txn_id so DepositSyncService can verify it later.
          deposit.metadata['payvra_invoice_id'] = result[:txn_id]
          deposit.save!
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

      def reseller_params
        params.require(:reseller).permit(:company_name, :email, :profile_picture_url, :avatar)
      end
    end
  end
end
