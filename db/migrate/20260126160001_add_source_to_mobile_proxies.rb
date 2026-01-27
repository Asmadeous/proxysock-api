# frozen_string_literal: true

class AddSourceToMobileProxies < ActiveRecord::Migration[8.1]
  def change
    # Use if_not_exists to handle partially run migrations
    unless column_exists?(:mobile_proxies, :proxy_source)
      add_column :mobile_proxies, :proxy_source, :string, default: 'myproxyapi'
    end

    unless column_exists?(:products, :provider_type)
      add_column :products, :provider_type, :string, default: 'myproxyapi'
    end

    # Adding index for faster lookups
    return if index_exists?(:mobile_proxies, :proxy_source)

    add_index :mobile_proxies, :proxy_source
  end
end
