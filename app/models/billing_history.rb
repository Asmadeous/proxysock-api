# frozen_string_literal: true

class BillingHistory < ApplicationRecord
  belongs_to :billable, polymorphic: true
end
