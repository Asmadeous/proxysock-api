# frozen_string_literal: true

class Vpn < ApplicationRecord
  belongs_to :vpn_order

  def username
    vpn_username
  end

  def password
    vpn_password
  end

  def server_ip
    metadata&.dig('server_ip') || metadata&.dig('hostname') || 'See OVPN Config'
  end
end
