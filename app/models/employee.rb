class Employee < ApplicationRecord
  has_secure_password validations: false
  
  belongs_to :department
  has_many :admin_action_logs
  has_many :user_impersonation_logs
  
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :work_email, uniqueness: true, allow_nil: true
  
  # Allowed work email domains for SSO
  ALLOWED_DOMAINS = ENV.fetch('EMPLOYEE_EMAIL_DOMAINS', 'proxysock.com').split(',').map(&:strip).freeze
  
  # SSO: Find or create employee from Zoho OAuth
  def self.from_omniauth(auth)
    email = auth.info.email
    
    # Validate email domain
    domain = email.split('@').last
    unless ALLOWED_DOMAINS.include?(domain)
      raise SecurityError, "Email domain #{domain} not authorized for employee access"
    end
    
    where(provider: auth.provider, uid: auth.uid).first_or_create do |employee|
      employee.email = email
      employee.work_email = email
      employee.first_name = auth.info.first_name || auth.info.name&.split&.first || 'Employee'
      employee.last_name = auth.info.last_name || auth.info.name&.split&.last || ''
      employee.password = SecureRandom.hex(16)
      employee.role = 'staff' # Default role
      employee.active = true
      employee.department = Department.find_or_create_by(name: 'General')
    end
  end
  
  def generate_jwt
    payload = {
      employee_id: id,
      email: email,
      role: role,
      exp: 8.hours.from_now.to_i, # Shorter expiry for employees
      iat: Time.current.to_i
    }
    JWT.encode(payload, Rails.application.secret_key_base)
  end
  
  def full_name
    "#{first_name} #{last_name}"
  end
end
