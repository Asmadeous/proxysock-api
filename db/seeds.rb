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
      
      # Use find_or_initialize_by if possible, or just create
      # We assume 'id' can be used if we enable identity insert (Postgres)
      # But easier is to just create new ones unless they exist.
      # For now, let's keep it simple: create if missing by searching for unique keys.
      case model_name
      when 'User', 'Employee', 'Reseller'
        model.find_or_create_by!(email: attrs['email']) { |m| m.assign_attributes(attrs) }
      when 'ProductCategory', 'Product'
        model.find_or_create_by!(slug: attrs['slug']) { |m| m.assign_attributes(attrs) }
      when 'Department'
        model.find_or_create_by!(name: attrs['name']) { |m| m.assign_attributes(attrs) }
      else
        # Fallback to create (might cause duplicates if run multiple times)
        model.create!(attrs) unless model.exists?(attrs.slice('id'))
      end
    end
  end
  puts "✅ Staging data import completed."
end
