# frozen_string_literal: true

class InHouseProductSyncService
  def initialize(logger = Rails.logger)
    @logger = logger
    @data_path = Rails.root.join('db', 'data', 'inhouse_products.json')
  end

  def sync(type: nil)
    unless File.exist?(@data_path)
      @logger.error("[InHouseProductSyncService] Data file not found at #{@data_path}")
      return
    end

    products_data = JSON.parse(File.read(@data_path))
    @logger.info("[InHouseProductSyncService] Starting sync of #{products_data.size} products...")

    products_data.each do |data|
      # If a specific type is requested, only sync products of that type
      next if type.present? && data['product_type'] != type.to_s

      sync_product(data)
    end

    @logger.info('[InHouseProductSyncService] Sync completed.')
  end

  private

  def sync_product(data)
    category_slug = data['product_category_slug']
    category = ProductCategory.find_or_create_by!(slug: category_slug) do |c|
      c.name = data['product_category_name'] || category_slug.titleize
      c.category_type = 'vm'
      c.active = true
      c.available_to = 'both'
    end

    product = Product.find_or_initialize_by(
      provider: data['provider'],
      provider_product_id: data['provider_product_id']
    )

    product.assign_attributes(
      name: data['name'],
      slug: data['slug'],
      product_type: data['product_type'],
      provider_type: data['provider_type'] || 'inhouse',
      metadata: data['metadata'],
      active: data['active'],
      available_to: data['available_to'] || 'both',
      product_category: category
    )

    product.save!

    # Sync Pricings
    data['pricings'].each do |pricing_data|
      # Normalize duration type to lowercase
      d_type = (pricing_data['duration_type'] || 'month').downcase

      pricing = product.product_pricings.find_or_initialize_by(
        currency: pricing_data['currency'] || 'USD',
        duration_type: d_type,
        duration_value: pricing_data['duration_value'] || 1
      )

      pricing.assign_attributes(
        selling_price: pricing_data['selling_price'],
        cost_price: pricing_data['cost_price'],
        reseller_selling_price: pricing_data['reseller_selling_price'] || pricing_data['selling_price'],
        user_selling_price: pricing_data['user_selling_price'] || pricing_data['selling_price'],
        active: pricing_data['active'] != false
      )

      pricing.save!
    end

    @logger.info("  ✓ Synced #{product.name}")
  rescue StandardError => e
    @logger.error("Failed to sync product #{data['name']}: #{e.message}")
  end
end
