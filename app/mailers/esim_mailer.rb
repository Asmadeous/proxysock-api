# frozen_string_literal: true

class EsimMailer < ApplicationMailer
  # Providers whose eSIMs get the credentials email with the QR embedded: remote QR images
  # are blocked by many email apps, and the email links to nothing outside Proxysock.
  CREDENTIALS_EMAIL_PROVIDERS = %w[meisim esim_access].freeze

  def delivery_email
    @user = params[:user]
    @owner = @user
    @esim = params[:esim]
    @order = @esim.esim_order.order
    @type = @esim.esim_provider == 'esim_access' ? 'api' : 'inventory'
    @title = "Your eSIM is ready - Order ##{@order.order_number}"
    subject = "Your eSIM is ready (Order ##{@order.order_number})"

    return credentials_delivery(subject) if CREDENTIALS_EMAIL_PROVIDERS.include?(@esim.esim_provider)

    mail(to: @user.email, subject: subject)
  end

  private

  # Credentials only, with the QR embedded so the email links to nothing outside Proxysock.
  def credentials_delivery(subject)
    # Apple's and Google's one-tap setup links never depend on (or point to) the provider.
    links = @esim.install_links
    @install_links = { 'iPhone' => links['ios'], 'Android' => links['android'] }.compact

    qr = download_qr
    attachments.inline['esim-qr.png'] = qr if qr

    mail(to: @user.email, subject: subject, template_name: 'credentials_email')
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
