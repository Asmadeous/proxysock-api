# frozen_string_literal: true

class ProxyInstance < ApplicationRecord
  has_many :proxy_assignments, dependent: :destroy

  validates :proxy_address, presence: true, uniqueness: true

  # Scopes
  scope :available, -> { where(status: 'available') }
  scope :assigned, -> { where(status: 'assigned') }

  def isp
    metadata&.dig('isp')
  end

  def isp_id
    metadata&.dig('isp_id')
  end
end
