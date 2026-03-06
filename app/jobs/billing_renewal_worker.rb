# frozen_string_literal: true

class BillingRenewalWorker < ApplicationJob
  queue_as :billing

  # Runs daily at midnight via sidekiq-cron.
  # Handles VM (and other resource) renewal and expiration reminders.
  def perform
    Rails.logger.info '[BillingRenewal] Starting renewal check...'

    process_expiring_resources(Vm)
    process_expiring_resources(MobileProxy) if defined?(MobileProxy)

    Rails.logger.info '[BillingRenewal] Renewal check complete.'
  end

  private

  def process_expiring_resources(model_class)
    # Resources expiring in the next 24 hours — send renewal reminder
    model_class.where(status: 'active')
               .where(expires_at: Time.current..24.hours.from_now)
               .find_each do |resource|
                 send_renewal_reminder(resource) unless already_notified_today?(resource)
    end

    # Resources expiring in the next 3 days — send early warning
    model_class.where(status: 'active')
               .where(expires_at: 24.hours.from_now..3.days.from_now)
               .find_each do |resource|
                 send_early_warning(resource) unless already_notified_today?(resource)
    end

    # Auto-renew resources with wallet balance if metadata flag is set
    model_class.where(status: 'active')
               .where(expires_at: Time.current..24.hours.from_now)
               .find_each do |resource|
                 attempt_auto_renewal(resource) if auto_renew_enabled?(resource)
    end
  end

  def send_renewal_reminder(resource)
    order = resource.respond_to?(:order) ? resource.order : resource.vm_order&.order
    return unless order

    owner = order.user || order.reseller
    return unless owner

    NotificationService.notify(
      recipient: owner,
      category: 'billing',
      title: "#{resource.class.name} Expiring Soon",
      message: "Your #{resource.class.name.underscore.humanize} (#{resource.ip_address || resource.id.to_s[0..7]}) expires in less than 24 hours. Please renew to avoid service interruption.",
      metadata: { resource_type: resource.class.name, resource_id: resource.id }
    )

    mark_notified(resource)
    Rails.logger.info "[BillingRenewal] Sent expiry reminder for #{resource.class.name} ##{resource.id}"
  end

  def send_early_warning(resource)
    order = resource.respond_to?(:order) ? resource.order : resource.vm_order&.order
    return unless order

    owner = order.user || order.reseller
    return unless owner

    days_left = ((resource.expires_at - Time.current) / 1.day).ceil

    NotificationService.notify(
      recipient: owner,
      category: 'billing',
      title: "#{resource.class.name} Expires in #{days_left} Days",
      message: "Your #{resource.class.name.underscore.humanize} (#{resource.ip_address || resource.id.to_s[0..7]}) expires in #{days_left} days.",
      metadata: { resource_type: resource.class.name, resource_id: resource.id, days_left: days_left }
    )

    mark_notified(resource)
  end

  def attempt_auto_renewal(resource)
    order = resource.respond_to?(:order) ? resource.order : resource.vm_order&.order
    return unless order

    owner = order.user || order.reseller
    return unless owner&.wallet

    # Find the product pricing to determine renewal cost
    product = order.product
    pricing = product&.product_pricings&.find_by(duration_type: 'monthly', active: true)
    return unless pricing

    renewal_amount = pricing.selling_price

    # Check wallet balance
    if owner.wallet.balance >= renewal_amount
      ActiveRecord::Base.transaction do
        owner.wallet.debit!(renewal_amount, "Auto-renewal: #{resource.class.name} #{resource.id.to_s[0..7]}", {
                              order_id: order.id,
                              resource_type: resource.class.name,
                              resource_id: resource.id,
                              auto_renewal: true
                            })

        # Extend the resource expiry
        resource.update!(expires_at: resource.expires_at + pricing.duration_value.days)

        # Create billing history
        BillingHistory.create!(
          order: order,
          amount: renewal_amount,
          billing_type: 'renewal',
          status: 'paid',
          period_start: resource.expires_at - pricing.duration_value.days,
          period_end: resource.expires_at,
          metadata: { auto_renewed: true, wallet_debit: true }
        )
      end

      NotificationService.notify(
        recipient: owner,
        category: 'billing',
        title: 'Auto-Renewal Successful',
        message: "Your #{resource.class.name.underscore.humanize} has been renewed for $#{renewal_amount}. New expiry: #{resource.expires_at.strftime('%B %d, %Y')}.",
        metadata: { resource_id: resource.id, amount: renewal_amount }
      )

      Rails.logger.info "[BillingRenewal] Auto-renewed #{resource.class.name} ##{resource.id} for $#{renewal_amount}"
    else
      # Insufficient balance — notify
      NotificationService.notify(
        recipient: owner,
        category: 'billing',
        title: 'Auto-Renewal Failed — Insufficient Balance',
        message: "Auto-renewal for your #{resource.class.name.underscore.humanize} failed. Balance: $#{'%.2f' % owner.wallet.balance}, Required: $#{'%.2f' % renewal_amount}. Please top up to avoid service interruption.",
        metadata: { resource_id: resource.id, amount: renewal_amount, balance: owner.wallet.balance }
      )

      Rails.logger.warn "[BillingRenewal] Insufficient balance for #{resource.class.name} ##{resource.id} ($#{owner.wallet.balance} < $#{renewal_amount})"
    end
  rescue StandardError => e
    Rails.logger.error "[BillingRenewal] Auto-renewal failed for #{resource.class.name} ##{resource.id}: #{e.message}"
  end

  def auto_renew_enabled?(resource)
    resource.metadata&.dig('auto_renew') == true
  end

  def already_notified_today?(resource)
    resource.metadata&.dig('last_renewal_notice') == Date.current.to_s
  end

  def mark_notified(resource)
    resource.metadata ||= {}
    resource.metadata['last_renewal_notice'] = Date.current.to_s
    resource.save!
  end
end
