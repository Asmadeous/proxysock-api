# frozen_string_literal: true

puts 'Starting Database Seed Process...'

if Rails.env.production?
  puts "⚠️  SEEDING ABORTED: Seeding is strictly disabled in production environment."
  return
end

# Load standard seeds
Dir[Rails.root.join('db', 'seeds', '*.rb')].sort.each do |file|
  next if file.end_with?('seeds.rb') # Avoid self-require if somehow included
  puts "Seeding #{File.basename(file)}..."
  require file
end

# Load staging-specific data if it exists
staging_file = Rails.root.join('db', 'seeds', 'staging_data.json')
if File.exist?(staging_file) && (Rails.env.staging? || Rails.env.development?)
  puts "Loading Staging Data from #{File.basename(staging_file)}..."
  data = JSON.parse(File.read(staging_file))

  # Import in order to preserve dependencies (simplistic approach)
  # We skip Product and ProductPricing from the massive JSON to use inhouse sync instead
  ['Department', 'Employee', 'User', 'Reseller', 'Affiliate', 'ProductCategory'].each do |model_name|
    next unless data[model_name]
    
    model = model_name.constantize
    puts "  Importing #{data[model_name].size} #{model_name} records..."
    
    data[model_name].each do |attrs|
      # Remove timestamps to let Rails handle them
      attrs.delete('created_at')
      attrs.delete('updated_at')
      
      record = nil
      
      # Step 1: Try finding by ID if present
      record = model.find_by(id: attrs['id']) if attrs['id'].present?
      
      # Step 2: Try finding by unique business keys if not found by ID
      if record.nil?
        case model_name
        when 'User', 'Employee', 'Reseller'
          record = model.find_by(email: attrs['email'])
        when 'ProductCategory', 'Product'
          record = model.find_by(slug: attrs['slug'])
        when 'Department'
          record = model.find_by(name: attrs['name'])
        when 'Affiliate'
          record = model.find_by(referral_code: attrs['referral_code'])
        end
      end

      # Step 3: Proactively fix associations that might be broken
      # Specifically for Employee -> Department and Affiliate -> Owner
      if model_name == 'Employee' && attrs['department_id'].present?
        unless Department.exists?(attrs['department_id'])
          # Try to find a department by name if possible, or use the first one
          dept = Department.find_by(name: 'General') || Department.find_by(name: 'Support') || Department.first
          attrs['department_id'] = dept&.id
        end
      elsif model_name == 'Affiliate' && attrs['affiliatable_id'].present?
        unless attrs['affiliatable_type'].constantize.exists?(attrs['affiliatable_id'])
          # Try finding the owner by email if we can find it in the current scope
          owner_email = data[attrs['affiliatable_type']]&.find { |o| o['id'] == attrs['affiliatable_id'] }&.dig('email')
          owner = attrs['affiliatable_type'].constantize.find_by(email: owner_email) if owner_email
          
          if owner
            attrs['affiliatable_id'] = owner.id
          else
            attrs.delete('affiliatable_id')
            attrs.delete('affiliatable_type')
          end
        end
      end

      # Step 4: Create or Update
      begin
        # Ensure passwords for models that need them
        if ['User', 'Employee', 'Reseller'].include?(model_name) && attrs['password_digest'].blank? && attrs['password'].blank?
          attrs['password'] = 'Password123!'
          attrs['password_confirmation'] = 'Password123!'
        end

        if record
          # Update existing record (found by email/slug but maybe different ID)
          # We skip updating pure IDs to avoid breaking constraints
          record.update!(attrs.except('id'))
        else
          # Create new record
          model.create!(attrs)
        end
      rescue ActiveRecord::RecordInvalid => e
        # If the failure is due to missing associations, skip and log
        if e.message =~ /must exist/i
           puts "    ⚠️  Skipped #{model_name} (#{attrs['id'] || attrs['email'] || attrs['name']}): Association missing (#{e.message})"
        elsif e.message =~ /already been taken/i
           puts "    ⚠️  Skipped #{model_name} (#{attrs['id'] || attrs['email'] || attrs['name']}): Duplicate entry"
        else
           raise e
        end
      end
    end
  end
end

# Sync In-house products (VPS, RDP, USA eSIM, Proxy)
if Rails.env.staging? || Rails.env.development?
  puts "Seeding In-house products..."
  InHouseProductSyncService.new.sync
  puts "✅ Product sync completed."
end
