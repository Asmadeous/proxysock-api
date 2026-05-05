# frozen_string_literal: true

module Admin
  module Api
    class EmployeesController < Admin::Api::BaseController
      before_action :require_admin!, only: %i[create destroy]
      before_action :set_employee, only: %i[show update destroy assign revoke_tokens]

      # GET /admin/api/employees
      def index
        employees = Employee.includes(:department).order(created_at: :desc)
        if params[:q].present?
          employees = employees.where('email ILIKE :q OR first_name ILIKE :q OR last_name ILIKE :q',
                                      q: "%#{params[:q]}%")
        end
        employees = employees.where(role: params[:role]) if params[:role].present?
        employees = employees.where(active: params[:active] == 'true') if params[:active].present?

        render json: {
          employees: employees.map { |e| employee_json(e) },
          total: employees.count
        }
      end

      # GET /admin/api/employees/:id
      def show
        render json: employee_json(@employee, full: true)
      end

      # POST /admin/api/employees — onboard new employee
      def create
        dept = Department.find_or_create_by!(name: params[:department] || 'General')
        employee = Employee.create!(
          email: params[:email],
          first_name: params[:first_name],
          last_name: params[:last_name],
          password: params[:password] || SecureRandom.hex(8),
          role: params[:role] || 'support',
          department: dept,
          active: true
        )
        if params[:avatar].present?
          employee.avatar.attach(params[:avatar])
          proxy_path = Rails.application.routes.url_helpers.rails_storage_proxy_path(employee.avatar, only_path: true)
          employee.update_column(:profile_picture_url, proxy_path)
        end
        record_audit_log('employee.created', employee)
        render json: employee_json(employee), status: :created
      end

      # PATCH /admin/api/employees/:id
      def update
        attrs = employee_params.to_h
        attrs[:department] = Department.find_or_create_by!(name: params[:department]) if params[:department].present?
        if @employee.update(attrs)
          if @employee.avatar.attached?
            proxy_path = Rails.application.routes.url_helpers.rails_storage_proxy_path(@employee.avatar, only_path: true)
            @employee.update_column(:profile_picture_url, proxy_path)
          end
          record_audit_log('employee.updated', @employee)
          render json: employee_json(@employee)
        else
          render json: { errors: @employee.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /admin/api/employees/:id
      def destroy
        @employee.update!(active: false)
        record_audit_log('employee.deactivated', @employee)
        render json: { message: 'Employee deactivated' }
      end

      # POST /admin/api/employees/:id/assign
      def assign
        require_role!('admin', 'manager')
        # Assign tickets / tasks to employee
        if params[:ticket_ids].present?
          tickets = Ticket.where(id: params[:ticket_ids])
          tickets.update_all(assigned_to_id: @employee.id, assigned_to_type: 'Employee')
          record_audit_log('employee.assigned_tickets', @employee, { ticket_ids: params[:ticket_ids] })
        end
        render json: { message: "Assigned #{params[:ticket_ids]&.length || 0} tickets to #{@employee.full_name}" }
      end

      # POST /admin/api/employees/:id/revoke_tokens
      def revoke_tokens
        require_admin!
        @employee.revoke_tokens!
        record_audit_log('employee.tokens_revoked', @employee)
        render json: { message: 'All active sessions and tokens for this employee have been revoked.' }
      end

      private

      def set_employee
        @employee = Employee.find(params[:id])
      end

      def employee_params
        permitted = params.permit(:first_name, :last_name, :email, :active, :work_email, :profile_picture_url, :avatar)
        permitted[:role] = params[:role] if params.key?(:role)
        permitted
      end

      def employee_json(e, full: false)
        data = {
          id: e.id,
          email: e.email,
          work_email: e.work_email,
          first_name: e.first_name,
          last_name: e.last_name,
          full_name: e.full_name,
          role: e.role,
          department: e.department&.name,
          active: e.active?,
          last_login: e.last_login_at,
          created_at: e.created_at,
          profile_picture_url: e.avatar.attached? ? Rails.application.routes.url_helpers.rails_storage_proxy_path(e.avatar, only_path: true) : e.profile_picture_url
        }
        if full
          data[:action_logs] = e.admin_action_logs.order(created_at: :desc).limit(20).map do |l|
            { action: l.action, created_at: l.created_at }
          end
          data[:impersonation_logs] = e.user_impersonation_logs.order(created_at: :desc).limit(10).map do |l|
            { user_id: l.user_id, ip: l.ip_address, created_at: l.created_at }
          end
        end
        data
      end
    end
  end
end
