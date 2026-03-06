# frozen_string_literal: true

ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
require 'rails/test_help'
require 'mocha/minitest'

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    setup do
      # Global stub for PaystackService to prevent network calls
      PaystackService.any_instance.stubs(:initialize_transaction).returns({ authorization_url: 'http://mock-paystack.com' })
      PaystackService.any_instance.stubs(:generate_payment_link).returns('http://mock-paystack.com')
    end

    # Helper to create JWT token for testing

    # Helper to create JWT token for testing
    # Helper to create JWT token for testing
    def jwt_token_for(user_or_reseller)
      payload = {
        exp: 24.hours.from_now.to_i
      }

      if user_or_reseller.is_a?(Reseller)
        payload[:reseller_id] = user_or_reseller.id
        # Ensure resonator has a valid JTI or generate one
        # Ideally we use the reseller's method to generate a valid token but that might be complex
        # So we mock a JTI that matches the reseller's current one or update it
        jti = SecureRandom.uuid
        user_or_reseller.update_column(:current_token_jti, jti)
        payload[:jti] = jti
      else
        payload[:user_id] = user_or_reseller.id
      end

      JWT.encode(payload, Rails.application.secret_key_base)
    end

    # Helper to set auth header
    def auth_header(user_or_reseller)
      { 'Authorization' => "Bearer #{jwt_token_for(user_or_reseller)}" }
    end

    # Helper to create a reseller with balance
    def create_reseller_with_balance(balance = 100.0)
      reseller = Reseller.create!(
        company_name: "Test Reseller #{SecureRandom.hex(4)}",
        username: "reseller_#{SecureRandom.hex(4)}",
        email: "reseller_#{SecureRandom.hex(4)}@test.com",
        password_digest: BCrypt::Password.create('password123'),
        reseller_type: 'api_only'
      )
      wallet = reseller.wallets.find_by(wallet_type: 'main') || Wallet.create!(owner: reseller, wallet_type: 'main')
      if balance.positive?
        txn = Transaction.create!(
          transactable: reseller, # The user/reseller receiving funds
          reference: reseller,    # Self-reference for initial balance grant
          amount: balance,
          transaction_type: 'credit',
          status: 'success',
          currency: 'USD',
          description: 'Initial Balance'
        )
        wallet.credit!(balance, 'Initial Balance', {}, txn)
      end
      reseller
    end

    # Helper to create a user with balance
    def create_user_with_balance(balance = 100.0)
      user = User.create!(
        first_name: 'Test',
        last_name: 'User',
        username: "user_#{SecureRandom.hex(4)}",
        email: "user_#{SecureRandom.hex(4)}@test.com",
        password_digest: BCrypt::Password.create('password123')
      )
      wallet = user.wallets.find_by(wallet_type: 'main') || Wallet.create!(owner: user, wallet_type: 'main')
      if balance.positive?
        txn = Transaction.create!(
          transactable: user,
          reference: user,
          amount: balance,
          transaction_type: 'credit',
          status: 'success',
          currency: 'USD',
          description: 'Initial Balance'
        )
        wallet.credit!(balance, 'Initial Balance', {}, txn)
      end
      user
    end

    # Helper to create a VM product
    def create_vm_product(price = 10.0)
      category = ProductCategory.find_or_create_by!(name: 'VMs')
      product = Product.create!(
        name: 'Test VM',
        description: 'Test VM Product',
        product_type: 'vm',
        provider_type: 'proxmox',
        available_to: 'both',
        product_category: category,
        metadata: { cpu_cores: 2, ram_gb: 4, storage_gb: 50 }
      )
      ProductPricing.create!(
        product: product,
        selling_price: price,
        cost_price: price * 0.7,
        active: true
      )
      product
    end

    # Helper to create a proxy product
    def create_proxy_product(price = 5.0)
      category = ProductCategory.find_or_create_by!(name: 'Proxies')
      product = Product.create!(
        name: 'Test Proxy',
        description: 'Test Proxy Product',
        product_type: 'proxy',
        provider_type: 'xproxy',
        available_to: 'ecommerce',
        product_category: category
      )
      ProductPricing.create!(
        product: product,
        selling_price: price,
        cost_price: price * 0.7,
        active: true
      )
      product
    end
  end
end

module ActionDispatch
  class IntegrationTest
    begin
      include ActiveSupport::TestCase::InstanceMethods
    rescue StandardError
      nil
    end

    def json_response
      JSON.parse(response.body)
    end
  end
end
