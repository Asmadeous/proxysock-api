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

    esim_provider == 'esim_access'
  end

  # Renew (top-up) this eSIM via the eSIM Access API.
  # Previously this was a no-op — now it actually calls the API.
  def renew!(duration_days = 30, _data_gb = 1)
    return false unless can_renew?
    return false unless esim_provider == 'esim_access'

    iccid_value = esims.first&.iccid
    raise ArgumentError, 'No ICCID available for renewal' if iccid_value.blank?
    raise ArgumentError, 'No package_code available for renewal' if package_code.blank?

    service = EsimAccessService.new
    service.top_up(iccid: iccid_value, package_code: package_code)

    update!(expires_at: (expires_at || Time.current) + duration_days.days)
    true
  end

  def voice_data_sms?
    esim_type == 'voice_data_sms'
  end
end
