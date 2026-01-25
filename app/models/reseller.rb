class Reseller < ApplicationRecord
  has_secure_password
  
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :username, presence: true, uniqueness: true
  validates :company_name, presence: true
  
  before_create :generate_api_key
  
  private
  
  def generate_api_key
    # Logic to generate API key (store hash, provide secret once?)
    # For now, generate a random token and hash it
    token = SecureRandom.hex(32)
    self.api_key_hash = Digest::SHA256.hexdigest(token)
    # Ideally store the plain token in a virtual attribute to return it once
  end
end
