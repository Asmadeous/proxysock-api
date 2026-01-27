# frozen_string_literal: true

class ExternalApiWebhook < ApplicationRecord
  belongs_to :related, polymorphic: true
end
