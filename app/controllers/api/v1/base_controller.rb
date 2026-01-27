# frozen_string_literal: true

module Api
  module V1
    class BaseController < ApplicationController
      include JwtAuthenticated

      before_action :authenticate_reseller!

      private

      def authenticate_reseller!
        return if @current_reseller

        render json: { error: 'Unauthorized Access: Reseller account required' }, status: :unauthorized
      end
    end
  end
end
