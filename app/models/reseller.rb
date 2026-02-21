# frozen_string_literal: true

class Reseller < ApplicationRecord
  has_secure_password

  has_many :reseller_orders
  has_many :billing_histories, as: :billable
  has_many :deposits, as: :depositable
  has_one :wallet, as: :owner, dependent: :destroy
  has_many :api_tokens, dependent: :destroy
  has_many :orders, as: :orderable, dependent: :destroy
  has_one :affiliate, as: :affiliatable, dependent: :destroy
  has_many :affiliate_referrals, as: :referred, dependent: :destroy

  delegate :balance, to: :wallet, allow_nil: true

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :username, presence: true, uniqueness: true
  validates :company_name, presence: true

  # Reseller Tiers
  # api_only: Standard pricing (100%)
  # infrastructure: Surcharge applied (100% + X%)
  has_many :webhook_endpoints, dependent: :destroy
  has_many :tickets, as: :user

  enum :reseller_type, { api_only: 'api_only', infrastructure: 'infrastructure' }, default: 'api_only'

  def api_only?
    reseller_type == 'api_only'
  end

  before_create :generate_api_key

  # Calculate price multiplier based on tier
  # Returns decimal (e.g., 1.0 for api_only, 1.15 for infrastructure with 15% surcharge)
  def price_multiplier
    return 1.0 if api_only?

    1.0 + (infrastructure_surcharge_percentage.to_f / 100.0)
  end

  # Generate rotating JWT token
  # Each token is single-use - must be rotated after each request
  def generate_rotating_token
    jti = SecureRandom.uuid

    payload = {
      reseller_id: id,
      email: email,
      jti: jti, # Unique token identifier
      exp: 1.hour.from_now.to_i,
      iat: Time.current.to_i
    }

    # Store the JTI for validation
    update_columns(
      current_token_jti: jti,
      token_issued_at: Time.current,
      token_request_count: token_request_count.to_i + 1
    )

    JWT.encode(payload, Rails.application.secret_key_base)
  end

  # Validate token and consume it (single-use)
  # Returns true if valid, false if invalid/already used
  def validate_and_consume_token!(jti)
    return false if jti.blank?
    return false if current_token_jti != jti

    # Token is valid - invalidate it immediately
    update_columns(current_token_jti: nil)
    true
  end

  # Check if token JTI is currently valid (without consuming)
  def token_valid?(jti)
    return false if jti.blank?

    current_token_jti == jti
  end

  # Generate initial API credentials (for first-time setup)
  def generate_initial_credentials
    token = generate_rotating_token
    {
      reseller_id: id,
      username: username,
      initial_token: token,
      note: 'This token is single-use. Each API response will include a new token.'
    }
  end

  private

  def generate_api_key
    # Legacy API key for backwards compatibility
    token = SecureRandom.hex(32)
    self.api_key_hash = Digest::SHA256.hexdigest(token)
  end
end
