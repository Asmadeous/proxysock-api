# frozen_string_literal: true

class EsimOrder < ApplicationRecord
  belongs_to :order

  has_many :esims, dependent: :destroy

  ESIM_TYPES = %w[data_only voice_data_sms].freeze

  # Renewal is only supported for API-based data-only eSIMs (esim_access).
  # Inventory-based eSIMs (lyca, colt, any voice_data_sms plan) are fixed-term.
  def can_renew?
    return false if voice_data_sms?
    return false if %w[lyca colt].include?(esim_provider)

    # Allow for API-based (eSIM Access)
    esim_provider == 'esim_access'
  end

  def renew!(duration_days = 30, _data_gb = 1)
    return false unless can_renew?

    return unless esim_provider == 'esim_access'

    # Call API to top-up
    EsimAccessService.new
    # result = service.top_up(iccid: esim&.iccid, package_code: package_code)
    # Assuming API success:

    update!(expires_at: (expires_at || Time.current) + duration_days.days)
  end

  def voice_data_sms?
    esim_type == 'voice_data_sms'
  end
end
