# frozen_string_literal: true

module Web
  module Api
    class BaseController < ApplicationController
      include JwtAuthenticated

      # Allow public access for some things, but verify user if token present
      # Specific controllers will enforce :authenticate_user!
      
      def current_actor
        @current_user || @current_reseller
      end

      private

      def authenticate_user!
        return if @current_user

        render json: { error: 'Unauthorized Access: User account required' }, status: :unauthorized
      end

      def authenticate_reseller!
        return if @current_reseller

        render json: { error: 'Unauthorized Access: Reseller account required' }, status: :unauthorized
      end

      def authenticate_actor!
        return if current_actor

        render json: { error: 'Unauthorized Access: Account required' }, status: :unauthorized
      end
    end
  end
end
