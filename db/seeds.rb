# frozen_string_literal: true

puts "Starting Database Seed Process..."

Dir[Rails.root.join('db', 'seeds', '*.rb')].sort.each do |file|
  puts "Seeding #{File.basename(file)}..."
  require file
end
