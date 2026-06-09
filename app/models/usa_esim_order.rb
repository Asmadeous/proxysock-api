# frozen_string_literal: true

class UsaEsimOrder < ApplicationRecord
  belongs_to :order
  has_many :usa_esim_credentials, foreign_key: 'order_id', dependent: :destroy
end
