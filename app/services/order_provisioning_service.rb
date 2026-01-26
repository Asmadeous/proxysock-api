class OrderProvisioningService
  class ProvisioningError < StandardError; end

  def initialize(order, user_or_reseller)
    @order = order
    @actor = user_or_reseller # Can be User or Reseller
    @product = order.product
  end

  def process!
    return false unless @order.pending?

    ActiveRecord::Base.transaction do
      # 1. Price Calculation
      @order.calculate_total_amount
      total = @order.total_amount

      # 2. Payment / Balance Check (Resellers always use wallet)
      if @actor.is_a?(Reseller)
        validate_and_deduct_balance!(total)
      elsif @actor.is_a?(User)
        # Users may have already paid via gateway, or pay from wallet
        # If this is called, assume wallet payment
        validate_and_deduct_balance!(total) if @actor.wallet&.balance.to_f >= total
      end
      
      # 3. Transition to processing
      @order.process!
    end

    # 4. Provision based on product type
    provision_product!
    
    true
  rescue => e
    Rails.logger.error("[OrderProvisioningService] Failed: #{e.message}")
    @order.fail! if @order.may_fail?
    raise e
  end

  private

  def validate_and_deduct_balance!(total)
    unless enough_balance?(total)
      raise ProvisioningError, "Insufficient balance: Wallet has #{@actor.balance || 0}, required #{total}"
    end
    
    @actor.wallet.debit!(total, "Order ##{@order.id} payment", { order_id: @order.id })
  end

  def enough_balance?(amount)
    return false unless @actor.wallet
    @actor.wallet.balance >= amount
  end

  def provision_product!
    case @product.product_type
    when 'vm'
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
    # Create VM record and queue provisioning
    vm = Vm.create!(
      order: @order,
      status: 'pending',
      vm_type: @product.metadata&.dig('vm_type') || 'shared-cpu'
    )
    
    VmProvisioningJob.perform_later(vm.id, {
      'os_template' => @product.metadata&.dig('os_template') || 'ubuntu-22-04',
      'cpu_cores' => @product.metadata&.dig('cpu_cores') || 1,
      'ram_gb' => @product.metadata&.dig('ram_gb') || 1,
      'storage_gb' => @product.metadata&.dig('storage_gb') || 20
    })
    
    # Order stays in processing until job completes
  end

  # ========== Proxy Provisioning ==========
  def provision_proxy!
    case @product.provider_type
    when 'xproxy'
      result = XProxyService.new.provision(@order)
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
    
    proxy = proxy_class.lock.where(status: 'available').first
    raise ProvisioningError, "No available #{provider_type} proxies" unless proxy
    
    # Generate credentials
    username = "user_#{SecureRandom.hex(4)}"
    password = SecureRandom.hex(8)
    
    proxy.update!(
      status: 'assigned',
      username: username,
      password: password,
      order_id: @order.id
    )
    
    proxy
  end

  def send_proxy_credentials(proxy)
    owner = @order.user || @order.reseller
    ProxyMailer.with(
      owner: owner,
      proxy: proxy,
      order: @order
    ).credentials_email.deliver_later
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
    
    # Store VPN credentials (assuming VpnAccount model exists or use metadata)
    vpn_account = VpnAccount.create!(
      order: @order,
      username: username,
      password: password,
      server: @product.metadata&.dig('server') || 'vpn.proxysock.com',
      protocol: @product.metadata&.dig('protocol') || 'wireguard',
      status: 'active'
    )
    
    # Send credentials
    owner = @order.user || @order.reseller
    VpnMailer.with(owner: owner, vpn_account: vpn_account).credentials_email.deliver_later
    
    @order.activate!
  end
end
