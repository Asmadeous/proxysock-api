module Api
  module V1
    class BaseController < ApplicationController
      include JwtAuthenticated

      before_action :authenticate_reseller!

      private

      def authenticate_reseller!
        unless @current_reseller
          render json: { error: 'Unauthorized Access: Reseller account required' }, status: :unauthorized
        end
      end
    end
  end
end
