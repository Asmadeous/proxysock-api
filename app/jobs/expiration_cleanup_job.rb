# frozen_string_literal: true

class ExpirationCleanupJob < ApplicationJob
  queue_as :maintenance

  def perform
    Rails.logger.info 'Starting ExpirationCleanupJob...'

    # VMs
    active_vms = Vm.where(status: 'active')
    process_expiries_and_warnings(active_vms)

    # Mobile Proxies
    active_proxies = MobileProxy.where(status: 'active')
    process_expiries_and_warnings(active_proxies)

    # eSIMs
    active_esims = EsimOrder.where(status: 'active')
    process_expiries_and_warnings(active_esims)

    # VPNs
    active_vpns = VpnAccount.where(status: 'active')
    process_expiries_and_warnings(active_vpns)

    # Static Datacenter Proxies
    active_dc_proxies = StaticDatacenterProxy.where(status: 'active')
    process_expiries_and_warnings(active_dc_proxies)

    # Static ISP Proxies
    active_isp_proxies = StaticIspProxy.where(status: 'active')
    process_expiries_and_warnings(active_isp_proxies)

    # Residential Proxies
    active_resi_proxies = ResidentialRotatingProxy.where(status: 'active')
    process_expiries_and_warnings(active_resi_proxies)

    # MyProxyAPI VPNs and proxies have no local resource; their term ends at the provider.
    expire_provider_orders

    Rails.logger.info 'ExpirationCleanupJob completed.'
  end

  private

  def expire_provider_orders
    orders = Order.joins(:product)
                  .where(status: %w[active completed],
                         products: { provider_type: 'myproxyapi', product_type: Product::PROXY_TYPES + ['vpn'] })
    orders.find_each do |order|
      next unless provider_term_over?(order)

      # An auto-renewed subscription has a later end time at MyProxyAPI than the one stored
      # here, so confirm with the provider before expiring; a failed check waits for the next run.
      next unless ProxyManagementService.new(order).refresh_details!
      next unless provider_term_over?(order.reload)

      expire_order(order)
    rescue StandardError => e
      Rails.logger.error "Failed to check provider expiry for Order ##{order.order_number}: #{e.message}"
    end
  end

  def provider_term_over?(order)
    ends_at = ProxyManagementService.provider_expires_at(order)
    ends_at.present? && ends_at < Time.current
  end

  def expire_order(order)
    Rails.logger.info "Expiring provider Order ##{order.order_number}"
    order.update!(status: 'expired')
    return unless order.orderable

    Notification.create(
      recipient: order.orderable,
      category: 'warning',
      title: "#{order.product.product_type == 'vpn' ? 'VPN' : 'Proxy'} Expired",
      message: "Your #{order.product_display_name} for Order ##{order.order_number} has expired. Please reorder to continue service.",
      metadata: { order_id: order.id, reorderable: true }
    )
  end

  def process_expiries_and_warnings(resources)
    resources.find_each do |resource|
      next unless resource.expires_at.present?

      if resource.expires_at < Time.current
        expire_resource(resource)
      elsif resource.expires_at < 24.hours.from_now
        send_expiry_warning(resource, 24)
      elsif resource.expires_at < 48.hours.from_now
        send_expiry_warning(resource, 48)
      end
    end
  end

  def send_expiry_warning(resource, hours)
    order = resource.order
    return unless order&.orderable

    # Check if we already sent this warning
    sent_key = "expiry_warning_#{hours}h_sent_at"
    metadata = order.metadata || {}
    return if metadata[sent_key].present?

    Rails.logger.info "Sending #{hours}h expiry warning for #{resource.class.name} ##{resource.id}"

    Notification.create(
      recipient: order.orderable,
      category: 'warning',
      title: "#{resource.class.name.titleize} Expiring Soon",
      message: "Your #{resource.class.name.titleize} for Order ##{order.order_number} will expire in approximately #{hours} hours. Please renew to avoid service interruption.",
      metadata: { order_id: order.id, hours_remaining: hours }
    )

    # Send Email Notification
    ExpirationMailer.with(
      resource: resource,
      order: order,
      owner: order.orderable,
      hours: hours
    ).warning_email.deliver_later

    # Mark as sent
    metadata[sent_key] = Time.current
    order.update!(metadata: metadata)
  end

  def terminate_resource(resource)
    Rails.logger.info "Terminating expired #{resource.class.name} ##{resource.id}"
    if resource.respond_to?(:terminate!) && resource.may_terminate?
      resource.terminate!
      resource.save! # Ensure state change is persisted
    end
    # Update associated order if needed
    resource.order&.update(status: 'expired')
  rescue StandardError => e
    Rails.logger.error "Failed to terminate #{resource.class.name} ##{resource.id}: #{e.message}"
  end

  def expire_resource(resource)
    Rails.logger.info "Expiring #{resource.class.name} ##{resource.id}"
    begin
      # Check if resource has custom expire logic, otherwise just update status
      if resource.respond_to?(:expire!)
        resource.expire!
      else
        resource.update!(status: 'expired')
      end
      resource.order&.update(status: 'expired')

      # Send notification urging reorder
      if resource.order&.orderable
        Notification.create(
          recipient: resource.order.orderable,
          category: 'warning',
          title: "#{resource.class.name.titleize} Expired",
          message: "Your #{resource.class.name.titleize} for Order ##{resource.order.order_number} has expired. Please reorder to continue service.",
          metadata: { order_id: resource.order.id, reorderable: true }
        )
      end
    rescue StandardError => e
      Rails.logger.error "Failed to expire #{resource.class.name} ##{resource.id}: #{e.message}"
    end
  end
end
