class Deposit < ApplicationRecord
  belongs_to :user
  belongs_to :linked_transaction, class_name: 'Transaction', foreign_key: 'transaction_id', optional: true
  belongs_to :payment_method, optional: true
end
