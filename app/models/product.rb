# frozen_string_literal: true

class Product < ApplicationRecord
  # product_type: vm, proxy, esim, vpn
  # provider:     proxmox, xproxy, myproxyapi, esim_access, meisim, etc.
  #
  # For eSIM products, metadata should include:
  #   esim_type:        'data_only' | 'voice_data_sms'
  #   data_gb:          numeric
  #   duration_days:    integer
  #   country_code:     string
  #   calling_minutes:  integer | null (null = unlimited, only for voice_data_sms)
  #   sms_quota:        integer | null (null = unlimited, only for voice_data_sms)
  #   network_operator: string (e.g. 'Lyca Mobile', 'Lebara')

  scope :for_resellers,  -> { where(available_to: %w[reseller both]) }
  scope :for_ecommerce,  -> { where(available_to: %w[ecommerce both]) }

  # Provider cost and sourcing details kept out of storefront and reseller API responses.
  INTERNAL_METADATA_KEYS = %w[api_price retail_price cost_price provider_name synced_at name_template
                              delisted_by_sync].freeze

  # MeiSIM titles lead with the carrier's list price. The sync stores the title with
  # this token in `name_template`, so each viewer sees the price they pay instead.
  NAME_PRICE_TOKEN = '{price}'

  PROXY_TYPES = %w[proxy datacenter isp premium_isp global_isp static_residential residential_rotating mobile].freeze

  scope :vms,     -> { where(product_type: 'vm') }
  scope :vps,     -> { where(product_type: 'vps') }
  scope :rdps,    -> { where(product_type: 'rdp') }
  scope :proxies, -> { where(product_type: PROXY_TYPES) }
  scope :esims,   -> { where(product_type: 'esim') }
  scope :vpns,    -> { where(product_type: 'vpn') }

  def public_metadata
    metadata.is_a?(Hash) ? metadata.except(*INTERNAL_METADATA_KEYS) : {}
  end

  def display_name(price)
    template = metadata['name_template'] if metadata.is_a?(Hash)
    return name if template.blank? || price.blank?

    template.sub(NAME_PRICE_TOKEN, format('$%.2f', price))
  end

  def proxy?
    PROXY_TYPES.include?(product_type)
  end

  # Subset of eSIM products that include voice + data + SMS
  scope :voice_esims, -> { esims.where("metadata->>'esim_type' = 'voice_data_sms'") }
  # Subset of eSIM products that are data-only
  scope :data_esims,  lambda {
    esims.where("metadata->>'esim_type' = 'data_only'").or(esims.where("metadata->>'esim_type' IS NULL"))
  }

  validates :available_to, inclusion: { in: %w[reseller ecommerce both] }
  validates :product_type, inclusion: { in: %w[vm vps rdp proxy esim vpn datacenter isp premium_isp global_isp static_residential residential_rotating mobile] }

  belongs_to :product_category
  has_many :product_pricings, dependent: :destroy
  accepts_nested_attributes_for :product_pricings, allow_destroy: true
  has_many :orders, dependent: :destroy

  # Cache version for catalog LIST endpoints. Derived from data so it
  # self-invalidates on any catalog write — including price-only edits
  # (ProductPricing) and category/metadata edits or re-slugging (ProductCategory),
  # neither of which a plain `products.updated_at` would catch.
  #
  # NOTE: update_columns / update_all bypass timestamps, so use update/save for
  # product, pricing and category edits (or bust this version explicitly).
  def self.catalog_cache_version
    [
      unscoped.maximum(:updated_at).to_i,
      unscoped.count,
      ProductPricing.unscoped.maximum(:updated_at).to_i,
      ProductCategory.unscoped.maximum(:updated_at).to_i
    ].join('-')
  end

  # Cache version for a single product's SHOW endpoint. Scoped to this product
  # so one product's edit doesn't flush every other product's cache.
  def cache_version
    [
      updated_at.to_i,
      product_pricings.maximum(:updated_at).to_i,
      product_category&.updated_at.to_i
    ].join('-')
  end
end
