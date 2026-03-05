# frozen_string_literal: true

class ResellerMailer < ApplicationMailer
  default from: 'noreply@proxysock.com'

  def welcome_email
    @reseller = params[:reseller]
    @credentials = params[:credentials]

    mail(to: @reseller.email, subject: 'Welcome to ProxySock - Your API Credentials')
  end

  # Alert admin when an external API order is cancelled
  def order_cancelled_admin_notification(order, reseller)
    @order = order
    @reseller = reseller
    @product = order.product

    admin_email = ENV.fetch('ADMIN_EMAIL', 'admin@proxysock.com')
    mail(
      to: admin_email,
      subject: "[ACTION REQUIRED] Reseller Order Cancelled — #{@product&.name} (#{order.id})"
    )
  end

  # Send credentials to customer email (Enterprise resellers)
  def customer_credentials(order, reseller, customer_email)
    @order = order
    @reseller = reseller
    @product = order.product
    @credentials = order.provisioned_resource

    mail(
      to: customer_email,
      subject: "Your #{@product&.name} Credentials — Order #{order.id}"
    )
  end

  # Send invoice to customer email (Enterprise resellers)
  def customer_invoice(order, reseller, customer_email)
    @order = order
    @reseller = reseller
    @product = order.product

    mail(
      to: customer_email,
      subject: "Invoice for #{@product&.name} — Order #{order.id}"
    )
  end
end
