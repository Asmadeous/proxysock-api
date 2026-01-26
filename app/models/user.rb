class User < ApplicationRecord
  has_secure_password validations: false
  
  has_many :ecommerce_orders
  has_many :orders, through: :ecommerce_orders
  has_many :ecommerce_orders
  has_many :ecommerce_orders
  has_many :orders, through: :ecommerce_orders
  has_many :deposits, as: :depositable
  has_one :wallet, as: :owner, dependent: :destroy
  
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :password, presence: true, length: { minimum: 8 }, if: :password_required?
  
  # SSO: Find or create user from OAuth provider
  def self.from_omniauth(auth)
    where(provider: auth.provider, uid: auth.uid).first_or_create do |user|
      user.email = auth.info.email
      user.first_name = auth.info.first_name || auth.info.name&.split&.first || 'User'
      user.last_name = auth.info.last_name || auth.info.name&.split&.last || ''
      user.password = SecureRandom.hex(16) # Random password for SSO users
      user.email_verified_at = Time.current
      user.status = 'active'
    end
  end
  
  # Find existing user by email (for linking SSO to existing account)
  def self.find_for_oauth(auth)
    user = find_by(email: auth.info.email)
    
    if user
      # Link SSO to existing user if not already linked
      if user.provider.nil?
        user.update(provider: auth.provider, uid: auth.uid)
      end
      user
    else
      from_omniauth(auth)
    end
  end
  
  def generate_jwt
    payload = {
      user_id: id,
      email: email,
      exp: 24.hours.from_now.to_i,
      iat: Time.current.to_i
    }
    JWT.encode(payload, Rails.application.secret_key_base)
  end
  
  private
  
  def password_required?
    # Password required only for non-SSO users
    provider.blank? && password_digest.blank?
  end
end
