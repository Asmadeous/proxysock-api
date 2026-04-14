# frozen_string_literal: true

module Admin
  module Api
    class AffiliatesController < Admin::Api::BaseController
      before_action :set_affiliate, only: %i[show update destroy configure]

      # GET /admin/api/affiliates
      def index
        affiliates = Affiliate.includes(:affiliatable)
                              .order(created_at: :desc)
                              .page(params[:page]).per(25)

        render json: {
          affiliates: affiliates.map { |a| affiliate_json(a) },
          total: affiliates.total_count
        }
      end

      # POST /admin/api/affiliates
      # Supports two modes:
      #   1. Standalone: { name: "Jane", email: "jane@example.com", commission_rate: 10, discount_rate: 5 }
      #   2. Linked:     { affiliatable_type: "User", email: "user@example.com", commission_rate: 10, discount_rate: 5 }
      def create
        require_admin!

        if params[:affiliatable_type].present?
          # ── Linked affiliate (User or Reseller) ──
          klass = case params[:affiliatable_type].to_s.downcase
                  when 'user' then User
                  when 'reseller' then Reseller
                  else nil
                  end

          unless klass
            return render json: { error: 'Invalid entity type. Must be User or Reseller.' }, status: :unprocessable_entity
          end

          entity = klass.find_by(id: params[:affiliatable_id]) || klass.find_by(email: params[:email])
          return render json: { error: "#{params[:affiliatable_type]} not found" }, status: :not_found unless entity

          if entity.affiliate.present?
            return render json: { error: 'This entity is already enrolled as an affiliate' }, status: :unprocessable_entity
          end

          affiliate = AffiliateService.new(entity).enrol!(
            commission_rate: params[:commission_rate]&.to_d,
            discount_rate: params[:discount_rate]&.to_d
          )
        else
          # ── Standalone affiliate ──
          affiliate = Affiliate.create!(
            name: params[:name],
            email: params[:email],
            commission_rate: params[:commission_rate]&.to_d || 10.0,
            discount_rate: params[:discount_rate]&.to_d || 5.0,
            notes: params[:notes],
            payment_details: params[:payment_details] || {}
          )
        end

        record_audit_log('affiliate.created', affiliate)
        render json: affiliate_json(affiliate), status: :created
      rescue StandardError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # GET /admin/api/affiliates/:id
      def show
        render json: affiliate_json(@affiliate)
      end

      # PATCH /admin/api/affiliates/:id
      def update
        @affiliate.update!(affiliate_params)
        render json: affiliate_json(@affiliate)
      end

      # DELETE /admin/api/affiliates/:id
      def destroy
        @affiliate.destroy!
        render json: { message: 'Affiliate removed' }
      end

      # PATCH /admin/api/affiliates/:id/configure
      def configure
        @affiliate.update!(commission_rate: params[:commission_rate],
                           discount_rate: params[:discount_rate],
                           status: params[:status])
        render json: affiliate_json(@affiliate)
      end

      private

      def set_affiliate
        @affiliate = Affiliate.find(params[:id])
      end

      def affiliate_params
        params.permit(:commission_rate, :discount_rate, :status, :notes, :name, :email, :payment_details)
      end

      def affiliate_json(a)
        {
          id: a.id,
          referral_code: a.referral_code,
          status: a.status,
          commission_rate: a.commission_rate,
          discount_rate: a.discount_rate,
          total_earned: a.total_earned,
          pending_balance: a.pending_balance,
          total_paid_out: a.total_paid_out,
          notes: a.notes,
          standalone: a.standalone?,
          affiliatable_type: a.affiliatable_type,
          affiliatable_name: a.display_name,
          affiliatable_email: a.display_email,
          name: a.name,
          email: a.email,
          payment_details: a.payment_details,
          total_referrals: a.affiliate_referrals.count,
          converted: a.affiliate_referrals.converted.count,
          created_at: a.created_at
        }
      end
    end
  end
end
