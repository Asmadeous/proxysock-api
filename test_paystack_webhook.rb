user = User.first || User.create!(email: "test_hooks@example.com", password: "password123")
user.create_wallet!(balance: 0) unless user.wallet
deposit = Deposit.create!(
  depositable: user,
  amount: 50.0,
  gateway: 'paystack',
  status: 'pending',
  transaction_id: "DEP_paystack_123"
)
puts "Pending Deposit created: #{deposit.id} for $#{deposit.amount}"
