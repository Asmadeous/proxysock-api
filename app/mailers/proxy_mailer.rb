# frozen_string_literal: true

class ProxyMailer < ApplicationMailer
  default from: ENV.fetch('SMTP_FROM_EMAIL', 'noreply@proxysock.com')

  def credentials_email
    @owner = params[:owner]
    @proxy = params[:proxy]
    @order = params[:order]
    @title = "Your Proxy Credentials - Order ##{@order.order_number}"

    mail(
      to: @owner.email,
      subject: "Your Proxy Credentials are Ready - Order ##{@order.order_number}"
    )
  end
end
