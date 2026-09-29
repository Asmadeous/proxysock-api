# frozen_string_literal: true

class EsimOrder < ApplicationRecord
  belongs_to :order

  has_many :esims, dependent: :destroy

  # Convenience accessor for single-esim orders (used by orders controller)
  def esim
    esims.first
  end

  ESIM_TYPES = %w[data_only voice_data_sms].freeze

  # Renewal is only supported for API-based data-only eSIMs (esim_access).
  def can_renew?
    return false if voice_data_sms?

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

  # What the admin and reseller eSIM lists show for each profile, whichever provider delivered it.
  # Only staff see MeiSIM's own QR link; customers get a QR drawn from the activation code.
  def listing_details(provider_qr: false)
    {
      country: country_code,
      esim_details: { data_amount_gb: data_amount_gb, duration_days: duration_days },
      credentials_list: esims.map do |esim|
        { iccid: esim.iccid, qr_code: (esim.qr_code_url if provider_qr || esim.esim_provider != 'meisim'),
          activation_code: esim.activation_code,
          phone_number: esim.msisdn, data: esim.data_label }
      end
    }
  end
end
