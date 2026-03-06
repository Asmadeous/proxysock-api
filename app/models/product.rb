# frozen_string_literal: true

class Product < ApplicationRecord
  # product_type: vm, proxy, esim, vpn
  # provider:     proxmox, xproxy, myproxyapi, esim_access, lyca, colt, lebara, etc.
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

  scope :vms,     -> { where(product_type: 'vm') }
  scope :vps,     -> { where(product_type: 'vps') }
  scope :rdps,    -> { where(product_type: 'rdp') }
  scope :proxies, -> { where(product_type: 'proxy') }
  scope :esims,   -> { where(product_type: 'esim') }
  scope :vpns,    -> { where(product_type: 'vpn') }

  # Subset of eSIM products that include voice + data + SMS
  scope :voice_esims, -> { esims.where("metadata->>'esim_type' = 'voice_data_sms'") }
  # Subset of eSIM products that are data-only
  scope :data_esims,  -> { esims.where("metadata->>'esim_type' = 'data_only'").or(esims.where("metadata->>'esim_type' IS NULL")) }

  validates :available_to, inclusion: { in: %w[reseller ecommerce both] }
  validates :product_type, inclusion: { in: %w[vm vps rdp proxy esim usa_esim vpn] }


  belongs_to :product_category
  has_many :product_pricings, dependent: :destroy
  accepts_nested_attributes_for :product_pricings, allow_destroy: true
  has_many :orders, dependent: :destroy
end
