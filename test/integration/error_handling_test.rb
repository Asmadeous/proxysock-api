# frozen_string_literal: true

require 'test_helper'
require 'mocha/minitest'

class ErrorHandlingTest < ActionDispatch::IntegrationTest
  # include JwtHelper # Not needed, methods in TestCase

  def setup
    @reseller = resellers(:one)
    @token = jwt_token_for(@reseller)
    @headers = { 'Authorization' => "Bearer #{@token}" }
  end

  test 'returns global 404 for missing record' do
    # Request a non-existent product
    get '/api/v1/products/999999', headers: @headers

    assert_response :not_found
    json = JSON.parse(response.body)
    assert_equal 'Not Found', json['error']
  end

  test 'returns global 500 for unhandled exceptions and reports to Sentry' do
    # Verify Sentry reporting
    # Expect capture_exception to be called once with any arguments
    Sentry.expects(:capture_exception).once

    # Stub controller index to raise standard error
    Api::V1::ProductsController.any_instance.stubs(:index).raises(StandardError, 'Boom')

    get '/api/v1/products', headers: @headers

    assert_response :internal_server_error
    json = JSON.parse(response.body)
    assert_equal 'Internal Server Error', json['error']
    assert json.key?('request_id')
    assert_nil json['exception']
  end
end
