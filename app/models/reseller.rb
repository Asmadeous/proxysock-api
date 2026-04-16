# frozen_string_literal: true

class Reseller < ApplicationRecord
  has_secure_password

  # Reseller table has no metadata column, but some controllers reference it
  def metadata
    {}
  end

  has_one_attached :avatar
  validate :avatar_security_checks

  has_many :reseller_orders
  has_many :billing_histories, as: :billable
  has_many :payouts, dependent: :destroy
  has_many :managed_users, class_name: 'User', foreign_key: 'reseller_id'
  has_many :deposits, as: :depositable
  has_many :wallets, as: :owner, dependent: :destroy
  has_one :main_wallet, -> { where(wallet_type: 'main') }, as: :owner, class_name: 'Wallet'
  has_one :earnings_wallet, -> { where(wallet_type: 'earnings') }, as: :owner, class_name: 'Wallet'

  after_create :initialize_wallet
  before_validation :normalize_location_data

  def normalize_location_data
    self.country_code = country_code.to_s.strip.upcase if country_code.present?
    self.country = country.to_s.strip if country.present?
    self.city = city.to_s.strip if city.present?
  end

  def wallet
    main_wallet || create_main_wallet!(wallet_type: 'main')
  end

  def initialize_wallet
    wallet
    create_earnings_wallet!(wallet_type: 'earnings') if infrastructure?
  end

  has_many :api_tokens, dependent: :destroy
  has_many :orders, as: :orderable, dependent: :destroy
  has_one :affiliate, as: :affiliatable, dependent: :destroy
  has_many :affiliate_referrals, as: :referred, dependent: :destroy
  has_many :webhook_endpoints, dependent: :destroy
  has_many :notifications, as: :recipient, dependent: :destroy
  has_many :tickets, as: :user

  delegate :balance, to: :main_wallet, allow_nil: true
  delegate :balance, to: :earnings_wallet, prefix: :earnings, allow_nil: true

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :username, presence: true, uniqueness: true
  validates :company_name, presence: true

  # Ensure location is available for MyProxyApi integrations
  validates :country_code, presence: true
  validates :city, presence: true

  # Reseller Tiers
  # api_only:        Balance-based, deposits via gateways (min $1500), rotational JWT, all products
  # single_product:  Balance-based, deposits via gateways (min $500), rotational JWT, one product category
  # infrastructure:  Monthly subscription, dedicated API key, earnings wallet, customer management, payouts
  enum :reseller_type, { api_only: 'api_only', infrastructure: 'infrastructure', single_product: 'single_product' }, default: 'api_only'

  belongs_to :allowed_product_category, class_name: 'ProductCategory', optional: true
  validates :allowed_product_category_id, presence: { message: 'must be assigned for single product resellers' }, if: -> { single_product? }
  validates :subscription_fee, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  def api_only?
    reseller_type == 'api_only'
  end

  def infrastructure?
    reseller_type == 'infrastructure'
  end

  def single_product?
    reseller_type == 'single_product'
  end

  # Balance-based tiers (api_only and single_product) use deposits and wallet balance
  def balance_based?
    api_only? || single_product?
  end

  # Minimum deposit amount based on tier
  def min_deposit_amount
    single_product? ? 500 : 1500
  end

  before_create :generate_api_key
  before_create :generate_dedicated_api_key, if: -> { infrastructure? || dedicated_api_key.present? }

  # Price multiplier based on tier (infrastructure has a surcharge for overhead)
  def price_multiplier
    return 1.0 if balance_based?

    1.0 + (infrastructure_surcharge_percentage.to_f / 100.0)
  end

  # Generate rotating JWT token (balance-based tiers: api_only & single_product)
  def generate_rotating_token
    return nil unless balance_based?

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
    elsif balance_based?
      {
        reseller_id: id,
        username: username,
        permanent_api_key: permanent_api_key,
        type: 'rotational_base',
        allowed_category: single_product? ? allowed_product_category&.name : 'all',
        note: 'Use your username and permanent_api_key to generate rotational tokens via /api/v1/auth/token'
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

  def profile_picture_url
    if avatar.attached?
      # Use full URL with host/protocol from default_url_options
      Rails.application.routes.url_helpers.rails_storage_proxy_url(avatar, host: Rails.application.routes.default_url_options[:host], protocol: Rails.application.routes.default_url_options[:protocol] || (Rails.env.development? ? 'http' : 'https'))
    else
      nil
    end
  end

  def as_json(options = {})
    super(options).merge({
                           balance: balance,
                           earnings_balance: earnings_balance,
                           price_multiplier: price_multiplier,
                           profile_picture_url: profile_picture_url
                         })
  end

  def generate_dedicated_api_key
    self.dedicated_api_key = "ps_live_#{SecureRandom.hex(24)}"
  end

  def authenticate_api_key(key)
    return false if permanent_api_key.blank? || key.blank?
    ActiveSupport::SecurityUtils.secure_compare(permanent_api_key, key)
  end

  private

  def generate_api_key
    token = SecureRandom.hex(32)
    self.permanent_api_key = token
    self.api_key_hash = Digest::SHA256.hexdigest(token)
  end

  def avatar_security_checks
    return unless avatar.attached?

    if avatar.blob.byte_size > 5.megabytes
      errors.add(:avatar, 'size must be less than 5MB')
    end

    acceptable_types = %w[image/jpeg image/png image/gif image/webp]
    return if acceptable_types.include?(avatar.content_type)

    errors.add(:avatar, 'must be a JPEG, PNG, GIF, or WebP image')
  end
end
