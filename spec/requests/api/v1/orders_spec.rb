# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/orders', type: :request do
  path '/api/v1/orders' do
    get('List Orders') do
      tags 'Orders'
      security [{ Bearer: [] }]
      produces 'application/json'

      parameter name: :product_type, in: :query, type: :string, description: 'Filter by product type (e.g., vps, proxy, esim)', required: false

      response(200, 'successful') do
        schema type: :object,
               properties: {
                 orders: {
                   type: :array,
                   items: {
                     type: :object,
                     properties: {
                       id: { type: :string },
                       product_name: { type: :string },
                       product_type: { type: :string },
                       total_amount: { type: :number },
                       status: { type: :string },
                       created_at: { type: :string }
                     }
                   }
                 }
               }

        let(:reseller) { Reseller.create!(username: 'partner_order_tracking', email: 'partner_orders@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        run_test!
      end
    end

    post('Create Order') do
      tags 'Orders'
      security [{ Bearer: [] }]
      consumes 'application/json'
      produces 'application/json'
      description 'API Only resellers: Balance is deducted immediately. Enterprise: Checkout session is created.'

      parameter name: :order, in: :body, schema: {
        type: :object,
        properties: {
          product_id: { type: :string, example: 'uuid-v4' },
          quantity: { type: :integer, example: 1 },
          customer_email: { type: :string, example: 'client@example.com', description: 'Required for Enterprise partners only.' },
          metadata: {
            type: :object,
            description: 'Resource-specific configuration. See product documentation for required fields.',
            example: { country_code: 'US', protocol: 'socks5' }
          }
        },
        required: %w[product_id quantity]
      }

      response(202, 'api only order created') do
        let(:reseller) do
          r = Reseller.create!(username: 'partner_api_fulfillment', email: 'api_fulfillment@example.com', password: 'password', company_name: 'Test Company', reseller_type: 'api_only', country_code: 'US', city: 'New York')
          r.main_wallet.credit!(100.0, 'Initial')
          r
        end
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }

        let(:product) { Product.create!(product_category: ProductCategory.first || ProductCategory.create!(name: 'Test', slug: 'test'), name: 'Standard VPN', product_type: 'vpn', provider_type: 'local') }
        let!(:pricing) { ProductPricing.create!(product: product, selling_price: 10, currency: 'USD', active: true) }
        let(:order) { { product_id: product.id, quantity: 1, metadata: { country_code: 'US' } } }

        run_test!
      end

      response(202, 'enterprise order initiated') do
        let(:reseller) { Reseller.create!(username: 'enterprise_gateway_session', email: 'enterprise_billing@example.com', password: 'password', company_name: 'Test Company', reseller_type: 'infrastructure', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }

        let(:product) { Product.create!(product_category: ProductCategory.first || ProductCategory.create!(name: 'Test', slug: 'test'), name: 'Infrastructure Resource', product_type: 'vpn', provider_type: 'local') }
        let!(:pricing) { ProductPricing.create!(product: product, selling_price: 10, currency: 'USD', active: true) }
        let(:order) { { product_id: product.id, quantity: 1, customer_email: 'client@example.com' } }

        run_test!
      end
    end
  end

  path '/api/v1/orders/{id}/credentials' do
    parameter name: :id, in: :path, type: :string

    get('Get Order Credentials') do
      tags 'Orders'
      security [{ Bearer: [] }]
      produces 'application/json'
      description 'Returns technical credentials (IP, Port, Username, Password, ICCID, etc.) for the provisioned resource.'

      response(202, 'resource not yet provisioned') do
        let(:reseller) { Reseller.create!(username: 'partner_resource_access', email: 'resource_access@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }

        let(:product) { Product.create!(product_category: ProductCategory.first || ProductCategory.create!(name: 'Test', slug: 'test'), name: 'Static ISP Proxy', product_type: 'proxy', provider_type: 'myproxyapi') }
        let!(:pricing) { ProductPricing.create!(product: product, selling_price: 10, currency: 'USD', active: true) }
        let(:order_obj) { Order.create!(orderable: reseller, product: product, status: 'active', total_amount: 1.0, product_pricing: pricing) }
        let(:id) { order_obj.id }

        run_test!
      end
    end
  end

  path '/api/v1/orders/stats' do
    get('Get Order Statistics') do
      tags 'Orders'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'partner_analytics', email: 'analytics@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        run_test!
      end
    end
  end

  path '/api/v1/orders/checkout_cart' do
    post('Enterprise Bulk Checkout') do
      tags 'Orders'
      security [{ Bearer: [] }]
      consumes 'application/json'
      produces 'application/json'
      description 'Enterprise partners use this to finalize a batch of resources. Generates a payment gateway session.'

      parameter name: :checkout_data, in: :body, schema: {
        type: :object,
        properties: {
          gateway: { type: :string, example: 'paystack' },
          currency: { type: :string, example: 'USD' }
        },
        required: ['gateway']
      }

      response(202, 'accepted') do
        let(:reseller) { Reseller.create!(username: 'enterprise_checkout_user', email: 'bulk_billing@example.com', password: 'password', company_name: 'Test Company', reseller_type: 'infrastructure', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:product) { Product.create!(product_category: ProductCategory.first || ProductCategory.create!(name: 'Test', slug: 'test'), name: 'Static ISP Proxy', product_type: 'proxy', provider_type: 'myproxyapi') }
        let!(:pricing) { ProductPricing.create!(product: product, selling_price: 10, currency: 'USD', active: true) }
        let(:checkout_data) { { gateway: 'paystack', customer_email: 'client@example.com', items: [{ product_id: product.id, quantity: 1 }] } }

        run_test!
      end
    end
  end

  path '/api/v1/orders/{id}/renew' do
    parameter name: :id, in: :path, type: :string

    post('Renew Resource Subscription') do
      tags 'Orders'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) do
          r = Reseller.create!(username: 'partner_renewal_service', email: 'renewals@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York')
          r.main_wallet.credit!(100.0, 'Initial')
          r
        end
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:product) { Product.create!(product_category: ProductCategory.first || ProductCategory.create!(name: 'Test', slug: 'test'), name: 'Standard VM Instance', product_type: 'vm', provider_type: 'proxmox') }
        let!(:pricing) { ProductPricing.create!(product: product, selling_price: 10, currency: 'USD', active: true) }
        let(:order_obj) { Order.create!(orderable: reseller, product: product, status: 'active', total_amount: 1.0, product_pricing: pricing) }
        let!(:vm_order) { VmOrder.create!(order: order_obj, os_type: 'ubuntu-22.04', vm_type: 'kvm', status: 'active') }
        let!(:vm) { Vm.create!(vm_order: vm_order, status: 'active') }
        let(:id) { order_obj.id }
        run_test!
      end
    end
  end

  path '/api/v1/orders/{id}/cancel' do
    parameter name: :id, in: :path, type: :string

    post('Cancel and Terminate Order') do
      tags 'Orders'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'partner_termination_service', email: 'cleanup@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:product) { Product.create!(product_category: ProductCategory.first || ProductCategory.create!(name: 'Test', slug: 'test'), name: 'Standard Proxy', product_type: 'proxy', provider_type: 'myproxyapi') }
        let!(:pricing) { ProductPricing.create!(product: product, selling_price: 10, currency: 'USD', active: true) }
        let(:order_obj) { Order.create!(orderable: reseller, product: product, status: 'active', total_amount: 1.0, product_pricing: pricing) }
        let(:id) { order_obj.id }
        run_test!
      end
    end
  end
end
