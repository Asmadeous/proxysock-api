# frozen_string_literal: true

class ExpirationCleanupJob < ApplicationJob
  queue_as :maintenance

  def perform
    Rails.logger.info 'Starting ExpirationCleanupJob...'

    # VMs
    expired_vms = Vm.where(status: 'active').where('expires_at < ?', Time.current)
    Rails.logger.info "Found #{expired_vms.count} expired VMs to terminate"
    expired_vms.find_each do |vm|
      Rails.logger.info "Processing VM #{vm.id}, responds_to terminate!: #{vm.respond_to?(:terminate!)}, may_terminate: #{vm.may_terminate?}"
      terminate_resource(vm)
    end

    # Mobile Proxies
    MobileProxy.where(status: 'active').where('expires_at < ?', Time.current).find_each do |proxy|
      expire_resource(proxy)
    end

    # Static Datacenter Proxies
    StaticDatacenterProxy.where(status: 'active').where('expires_at < ?', Time.current).find_each do |proxy|
      expire_resource(proxy)
    end

    # Static ISP Proxies
    StaticIspProxy.where(status: 'active').where('expires_at < ?', Time.current).find_each do |proxy|
      expire_resource(proxy)
    end

    # Residential Proxies
    ResidentialRotatingProxy.where(status: 'active').where('expires_at < ?', Time.current).find_each do |proxy|
      expire_resource(proxy)
    end

    # eSIMs
    EsimOrder.where(status: 'active').where('expires_at < ?', Time.current).find_each do |esim|
      expire_resource(esim)
    end

    # VPNs
    VpnAccount.where(status: 'active').where('expires_at < ?', Time.current).find_each do |vpn|
      expire_resource(vpn)
    end

    Rails.logger.info 'ExpirationCleanupJob completed.'
  end

  private

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
