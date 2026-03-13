# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'

class RedditConversionService
  BASE_URL = 'https://ads-api.reddit.com/api/v1/conversions'

  def initialize(params)
    @params = params
    @ad_account_id = ENV['REDDIT_AD_ACCOUNT_ID']
    @conversion_token = ENV['REDDIT_CONVERSION_TOKEN']
  end

  def track
    unless @ad_account_id && @conversion_token
      Rails.logger.warn "Reddit CAPI: Skipping tracking due to missing credentials"
      return { success: true, message: 'Skipped: Missing credentials' }
    end

    uri = URI("#{BASE_URL}/#{@ad_account_id}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri.path, headers)
    request.body = payload.to_json

    response = http.request(request)

    case response.code.to_i
    when 200, 201, 204
      Rails.logger.info "Reddit CAPI success: #{response.body}"
      { success: true, response: JSON.parse(response.body || '{}') }
    else
      Rails.logger.error "Reddit CAPI failed: #{response.code} - #{response.body}"
      { success: false, error: response.body }
    end
  rescue StandardError => e
    Rails.logger.error "Reddit CAPI Error: #{e.message}"
    { success: false, error: e.message }
  end

  private

  def headers
    {
      'Authorization' => "Bearer #{@conversion_token}",
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  def payload
    {
      events: [
        {
          event_type: @params[:event_type] || 'PageVisit',
          event_time: @params[:event_time] || (Time.now.to_i * 1000), # Reddit expects milliseconds
          event_source_url: @params[:event_source_url],
          user_data: format_user_data,
          custom_data: format_custom_data
        }
      ]
    }
  end

  def format_user_data
    user_data = @params[:user_data] || {}
    {
      rdt_cid: user_data[:click_id],
      external_id: user_data[:external_id],
      aaid: user_data[:aaid], # Android Advertising ID
      idfa: user_data[:idfa], # iOS Identifier for Advertisers
      email: user_data[:email],
      ip_address: user_data[:ip_address],
      user_agent: user_data[:user_agent]
    }.compact
  end

  def format_custom_data
    custom_data = @params[:custom_data] || {}
    {
      value: custom_data[:value],
      currency: custom_data[:currency] || 'USD',
      transaction_id: custom_data[:transaction_id],
      conversion_id: custom_data[:conversion_id] || custom_data[:transaction_id],
      item_count: custom_data[:item_count],
      product_id: custom_data[:product_id],
      product_name: custom_data[:product_name],
      product_category: custom_data[:product_category]
    }.compact
  end
end
