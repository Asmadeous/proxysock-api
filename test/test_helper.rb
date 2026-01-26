ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Helper to create JWT token for testing
    def jwt_token_for(user_or_reseller)
      payload = {
        sub: user_or_reseller.id,
        type: user_or_reseller.class.name.downcase,
        exp: 24.hours.from_now.to_i
      }
      JWT.encode(payload, Rails.application.credentials.secret_key_base)
    end

    # Helper to set auth header
    def auth_header(user_or_reseller)
      { "Authorization" => "Bearer #{jwt_token_for(user_or_reseller)}" }
    end

    # Helper to create a reseller with balance
    def create_reseller_with_balance(balance = 100.0)
      reseller = Reseller.create!(
        company_name: "Test Reseller #{SecureRandom.hex(4)}",
        email: "reseller_#{SecureRandom.hex(4)}@test.com",
        password_digest: BCrypt::Password.create("password123"),
        reseller_type: "api_only"
      )
      wallet = Wallet.create!(owner: reseller, balance: balance)
      reseller
    end

    # Helper to create a user with balance
    def create_user_with_balance(balance = 100.0)
      user = User.create!(
        first_name: "Test",
        last_name: "User",
        email: "user_#{SecureRandom.hex(4)}@test.com",
        password_digest: BCrypt::Password.create("password123")
      )
      wallet = Wallet.create!(owner: user, balance: balance)
      user
    end

    # Helper to create a VM product
    def create_vm_product(price = 10.0)
      category = ProductCategory.find_or_create_by!(name: "VMs")
      product = Product.create!(
        name: "Test VM",
        description: "Test VM Product",
        product_type: "vm",
        provider_type: "proxmox",
        available_to: "both",
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
      category = ProductCategory.find_or_create_by!(name: "Proxies")
      product = Product.create!(
        name: "Test Proxy",
        description: "Test Proxy Product",
        product_type: "proxy",
        provider_type: "xproxy",
        available_to: "ecommerce",
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
    include ActiveSupport::TestCase::InstanceMethods rescue nil
    
    def json_response
      JSON.parse(response.body)
    end
  end
end
