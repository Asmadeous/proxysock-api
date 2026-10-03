# frozen_string_literal: true

class Esim < ApplicationRecord
  belongs_to :esim_order

  # Apple's and Google's one-tap setup links, built from the LPA activation code.
  INSTALL_LINKS = {
    'ios' => 'https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=',
    'android' => 'https://esimsetup.android.com/esim_qrcode_provisioning?carddata='
  }.freeze

  # A plan's allowance as bytes when it is one fixed amount ("1" GB, "1000 MB",
  # "1.95 GB"); nil for "Unlimited" and described allowances.
  def self.data_bytes(limit, unit = nil)
    match = limit.to_s.strip.match(/\A(\d+(?:\.\d+)?)\s*(GB|MB)?\z/i)
    return nil unless match

    amount = match[1].to_f
    return nil unless amount.positive?

    (amount * ((match[2] || unit).to_s.casecmp('MB').zero? ? 1.megabyte : 1.gigabyte)).round
  end

  # Moxee and LinkUp keep the profile at the carrier (qr_source "carrier"): no activation
  # code, only a QR image MeiSIM fetches for us. We serve it from our own URL, never
  # MeiSIM's. Physical SIM cards come with qr_available false and have no QR at all.
  def carrier_qr?
    esim_provider == 'meisim' && activation_code.blank? && (metadata || {})['qr_available'] != false &&
      esim_order&.provider_order_no.present?
  end

  def carrier_qr_png
    Rails.cache.fetch("esim/#{id}/carrier_qr", expires_in: 1.day) do
      MeisimService.new.qr_png(esim_order.provider_order_no, line: (metadata || {})['line'] || 1)
    end
  end

  # MeiSIM eSIM Verify, kept in metadata['verification']: batch_id, status, submitted_at,
  # requested_by and checked_at. A check is pending until MeiSIM gives its verdict; checks
  # saved before status was recorded on submission count as pending too.
  scope :verification_pending, lambda {
    where("metadata->'verification'->>'batch_id' IS NOT NULL")
      .where("COALESCE(metadata->'verification'->>'status', 'pending') = 'pending'")
  }

  def verification
    (metadata || {})['verification'] || {}
  end

  # nil when never checked, otherwise pending, timed_out or MeiSIM's verdict.
  def verification_status
    verification['status'] || ('pending' if verification['batch_id'].present?)
  end

  def update_verification!(values)
    update!(metadata: (metadata || {}).merge('verification' => verification.merge(values)))
  end

  # Asks MeiSIM how the verify batch went and saves the verdict once there is one.
  def refresh_verification!
    progress = MeisimService.new.esim_verify_batch(verification['batch_id'])['progress'] || {}
    status = MeisimService.verify_verdict(progress)
    update_verification!('status' => status, 'checked_at' => Time.current.iso8601) unless status == 'pending'
    [status, progress]
  end

  def install_links
    code = activation_code.to_s
    return {} unless code.start_with?('LPA:')

    INSTALL_LINKS.transform_values { |base| base + CGI.escape(code) }
  end

  # The plan's own wording ("1 GB", "1000 MB", "Unlimited") when it has one, else the
  # recorded allowance ("1 GB").
  def data_label
    metadata = esim_order&.order&.product&.metadata || {}
    wording = [metadata['data_limit'], metadata['data_unit']].compact_blank.join(' ').presence
    return wording if wording
    return unless data_total_bytes.to_i.positive?

    gb = (data_total_bytes / 1.gigabyte.to_f).round(2)
    "#{(gb % 1).zero? ? gb.to_i : gb} GB"
  end
end
