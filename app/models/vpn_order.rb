# frozen_string_literal: true

class VpnOrder < ApplicationRecord
  belongs_to :order
  has_one :vpn, dependent: :destroy
end
