# frozen_string_literal: true

class Reseller < ApplicationRecord
  has_secure_password

  has_many :reseller_orders
  has_many :billing_histories, as: :billable
  has_many :deposits, as: :depositable
  has_many :wallets, as: :owner, dependent: :destroy
  has_one :main_wallet, -> { where(wallet_type: 'main') }, as: :owner, class_name: 'Wallet'
  has_one :earnings_wallet, -> { where(wallet_type: 'earnings') }, as: :owner, class_name: 'Wallet'

  after_create :initialize_wallet

  def wallet
    main_wallet || create_main_wallet!(wallet_type: 'main')
  end

  def initialize_wallet
    wallet
  end

  has_many :api_tokens, dependent: :destroy
  has_many :orders, as: :orderable, dependent: :destroy
  has_one :affiliate, as: :affiliatable, dependent: :destroy
  has_many :affiliate_referrals, as: :referred, dependent: :destroy
  has_many :webhook_endpoints, dependent: :destroy
  has_many :tickets, as: :user

  delegate :balance, to: :main_wallet, allow_nil: true
  delegate :balance, to: :earnings_wallet, prefix: :earnings, allow_nil: true

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :username, presence: true, uniqueness: true
  validates :company_name, presence: true

  # Reseller Tiers
  # api_only: Balance-based, deposits via 3 gateways (min $1000), rotational JWT
  # infrastructure: Monthly subscription, dedicated API key, earnings wallet, customer emails
  enum :reseller_type, { api_only: 'api_only', infrastructure: 'infrastructure' }, default: 'api_only'

  validates :subscription_fee, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  def api_only?
    reseller_type == 'api_only'
  end

  def infrastructure?
    reseller_type == 'infrastructure'
  end

  before_create :generate_api_key
  before_create :generate_dedicated_api_key, if: -> { infrastructure? || dedicated_api_key.present? }

  # Price multiplier based on tier (infrastructure has a surcharge for overhead)
  def price_multiplier
    return 1.0 if api_only?

    1.0 + (infrastructure_surcharge_percentage.to_f / 100.0)
  end

  # Generate rotating JWT token (API Only)
  def generate_rotating_token
    return nil unless api_only?

    jti = SecureRandom.uuid
    payload = {
      reseller_id: id,
      email: email,
      jti: jti,
      exp: 1.hour.from_now.to_i,
      iat: Time.current.to_i
    }

    update_columns(
      current_token_jti: jti,
      token_issued_at: Time.current,
      token_request_count: token_request_count.to_i + 1
    )

    JWT.encode(payload, Rails.application.secret_key_base)
  end

  # Validates the single-use JTI and consumes it so it cannot be reused.
  # Returns true if valid, false if already consumed or mismatched.
  def validate_and_consume_token!(jti)
    return false if current_token_jti.blank?
    return false unless ActiveSupport::SecurityUtils.secure_compare(current_token_jti, jti)

    # Consume the token immediately so replay attacks are impossible
    update_columns(current_token_jti: nil)
    true
  end

  # API credentials based on tier
  def api_credentials
    if dedicated_api_key.present?
      {
        reseller_id: id,
        username: username,
        api_key: dedicated_api_key,
        type: 'dedicated',
        note: 'This is your persistent API key for all requests.'
      }
    else
      {
        reseller_id: id,
        username: username,
        initial_token: generate_rotating_token,
        type: 'rotational',
        note: 'This token is single-use. Each API response will include a new token.'
      }
    end
  end

  def as_json(options = {})
    super(options).merge({
                           balance: balance,
                           earnings_balance: earnings_balance,
                           price_multiplier: price_multiplier
                         })
  end

  def generate_dedicated_api_key
    self.dedicated_api_key = "ps_live_#{SecureRandom.hex(24)}"
  end

  private

  def generate_api_key
    token = SecureRandom.hex(32)
    self.api_key_hash = Digest::SHA256.hexdigest(token)
  end
end
