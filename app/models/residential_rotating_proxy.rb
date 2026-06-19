# frozen_string_literal: true

class ResidentialRotatingProxy < ApplicationRecord
  belongs_to :residential_rotating_proxy_order
  # The table has an order_id column and provisioning passes `order:` when creating
  # records; without this association that create raised UnknownAttributeError and
  # failed every residential-rotating order at the persistence step.
  belongs_to :order, optional: true
end
