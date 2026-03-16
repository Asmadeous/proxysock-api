# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UsaEsimCredential, type: :model do
  describe 'associations' do
    it 'belongs to a usa_esim_order' do
      association = described_class.reflect_on_association(:usa_esim_order)
      expect(association.macro).to eq :belongs_to
      expect(association.options[:foreign_key]).to eq 'order_id'
      expect(association.options[:optional]).to eq true
    end

    it 'belongs to a user optionally' do
      association = described_class.reflect_on_association(:user)
      expect(association.macro).to eq :belongs_to
      expect(association.options[:optional]).to eq true
    end
  end

  describe 'validations' do
    describe '#prevent_reassignment' do
      let(:credential) { described_class.new(status: 'assigned', order_id: 1) }

      before do
        # Simulate that it was already saved to trigger the `on: :update` validation
        allow(credential).to receive(:new_record?).and_return(false)
      end

      it 'prevents status from changing back to available once assigned' do
        allow(credential).to receive(:status_was).and_return('assigned')
        credential.status = 'available'

        credential.valid?(:update)
        expect(credential.errors[:status]).to include('cannot be changed back to available once assigned')
      end

      it 'prevents order_id from changing once set' do
        allow(credential).to receive(:order_id_was).and_return(1)
        allow(credential).to receive(:order_id_changed?).and_return(true)
        credential.order_id = 2

        credential.valid?(:update)
        expect(credential.errors[:order_id]).to include('cannot be reassigned once set')
      end

      it 'allows other updates' do
        allow(credential).to receive(:status_was).and_return('assigned')
        allow(credential).to receive(:order_id_was).and_return(1)
        allow(credential).to receive(:order_id_changed?).and_return(false)

        credential.iccid = 'new_iccid'
        credential.valid?(:update)

        expect(credential.errors[:status]).to be_empty
        expect(credential.errors[:order_id]).to be_empty
      end
    end
  end
end
