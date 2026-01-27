# frozen_string_literal: true

class VmMailer < ApplicationMailer
  default from: ENV.fetch('SMTP_FROM_EMAIL', 'noreply@proxysock.com')

  def credentials_email
    @vm = params[:vm]
    @order = @vm.vm_order.order
    @owner = params[:owner] || @order.orderable

    mail(
      to: @owner.email,
      subject: "Your VM is Ready - #{@vm.ip_address}"
    )
  end
end
