# frozen_string_literal: true

class UsaEsimMailer < ApplicationMailer
  default from: ENV.fetch('SMTP_FROM_EMAIL', 'noreply@proxysock.com')

  def credentials_email
    @owner = params[:owner]
    @credentials = params[:credentials]
    @order = params[:order]
    @title = "Your USA eSIM Credentials - Order ##{@order.order_number}"

    mail(
      to: params[:target_email].presence || @owner.email,
      subject: "Your USA eSIM Credentials are Ready - Order ##{@order.order_number}"
    )
  end
end
