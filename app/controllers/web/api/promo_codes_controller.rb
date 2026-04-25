# frozen_string_literal: true

module Web
  module Api
    class PromoCodesController < BaseController
      skip_before_action :authenticate_request, only: [:validate]

      # Validate is public (no auth required for preview)
      # Other actions would require authentication

      # POST /web/api/promo_codes/validate
      # Validates a promo code OR affiliate referral code and returns discount info
      def validate
        code = params[:code]&.upcase&.strip
        return render json: { valid: false, error: 'Please enter a promo code' }, status: :ok if code.blank?

        # 1. Check PromoCode first
        promo = PromoCode.find_by('UPPER(code) = ?', code)

        if promo.present?
          if !promo.usable?
            if promo.expired?
              render json: { valid: false, error: 'This promo code has expired' }
            elsif promo.maxed_out?
              render json: { valid: false, error: 'This promo code has reached its usage limit' }
            else
              render json: { valid: false, error: 'This promo code is no longer active' }
            end
          else
            render json: {
              valid: true,
              type: 'promo_code',
              code: promo.code,
              discount_type: promo.discount_type,
              discount_value: promo.discount_value.to_f,
              description: promo.description,
              min_order_amount: promo.min_order_amount&.to_f,
              max_discount_amount: promo.max_discount_amount&.to_f
            }
          end
          return
        end

        # 2. Fall back to Affiliate referral code
        affiliate = Affiliate.active.find_by(referral_code: code)

        if affiliate.present?
          render json: {
            valid: true,
            type: 'affiliate',
            code: affiliate.referral_code,
            discount_type: 'percentage',
            discount_value: affiliate.discount_rate.to_f,
            description: "Affiliate discount from #{affiliate.display_name}",
            min_order_amount: nil,
            max_discount_amount: nil
          }
        else
          render json: { valid: false, error: 'Invalid promo code' }
        end
      end
    end
  end
end
