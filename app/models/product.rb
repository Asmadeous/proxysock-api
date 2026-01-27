# frozen_string_literal: true

class Product < ApplicationRecord
  # Product types: vm, proxy, esim, vpn
  # Provider types: proxmox, xproxy, myproxyapi, esim_access, lyca, colt, etc.

  scope :for_resellers, -> { where(available_to: %w[reseller both]) }
  scope :for_ecommerce, -> { where(available_to: %w[ecommerce both]) }

  scope :vms, -> { where(product_type: 'vm') }
  scope :proxies, -> { where(product_type: 'proxy') }
  scope :esims, -> { where(product_type: 'esim') }
  scope :vpns, -> { where(product_type: 'vpn') }

  validates :available_to, inclusion: { in: %w[reseller ecommerce both] }
  validates :product_type, inclusion: { in: %w[vm proxy esim vpn] }

  belongs_to :product_category
  has_many :product_pricings, dependent: :destroy
  has_many :orders, dependent: :destroy
end
