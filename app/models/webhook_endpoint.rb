class WebhookEndpoint < ApplicationRecord
  belongs_to :reseller
  
  validates :url, presence: true, format: { with: URI::regexp(%w[http https]) }
  validates :secret, presence: true
  
  before_validation :generate_secret, on: :create
  
  private
  
  def generate_secret
    self.secret ||= SecureRandom.hex(24)
  end
end
