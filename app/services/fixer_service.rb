# frozen_string_literal: true

require 'net/http'
require 'json'

class FixerService
  BASE_URL = 'http://data.fixer.io/api'
  CACHE_KEY = 'fixer_exchange_rate_usd_ngn'
  CACHE_EXPIRY = 24.hours

  def self.get_rate(from_currency = 'USD', to_currency = 'NGN')
    # Try to read from cache first
    cached_rate = Rails.cache.read("#{CACHE_KEY}_#{from_currency}_#{to_currency}")
    return cached_rate if cached_rate.present?

    api_key = ENV['FIXER_API_KEY']
    return ENV.fetch('NGN_USD_RATE', '1500').to_f if api_key.blank?

    begin
      # Fixer.io free plan only supports EUR as base.
      # So we fetch both vs EUR and calculate relative rate if base is not EUR.
      uri = URI("#{BASE_URL}/latest?access_key=#{api_key}&symbols=#{from_currency},#{to_currency}")
      response = Net::HTTP.get(uri)
      data = JSON.parse(response)

      if data['success']
        rates = data['rates']
        # from_currency -> EUR -> to_currency
        # rate = (1 / EUR_from) * EUR_to = EUR_to / EUR_from
        rate = rates[to_currency].to_f / rates[from_currency]

        # Cache for CACHE_EXPIRY
        Rails.cache.write("#{CACHE_KEY}_#{from_currency}_#{to_currency}", rate, expires_in: CACHE_EXPIRY)
        rate
      else
        Rails.logger.error("[FixerService] API Error: #{data['error']['info']}")
        ENV.fetch('NGN_USD_RATE', '1500').to_f
      end
    rescue StandardError => e
      Rails.logger.error("[FixerService] Unified Error: #{e.message}")
      ENV.fetch('NGN_USD_RATE', '1500').to_f
    end
  end
end
