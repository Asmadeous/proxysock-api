# frozen_string_literal: true

class EsimMailer < ApplicationMailer
  default from: ENV.fetch('SMTP_FROM_EMAIL', 'noreply@proxysock.com')

  def delivery_email
    @user = params[:user]
    @esim = params[:esim]
    @order = @esim.esim_order.order
    @type = @esim.esim_provider == 'esim_access' ? 'api' : 'inventory'
    @title = "Your eSIM is ready - Order ##{@order.order_number}"

    mail(to: @user.email, subject: "Your eSIM is ready (Order ##{@order.order_number})")
  end
end
