# frozen_string_literal: true

class UsaEsimMailer < ApplicationMailer
  SUPPORT_EMAIL = 'support@proxysock.com'

  def credentials_email
    @owner = params[:owner]
    @credentials = params[:credentials]
    @order = params[:order]
    @title = "Your USA eSIM Credentials - Order ##{@order.order_number}"

    # Attach any uploaded QR code images
    @credentials.each do |cred|
      if cred.qr_code_image.attached?
        attachments.inline[cred.qr_code_image.filename.to_s] = cred.qr_code_image.download
      end
    end

    mail(
      to: params[:target_email].presence || @owner.email,
      subject: "Your USA eSIM Credentials are Ready - Order ##{@order.order_number}"
    )
  end

  # Sent to user/reseller when order is for 'colt' (manual fulfillment)
  def manual_order_notification
    @owner = params[:owner]
    @order = params[:order]
    @title = 'Order Received - Manual Fulfillment Required'

    mail(
      to: @owner.email,
      subject: "USA eSIM Order Processing (24-48hrs) - Order ##{@order.order_number}"
    )
  end

  # Sent to admin to alert about a new manual order
  def admin_manual_order_alert
    @order = params[:order]
    @owner = @order.orderable
    @title = 'NEW MANUAL ORDER: Colt USA eSIM'

    mail(
      to: SUPPORT_EMAIL,
      subject: "[ADMIN] New Manual Colt Order ##{@order.order_number}"
    )
  end
end
