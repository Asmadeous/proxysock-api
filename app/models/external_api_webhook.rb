class ExternalApiWebhook < ApplicationRecord
  belongs_to :related, polymorphic: true
end
