# frozen_string_literal: true

module Admin
  module Api
    class ProfileController < Admin::Api::BaseController
      # GET /admin/api/profile
      def show
        render json: profile_json(current_employee)
      end

      # PATCH /admin/api/profile
      def update
        employee = current_employee

        # Validate current password if changing password or email
        if profile_params[:password].present? || profile_params[:email].present?
          unless employee.authenticate(params[:current_password])
            return render json: { error: 'Current password is incorrect' }, status: :unprocessable_entity
          end
        end

        attrs = profile_params.to_h.reject { |_, v| v.blank? }

        if attrs[:password].present?
          if attrs[:password].length < 8
            return render json: { error: 'New password must be at least 8 characters' }, status: :unprocessable_entity
          end
          if attrs[:password] != params[:password_confirmation]
            return render json: { error: 'Password confirmation does not match' }, status: :unprocessable_entity
          end
        end

        if employee.update(attrs)
          # Handle avatar upload
          if params[:avatar].present?
            employee.avatar.attach(params[:avatar])
            proxy_path = Rails.application.routes.url_helpers.rails_storage_proxy_path(employee.avatar, only_path: true)
            employee.update_column(:profile_picture_url, proxy_path)
          end

          record_audit_log('admin.profile_updated', employee)

          # Update the stored admin user in case the frontend needs refreshed data
          render json: {
            message: 'Profile updated successfully',
            employee: profile_json(employee.reload)
          }
        else
          render json: { error: employee.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      private

      def profile_params
        params.permit(:first_name, :last_name, :email, :password)
      end

      def profile_json(employee)
        {
          id: employee.id,
          email: employee.email,
          first_name: employee.first_name,
          last_name: employee.last_name,
          full_name: employee.full_name,
          role: employee.role,
          department: employee.department&.name,
          profile_picture_url: employee.avatar.attached? ? Rails.application.routes.url_helpers.rails_storage_proxy_path(employee.avatar, only_path: true) : employee.profile_picture_url,
          last_login: employee.last_login_at,
          created_at: employee.created_at
        }
      end
    end
  end
end
