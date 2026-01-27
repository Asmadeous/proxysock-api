# frozen_string_literal: true

class ResellOrder < ApplicationRecord
  # This corresponds to 'reseller_orders' table
  # Renaming the model class to match the intended polymorphic type usage,
  # but the table is 'reseller_orders'. We can set table name.
  self.table_name = 'reseller_orders'

  belongs_to :order # The master order
  belongs_to :reseller
  belongs_to :orderable, polymorphic: true # VmOrder, etc

  # Delegations for convenience
  delegate :status, :total_amount, :currency, :order_number, to: :order

  validate :validate_orderable_type

  private

  def validate_orderable_type
    allowed_types = ['VmOrder']
    return if allowed_types.include?(orderable_type)

    errors.add(:orderable_type, "is not allowed for resellers. Allowed: #{allowed_types.join(', ')}")
  end
end
