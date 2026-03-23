# frozen_string_literal: true

module Api
  module V1
    class WebhookEndpointsController < BaseController
      include JwtAuthenticated

      # GET /api/v1/webhook_endpoints
      def index
        endpoints = current_reseller.webhook_endpoints.order(created_at: :desc)
        render json: endpoints.map { |e| serialize_endpoint(e) }
      end

      # POST /api/v1/webhook_endpoints
      def create
        endpoint = current_reseller.webhook_endpoints.build(endpoint_params)
        if endpoint.save
          render json: serialize_endpoint(endpoint), status: :created
        else
          render json: { errors: endpoint.errors }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/webhook_endpoints/:id
      def update
        endpoint = current_reseller.webhook_endpoints.find(params[:id])
        if endpoint.update(endpoint_params)
          render json: serialize_endpoint(endpoint)
        else
          render json: { errors: endpoint.errors }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/webhook_endpoints/:id
      def destroy
        endpoint = current_reseller.webhook_endpoints.find(params[:id])
        endpoint.destroy!
        render json: { message: 'Webhook endpoint deleted' }
      end

      # POST /api/v1/webhook_endpoints/:id/verify
      def verify
        endpoint = current_reseller.webhook_endpoints.find(params[:id])
  
        payload = {
          event: 'system.ping',
          reseller_id: current_reseller.id,
          timestamp: Time.current.iso8601,
          data: { message: 'Pulse verification from ProxySock' }
        }
  
        begin
          response = Faraday.post(endpoint.url) do |req|
            req.headers['Content-Type'] = 'application/json'
            req.headers['X-ProxySock-Signature'] = generate_signature(payload, endpoint.secret)
            req.body = payload.to_json
            req.options.timeout = 10
          end
  
          render json: {
            success: response.success?,
            status_code: response.status,
            message: response.success? ? 'Pulse delivered successfully' : 'Pulse delivery failed'
          }
        rescue Faraday::Error => e
          render json: { success: false, message: "Connection failed: #{e.message}" }, status: :ok
        end
      end

      private

      def endpoint_params
        params.require(:webhook_endpoint).permit(:url, :description, events: [])
      end

      def serialize_endpoint(endpoint)
        {
          id: endpoint.id,
          url: endpoint.url,
          secret: endpoint.secret,
          events: endpoint.events,
          created_at: endpoint.created_at,
          updated_at: endpoint.updated_at
        }
      end

      def generate_signature(payload, secret)
        OpenSSL::HMAC.hexdigest('sha256', secret, payload.to_json)
      end
    end
  end
end
