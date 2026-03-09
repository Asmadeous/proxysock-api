# frozen_string_literal: true

require 'rails_helper'

RSpec.describe OrderProvisioningService do
  let(:user) { User.create!(username: 'prov_user', email: 'prov@test.com', first_name: 'P', last_name: 'U', password: 'password123') }
  let!(:wallet) { Wallet.create!(owner: user, wallet_type: 'main') }
  let(:category) { ProductCategory.create!(name: 'Proxies', slug: 'proxies') }
  let(:product) { Product.create!(name: 'Proxy', product_type: 'proxy', provider: 'myproxyapi', product_category: category, available_to: 'both') }
  let!(:pricing) { ProductPricing.create!(product: product, selling_price: 15.0, active: true, currency: 'USD') }
  let(:order) { Order.create!(orderable: user, product: product, product_pricing: pricing, quantity: 1, status: 'pending') }
  let(:service) { OrderProvisioningService.new(order, user) }

  before do
    allow_any_instance_of(InvoicePdfService).to receive(:generate_and_attach!).and_return(true)
    allow(ResellerEarningsService).to receive(:record_profit_share!).and_return(true)
    allow(NotificationService).to receive(:notify).and_return(true)
  end

  describe '#process!' do
    context 'when balance is sufficient' do
      before do
        wallet.credit!(100.0, 'Initial')
        # Mock the low-level provider call
        allow(service).to receive(:provision_product!).and_return(true)
      end

      it 'deducts balance and moves order to processing/completed' do
        expect {
          service.process!
        }.to change { wallet.reload.balance.to_f }.from(100.0).to(85.0)
        
        expect(order.reload.status).to eq('processing') # aasm state machine usually moves to processing then completed
      end
    end

    context 'when balance is insufficient' do
      it 'raises ProvisioningError and marks order as failed' do
        expect {
          service.process!
        }.to raise_error(OrderProvisioningService::ProvisioningError)
        expect(order.reload.status).to eq('failed')
      end
    end
  end
end
