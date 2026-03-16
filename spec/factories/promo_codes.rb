# frozen_string_literal: true

FactoryBot.define do
  factory :promo_code do
    sequence(:code) { |n| "PROMO#{n}" }
    discount_type { 'percentage' }
    discount_value { 10.0 }
    active { true }
    current_uses { 0 }
    max_uses { nil }
    expires_at { nil }
  end
end
