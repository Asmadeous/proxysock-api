class UsaEsimCredential < ApplicationRecord
  belongs_to :usa_esim_order, foreign_key: 'order_id', optional: true
  belongs_to :user, optional: true
end
