# frozen_string_literal: true

module Admin
  module Api
    class BaseController < ApplicationController
      # Ensure admin authentication here
      # For now, we can skip or implement simple token auth if needed
      # before_action :authenticate_admin!

      private

      def authenticate_admin!
        # Placeholder for admin auth logic
        # render json: { error: 'Unauthorized' }, status: :unauthorized unless current_employee
      end

      attr_reader :current_employee
    end
  end
end
