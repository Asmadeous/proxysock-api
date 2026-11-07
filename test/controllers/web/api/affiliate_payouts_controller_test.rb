# frozen_string_literal: true

require 'test_helper'

module Web
  module Api
    class AffiliatePayoutsControllerTest < ActionDispatch::IntegrationTest
      test 'payout history is scoped to the authenticated affiliate' do
        mine = Affiliate.create!(affiliatable: users(:one))
        other = Affiliate.create!(affiliatable: users(:two))
        payout = mine.affiliate_payouts.create!(amount: 12, payment_method: 'manual', status: 'pending',
                                                payment_details: { account_number: 'private-account' })
        other.affiliate_payouts.create!(amount: 99, payment_method: 'wallet', status: 'paid')

        get '/web/api/affiliate_payouts', headers: auth_header(users(:one))

        assert_response :success
        assert_equal 1, json_response['total']
        assert_equal [payout.id], json_response['payouts'].pluck('id')
        assert_equal 'manual', json_response['payouts'].first['payment_method']
        assert_not json_response['payouts'].first.key?('payment_details')
      end

      test 'payout history paginates and reports its total' do
        affiliate = Affiliate.create!(affiliatable: users(:one))
        21.times { affiliate.affiliate_payouts.create!(amount: 1, payment_method: 'wallet', status: 'paid') }
        get '/web/api/affiliate_payouts', params: { page: 2 }, headers: auth_header(users(:one))
        assert_response :success
        assert_equal 21, json_response['total']
        assert_equal 1, json_response['payouts'].length
      end

      test 'unenrolled user has an empty payout history' do
        get '/web/api/affiliate_payouts', headers: auth_header(users(:one))
        assert_response :success
        assert_equal({ 'payouts' => [], 'total' => 0 }, json_response)
      end

      test 'affiliate profile and referrals use authenticated account context' do
        affiliate = Affiliate.create!(affiliatable: users(:one), total_earned: 25)
        get '/web/api/affiliate', headers: auth_header(users(:one))
        assert_response :success
        assert_equal affiliate.referral_code, json_response['referral_code']
        assert_equal 25, json_response['total_earned'].to_d

        get '/web/api/affiliate_referrals', headers: auth_header(users(:one))
        assert_response :success
        assert_equal [], json_response['referrals']

        get '/web/api/affiliate', headers: auth_header(users(:two))
        assert_response :success
        assert_equal false, json_response['enrolled']
      end

      test 'enrollment authenticates the user and returns a usable profile' do
        post '/web/api/affiliate', headers: auth_header(users(:one))
        assert_response :created
        assert_equal users(:one).reload.affiliate.referral_code, json_response['referral_code']
      end

      test 'payout history requires authentication' do
        get '/web/api/affiliate_payouts'
        assert_response :unauthorized
      end
    end
  end
end
