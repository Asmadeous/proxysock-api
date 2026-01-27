# frozen_string_literal: true

module Web
  module Api
    class BaseController < ApplicationController
      include JwtAuthenticated

      # Allow public access for some things, but verify user if token present
      # Specific controllers will enforce :authenticate_user!

      private

      def authenticate_user!
        return if @current_user

        render json: { error: 'Unauthorized Access: User account required' }, status: :unauthorized
      end
    end
  end
end
