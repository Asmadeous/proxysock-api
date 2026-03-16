# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PromoCode, type: :model do
  describe 'validations' do
    it 'requires a code' do
      promo = PromoCode.new(code: nil)
      expect(promo.valid?).to be false
      expect(promo.errors[:code]).to include("can't be blank")
    end

    it 'requires a unique code' do
      PromoCode.create!(code: 'UNIQUE123', discount_type: 'percentage', discount_value: 10)
      promo = PromoCode.new(code: 'unique123', discount_type: 'percentage', discount_value: 10)
      expect(promo.valid?).to be false
      expect(promo.errors[:code]).to include('has already been taken')
    end

    it 'requires discount_type to be percentage or fixed' do
      promo = PromoCode.new(code: 'TEST', discount_type: 'invalid', discount_value: 10)
      expect(promo.valid?).to be false
      expect(promo.errors[:discount_type]).to include('is not included in the list')
    end

    it 'requires discount_value to be > 0' do
      promo = PromoCode.new(code: 'TEST', discount_type: 'percentage', discount_value: 0)
      expect(promo.valid?).to be false
      expect(promo.errors[:discount_value]).to include('must be greater than 0')
    end

    it 'requires max_uses to be > 0 if present' do
      promo = PromoCode.new(code: 'TEST', discount_type: 'percentage', discount_value: 10, max_uses: 0)
      expect(promo.valid?).to be false
      expect(promo.errors[:max_uses]).to include('must be greater than 0')
    end
  end

  describe 'callbacks' do
    it 'upcases and strips the code before validation' do
      promo = PromoCode.new(code: ' save20 ', discount_type: 'percentage', discount_value: 10)
      promo.valid?
      expect(promo.code).to eq('SAVE20')
    end
  end

  describe '#usable?' do
    it 'returns true if active, not expired, and uses < max_uses' do
      promo = PromoCode.create!(code: 'TEST1', discount_type: 'percentage', discount_value: 10, active: true, expires_at: 1.day.from_now, current_uses: 5, max_uses: 10)
      expect(promo.usable?).to be true
    end

    it 'returns false if inactive' do
      promo = PromoCode.create!(code: 'TEST2', discount_type: 'percentage', discount_value: 10, active: false)
      expect(promo.usable?).to be false
    end

    it 'returns false if expired' do
      promo = PromoCode.create!(code: 'TEST3', discount_type: 'percentage', discount_value: 10, expires_at: 1.day.ago)
      expect(promo.usable?).to be false
    end

    it 'returns false if maxed out' do
      promo = PromoCode.create!(code: 'TEST4', discount_type: 'percentage', discount_value: 10, current_uses: 10, max_uses: 10)
      expect(promo.usable?).to be false
    end
  end

  describe '#calculate_discount' do
    let(:promo) { PromoCode.create!(code: 'TEST5', discount_type: 'percentage', discount_value: 20) }

    it 'returns 0 if not usable' do
      promo.update(active: false)
      expect(promo.calculate_discount(100)).to eq(0)
    end

    it 'returns 0 if order amount is below min_order_amount' do
      promo.update(min_order_amount: 50)
      expect(promo.calculate_discount(40)).to eq(0)
    end

    it 'calculates percentage discount' do
      expect(promo.calculate_discount(100)).to eq(20)
    end

    it 'calculates fixed discount' do
      promo.update(discount_type: 'fixed', discount_value: 15)
      expect(promo.calculate_discount(100)).to eq(15)
    end

    it 'caps discount at max_discount_amount' do
      promo.update(max_discount_amount: 10)
      expect(promo.calculate_discount(100)).to eq(10)
    end

    it 'does not discount more than the order total' do
      promo.update(discount_type: 'fixed', discount_value: 50)
      expect(promo.calculate_discount(30)).to eq(30)
    end
  end

  describe '#record_use!' do
    it 'increments current_uses by 1' do
      promo = PromoCode.create!(code: 'TEST6', discount_type: 'percentage', discount_value: 10, current_uses: 5)
      promo.record_use!
      expect(promo.reload.current_uses).to eq(6)
    end
  end
end
