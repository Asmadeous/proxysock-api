# frozen_string_literal: true

puts '── Seeding IP Addresses ──'

range = ('21'..'254').map { |i| "64.6.175.#{i}" }
existing = IpAddress.pluck(:address)

new_ips = []
range.each do |addr|
  next if existing.include?(addr)

  new_ips << { address: addr, status: 'available', created_at: Time.current, updated_at: Time.current }
end

if new_ips.any?
  IpAddress.insert_all(new_ips)
  puts "  ✓ Added #{new_ips.count} new available IPs"
else
  puts '  ✓ No new IPs to add'
end

puts "── Done: #{IpAddress.count} total IPs in database ──"
