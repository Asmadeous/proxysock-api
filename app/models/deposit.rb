# frozen_string_literal: true

class Deposit < ApplicationRecord
  belongs_to :depositable, polymorphic: true
  belongs_to :user, optional: true # Deprecated
  belongs_to :linked_transaction, class_name: 'Transaction', foreign_key: 'transaction_id', optional: true
  belongs_to :payment_method, optional: true
end
