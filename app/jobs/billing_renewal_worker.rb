# frozen_string_literal: true

class BillingRenewalWorker < ApplicationJob
  queue_as :billing

  def perform
    Rails.logger.info 'Starting BillingRenewalWorker...'

    # Find active orders expiring in the next 24 hours that haven't been notified/renewed needed
    # For now, simplistic approach: Find expiring orders and notify or attempt auto-renew if enabled

    # Assumption: Orders expiring in < 24h
    Order.where(status: 'active')
         .joins('LEFT JOIN vms ON vms.order_id = orders.id')
         .joins('LEFT JOIN mobile_proxies ON mobile_proxies.order_id = orders.id')
    # ... join other tables or assume expiry is tracked on Order logic via association
    # Since expires_at is on RESOURCES not ORDERS directly (or tracked via resource),
    # we need to query resources.

    # Better approach: Iterate resources like CleanupJob but for notification
    check_resources_expiring_soon(Vm)
    check_resources_expiring_soon(MobileProxy)
    # ... add others
  end

  private

  def check_resources_expiring_soon(model_class)
    model_class.where(status: 'active')
               .where(expires_at: Time.current..24.hours.from_now)
               .find_each do |resource|
                 # Logic:
                 # 1. Check if auto-renew matches? (Not implemented yet)
                 # 2. Send reminder email

                 send_renewal_reminder(resource)
    end
  end

  def send_renewal_reminder(resource)
    order = resource.order
    return unless order

    # Avoid spamming: Check if notification already sent today?
    # Ideally store 'last_renewal_notice_sent_at'

    # UserMailer.renewal_reminder(order).deliver_later
    Rails.logger.info "Would send renewal reminder for Order ##{order.id} (#{resource.class.name})"
  end
end
