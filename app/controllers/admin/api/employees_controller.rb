module Admin
  module Api
    class EmployeesController < BaseController
      def index
        employees = Employee.includes(:department).order(created_at: :desc).page(params[:page]).per(20)
        
        render json: { 
          employees: employees.as_json(include: :department),
          meta: { 
            current_page: employees.current_page,
            total_pages: employees.total_pages,
            total_count: employees.total_count 
          }
        }
      end
      
      def show
        employee = Employee.find(params[:id])
        render json: { employee: employee.as_json(include: :department) }
      end
      
      def create
        employee = Employee.new(employee_params)
        employee.password = "password123" # Temporary/Default
        # Send invitation email logic here
        
        if employee.save
          render json: { employee: employee }, status: :created
        else
          render json: { errors: employee.errors }, status: :unprocessable_entity
        end
      end
      
      def update
        employee = Employee.find(params[:id])
        
        if employee.update(employee_params)
          render json: { employee: employee }
        else
          render json: { errors: employee.errors }, status: :unprocessable_entity
        end
      end
      
      def destroy
        employee = Employee.find(params[:id])
        employee.update(active: false) # Soft delete
        render json: { message: "Employee deactivated" }
      end
      
      private
      
      def employee_params
        params.require(:employee).permit(:first_name, :last_name, :email, :work_email, :department_id, :role, :active)
      end
    end
  end
end
