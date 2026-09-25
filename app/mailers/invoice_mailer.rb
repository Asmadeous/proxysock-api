# frozen_string_literal: true

class InvoiceMailer < ApplicationMailer
  # Sent when an order transitions to 'processing'
  def invoice_email
    @order = params[:order]
    @owner = @order.orderable
    @title = "Receipt and Invoice for Order ##{@order.order_number}"

    mail(
      to: @owner.email,
      subject: "Receipt and Invoice for Order ##{@order.order_number}"
    )
  end

  # Sent when a wallet deposit is confirmed (any gateway)
  def deposit_receipt_email
    @deposit  = params[:deposit]
    @owner    = @deposit.depositable
    @gateway  = params[:gateway]
    @amount   = params[:amount] || @deposit.amount
    @title    = 'Deposit Confirmed - ProxySock'

    mail(
      to: @owner.email,
      subject: "Deposit of $#{format('%.2f', @amount)} USD Confirmed - ProxySock"
    )
  end

  # Sent when a MyProxyAPI-based proxy or VPN order is provisioned
  def api_proxy_credentials_email
    @order        = params[:order]
    @owner        = params[:owner] || @order.orderable
    @api_response = params[:api_response]
    if @api_response.is_a?(Hash) && @api_response['data'].is_a?(Array)
      @api_response = @api_response['data'].first
    elsif @api_response.is_a?(Array)
      @api_response = @api_response.first
    end
    @api_response ||= {}
    @title        = "Your Access Credentials - Order ##{@order.order_number}"

    if @order.respond_to?(:ovpn_config) && @order.ovpn_config.attached?
      provider_id = @order.metadata['provider_order_id'] || @order.id
      attachments["vpn-#{provider_id}.ovpn"] = @order.ovpn_config.download
    end

    mail(
      to: params[:target_email].presence || @owner.email,
      subject: "Your #{@order.product_display_name} Credentials are Ready - Order ##{@order.order_number}"
    )
  end
end
