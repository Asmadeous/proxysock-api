# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password validations: false

  has_one_attached :avatar

  has_many :orders, as: :orderable, dependent: :destroy
  has_many :deposits, as: :depositable
  has_many :tickets, as: :user
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
  has_many :notifications, as: :recipient, dependent: :destroy
  has_one :affiliate, as: :affiliatable, dependent: :destroy
  has_many :affiliate_referrals, as: :referred, dependent: :destroy

  belongs_to :reseller, optional: true

  # Owner types for data separation:
  # platform       = Direct customers of the platform (your own users)
  # reseller_managed = Users created/managed by infrastructure resellers
  OWNER_TYPES = %w[platform reseller_managed].freeze
  validates :owner_type, inclusion: { in: OWNER_TYPES }

  scope :platform_users, -> { where(owner_type: 'platform') }
  scope :reseller_managed, -> { where(owner_type: 'reseller_managed') }


  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :username, presence: true, uniqueness: { case_sensitive: false },
                       length: { minimum: 3, maximum: 30 },
                       format: { with: /\A[a-zA-Z0-9_]+\z/, message: 'can only contain letters, numbers, and underscores' }
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :password, presence: true, length: { minimum: 8 }, if: :password_required?

  # Ensure location is available for MyProxyApi integrations
  validates :country_code, presence: true
  validates :city, presence: true

  validate :avatar_security_checks

  generates_token_for :password_reset, expires_in: 15.minutes do
    password_salt&.last(10)
  end

  generates_token_for :email_verification, expires_in: 24.hours do
    email
  end

  # SSO: Find or create user from OAuth provider
  def self.from_omniauth(auth)
    where(provider: auth.provider, uid: auth.uid).first_or_create do |user|
      user.email = auth.info.email
      user.first_name = auth.info.first_name || auth.info.name&.split&.first || 'User'
      user.last_name = auth.info.last_name || auth.info.name&.split&.last
      user.last_name = 'User' if user.last_name.blank?
      user.password = SecureRandom.hex(16) # Random password for SSO users
      base_username = auth.info.nickname || auth.info.username || auth.info.email.split('@').first
      user.username = base_username

      # Ensure username uniqueness if the split email is taken (case-insensitive)
      user.username = "#{base_username}_#{SecureRandom.hex(3)}" while User.where('LOWER(username) = ?', user.username.downcase).exists?

      user.email_verified_at = Time.current
      user.status = 'active'
    end
  end

  # Find existing user by email (for linking SSO to existing account)
  def self.find_for_oauth(auth)
    user = find_by(email: auth.info.email)

    if user
      # Link SSO to existing user if not already linked
      user.update(provider: auth.provider, uid: auth.uid) if user.provider.nil?
      user
    else
      from_omniauth(auth)
    end
  end

  def generate_jwt(duration = 24.hours.from_now.to_i)
    payload = {
      user_id: id,
      email: email,
      exp: duration,
      iat: Time.current.to_i
    }
    JWT.encode(payload, Rails.application.secret_key_base)
  end

  def profile_picture_url
    if avatar.attached?
      Rails.application.routes.url_helpers.rails_storage_proxy_url(avatar, host: Rails.application.routes.default_url_options[:host], protocol: Rails.application.routes.default_url_options[:protocol] || 'https')
    elsif super.present? && (super.start_with?('http') || super.start_with?('/'))
      super
    else
      nil
    end
  end

  private

  def avatar_security_checks
    return unless avatar.attached?

    if avatar.blob.byte_size > 5.megabytes
      errors.add(:avatar, 'size must be less than 5MB')
    end

    acceptable_types = %w[image/jpeg image/png image/gif image/webp]
    return if acceptable_types.include?(avatar.content_type)

    errors.add(:avatar, 'must be a JPEG, PNG, GIF, or WebP image')
  end

  def password_required?
    # Password required only for non-SSO users
    provider.blank? && password_digest.blank?
  end
end
