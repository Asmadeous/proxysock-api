# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ProxyAssignment, type: :model do
  let!(:user) do
    User.create!(
      email: "test_#{SecureRandom.hex(4)}@example.com",
      username: "testuser_#{SecureRandom.hex(4)}",
      first_name: 'Test',
      last_name: 'User',
      password: 'password123',
      status: 'active',
      country_code: 'US',
      city: 'New York'
    )
  end

  let!(:category) { ProductCategory.create!(name: 'Mobile Proxy', slug: "mobile-proxy-#{SecureRandom.hex(4)}", available_to: 'both') }

  let!(:product) do
    Product.create!(
      name: 'XProxy Mobile',
      product_type: 'proxy',
      product_category: category,
      available_to: 'both',
      slug: "xproxy-mobile-#{SecureRandom.hex(4)}"
    )
  end

  let!(:pricing) do
    ProductPricing.create!(
      product: product,
      duration_type: 'monthly',
      duration_value: 1,
      selling_price: 10.0,
      currency: 'USD'
    )
  end

  let!(:proxy_instance) { ProxyInstance.create!(proxy_address: "1.2.3.4:#{rand(1000..9999)}", status: 'available') }

  let!(:order) do
    Order.create!(
      orderable: user,
      product: product,
      product_pricing: pricing,
      order_number: "ORD-#{SecureRandom.hex(4).upcase}",
      status: 'active'
    )
  end

  subject(:assignment) do
    described_class.create!(
      order: order,
      proxy_instance: proxy_instance,
      username: 'user',
      password: 'pass',
      status: 'active',
      gb_limit: 1.0,
      gb_used: 0.0,
      expires_at: 1.day.from_now
    )
  end

  describe '#expired?' do
    it 'is false when neither limit is reached' do
      expect(assignment.expired?).to be false
    end

    it 'is true when time expires' do
      assignment.update!(expires_at: 1.minute.ago)
      expect(assignment.expired?).to be true
      expect(assignment.expiry_reason).to eq(:time_expired)
    end

    it 'is true when GB limit is reached' do
      assignment.update!(gb_used: 1.0)
      expect(assignment.expired?).to be true
      expect(assignment.expiry_reason).to eq(:gb_depleted)
    end
  end

  describe '#record_usage!' do
    it 'increments gb_used and returns true when limit is crossed' do
      expect(assignment.record_usage!(0.5)).to be false
      expect(assignment.gb_used).to eq(0.5)

      expect(assignment.record_usage!(0.5)).to be true
      expect(assignment.gb_used).to eq(1.0)
      expect(assignment.expired?).to be true
    end
  end

  describe '#disconnect!' do
    it 'marks as expired and frees the proxy if last active' do
      allow(ProxyMailer).to receive(:with).and_return(double(expiry_email: double(deliver_later: true)))

      assignment.disconnect!(reason: :time_expired)

      expect(assignment.status).to eq('expired')
      expect(assignment.metadata['disconnect_reason']).to eq('time_expired')
      expect(proxy_instance.reload.status).to eq('available')
    end

    it 'does not free the proxy if other active assignments exist' do
      allow(ProxyMailer).to receive(:with).and_return(double(expiry_email: double(deliver_later: true)))

      # Create another active assignment on same instance
      ProxyAssignment.create!(
        order: order,
        proxy_instance: proxy_instance,
        username: 'user2',
        password: 'pass',
        status: 'active'
      )

      proxy_instance.update!(status: 'assigned')

      assignment.disconnect!(reason: :time_expired)

      expect(assignment.status).to eq('expired')
      expect(proxy_instance.reload.status).to eq('assigned')
    end
  end
end
