# frozen_string_literal: true

module Admin
  module Api
    class BaseController < ApplicationController
      before_action :authenticate_admin!

      private

      def authenticate_admin!
        token = request.headers['Authorization']&.split(' ')&.last
        return render_unauthorized unless token

        begin
          payload = JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256').first
          @current_employee = Employee.find(payload['employee_id'])
          render_unauthorized unless @current_employee&.active?
        rescue JWT::DecodeError, ActiveRecord::RecordNotFound
          render_unauthorized
        end
      end

      def require_role!(*roles)
        return if roles.map(&:to_s).include?(@current_employee.role)

        render json: { error: 'Forbidden', message: "Requires role: #{roles.join(' or ')}" }, status: :forbidden
      end

      def require_admin!
        require_role!('admin')
      end

      attr_reader :current_employee

      def render_unauthorized
        render json: { error: 'Unauthorized' }, status: :unauthorized
      end
    end
  end
end
