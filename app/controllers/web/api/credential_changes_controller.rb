# frozen_string_literal: true

module Web
  module Api
    class CredentialChangesController < BaseController
      before_action :authenticate_request

      # POST /web/api/credential_changes/vm/:id/password
      def vm_password
        vm = current_actor_vms.find(params[:id])
        password = params[:password]

        if password.blank?
          render json: { error: 'Password is required' }, status: :unprocessable_entity
          return
        end

        success = VmProvisioningService.new.change_password(vm, password)

        if success
          render json: { message: 'Password changed successfully' }
        else
          render json: { error: 'Failed to change password via Ansible' }, status: :service_unavailable
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'VM not found' }, status: :not_found
      end

      # POST /web/api/credential_changes/proxy/:id/credentials
      def proxy_credentials
        proxy = find_proxy(params[:id])
        username = params[:username]
        password = params[:password]

        if username.blank? || password.blank?
          render json: { error: 'Username and password are required' }, status: :unprocessable_entity
          return
        end

        if proxy.proxy_source == 'myproxyapi' && proxy.myproxyapi_order_id.present?
          begin
            MyProxyApiClient.new.update_credentials(proxy.myproxyapi_order_id, username, password)
            proxy.update!(username: username, password: password)
            render json: { message: 'Proxy credentials updated successfully' }
          rescue StandardError => e
            render json: { error: "MyProxy API Error: #{e.message}" }, status: :service_unavailable
          end
        else
          render json: { error: 'Manual update required for this proxy source' }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Proxy not found' }, status: :not_found
      end

      # POST /web/api/credential_changes/proxy/:id/rotate_ip
      def proxy_rotate_ip
        proxy = find_proxy(params[:id])

        if proxy.proxy_source == 'myproxyapi' && proxy.myproxyapi_order_id.present?
          begin
            MyProxyApiClient.new.rotate_ip(proxy.myproxyapi_order_id)
            render json: { message: 'IP rotation initiated' }
          rescue StandardError => e
            render json: { error: "MyProxy API Error: #{e.message}" }, status: :service_unavailable
          end
        else
          render json: { error: 'IP rotation not supported for this proxy source' }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Proxy not found' }, status: :not_found
      end

      private

      def current_actor_vms
        Vm.joins(vm_order: :order).where(orders: { orderable: current_actor })
      end

      def find_proxy(id)
        # Search across all proxy types
        proxy = MobileProxy.joins(:order).where(orders: { orderable: current_actor }).find_by(id: id) ||
                StaticDatacenterProxy.joins(:order).where(orders: { orderable: current_actor }).find_by(id: id) ||
                StaticIspProxy.joins(:order).where(orders: { orderable: current_actor }).find_by(id: id)

        raise ActiveRecord::RecordNotFound unless proxy

        proxy
      end
    end
  end
end
