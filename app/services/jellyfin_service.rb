# frozen_string_literal: true

require 'net/http'
require 'uri'
require 'json'
require 'open3'

class JellyfinService
  def initialize
    @url = ENV.fetch('JELLYFIN_URL', 'https://media.proxysock.com')
    @api_key = ENV.fetch('JELLYFIN_API_KEY', '')
  end

  def create_user(user)
    return if user.jellyfin_account_created?

    # Sanitize username: Jellyfin rejects names with spaces
    jellyfin_username = user.username.to_s.strip.gsub(/\s+/, '_')
    password = SecureRandom.hex(12)
    user_data = { Name: jellyfin_username, Password: password }.to_json

    # Use curl to bypass potential Net::HTTP flagging by Cloudflare
    cmd = [
      'curl', '-s', '--connect-timeout', '5', '--max-time', '15',
      '-X', 'POST',
      "#{@url}/Users/New?api_key=#{@api_key}",
      '-H', 'Content-Type: application/json',
      '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '-d', user_data
    ]

    Rails.logger.info("[JellyfinService] Attempting to create user '#{user.username}' via curl")
    
    stdout, stderr, status = Open3.capture3(*cmd)

    if status.success? && stdout.include?('"Id":')
      user.update!(
        jellyfin_account_created: true,
        jellyfin_username: jellyfin_username,
        jellyfin_password: password
      )
      Rails.logger.info("[JellyfinService] Successfully created user '#{user.username}'")
      true
    else
      Rails.logger.error("[JellyfinService] Failed to create user via curl. Status: #{status.exitstatus}")
      Rails.logger.error("[JellyfinService] STDOUT: #{stdout}")
      Rails.logger.error("[JellyfinService] STDERR: #{stderr}")
      false
    end
  rescue StandardError => e
    Rails.logger.error("[JellyfinService] Error creating user: #{e.message}")
    false
  end
end
