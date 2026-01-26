class VpnMailer < ApplicationMailer
  def credentials_email
    @owner = params[:owner]
    @vpn = params[:vpn_account]
    
    mail(to: @owner.email, subject: "Your VPN Credentials - Order ##{@vpn.order_id}")
  end
end
