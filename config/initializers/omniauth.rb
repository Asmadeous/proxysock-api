# frozen_string_literal: true

Rails.application.config.middleware.use OmniAuth::Builder do
  # User SSO
  provider :google_oauth2, ENV['GOOGLE_CLIENT_ID'], ENV['GOOGLE_CLIENT_SECRET']
  provider :twitter2, ENV['TWITTER_CLIENT_ID'], ENV['TWITTER_CLIENT_SECRET']

  # Employee SSO (Zoho)
  provider :zoho, ENV['ZOHO_CLIENT_ID'], ENV['ZOHO_CLIENT_SECRET'],
           scope: 'AaaServer.profile.READ'

  # Global error handling for OmniAuth
  OmniAuth.config.on_failure = proc do |_env|
    OmniAuth::Strategies::Developer.new(nil).redirect_to_failure
  end
end
