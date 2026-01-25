class ExternalApiRequest < ApplicationRecord
  belongs_to :related, polymorphic: true
end
