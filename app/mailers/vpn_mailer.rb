# frozen_string_literal: true

class VpnMailer < ApplicationMailer
  def credentials_email
    @owner       = params[:owner]
    @vpn_account = params[:vpn_account]
    @order       = params[:order] || @vpn_account&.vpn_order&.order
    @api_response = params[:api_response] || {}
    @title = "Your VPN Credentials - Order ##{@order.order_number}"

    # Prefer the Vpn record if available (MyProxyAPI path stores credentials there)
    if @vpn_account.nil? && @order.present?
      vpn_order = @order.vpn_order
      @vpn_account = vpn_order&.vpn
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

