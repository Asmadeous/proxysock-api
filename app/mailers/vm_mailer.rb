# frozen_string_literal: true

class VmMailer < ApplicationMailer

  def credentials_email
    @vm = params[:vm]
    @order = @vm.vm_order.order
    @owner = params[:owner] || @order.orderable
    @title = "Your VM Credentials - Order ##{@order.order_number}"

    mail(
      to: params[:target_email].presence || @owner.email,
      subject: "Your VM is Ready - #{@vm.ip_address}"
    )
  end
end
