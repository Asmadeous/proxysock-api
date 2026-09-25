require 'rails_helper'

RSpec.describe FundSplitterService do
  describe '.process_order!' do
    let(:product_pricing) { instance_double('ProductPricing', selling_price: 10.0, api_price: 4.0) }
    let(:product) { instance_double('Product', product_type: 'proxy') }
    let(:order) { instance_double('Order', product: product, product_pricing: product_pricing, quantity: 2, order_fund_split: nil) }

    before do
      allow(OrderFundSplit).to receive(:create!)
    end

    context 'with an API-centered product (proxy)' do
      it 'calculates capital as api_price * quantity and profit as remainder' do
        FundSplitterService.process_order!(order)
        expect(OrderFundSplit).to have_received(:create!).with(
          order: order,
          total_amount: 20.0,
          capital_amount: 8.0,
          profit_amount: 12.0,
          status: 'pending'
        )
      end
    end

    context 'with a VM product' do
      let(:product) { instance_double('Product', product_type: 'vps') }
      let(:product_pricing) { instance_double('ProductPricing', selling_price: 20.0, api_price: 10.0) }

      it 'calculates capital as 15% of total amount' do
        FundSplitterService.process_order!(order)
        expect(OrderFundSplit).to have_received(:create!).with(
          order: order,
          total_amount: 40.0,
          capital_amount: 6.0, # 40 * 0.15
          profit_amount: 34.0,
          status: 'pending'
        )
      end
    end

    it 'does not create a duplicate split if one already exists' do
      allow(order).to receive(:order_fund_split).and_return(double)
      FundSplitterService.process_order!(order)
      expect(OrderFundSplit).not_to have_received(:create!)
    end
  end
end
