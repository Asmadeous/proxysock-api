# frozen_string_literal: true

# Device details MeiSIM requires for US prepaid (p3: and ly:) lines, read from an
# order's metadata: `imei`, `eid`, and an optional E911 `address`.
class MeisimDeviceDetails
  ADDRESS_KEYS = %w[first_name last_name address_line_1 address_line_2 city state zip_code phone].freeze

  def self.required_for?(product)
    product&.provider == 'meisim' && device_required?(product.provider_product_id)
  end

  # MeiSIM: "A 15-digit customer IMEI is required for US prepaid plans".
  def self.device_required?(product_id)
    product_id.to_s.start_with?(*MeisimCatalogSyncService::US_PREPAID_PREFIXES)
  end

  # MeiSIM documents EID as required for US prepaid lines except Moxee.
  def self.eid_required?(network)
    network.to_s !~ /moxee/i
  end

  def initialize(product, metadata)
    @product = product
    metadata = metadata.to_unsafe_h if metadata.respond_to?(:to_unsafe_h)
    @metadata = (metadata || {}).to_h.deep_stringify_keys
  end

  def errors
    errors = []
    errors << 'imei must be exactly 15 digits' unless imei.match?(/\A\d{15}\z/)
    errors << 'eid must be exactly 32 digits' if eid_required? && !eid.match?(/\A\d{32}\z/)
    errors.concat(address_errors) if address.present?
    errors
  end

  # Keyword arguments for MeisimService#create_order.
  def to_params
    normalized = address.presence&.merge('state' => address['state'].upcase)
    { imei: imei, eid: (eid.presence if eid_required?), address: normalized }
  end

  private

  # Phones display these grouped with spaces (e.g. "35 092338 941642 0").
  def imei
    @metadata['imei'].to_s.gsub(/[\s-]/, '')
  end

  def eid
    @metadata['eid'].to_s.gsub(/[\s-]/, '')
  end

  def address
    raw = @metadata['address']
    raw = raw.to_unsafe_h if raw.respond_to?(:to_unsafe_h)
    return {} unless raw.is_a?(Hash)

    raw.slice(*ADDRESS_KEYS).transform_values { |v| v.to_s.strip }.compact_blank
  end

  def eid_required?
    self.class.eid_required?(@product.metadata&.dig('network'))
  end

  def address_errors
    errors = []
    errors << 'address.address_line_1 must start with a street number' unless address['address_line_1'].to_s.match?(/\A\d+\s+\S/)
    errors << 'address.city must be at least 2 characters' if address['city'].to_s.length < 2
    errors << 'address.state must be a 2-letter code' unless address['state'].to_s.match?(/\A[A-Za-z]{2}\z/)
    errors << 'address.zip_code must be 5 digits' unless address['zip_code'].to_s.match?(/\A\d{5}\z/)
    errors
  end
end
