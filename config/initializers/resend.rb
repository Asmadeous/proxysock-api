# frozen_string_literal: true

require 'resend'

Resend.configure do |config|
  config.api_key = ENV.fetch('RESEND_API_KEY', 're_test_key')
end
