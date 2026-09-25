# frozen_string_literal: true

class EsimMailer < ApplicationMailer
  # Apple's and Google's standard one-tap eSIM setup links, built from the LPA
  # activation code so they never depend on (or point to) the provider.
  INSTALL_LINKS = {
    'iPhone' => 'https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=',
    'Android' => 'https://esimsetup.android.com/esim_qrcode_provisioning?carddata='
  }.freeze

  def delivery_email
    @user = params[:user]
    @owner = @user
    @esim = params[:esim]
    @order = @esim.esim_order.order
    @type = @esim.esim_provider == 'esim_access' ? 'api' : 'inventory'
    @title = "Your eSIM is ready - Order ##{@order.order_number}"
    subject = "Your eSIM is ready (Order ##{@order.order_number})"

    return meisim_delivery(subject) if @esim.esim_provider == 'meisim'

    mail(to: @user.email, subject: subject)
  end

  private

  # MeiSIM lines get credentials only, with the QR embedded so the email links
  # to nothing outside Proxysock.
  def meisim_delivery(subject)
    code = @esim.activation_code.to_s
    @install_links = code.start_with?('LPA:') ? INSTALL_LINKS.transform_values { |base| base + CGI.escape(code) } : {}

    qr = download_qr
    attachments.inline['esim-qr.png'] = qr if qr

    mail(to: @user.email, subject: subject, template_name: 'meisim_delivery_email')
  end

  def download_qr
    return if @esim.qr_code_url.blank?

    response = HTTParty.get(@esim.qr_code_url, timeout: 15)
    response.body if response.success? && response.headers['content-type'].to_s.start_with?('image/')
  rescue StandardError => e
    Rails.logger.warn("[EsimMailer] QR download failed for eSIM #{@esim.id}: #{e.class}")
    nil
  end
end
