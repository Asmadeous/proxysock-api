# frozen_string_literal: true

require 'rails_helper'

RSpec.describe LedgerService do
  let(:user) { User.create!(username: 'ledger_user', email: 'ledger@test.com', first_name: 'L', last_name: 'S', password: 'password123') }
  let(:wallet) { user.wallet }
  let(:service) { LedgerService.new(wallet) }

  include ActiveSupport::Testing::TimeHelpers

  describe '#record_entry' do
    context 'when crediting 100 USD' do
      it 'creates a wallet transaction and increases balance' do
        expect {
          service.record_entry(100.0, 'credit', 'Test Credit')
        }.to change { wallet.reload.balance.to_f }.from(0.0).to(100.0)

        tx = wallet.wallet_transactions.last
        expect(tx.transaction_type).to eq('credit')
        expect(tx.amount).to eq(100.0)
        expect(tx.balance_before).to eq(0.0)
        expect(tx.balance_after).to eq(100.0)
        expect(tx.parent_hash).to eq('GENESIS_HASH')
        expect(tx.entry_hash).to be_present
      end
    end

    context 'when debiting 40 USD from 100 USD balance' do
      before { service.record_entry(100.0, 'credit', 'Initial Deposit') }

      it 'decreases balance correctly' do
        freeze_time do
          service.record_entry(40.0, 'debit', 'Test Debit')
          expect(wallet.reload.balance.to_f).to eq(60.0)

          tx = wallet.wallet_transactions.find_by!(transaction_type: 'debit')
          expect(tx.amount.to_f).to eq(-40.0)
          expect(tx.balance_after.to_f).to eq(60.0)
          expect(tx.parent_hash).to eq(wallet.wallet_transactions.find_by!(transaction_type: 'credit').entry_hash)
        end
      end
    end

    context 'when debiting more than balance' do
      it 'raises InsufficientFundsError and does not record entry' do
        expect {
          service.record_entry(50.0, 'debit', 'Overdraw')
        }.to raise_error(LedgerService::InsufficientFundsError)
        expect(wallet.wallet_transactions.count).to eq(0)
      end
    end
  end

  describe '#verify_integrity!' do
    before do
      service.record_entry(100.0, 'credit', 'Initial')
      service.record_entry(30.0, 'debit', 'Second')
    end

    it 'returns true for a valid ledger' do
      expect(service.verify_integrity!).to be true
    end

    it 'raises LedgerTamperError if an amount is modified in the database' do
      tx = wallet.wallet_transactions.first
      tx.update_column(:amount, 500.0) # Tampering bypasses validations/hooks
      expect { service.verify_integrity! }.to raise_error(LedgerService::LedgerTamperError)
    end

    it 'raises LedgerTamperError if a balance_after is tampered with' do
      tx = wallet.wallet_transactions.last
      tx.update_column(:balance_after, 9999.0)
      expect { service.verify_integrity! }.to raise_error(LedgerService::LedgerTamperError)
    end

    it 'detects chain breaks in parent_hash' do
      tx = wallet.wallet_transactions.last
      tx.update_column(:parent_hash, 'broken')
      expect { service.verify_integrity! }.to raise_error(LedgerService::LedgerTamperError)
    end
  end
end
