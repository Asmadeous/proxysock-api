# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/vms', type: :request do
  path '/api/v1/vms' do
    get('List VMs') do
      tags 'Virtual Machines'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'resource_inventory_manager', email: 'inventory@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        run_test!
      end
    end

    post('Create VM Instance') do
      tags 'Virtual Machines'
      security [{ Bearer: [] }]
      consumes 'application/json'
      produces 'application/json'

      parameter name: :vm, in: :body, schema: {
        type: :object,
        properties: {
          product_id: { type: :string },
          os_template: { type: :string, example: 'ubuntu-22.04' },
          hostname: { type: :string, example: 'srv-01' }
        },
        required: %w[product_id os_template hostname]
      }

      response(202, 'accepted') do
        let(:reseller) do
          r = Reseller.create!(username: 'compute_provisioning_flow', email: 'provisioning@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York')
          r.main_wallet.credit!(100.0, 'Initial')
          r
        end
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }

        let(:product) { Product.create!(product_category: ProductCategory.first || ProductCategory.create!(name: 'Test', slug: 'test'), name: 'Standard Ubuntu Instance', product_type: 'vm', provider_type: 'proxmox', slug: 'ubuntu-22.04') }
        let!(:pricing) { ProductPricing.create!(product: product, selling_price: 10, currency: 'USD', active: true) }
        let(:vm) { { vm: { product_id: product.id, os_template: 'ubuntu-22.04', hostname: 'srv-01', vm_type: 'kvm', cpu_cores: 2, ram_gb: 4, storage_gb: 60 } } }

        run_test!
      end
    end
  end

  path '/api/v1/vms/{id}/status' do
    parameter name: :id, in: :path, type: :string

    get('Get VM Status') do
      tags 'Virtual Machines'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'instance_health_monitor', email: 'health@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }

        let(:product) { Product.create!(product_category: ProductCategory.first || ProductCategory.create!(name: 'Test', slug: 'test'), name: 'Premium Windows RDP', product_type: 'vm', provider_type: 'proxmox') }
        let(:pricing) { ProductPricing.create!(product: product, selling_price: 10, currency: 'USD', active: true) }
        let(:order) { Order.create!(orderable: reseller, product: product, product_pricing: pricing, status: 'active') }
        let(:vm_order) { VmOrder.create!(order: order, os_type: 'ubuntu-22.04', vm_type: 'kvm', status: 'active') }
        let(:vm_obj) { Vm.create!(vm_order: vm_order, status: 'active') }
        let(:id) { vm_obj.id }

        run_test!
      end
    end
  end

  path '/api/v1/vms/{id}' do
    parameter name: :id, in: :path, type: :string

    get('Show VM Details') do
      tags 'Virtual Machines'
      security [{ Bearer: [] }]
      produces 'application/json'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'resource_auditor', email: 'audit@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:product) { Product.create!(product_category: ProductCategory.first || ProductCategory.create!(name: 'Test', slug: 'test'), name: 'Standard Instance', product_type: 'vm', provider_type: 'proxmox') }
        let(:pricing) { ProductPricing.create!(product: product, selling_price: 10, currency: 'USD', active: true) }
        let(:order) { Order.create!(orderable: reseller, product: product, product_pricing: pricing, status: 'active') }
        let(:vm_order) { VmOrder.create!(order: order, os_type: 'ubuntu-22.04', vm_type: 'kvm', status: 'active') }
        let(:vm_obj) { Vm.create!(vm_order: vm_order, status: 'active') }
        let(:id) { vm_obj.id }
        run_test!
      end
    end

    delete('Terminate VM Instance') do
      tags 'Virtual Machines'
      security [{ Bearer: [] }]
      produces 'application/json'
      description 'Permanently deletes the VM instance and deprovisions resources.'

      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'resource_cleanup_service', email: 'cleanup@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:product) { Product.create!(product_category: ProductCategory.first || ProductCategory.create!(name: 'Test', slug: 'test'), name: 'Standard Instance', product_type: 'vm', provider_type: 'proxmox') }
        let(:pricing) { ProductPricing.create!(product: product, selling_price: 10, currency: 'USD', active: true) }
        let(:order) { Order.create!(orderable: reseller, product: product, product_pricing: pricing, status: 'active') }
        let(:vm_order) { VmOrder.create!(order: order, os_type: 'ubuntu-22.04', vm_type: 'kvm', status: 'active') }
        let(:vm_obj) { Vm.create!(vm_order: vm_order, status: 'active') }
        let(:id) { vm_obj.id }
        run_test!
      end
    end
  end

  path '/api/v1/vms/{id}/start' do
    parameter name: :id, in: :path, type: :string
    post('Start VM') do
      tags 'Virtual Machines'
      security [{ Bearer: [] }]
      produces 'application/json'
      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'instance_operator', email: 'ops@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:product) { Product.create!(product_category: ProductCategory.first || ProductCategory.create!(name: 'Test', slug: 'test'), name: 'Standard Instance', product_type: 'vm', provider_type: 'proxmox') }
        let(:pricing) { ProductPricing.create!(product: product, selling_price: 10, currency: 'USD', active: true) }
        let(:order) { Order.create!(orderable: reseller, product: product, product_pricing: pricing, status: 'active') }
        let(:vm_order) { VmOrder.create!(order: order, os_type: 'ubuntu-22.04', vm_type: 'kvm', status: 'active') }
        let(:vm_obj) { Vm.create!(vm_order: vm_order, status: 'pending') }
        let(:id) { vm_obj.id }
        run_test!
      end
    end
  end

  path '/api/v1/vms/{id}/stop' do
    parameter name: :id, in: :path, type: :string
    post('Stop VM') do
      tags 'Virtual Machines'
      security [{ Bearer: [] }]
      produces 'application/json'
      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'instance_operator', email: 'ops@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:product) { Product.create!(product_category: ProductCategory.first || ProductCategory.create!(name: 'Test', slug: 'test'), name: 'Standard Instance', product_type: 'vm', provider_type: 'proxmox') }
        let(:pricing) { ProductPricing.create!(product: product, selling_price: 10, currency: 'USD', active: true) }
        let(:order) { Order.create!(orderable: reseller, product: product, product_pricing: pricing, status: 'active') }
        let(:vm_order) { VmOrder.create!(order: order, os_type: 'ubuntu-22.04', vm_type: 'kvm', status: 'active') }
        let(:vm_obj) { Vm.create!(vm_order: vm_order, status: 'active') }
        let(:id) { vm_obj.id }
        run_test!
      end
    end
  end

  path '/api/v1/vms/{id}/restart' do
    parameter name: :id, in: :path, type: :string
    post('Restart VM') do
      tags 'Virtual Machines'
      security [{ Bearer: [] }]
      produces 'application/json'
      response(200, 'successful') do
        let(:reseller) { Reseller.create!(username: 'instance_operator', email: 'ops@example.com', password: 'password', company_name: 'Test Company', country_code: 'US', city: 'New York') }
        let(:token) { JWT.encode({ reseller_id: reseller.id }, Rails.application.secret_key_base) }
        let(:Authorization) { "Bearer #{token}" }
        let(:product) { Product.create!(product_category: ProductCategory.first || ProductCategory.create!(name: 'Test', slug: 'test'), name: 'Standard Instance', product_type: 'vm', provider_type: 'proxmox') }
        let(:pricing) { ProductPricing.create!(product: product, selling_price: 10, currency: 'USD', active: true) }
        let(:order) { Order.create!(orderable: reseller, product: product, product_pricing: pricing, status: 'active') }
        let(:vm_order) { VmOrder.create!(order: order, os_type: 'ubuntu-22.04', vm_type: 'kvm', status: 'active') }
        let(:vm_obj) { Vm.create!(vm_order: vm_order, status: 'active') }
        let(:id) { vm_obj.id }
        run_test!
      end
    end
  end
end
