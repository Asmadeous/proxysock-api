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
  ['Department', 'Employee', 'User', 'Reseller', 'Affiliate', 'ProductCategory', 'Product', 'ProductPricing'].each do |model_name|
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

      # Step 3: Create or Update
      begin
        if record
          # Update existing record (found by email/slug but maybe different ID)
          # We skip updating pure IDs to avoid breaking constraints
          record.update!(attrs.except('id'))
        else
          # Create new record
          model.create!(attrs)
        end
      rescue ActiveRecord::RecordInvalid => e
        # If the failure is due to 'Affiliatable must exist', it's a polymorphic mapping issue
        # We'll skip it for now and log it
        if e.message.include?('Affiliatable must exist')
           puts "    ⚠️  Skipped #{model_name} (#{attrs['id']}): Owner record missing."
        elsif e.message.include?('has already been taken')
           puts "    ⚠️  Skipped #{model_name} (#{attrs['id']}): Duplicate unique field."
        else
           raise e
        end
      end
    end
  end
  puts "✅ Staging data import completed."
end
