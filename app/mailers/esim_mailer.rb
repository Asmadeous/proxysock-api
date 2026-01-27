# frozen_string_literal: true

class EsimMailer < ApplicationMailer
  def delivery_email
    @user = params[:user]
    @esim = params[:esim]
    @type = @esim.esim_provider == 'esim_access' ? 'api' : 'inventory'

    mail(to: @user.email, subject: "Your eSIM is ready (Order ##{@esim.esim_order.order.order_number})")
  end
end
