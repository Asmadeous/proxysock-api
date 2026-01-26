module Api
  module V1
    class ResellersController < BaseController
      include JwtAuthenticated

      def show
        render json: current_reseller
      end
      
      def update
        if current_reseller.update(reseller_params)
          render json: current_reseller
        else
          render json: { errors: current_reseller.errors }, status: :unprocessable_entity
        end
      end

      def deposit
        # Initiate deposit logic
        # params: amount, gateway ('paystack', 'plisio', 'payvra')
        
        amount = params[:amount].to_f
        gateway = params[:gateway]
        
        return render json: { error: 'Invalid amount' }, status: :bad_request if amount <= 0
        
        # Create Pending Deposit
        deposit = Deposit.create!(
          depositable: current_reseller,
          amount: amount,
          gateway: gateway,
          status: 'pending',
          transaction_id: "DEP_#{SecureRandom.hex(8)}"
        )
        
        # Generate Link (Mock or via Service)
        # Service logic for generating payment URL would go here
        
        render json: { 
          message: 'Deposit initiated', 
          deposit_id: deposit.id,
          transaction_ref: deposit.transaction_id
        }
      end

      private

      def reseller_params
        params.require(:reseller).permit(:company_name, :email) 
      end
    end
  end
end
