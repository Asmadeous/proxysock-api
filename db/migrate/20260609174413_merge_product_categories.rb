# frozen_string_literal: true

class MergeProductCategories < ActiveRecord::Migration[8.0]
  def up
    proxy_cat = ProductCategory.find_or_create_by!(name: 'Proxies', slug: 'proxies') do |c|
      c.available_to = 'both'
    end

    esim_cat = ProductCategory.find_or_create_by!(name: 'eSIMs', slug: 'esims') do |c|
      c.available_to = 'both'
    end

    # Proxy types
    proxy_slugs = %w[datacenter isp static-residential residential-vpn premium-isp global-isp mobile residential-rotating proxy]
    old_proxy_cats = ProductCategory.where(slug: proxy_slugs)

    Product.where(product_category_id: old_proxy_cats.select(:id)).update_all(product_category_id: proxy_cat.id)
    Reseller.where(allowed_product_category_id: old_proxy_cats.select(:id)).update_all(allowed_product_category_id: proxy_cat.id)

    old_proxy_cats.where.not(id: proxy_cat.id).destroy_all

    # eSIM types
    esim_slugs = %w[usa_esim esim]
    old_esim_cats = ProductCategory.where(slug: esim_slugs)

    Product.where(product_category_id: old_esim_cats.select(:id)).update_all(product_category_id: esim_cat.id)
    Reseller.where(allowed_product_category_id: old_esim_cats.select(:id)).update_all(allowed_product_category_id: esim_cat.id)

    old_esim_cats.where.not(id: esim_cat.id).destroy_all
  end

  def down
    raise ActiveRecord::IrreversibleMigration, 'Category merges cannot be reliably reversed'
  end
end
