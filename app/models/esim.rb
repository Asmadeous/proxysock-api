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
