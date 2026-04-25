# frozen_string_literal: true

class BillingRenewalWorker < ApplicationJob
  queue_as :billing

  # Runs daily at midnight via sidekiq-cron.
  # Handles VM (and other resource) renewal and expiration reminders.
  def perform
    Rails.logger.info '[BillingRenewal] Starting renewal check...'

    [
      'Vm', 'Vpn', 'MobileProxy', 'GlobalIspProxy',
      'StaticDatacenterProxy', 'StaticIspProxy',
      'StaticResidentialProxy', 'PremiumIspProxy',
      'EsimOrder'
    ].each do |model_name|
      begin
        model_class = Object.const_get(model_name)
        process_expiring_resources(model_class)
      rescue NameError
        Rails.logger.warn "[BillingRenewal] Model #{model_name} not defined, skipping."
      end
    end

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
    renewal_method = resource.metadata&.dig('renewal_method') || 'wallet'
    
    # 1. Fallback to Gateway if balance is low and valid renewal method is set
    if owner.wallet.balance < renewal_amount && %w[paystack fastspring].include?(renewal_method)
      attempt_gateway_charge(owner, resource, renewal_amount, renewal_method)
    end

    # 2. Proceed with wallet renewal (might have been funded by step 1)
    if owner.wallet.balance >= renewal_amount
      ActiveRecord::Base.transaction do
        owner.wallet.debit!(renewal_amount, "Auto-renewal: #{resource.class.name} #{resource.id.to_s[0..7]}", {
                              order_id: order.id,
                              resource_type: resource.class.name,
                              resource_id: resource.id,
                              auto_renewal: true
                            })

        # Extend the resource expiry
        if resource.respond_to?(:renew!)
          resource.renew!(pricing.duration_value, order.metadata['data_gb'] || 1)
        else
          resource.update!(expires_at: resource.expires_at + pricing.duration_value.days)
        end

        # Create billing history
        BillingHistory.create!(
          order: order,
          amount: renewal_amount,
          billing_type: 'renewal',
          status: 'paid',
          period_start: resource.expires_at - pricing.duration_value.days,
          period_end: resource.expires_at,
          metadata: { auto_renewed: true, wallet_debit: true, renewal_method: renewal_method }
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
    NotificationService.notify(
      recipient: owner,
      category: 'error',
      title: 'Auto-Renewal System Error',
      message: "An unexpected error occurred during auto-renewal of your #{resource.class.name.underscore.humanize}: #{e.message}. Please check your account manually.",
      metadata: { resource_id: resource.id, error: e.message }
    ) if owner
  end

  def attempt_gateway_charge(owner, resource, amount, method)
    reference = "RENEW_#{resource.class.name[0..2].upcase}_#{resource.id}_#{Time.current.to_i}"
    success = false
    gateway_ref = nil

    begin
      case method
      when 'paystack'
        auth_code = resource.metadata&.dig('paystack_auth_code')
        if auth_code.present?
          # Convert USD to NGN for Paystack charge
          rate = FixerService.get_rate('USD', 'NGN') || 1500.0 # Fallback safety
          amount_ngn = (amount * rate).round(2)
          amount_kobo = (amount_ngn * 100).to_i
          
          resp = PaystackService.new.charge_authorization(owner.email, amount_kobo, auth_code, reference)
          if resp['status'] && resp.dig('data', 'status') == 'success'
            success = true
            gateway_ref = resp.dig('data', 'reference')
          end
        end
      when 'fastspring'
        sub_id = resource.metadata&.dig('fastspring_sub_id')
        if sub_id.present?
          resp = FastspringService.new.charge_subscription(sub_id, amount)
          if resp['result'] == 'success' || resp['id'].present?
            success = true
            gateway_ref = resp['id']
          end
        end
      end

      if success
        ActiveRecord::Base.transaction do
          # Create a synthetic transaction for the wallet credit
          transaction = Transaction.create!(
            transactable: owner,
            reference: resource,
            amount: amount,
            transaction_type: 'credit',
            status: 'success',
            currency: 'USD',
            description: "Auto-Renewal Gateway Funding (#{method.capitalize})",
            metadata: { 
              gateway: method, 
              gateway_ref: gateway_ref, 
              renewal_reference: reference 
            }
          )
          
          owner.wallet.credit!(amount, "Auto-renewal funding via #{method}", { 
            gateway: method, 
            gateway_ref: gateway_ref 
          }, transaction)
          
          # Update resource metadata to log the last successful charge
          resource.metadata ||= {}
          resource.metadata['last_gateway_charge_id'] = gateway_ref
          resource.metadata['last_renewal_method'] = method
          resource.save!
        end
        Rails.logger.info "[BillingRenewal] Gateway charge successful for #{resource.class.name} ##{resource.id} via #{method}"
      end
    rescue StandardError => e
      Rails.logger.error "[BillingRenewal] Gateway charge failed for #{resource.class.name} ##{resource.id} via #{method}: #{e.message}"
    end
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
