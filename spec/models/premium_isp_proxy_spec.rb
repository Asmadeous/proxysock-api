# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PremiumIspProxy, type: :model do
  describe 'associations' do
    it 'belongs to a premium_isp_proxy_order' do
      association = described_class.reflect_on_association(:premium_isp_proxy_order)
      expect(association.macro).to eq :belongs_to
    end
  end
end
