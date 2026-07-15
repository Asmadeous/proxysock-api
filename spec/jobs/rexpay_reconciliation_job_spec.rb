# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RexpayReconciliationJob, type: :job do
  let(:user) do
    User.create!(username: 'sweep_user', email: 'sweep@test.com', first_name: 'S', last_name: 'W',
                 password: 'password123', country_code: 'US', city: 'New York')
  end
  let(:rexpay) { instance_double(RexpayService) }

  before { allow(RexpayService).to receive(:new).and_return(rexpay) }

  describe 'checkout sessions' do
    let!(:session) do
      s = CheckoutSession.create!(orderable: user, total_amount: 20.0, payment_method: 'rexpay',
                                  status: 'pending', gateway_reference: 'CHECKOUTSWEEP1')
      s.update_column(:created_at, 10.minutes.ago)
      s
    end

    it 'reconciles a pending session whose payment succeeded' do
      expect(rexpay).to receive(:verify_transaction).with('CHECKOUTSWEEP1')
                                                    .and_return({ status: 'success', amount: 30_000.0, currency: 'NGN' })

      described_class.new.perform

      expect(session.reload.status).not_to eq('pending') # marked paid → provisioned
    end

    it 'leaves a pending session whose payment has not completed' do
      allow(rexpay).to receive(:verify_transaction).and_return({ status: 'failed', error: 'pending' })

      described_class.new.perform

      expect(session.reload.status).to eq('pending')
    end

    it 'does not poll sessions younger than MIN_AGE' do
      session.update_column(:created_at, 1.minute.ago)
      expect(rexpay).not_to receive(:verify_transaction)

      described_class.new.perform
    end

    it 'abandons a stale unpaid session past MAX_AGE' do
      session.update_column(:created_at, 3.hours.ago)
      allow(rexpay).to receive(:verify_transaction).and_return({ status: 'failed', error: 'not found' })

      described_class.new.perform

      expect(session.reload.status).to eq('failed')
    end
  end

  describe 'deposits' do
    let!(:deposit) do
      d = Deposit.create!(depositable: user, amount: 50.0, gateway: 'rexpay', status: 'pending',
                          metadata: { transaction_ref: 'DEPSWEEP1', exchange_rate: 1400.0 })
      d.update_column(:created_at, 10.minutes.ago)
      d
    end

    it 'credits a pending deposit whose payment succeeded (USD, not the fee)' do
      # 71,050 NGN / 1400 = 50.75 → capped at the $50 intended deposit
      expect(rexpay).to receive(:verify_transaction).with('DEPSWEEP1')
                                                    .and_return({ status: 'success', amount: 71_050.0, currency: 'NGN' })

      described_class.new.perform

      expect(deposit.reload.status).to eq('completed')
      expect(user.wallet.reload.balance).to be_within(0.01).of(50.0)
    end
  end
end
