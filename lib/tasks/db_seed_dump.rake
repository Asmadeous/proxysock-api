# frozen_string_literal: true

namespace :db do
  namespace :seed do
    desc 'Dump current DB contents (setup-related) to db/seeds/staging_data.json'
    task dump_staging: :environment do
      models = [Department, Employee, User, Reseller, Affiliate, ProductCategory, Product, ProductPricing]
      data = {}

      models.each do |model|
        begin
          data[model.name] = model.all.map(&:attributes)
          puts "Dumped #{model.count} #{model.name} records."
        rescue NameError
          puts "Skipping #{model} (model not found)."
        end
      end

      File.open(Rails.root.join('db', 'seeds', 'staging_data.json'), 'w') do |f|
        f.write(JSON.pretty_generate(data))
      end

      puts "✅ Staging data dumped to db/seeds/staging_data.json"
    end
  end
end
