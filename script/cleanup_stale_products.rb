# frozen_string_literal: true

# Deletes proxy products that were created without a provider_product_id.
# Run with: rails runner script/cleanup_stale_products.rb

count = Product.where("provider_product_id IS NULL OR provider_product_id = ''")
               .where(product_type: 'proxy')
               .count

puts "Found #{count} stale proxy products."

if count.positive?
  Product.where("provider_product_id IS NULL OR provider_product_id = ''")
         .where(product_type: 'proxy')
         .destroy_all
  puts "Successfully deleted #{count} stale proxy products."
end
