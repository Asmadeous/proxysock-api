# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PremiumIspProxyOrder, type: :model do
  describe 'associations' do
    it 'belongs to an order' do
      association = described_class.reflect_on_association(:order)
      expect(association.macro).to eq :belongs_to
    end
  end
end
