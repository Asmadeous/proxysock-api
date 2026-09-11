# frozen_string_literal: true

class VpnMailer < ApplicationMailer
  def credentials_email
    @owner       = params[:owner]
    @vpn_account = params[:vpn_account]
    @order       = params[:order] || @vpn_account&.vpn_order&.order
    @api_response = params[:api_response] || {}
    @title = "Your VPN Credentials - Order ##{@order.order_number}"

    # Prefer the Vpn record if available (MyProxyAPI path stores credentials there).
    # NOTE: VpnOrder has_many :vpns — there is no singular :vpn association.
    if @vpn_account.nil? && @order.present?
      vpn_order = @order.vpn_order
      @vpn_account = vpn_order&.vpns&.first
    end

    # Normalize credentials into a single hash the view can rely on, covering both
    # the MyProxyAPI response shape (config.auth_credentials.*) and the local Vpn
    # record (vpn_username/vpn_password). server is optional — the API path ships
    # connection details via the attached .ovpn file, so it is often blank.
    @creds =
      if @api_response.present?
        creds = @api_response.dig('config', 'auth_credentials') || {}
        {
          server:   @api_response['ip'] || @api_response['server'],
          username: creds['username'] || @api_response['username'] || @api_response['vpn_username'],
          password: creds['password'] || @api_response['password'] || @api_response['vpn_password']
        }
      elsif @vpn_account
        {
          server:   @vpn_account.metadata&.dig('server'),
          username: @vpn_account.vpn_username,
          password: @vpn_account.vpn_password
        }
      else
        {}
      end

    # Attach the .ovpn config file if it was stored on the order
    if @order.respond_to?(:ovpn_config) && @order.ovpn_config.attached?
      provider_id = @order.metadata&.dig('provider_order_id') || @order.id
      attachments["vpn-#{provider_id}.ovpn"] = @order.ovpn_config.download
    end

    mail(
      to: params[:target_email].presence || @owner.email,
      subject: "Your VPN Credentials are Ready - Order ##{@order.order_number}"
    )
  end
end
