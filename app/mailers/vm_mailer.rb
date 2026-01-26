class VmMailer < ApplicationMailer
  default from: ENV.fetch('SMTP_FROM_EMAIL', 'noreply@proxysock.com')

  def credentials_email(vm)
    @vm = vm
    @order = vm.vm_order.order
    @user = @order.user
    
    mail(
      to: @user.email,
      subject: "Your VM is Ready - #{vm.ip_address}"
    )
  end
end
