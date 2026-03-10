# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UsaEsimOrder, type: :model do
  describe 'associations' do
    it 'belongs to an order' do
      association = described_class.reflect_on_association(:order)
      expect(association.macro).to eq :belongs_to
    end
    
    it 'has many usa_esim_credentials' do
      association = described_class.reflect_on_association(:usa_esim_credentials)
      expect(association.macro).to eq :has_many
      expect(association.options[:foreign_key]).to eq 'order_id'
      expect(association.options[:dependent]).to eq :nullify
    end
  end
end
