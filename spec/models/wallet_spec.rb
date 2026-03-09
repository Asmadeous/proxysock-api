# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Wallet, type: :model do
  let(:user) { User.create!(username: 'wallet_user', email: 'wallet@test.com', first_name: 'W', last_name: 'S', password: 'password123') }
  let(:wallet) { Wallet.create!(owner: user, wallet_type: 'main') }

  describe '#credit!' do
    it 'delegates to LedgerService' do
      expect_any_instance_of(LedgerService).to receive(:record_entry).with(50.0, 'credit', 'Test Credit', {}, nil)
      wallet.credit!(50.0, 'Test Credit')
    end
  end

  describe '#debit!' do
    it 'delegates to LedgerService' do
      expect_any_instance_of(LedgerService).to receive(:record_entry).with(25.0, 'debit', 'Test Debit', {}, nil)
      wallet.debit!(25.0, 'Test Debit')
    end
  end

  describe '#balance' do
    it 'sums the wallet transactions' do
      wallet.credit!(100.0, 'Initial')
      wallet.debit!(30.0, 'Second')
      expect(wallet.balance).to eq(70.0)
    end
  end
end
