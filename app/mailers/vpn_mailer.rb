# frozen_string_literal: true

class VpnMailer < ApplicationMailer
  default from: ENV.fetch('SMTP_FROM_EMAIL', 'noreply@proxysock.com')

  def credentials_email
    @owner = params[:owner]
    @vpn_account = params[:vpn_account]
    @order = @vpn_account.vpn_order.order
    @title = "Your VPN Credentials - Order ##{@order.order_number}"

    mail(
      to: @owner.email,
      subject: "Your VPN Credentials are Ready - Order ##{@order.order_number}"
    )
  end
end
