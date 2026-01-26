module Admin
  module Api
    class ResellersController < ApplicationController
      before_action :authenticate_admin!
      before_action :set_reseller, only: [:show, :update, :destroy, :onboard]

      # GET /admin/api/resellers
      def index
        resellers = Reseller.order(created_at: :desc).page(params[:page])
        render json: {
          resellers: resellers.map { |r| serialize_reseller(r) },
          meta: pagination_meta(resellers)
        }
      end

      # GET /admin/api/resellers/:id
      def show
        render json: serialize_reseller(@reseller)
      end

      # POST /admin/api/resellers
      def create
        @reseller = Reseller.new(reseller_params)
        
        if @reseller.save
          # Create wallet for reseller
          @reseller.create_wallet!
          
          render json: serialize_reseller(@reseller), status: :created
        else
          render json: { errors: @reseller.errors }, status: :unprocessable_entity
        end
      end

      # PATCH /admin/api/resellers/:id
      def update
        if @reseller.update(reseller_params)
          render json: serialize_reseller(@reseller)
        else
          render json: { errors: @reseller.errors }, status: :unprocessable_entity
        end
      end

      # DELETE /admin/api/resellers/:id
      def destroy
        @reseller.destroy
        head :no_content
      end

      # POST /admin/api/resellers/:id/onboard
      # Generates initial API credentials for reseller
      def onboard
        credentials = @reseller.generate_initial_credentials
        
        # Send welcome email with credentials
        ResellerMailer.with(reseller: @reseller, credentials: credentials).welcome_email.deliver_later
        
        render json: {
          message: 'Reseller onboarded successfully',
          credentials: credentials
        }
      end

      private

      def set_reseller
        @reseller = Reseller.find(params[:id])
      end

      def reseller_params
        params.require(:reseller).permit(
          :email, :username, :company_name, :password, :password_confirmation,
          :reseller_type, :infrastructure_surcharge_percentage, :status
        )
      end

      def serialize_reseller(reseller)
        {
          id: reseller.id,
          email: reseller.email,
          username: reseller.username,
          company_name: reseller.company_name,
          reseller_type: reseller.reseller_type,
          infrastructure_surcharge_percentage: reseller.infrastructure_surcharge_percentage,
          balance: reseller.balance || 0.0,
          status: reseller.status,
          created_at: reseller.created_at
        }
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count
        }
      end

      def authenticate_admin!
        # Uses JWT from session - employee must be authenticated via Zoho SSO
        token = request.headers['Authorization']&.split(' ')&.last
        return render json: { error: 'Unauthorized' }, status: :unauthorized unless token

        begin
          payload = JWT.decode(token, Rails.application.secret_key_base).first
          @current_employee = Employee.find(payload['employee_id'])
        rescue
          render json: { error: 'Unauthorized' }, status: :unauthorized
        end
      end
    end
  end
end
