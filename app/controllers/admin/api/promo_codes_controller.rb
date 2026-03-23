# frozen_string_literal: true

module Admin
  module Api
    class PromoCodesController < Admin::Api::BaseController
      before_action :set_promo_code, only: %i[show update destroy]

      # GET /admin/api/promo_codes
      def index
        promo_codes = PromoCode.order(created_at: :desc)
                               .page(params[:page]).per(25)

        render json: {
          promo_codes: promo_codes.map { |p| promo_json(p) },
          total: promo_codes.total_count
        }
      end

      # GET /admin/api/promo_codes/:id
      def show
        render json: promo_json(@promo_code)
      end

      # POST /admin/api/promo_codes
      def create
        promo = PromoCode.new(promo_params)
        promo.created_by_id = current_admin&.id

        if promo.save
          render json: promo_json(promo), status: :created
        else
          render json: { errors: promo.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /admin/api/promo_codes/:id
      def update
        if @promo_code.update(promo_params)
          render json: promo_json(@promo_code)
        else
          render json: { errors: @promo_code.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /admin/api/promo_codes/:id
      def destroy
        @promo_code.destroy!
        render json: { message: 'Promo code deleted' }
      end

      private

      def set_promo_code
        @promo_code = PromoCode.find(params[:id])
      end

      def promo_params
        params.permit(:code, :discount_type, :discount_value, :max_uses, :expires_at,
                      :active, :min_order_amount, :max_discount_amount, :description)
      end

      def promo_json(p)
        {
          id: p.id,
          code: p.code,
          discount_type: p.discount_type,
          discount_value: p.discount_value.to_f,
          max_uses: p.max_uses,
          current_uses: p.current_uses,
          expires_at: p.expires_at,
          active: p.active,
          usable: p.usable?,
          min_order_amount: p.min_order_amount&.to_f,
          max_discount_amount: p.max_discount_amount&.to_f,
          description: p.description,
          created_at: p.created_at
        }
      end
    end
  end
end
