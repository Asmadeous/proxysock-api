# frozen_string_literal: true

require_relative '../config/environment'

user_id = '4f5c3d5a-b045-44d0-ae1e-d40103314336'
user = User.find(user_id)

puts "Testing Jellyfin creation for user: #{user.username}"
puts "URL: #{ENV['JELLYFIN_URL']}"
puts "API Key present: #{ENV['JELLYFIN_API_KEY'].present?}"

service = JellyfinService.new
success = service.create_user(user)

if success
  puts "SUCCESS! Jellyfin account created and metadata updated."
  puts "Metadata: #{user.reload.metadata}"
else
  puts "FAILED. Check logs/development.log for details."
end
