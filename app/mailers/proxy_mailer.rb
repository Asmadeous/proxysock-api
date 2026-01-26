class ProxyMailer < ApplicationMailer
  default from: ENV.fetch('SMTP_FROM_EMAIL', 'noreply@proxysock.com')

  def credentials_email
    @owner = params[:owner]
    @proxy = params[:proxy]
    @order = params[:order]
    
    mail(
      to: @owner.email,
      subject: "Your Proxy Credentials - Order ##{@order.id}"
    )
  end
  
  def support_email(subject, details)
    @details = details
    mail(
      to: ENV.fetch('PROXY_SUPPORT_EMAIL', 'support@proxysock.com'),
      subject: subject
    )
  end
end
