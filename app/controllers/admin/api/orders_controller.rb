module Admin
  module Api
    class OrdersController < BaseController
      def index
        orders = Order.includes(:user, :product).order(created_at: :desc).page(params[:page]).per(20)
        
        # Simple filtering
        orders = orders.where(status: params[:status]) if params[:status].present?
        
        render json: { 
          orders: orders.as_json(include: { user: { only: [:email] }, product: { only: [:name] } }),
          meta: { 
            current_page: orders.current_page, 
            total_pages: orders.total_pages, 
            total_count: orders.total_count 
          }
        }
      end
      
      def show
        order = Order.find(params[:id])
        render json: { order: order, details: order.provisioned_resource }
      end
      
      def refund
        order = Order.find(params[:id])
        # Placeholder for RefundService interaction
        # RefundService.new(order).process!
        order.update(status: 'refunded') # simplified
        render json: { message: 'Order refunded', order: order }
      end
    end
  end
end
