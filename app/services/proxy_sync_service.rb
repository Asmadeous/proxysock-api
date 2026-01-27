# frozen_string_literal: true

class ProxySyncService
  def initialize(logger = Rails.logger)
    @client = MyProxyApiClient.new
    @logger = logger
  end

  def sync_all
    @logger.info('[ProxySyncService] Starting sync...')

    external_proxies = @client.fetch_proxies

    # map external proxies by ID for quick lookup
    external_proxies.index_by { |p| p['id'] }

    # 1. Sync Mobile Proxies
    sync_resource(MobileProxy, external_proxies.select { |p| p['type'] == 'mobile_proxy' })

    # 2. Sync Static Datacenter Proxies
    sync_resource(StaticDatacenterProxy, external_proxies.select { |p| p['type'] == 'static_datacenter' })

    # 3. Sync Residential Proxies
    sync_resource(ResidentialRotatingProxy, external_proxies.select { |p| p['type'] == 'residential' })

    # 4. Sync Static ISP Proxies
    sync_resource(StaticIspProxy, external_proxies.select { |p| p['type'] == 'static_isp' })

    @logger.info('[ProxySyncService] Sync completed.')
    
    check_inventory_levels
  end

  def check_inventory_levels
    [MobileProxy, StaticDatacenterProxy, StaticIspProxy, ResidentialRotatingProxy].each do |proxy_class|
      count = proxy_class.where(status: 'available').count
      threshold = 5 # Alert if below 5

      if count < threshold
        # Notify active employees
        Employee.where(active: true).find_each do |employee|
          NotificationService.notify(
            recipient: employee,
            category: 'warning',
            title: 'Low Inventory Alert',
            message: "#{proxy_class.name.titleize} inventory is low (#{count} remaining).",
            metadata: { proxy_type: proxy_class.name, count: count }
          )
        end
      end
    end
  end

  private

  def sync_resource(model_class, external_list)
    return if external_list.empty?

    # Eager load existing records to minimize DB queries
    # Assuming 'myproxyapi_order_id' is the unique key from provider (stored as string)
    external_ids = external_list.map { |p| p['id'].to_s }
    existing_records = model_class.where(myproxyapi_order_id: external_ids).index_by(&:myproxyapi_order_id)

    external_list.each do |data|
      external_id = data['id'].to_s
      local_record = existing_records[external_id]

      attributes = map_attributes(data, model_class)
      next unless attributes  # Skip if we can't create valid attributes (missing FK)

      if local_record
        # Update if changed
        if needs_update?(local_record, attributes)
          local_record.update(attributes)
          @logger.info("Updated #{model_class.name} #{local_record.id}")
        end
      else
        # Create new
        # Note: Creation might require an associated Order or parent record depending on schema constraints.
        # If proxies are independently synced (inventory), we can just create.
        # If they belong to a user order, we might need to find the parent order first.
        # For now, assuming they can be created or linked if logic permits.

        # Checking if we can create without parent order (likely depends on schema constraints)
        begin
          # Attempt create (might fail if foreign keys are required)
          # In a real scenario, we might need to find_or_create a placeholder order or match via metadata
          model_class.create!(attributes)
          @logger.info("Created #{model_class.name} #{data['id']}")
        rescue StandardError => e
          @logger.warn("Skipping create for #{model_class.name} #{data['id']}: #{e.message}")
        end
      end
    end
  end

  def map_attributes(data, model_class)
    attrs = {
      ip_address: data['ip'],
      port: data['port'],
      username: data['username'],
      password: data['password'],
      status: data['status'],
      myproxyapi_order_id: data['id'].to_s,
      updated_at: Time.current
    }
    
    # Add country_code for models that have it
    attrs[:country_code] = data['country'] if data['country']
    
    # Add mobile_proxy_order_id for MobileProxy model (required by schema)
    if model_class == MobileProxy
      mp_order = MobileProxyOrder.first
      return nil unless mp_order  # Can't create without FK
      attrs[:mobile_proxy_order_id] = mp_order.id
    end
    
    attrs
  end

  def needs_update?(record, new_attributes)
    # Check key fields for changes
    record.ip_address != new_attributes[:ip_address] ||
      record.port != new_attributes[:port] ||
      record.status != new_attributes[:status] ||
      record.username != new_attributes[:username] ||
      record.password != new_attributes[:password]
  end
end
