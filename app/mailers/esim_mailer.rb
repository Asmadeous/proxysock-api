# frozen_string_literal: true

class EsimMailer < ApplicationMailer
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
    # Apple's and Google's one-tap setup links never depend on (or point to) the provider.
    links = @esim.install_links
    @install_links = { 'iPhone' => links['ios'], 'Android' => links['android'] }.compact

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
