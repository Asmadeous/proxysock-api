# frozen_string_literal: true

class OrderProvisioningService
  class ProvisioningError < StandardError; end

  def initialize(order, user_or_reseller)
    @order = order
    @actor = user_or_reseller # Can be User or Reseller
    @product = order.product
  end

  def process!(skip_payment: false)
    return false unless @order.pending?

    ActiveRecord::Base.transaction do
      # 1. Price Calculation
      @order.calculate_total_amount
      total = @order.total_amount

      # 2. Payment / Balance Check (Resellers always use wallet)
      unless skip_payment
        if @actor.is_a?(Reseller)
          validate_and_deduct_balance!(total)
        elsif @actor.is_a?(User)
          # Users may have already paid via gateway, or pay from wallet
          # If this is called, assume wallet payment
          validate_and_deduct_balance!(total)
        end
      end

      # 3. Transition to processing
      @order.process!
    end
    
    # 4. Provision based on product type
    provision_product!
    
    NotificationService.notify(
      recipient: @actor,
      category: 'success',
      title: 'Order Completed',
      message: "Order ##{@order.order_number} has been successfully provisioned.",
      metadata: { order_id: @order.id }
    )

    true
  rescue StandardError => e
    handle_failure(e)
  end

  def process_without_deduction!
    process!(skip_payment: true)
  end

  private

  def handle_failure(e)
    Rails.logger.error("[OrderProvisioningService] Failed: #{e.message}")
    @order.fail! if @order.may_fail?

    NotificationService.notify(
      recipient: @actor,
      category: 'error',
      title: 'Order Failed',
      message: "Order ##{@order.order_number} failed to provision. Support has been notified.",
      metadata: { order_id: @order.id, error: e.message }
    )

    # Notify Employees (System Alert)
    Employee.where(active: true).find_each do |employee|
      NotificationService.notify(
        recipient: employee,
        category: 'system_alert',
        title: 'Provisioning Failure',
        message: "Order ##{@order.order_number} for #{@actor.try(:email) || @actor.try(:username)} failed: #{e.message}",
        metadata: { order_id: @order.id, actor_id: @actor.id, actor_type: @actor.class.name }
      )
    end

    raise e
  end

  private

  def validate_and_deduct_balance!(total)
    unless enough_balance?(total)
      raise ProvisioningError, "Insufficient balance: Wallet has #{@actor.wallet&.balance || 0}, required #{total}"
    end

    transaction = Transaction.create!(
      transactable: @actor,
      reference: @order,
      amount: total,
      transaction_type: 'debit',
      status: 'success',
      currency: 'USD',
      description: "Order ##{@order.id} payment",
      metadata: { order_id: @order.id }
    )

    @actor.wallet.debit!(total, "Order ##{@order.id} payment", { order_id: @order.id }, transaction)
  end

  def enough_balance?(amount)
    return false unless @actor.wallet

    @actor.wallet.balance >= amount
  end

  def provision_product!
    case @product.product_type
    when 'vps'
      provision_vm!
    when 'proxy'
      provision_proxy!
    when 'esim'
      provision_esim!
    when 'vpn'
      provision_vpn!
    else
      raise ProvisioningError, "Unknown product type: #{@product.product_type}"
    end
  end

  # ========== VM Provisioning ==========
  def provision_vm!
    # Create VM Order first
    vm_order = VmOrder.create!(
      order: @order,
      os_type: @product.metadata&.dig('os_template') || 'ubuntu-22-04',
      vm_type: @product.metadata&.dig('vm_type') || 'shared-cpu',
      cpu_cores: @product.metadata&.dig('cpu_cores') || 1,
      ram_gb: @product.metadata&.dig('ram_gb') || 1,
      disk_gb: @product.metadata&.dig('storage_gb') || 20,
      country_code: @product.metadata&.dig('country_code') || 'US',
      status: 'provisioning'
    )

    # Create VM record and queue provisioning
    vm = Vm.create!(
      vm_order: vm_order,
      status: 'pending',
      vm_type: vm_order.vm_type
    )

    VmProvisioningJob.perform_later(vm.id, {
                                      'os_template' => vm_order.os_type,
                                      'cpu_cores' => vm_order.cpu_cores,
                                      'ram_gb' => vm_order.ram_gb,
                                      'storage_gb' => vm_order.disk_gb
                                    })

    # Order stays in processing until job completes
  end

  # ========== Proxy Provisioning ==========
  def provision_proxy!
    case @product.provider_type
    when 'xproxy'
      XProxyService.new.provision(@order)
      @order.activate!

    when 'myproxyapi'
      # Find available proxy from synced inventory
      proxy = assign_proxy_from_inventory('myproxyapi')
      send_proxy_credentials(proxy)
      @order.activate!

    when 'static_datacenter', 'static_isp', 'residential'
      proxy = assign_proxy_from_inventory(@product.provider_type)
      send_proxy_credentials(proxy)
      @order.activate!

    else
      raise ProvisioningError, "Unknown proxy provider: #{@product.provider_type}"
    end
  end

  def assign_proxy_from_inventory(provider_type)
    # Find available proxy from synced inventory
    proxy_class = case provider_type
                  when 'static_datacenter' then StaticDatacenterProxy
                  when 'static_isp' then StaticIspProxy
                  when 'residential' then ResidentialRotatingProxy
                  else MobileProxy
                  end

    proxy_order_class = case provider_type
                        when 'static_datacenter' then StaticDatacenterProxyOrder
                        when 'static_isp' then StaticIspProxyOrder
                        when 'residential' then ResidentialRotatingProxyOrder
                        else MobileProxyOrder
                        end

    proxy_order_foreign_key = case provider_type
                              when 'static_datacenter' then :static_datacenter_proxy_order_id
                              when 'static_isp' then :static_isp_proxy_order_id
                              when 'residential' then :residential_rotating_proxy_order_id
                              else :mobile_proxy_order_id
                              end

    proxy = proxy_class.lock.where(status: 'available').first
    raise ProvisioningError, "No available #{provider_type} proxies" unless proxy

    # Create ProxyOrder
    proxy_order = proxy_order_class.create!(
      order: @order,
      status: 'active',
      country_code: @product.metadata&.dig('country_code'),
      quantity: @order.quantity || 1
    )

    # Generate credentials
    username = "user_#{SecureRandom.hex(4)}"
    password = SecureRandom.hex(8)

    proxy.update!(
      status: 'assigned',
      username: username,
      password: password,
      order_id: @order.id,
      proxy_order_foreign_key => proxy_order.id
    )

    proxy
  end

  def send_proxy_credentials(proxy)
    owner = @actor || @order.orderable
    # ProxyMailer.with(
    #   owner: owner,
    #   proxy: proxy,
    #   order: @order
    # ).credentials_email.deliver_later
  end

  # ========== eSIM Provisioning ==========
  def provision_esim!
    EsimProvisioningService.new(@order).provision!
    # eSIM service handles order status and mailer internally
  end

  # ========== VPN Provisioning ==========
  def provision_vpn!
    # Generate VPN credentials
    username = "vpn_#{SecureRandom.hex(4)}"
    password = SecureRandom.hex(12)

    # Store VPN credentials
    # Create the VpnOrder first (similar to VmOrder)
    vpn_order = VpnOrder.create!(
      order: @order,
      country_code: @product.metadata&.dig('country_code') || 'US',
      quantity: 1,
      status: 'active'
    )

    vpn_account = Vpn.create!(
      vpn_order: vpn_order,
      username: username,
      password: password,
      server_ip: @product.metadata&.dig('server') || '192.168.1.1',
      status: 'active'
    )

    # Send credentials
    owner = @actor || @order.orderable
    # VpnMailer.with(owner: owner, vpn_account: vpn_account).credentials_email.deliver_later

    @order.activate!
  end
end
