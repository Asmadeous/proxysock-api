# frozen_string_literal: true

class WebhookEndpoint < ApplicationRecord
  belongs_to :reseller

  validates :url, presence: true, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]) }
  validates :secret, presence: true

  # events is a JSON array of event types, e.g. ["order.completed", "order.cancelled", "credentials.ready"]
  VALID_EVENTS = %w[order.completed order.cancelled order.failed credentials.ready].freeze

  before_validation :generate_secret, on: :create

  private

  def generate_secret
    self.secret ||= SecureRandom.hex(24)
  end
end

