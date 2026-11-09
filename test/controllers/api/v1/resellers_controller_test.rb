# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class ResellersControllerTest < ActionDispatch::IntegrationTest
      SECRET_FIELDS = %w[
        password_digest api_key_hash permanent_api_key password_reset_token
        unlock_token email_confirmation_token current_token_jti
      ].freeze

      setup do
        @reseller = Reseller.create!(
          company_name: 'Own Co', username: 'own_reseller', email: 'own@reseller.test',
          password: 'password123', reseller_type: 'infrastructure',
          country_code: 'US', country: 'United States', city: 'New York', email_verified_at: Time.current
        )
        @other = Reseller.create!(
          company_name: 'Other Co', username: 'other_reseller', email: 'other@reseller.test',
          password: 'password123', reseller_type: 'api_only',
          country_code: 'GB', city: 'London', email_verified_at: Time.current
        )
        @reseller.generate_dedicated_api_key
        @reseller.save!
      end

      test 'listing resellers is not routable' do
        get '/api/v1/resellers', headers: auth_header(@reseller)

        assert_response :not_found
        assert_not_includes response.body, @other.email
      end

      test 'show returns only the allowlisted own profile' do
        get '/api/v1/resellers/me', headers: auth_header(@reseller)

        assert_response :success
        body = json_response
        assert_equal @reseller.id, body['id']
        assert_equal 'own@reseller.test', body['email']
        assert_equal 'United States', body['country']
        assert_equal 'US', body['country_code']
        assert_equal 'New York', body['city']
        assert_equal @reseller.dedicated_api_key, body['dedicated_api_key']
        SECRET_FIELDS.each { |field| assert_not body.key?(field), "#{field} must not be exposed" }
      end

      test "show with another reseller's id still returns the caller's own record" do
        get "/api/v1/resellers/#{@other.id}", headers: auth_header(@reseller)

        assert_response :success
        assert_equal @reseller.id, json_response['id']
        assert_not_includes response.body, @other.email
      end

      test 'update ignores the id, changes only the caller, and omits secrets' do
        patch "/api/v1/resellers/#{@other.id}", params: { reseller: { company_name: 'Renamed Co' } },
                                                headers: auth_header(@reseller)

        assert_response :success
        assert_equal 'Renamed Co', @reseller.reload.company_name
        assert_equal 'Other Co', @other.reload.company_name
        SECRET_FIELDS.each { |field| assert_not json_response.key?(field), "#{field} must not be exposed" }
      end

      test 'update saves the Settings page fields' do
        patch '/api/v1/resellers/me',
              params: { reseller: { username: 'renamed_user', country: 'Kenya', country_code: 'ke', city: 'Nairobi' } },
              headers: auth_header(@reseller)

        assert_response :success
        @reseller.reload
        assert_equal %w[renamed_user Kenya KE Nairobi],
                     [@reseller.username, @reseller.country, @reseller.country_code, @reseller.city]
        assert_equal 'KE', json_response['country_code']
      end

      test 'update cannot change the login email' do
        patch '/api/v1/resellers/me', params: { reseller: { email: 'hijack@evil.test', company_name: 'Still Own Co' } },
                                      headers: auth_header(@reseller)

        assert_response :success
        assert_equal 'own@reseller.test', @reseller.reload.email
      end

      test 'update attaches an avatar and returns its URL' do
        avatar = Rack::Test::UploadedFile.new(StringIO.new("\x89PNG\r\n\x1a\n"), 'image/png', true,
                                              original_filename: 'avatar.png')
        patch '/api/v1/resellers/me', params: { reseller: { avatar: avatar } }, headers: auth_header(@reseller)

        assert_response :success
        assert @reseller.reload.avatar.attached?
        assert_match %r{/rails/active_storage/}, json_response['profile_picture_url']
      end
    end
  end
end
