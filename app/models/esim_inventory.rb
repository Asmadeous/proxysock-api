# frozen_string_literal: true

class EsimInventory < ApplicationRecord
  ESIM_TYPES = %w[data_only voice_data_sms].freeze

  # Providers available to customers (single-line purchase allowed)
  CUSTOMER_PROVIDERS = %w[lyca].freeze

  validates :iccid, presence: true, uniqueness: true
  validates :provider, presence: true
  validates :esim_type, inclusion: { in: ESIM_TYPES }

  # Status scopes
  scope :available, -> { where(status: 'available') }
  scope :reserved,  -> { where(status: 'reserved') }
  scope :sold,      -> { where(status: 'sold') }

  # Provider scopes
  scope :lyca,         -> { where(provider: 'lyca') }
  scope :colt,         -> { where(provider: 'colt') }
  scope :by_provider,  ->(p) { where(provider: p) }

  # eSIM type scopes
  scope :data_only,      -> { where(esim_type: 'data_only') }
  scope :voice_data_sms, -> { where(esim_type: 'voice_data_sms') }

  # Returns minimum order quantity for a given provider.
  # Lyca allows single-line purchases; all other providers require bulk (MOQ 5).
  def self.moq_for(provider)
    CUSTOMER_PROVIDERS.include?(provider.to_s) ? 1 : 5
  end

  # Returns true if this provider can be purchased by e-commerce customers.
  def self.customer_accessible?(provider)
    CUSTOMER_PROVIDERS.include?(provider.to_s)
  end

  def mark_as_sold!
    update!(status: 'sold')
  end

  def mark_as_reserved!
    update!(status: 'reserved')
  end

  def voice_data_sms?
    esim_type == 'voice_data_sms'
  end
end
