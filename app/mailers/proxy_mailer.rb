# frozen_string_literal: true

class ProxyMailer < ApplicationMailer
  default from: ENV.fetch('SMTP_FROM_EMAIL', 'noreply@proxysock.com')

  def credentials_email
    @owner = params[:owner]
    @proxy = params[:proxy]
    @order = params[:order]
    @assignment = params[:assignment]
    @title = "Your Proxy Credentials - Order ##{@order.order_number}"

    mail(
      to: params[:target_email].presence || @owner.email,
      subject: "Your Proxy Credentials are Ready - Order ##{@order.order_number}"
    )
  end

  def expiry_email
    @owner      = params[:owner]
    @order      = params[:order]
    @assignment = params[:assignment]
    @proxy      = params[:proxy]
    @reason     = params[:reason]

    subject = case @reason.to_s
              when 'gb_depleted'  then "Your proxy data limit has been reached - Order ##{@order.order_number}"
              when 'time_expired' then "Your proxy subscription has expired - Order ##{@order.order_number}"
              else                     "Your proxy service has ended - Order ##{@order.order_number}"
              end

    mail(to: @owner.email, subject: subject)
  end
end
