# frozen_string_literal: true

class InvoiceMailer < ApplicationMailer
  default from: ENV.fetch('SMTP_FROM_EMAIL', 'noreply@proxysock.com')

  # Sent when an order transitions to 'processing'
  def invoice_email
    @order = params[:order]
    @owner = @order.orderable
    @title = "Invoice for Order ##{@order.order_number}"

    mail(
      to: @owner.email,
      subject: "Invoice for Order ##{@order.order_number}"
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
    @title        = "Your Access Credentials - Order ##{@order.order_number}"

    mail(
      to: @owner.email,
      subject: "Your #{@order.product.name} Credentials are Ready - Order ##{@order.order_number}"
    )
  end
end
