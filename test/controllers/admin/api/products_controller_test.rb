# frozen_string_literal: true

require 'test_helper'

module Admin
  module Api
    # Staff sync the MeiSIM catalogue and switch plans on and off from Admin → Products.
    class ProductsControllerTest < ActionDispatch::IntegrationTest
      setup do
        employee = Employee.create!(email: "staff_#{SecureRandom.hex(4)}@test.com", first_name: 'Sam', last_name: 'Staff',
                                    role: 'admin', active: true, department: departments(:one))
        @headers = { 'Authorization' => "Bearer #{JWT.encode({ employee_id: employee.id }, Rails.application.secret_key_base, 'HS256')}" }
        @product = Product.create!(name: 'Lycamobile · $22.50 international Plan', product_type: 'esim', provider: 'meisim',
                                   provider_product_id: 'ly:1012', available_to: 'both', active: true,
                                   product_category: product_categories(:three))
      end

      test 'sync_meisim runs the catalogue sync and clears the product caches' do
        MeisimCatalogSyncService.any_instance.expects(:sync!).returns(42)
        version = Product.catalog_cache_version

        post '/admin/api/products/sync_meisim', headers: @headers

        assert_response :success
        assert_equal 42, json_response['synced']
        assert_not_equal version, Product.catalog_cache_version
      end

      test 'sync_meisim reports a MeiSIM failure' do
        MeisimCatalogSyncService.any_instance.stubs(:sync!).raises(MeisimService::Error.new('Unauthorized', status: 401))

        post '/admin/api/products/sync_meisim', headers: @headers

        assert_response :unprocessable_entity
        assert_equal 'Unauthorized', json_response['error']
      end

      test 'staff can switch a plan off and back on' do
        patch "/admin/api/products/#{@product.id}", params: { product: { active: false } }, headers: @headers, as: :json

        assert_response :success
        assert_not @product.reload.active
        assert_equal false, json_response.dig('product', 'active')

        patch "/admin/api/products/#{@product.id}", params: { product: { active: true } }, headers: @headers, as: :json
        assert @product.reload.active
      end

      test 'sync_meisim requires staff' do
        post '/admin/api/products/sync_meisim'

        assert_response :unauthorized
      end
    end
  end
end
