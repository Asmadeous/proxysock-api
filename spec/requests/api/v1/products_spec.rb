# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/products', type: :request do
  path '/api/v1/products' do
    get('List Products') do
      tags 'Products'
      produces 'application/json'
      security [{ Bearer: [] }]

      response(200, 'successful') do
        schema type: :object,
               properties: {
                 products: {
                   type: :array,
                   items: {
                     type: :object,
                     properties: {
                       id: { type: :string },
                       name: { type: :string },
                       base_price: { type: :number },
                       currency: { type: :string, nullable: true }
                     }
                   }
                 }
               }

        # Legacy Rswag 2.x approach for run_test! hook logic, or manual data creation
        # We need a reseller and token to pass auth
        let(:reseller) do
          Reseller.create!(username: 'doc_user', email: 'doc@test.com', password: 'password', company_name: 'test')
        end
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }

        before do
          category = ProductCategory.create!(name: 'Proxies')
          product = Product.create!(name: 'Test Proxy', product_type: 'proxy', provider_type: 'xproxy',
                                    product_category: category)
          ProductPricing.create!(product: product, selling_price: 10.0, active: true, currency: 'USD')
        end

        run_test!
      end

      response(401, 'unauthorized') do
        let(:Authorization) { 'Bearer invalid_token' }
        run_test!
      end
    end
  end

  path '/api/v1/products/{id}' do
    parameter name: 'id', in: :path, type: :string, description: 'id'

    get('Show Product') do
      tags 'Products'
      produces 'application/json'
      security [{ Bearer: [] }]

      response(200, 'successful') do
        let(:reseller) do
          Reseller.create!(username: 'doc_user_2', email: 'doc2@test.com', password: 'password', company_name: 'test')
        end
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }

        let(:product) do
          category = ProductCategory.create!(name: 'VMs')
          p = Product.create!(name: 'Test VM', product_type: 'vm', provider_type: 'proxmox', product_category: category)
          ProductPricing.create!(product: p, selling_price: 20.0, active: true)
          p
        end
        let(:id) { product.id }

        run_test!
      end

      response(404, 'not found') do
        let(:reseller) do
          Reseller.create!(username: 'doc_user_3', email: 'doc3@test.com', password: 'password', company_name: 'test')
        end
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:id) { 'invalid' }

        run_test!
      end
    end
  end
end
