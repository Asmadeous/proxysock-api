# frozen_string_literal: true

class PaymentGatewayTransaction < ApplicationRecord
  belongs_to :financial_transaction, class_name: 'Transaction', foreign_key: 'transaction_id'
end
