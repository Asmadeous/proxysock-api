# frozen_string_literal: true

require 'net/http'
require 'json'

class FixerService
  # Raised when a live exchange rate cannot be obtained. There is deliberately
  # NO hardcoded fallback rate — charging at a made-up rate is worse than failing.
  class RateUnavailableError < StandardError; end

  BASE_URL = 'http://data.fixer.io/api'
  CACHE_KEY = 'fixer_exchange_rate_usd_ngn'
  CACHE_EXPIRY = 24.hours

  def self.get_rate(from_currency = 'USD', to_currency = 'NGN')
    # Try to read from cache first
    cached_rate = Rails.cache.read("#{CACHE_KEY}_#{from_currency}_#{to_currency}")
    return cached_rate if cached_rate.present?

    api_key = ENV['FIXER_API_KEY']
    raise RateUnavailableError, 'FIXER_API_KEY is not configured' if api_key.blank?

    data =
      begin
        # Fixer.io free plan only supports EUR as base, so we fetch both vs EUR
        # and compute the cross-rate.
        uri = URI("#{BASE_URL}/latest?access_key=#{api_key}&symbols=#{from_currency},#{to_currency}")
        JSON.parse(Net::HTTP.get(uri))
      rescue StandardError => e
        raise RateUnavailableError, "Failed to fetch exchange rate: #{e.message}"
      end

    unless data['success']
      raise RateUnavailableError, "Fixer API error: #{data.dig('error', 'info') || 'unknown'}"
    end

    rates = data['rates']
    # from_currency -> EUR -> to_currency : rate = EUR_to / EUR_from
    rate = rates[to_currency].to_f / rates[from_currency].to_f
    raise RateUnavailableError, 'Fixer returned a non-positive rate' unless rate.positive? && rate.finite?

    Rails.cache.write("#{CACHE_KEY}_#{from_currency}_#{to_currency}", rate, expires_in: CACHE_EXPIRY)
    rate
  end
end
