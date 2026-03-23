# frozen_string_literal: true

module Web
  module Api
    class PromoCodesController < BaseController
      skip_before_action :authenticate_request, only: [:validate]

      # Validate is public (no auth required for preview)
      # Other actions would require authentication

      # POST /web/api/promo_codes/validate
      # Validates a promo code and returns discount info (no auth required for preview)
      def validate
        code = params[:code]&.upcase&.strip
        return render json: { valid: false, error: 'Please enter a promo code' }, status: :ok if code.blank?

        promo = PromoCode.find_by('UPPER(code) = ?', code)

        if promo.nil?
          render json: { valid: false, error: 'Invalid promo code' }
        elsif !promo.usable?
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
            code: promo.code,
            discount_type: promo.discount_type,
            discount_value: promo.discount_value.to_f,
            description: promo.description,
            min_order_amount: promo.min_order_amount&.to_f,
            max_discount_amount: promo.max_discount_amount&.to_f
          }
        end
      end
    end
  end
end
