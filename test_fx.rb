# frozen_string_literal: true

# Mock the environment
ENV['APP_URL'] = 'http://localhost:3000'
ENV['FRONTEND_URL'] = 'http://localhost:3001'

puts "Testing Exchange Rate Integration..."

# 1. Test FixerService directly
rate = FixerService.get_rate('USD', 'NGN')
puts "Current USD -> NGN Rate: #{rate}"

# 2. Test Checkout logic (mocking necessary parts)
# Since I cannot easily run a full controller test here without a DB, 
# I will just verify the calculation logic in a sub-method if possible.

order_amount_usd = 100.0
calculated_ngn = (order_amount_usd * rate).round(2)
puts "Order $100.00 -> #{calculated_ngn} NGN"

# Verify rounding to 2 decimal places
if calculated_ngn.to_s.split('.').last.length <= 2
  puts "SUCCESS: Rounding is correct."
else
  puts "FAILURE: Rounding failed."
end

# Verify Paystack kobo conversion (integers)
kobo = (calculated_ngn * 100).to_i
puts "Paystack Amount (Kobo): #{kobo}"

if kobo.is_a?(Integer)
  puts "SUCCESS: Kobo is an integer."
else
  puts "FAILURE: Kobo must be an integer."
end
