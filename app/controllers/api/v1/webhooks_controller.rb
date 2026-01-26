module Api
  module V1
    class WebhooksController < BaseController
      def index
        endpoints = current_reseller.webhook_endpoints
        render json: { endpoints: endpoints }
      end
      
      def create
        endpoint = current_reseller.webhook_endpoints.build(webhook_params)
        
        if endpoint.save
          render json: { endpoint: endpoint }, status: :created
        else
          render json: { errors: endpoint.errors }, status: :unprocessable_entity
        end
      end
      
      def destroy
        endpoint = current_reseller.webhook_endpoints.find(params[:id])
        endpoint.destroy
        head :no_content
      end
      
      def test
        endpoint = current_reseller.webhook_endpoints.find(params[:id])
        
        # Dispatch a test event
        WebhookDispatchWorker.perform_later(
          current_reseller.id,
          'ping',
          { message: 'This is a test webhook event', timestamp: Time.now.to_i }
        )
        
        render json: { message: 'Test webhook queued' }
      end
      
      private
      
      def webhook_params
        params.require(:webhook).permit(:url, events: [])
      end
    end
  end
end
