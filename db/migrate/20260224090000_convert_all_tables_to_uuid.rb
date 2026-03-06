# frozen_string_literal: true

class ConvertAllTablesToUuid < ActiveRecord::Migration[8.1]
  def up
    remove_foreign_key :active_storage_variant_records, name: 'fk_rails_993965df05'
    remove_foreign_key :admin_action_logs, name: 'fk_rails_83c2657fc7'
    remove_foreign_key :affiliate_payouts, name: 'fk_rails_fa5e30ad71'
    remove_foreign_key :affiliate_referrals, name: 'fk_rails_ce3871e99e'
    remove_foreign_key :affiliate_referrals, name: 'fk_rails_e04fb8233f'
    remove_foreign_key :ansible_runs, name: 'fk_rails_012ec40560'
    remove_foreign_key :api_tokens, name: 'fk_rails_ab993cc58d'
    remove_foreign_key :carts, name: 'fk_rails_ea59a35211'
    remove_foreign_key :billing_histories, name: 'fk_rails_7c92db159c'
    remove_foreign_key :conversions, name: 'fk_rails_1b40a25c17'
    remove_foreign_key :conversions, name: 'fk_rails_56a50915d2'
    remove_foreign_key :conversions, name: 'fk_rails_64f4adf978'
    remove_foreign_key :conversions, name: 'fk_rails_b6f56087f6'
    remove_foreign_key :conversions, name: 'fk_rails_df1ac5423a'
    remove_foreign_key :checkout_sessions, name: 'fk_rails_452a36f205'
    remove_foreign_key :deposits, name: 'fk_rails_312db20823'
    remove_foreign_key :deposits, name: 'fk_rails_88307c7ed2'
    remove_foreign_key :deposits, name: 'fk_rails_e0c0cfabe9'
    remove_foreign_key :ecommerce_orders, name: 'fk_rails_c69256145c'
    remove_foreign_key :ecommerce_orders, name: 'fk_rails_e8bc831ae3'
    remove_foreign_key :esim_orders, name: 'fk_rails_6be25960b6'
    remove_foreign_key :esims, name: 'fk_rails_253981651c'
    remove_foreign_key :employees, name: 'fk_rails_0025f65a97'
    remove_foreign_key :esim_inventories, name: 'fk_rails_4e04c014bb'
    remove_foreign_key :mobile_proxy_orders, name: 'fk_rails_8200718eed'
    remove_foreign_key :order_items, name: 'fk_rails_a3c772e63a'
    remove_foreign_key :order_items, name: 'fk_rails_debcc2ccfe'
    remove_foreign_key :order_items, name: 'fk_rails_f1a29ddd47'
    remove_foreign_key :guest_chats, name: 'fk_rails_504b3e1503'
    remove_foreign_key :mobile_proxies, name: 'fk_rails_71d3fbc3da'
    remove_foreign_key :mobile_proxies, name: 'fk_rails_f992a4354f'
    remove_foreign_key :product_analytics, name: 'fk_rails_433739dd0b'
    remove_foreign_key :payment_gateway_transactions, name: 'fk_rails_90f6db0d93'
    remove_foreign_key :product_pricings, name: 'fk_rails_89cd9d47d0'
    remove_foreign_key :proxmox_operations, name: 'fk_rails_b467cd4f02'
    remove_foreign_key :reseller_orders, name: 'fk_rails_10f3b18efc'
    remove_foreign_key :reseller_orders, name: 'fk_rails_d266d1ee51'
    remove_foreign_key :products, name: 'fk_rails_efe167855e'
    remove_foreign_key :residential_rotating_proxy_orders, name: 'fk_rails_70c70868d4'
    remove_foreign_key :static_datacenter_proxies, name: 'fk_rails_52ddb43369'
    remove_foreign_key :static_datacenter_proxies, name: 'fk_rails_8e9d6842e5'
    remove_foreign_key :static_datacenter_proxy_orders, name: 'fk_rails_5d06440b46'
    remove_foreign_key :static_isp_proxies, name: 'fk_rails_0dae2fdd6a'
    remove_foreign_key :static_isp_proxies, name: 'fk_rails_b8d61a4f35'
    remove_foreign_key :static_isp_proxy_orders, name: 'fk_rails_104bc41dec'
    remove_foreign_key :residential_rotating_proxies, name: 'fk_rails_e0ed6ba734'
    remove_foreign_key :residential_rotating_proxies, name: 'fk_rails_f92cbc672e'
    remove_foreign_key :support_chats, name: 'fk_rails_540e794527'
    remove_foreign_key :tickets, name: 'fk_rails_99ff85190e'
    remove_foreign_key :tickets, name: 'fk_rails_c6410ba81d'
    remove_foreign_key :ticket_messages, name: 'fk_rails_398b98fd8f'
    remove_foreign_key :support_chat_messages, name: 'fk_rails_77ee8acfc0'
    remove_foreign_key :user_impersonation_logs, name: 'fk_rails_14fa00f743'
    remove_foreign_key :user_impersonation_logs, name: 'fk_rails_7b3e1a3637'
    remove_foreign_key :vm_orders, name: 'fk_rails_f1a54d47a8'
    remove_foreign_key :user_sessions, name: 'fk_rails_9fa262d742'
    remove_foreign_key :vpn_orders, name: 'fk_rails_fbc7d2bfee'
    remove_foreign_key :vpns, name: 'fk_rails_4df145bf1b'
    remove_foreign_key :wallet_transactions, name: 'fk_rails_216df4a821'
    remove_foreign_key :wallet_transactions, name: 'fk_rails_d07bc24ce3'
    remove_foreign_key :wallets, name: 'fk_rails_732f6628c4'
    remove_foreign_key :webhook_endpoints, name: 'fk_rails_20cc4a8a9b'
    remove_foreign_key :vpn_accounts, name: 'fk_rails_0336c7616c'
    remove_foreign_key :active_storage_attachments, name: 'fk_rails_c3b3935057'
    remove_foreign_key :orders, name: 'fk_rails_0a71cef549'
    remove_foreign_key :orders, name: 'fk_rails_931b4f8ca3'
    remove_foreign_key :orders, name: 'fk_rails_dfb33b2de0'
    remove_foreign_key :vms, name: 'fk_rails_898bd8a82d'
    remove_foreign_key :cart_items, name: 'fk_rails_681a180e84'
    remove_foreign_key :cart_items, name: 'fk_rails_6cdb1f0139'
    remove_foreign_key :cart_items, name: 'fk_rails_87f0990da2'
    remove_foreign_key :guest_chat_messages, name: 'fk_rails_ff89260748'
    remove_foreign_key :residential_proxy_accounts, name: 'fk_rails_96f460536e'
    remove_foreign_key :static_residential_proxy_orders, name: 'fk_rails_250d910099'
    remove_foreign_key :static_residential_proxies, name: 'fk_rails_024a5c2543'
    remove_foreign_key :webhook_events, name: 'fk_rails_78c5b7eba3'
    remove_foreign_key :premium_isp_proxies, name: 'fk_rails_1ba2803dd0'
    remove_foreign_key :premium_isp_proxy_orders, name: 'fk_rails_9c1f1767d3'
    remove_foreign_key :usa_esim_orders, name: 'fk_rails_04a3a2b48f'
    remove_foreign_key :usa_esim_credentials, name: 'usa_esim_credentials_order_id_fkey'
    remove_foreign_key :usa_esim_credentials, name: 'usa_esim_credentials_user_id_fkey'
    add_column :active_storage_variant_records, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :admin_action_logs, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :affiliate_payouts, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :affiliate_referrals, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :ansible_runs, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :api_tokens, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :audit_logs, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :carts, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :blog_posts, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :billing_histories, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :conversions, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :daily_analytics_summaries, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :checkout_sessions, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :deposits, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :ecommerce_orders, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :esim_orders, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :esims, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :external_api_requests, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :external_api_webhooks, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :employees, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :esim_inventories, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :mobile_proxy_orders, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :order_items, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :notifications, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :guest_chats, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :mobile_proxies, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :page_analytics, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :product_analytics, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :payment_gateway_transactions, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :product_categories, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :payment_methods, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :product_pricings, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :proxmox_operations, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :provider_inventory_syncs, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :reseller_orders, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :rate_limits, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :products, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :resellers, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :residential_rotating_proxy_orders, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :static_datacenter_proxies, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :static_datacenter_proxy_orders, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :static_isp_proxies, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :static_isp_proxy_orders, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :residential_rotating_proxies, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :support_chats, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :stores, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :tickets, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :ticket_messages, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :support_chat_messages, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :user_impersonation_logs, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :vm_orders, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :transactions, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :user_sessions, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :users, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :vpn_orders, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :vpns, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :wallet_transactions, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :wallets, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :webhook_endpoints, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :vpn_accounts, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :active_storage_blobs, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :active_storage_attachments, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :affiliates, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :orders, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :vms, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :cart_items, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :departments, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :guest_chat_messages, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :residential_proxy_accounts, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :static_residential_proxy_orders, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :static_residential_proxies, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :webhook_events, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :premium_isp_proxies, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :premium_isp_proxy_orders, :uuid_id, :uuid, default: -> { 'gen_random_uuid()' }, null: false
    add_column :active_storage_variant_records, :blob_uuid, :uuid
    add_column :admin_action_logs, :employee_uuid, :uuid
    add_column :admin_action_logs, :target_uuid, :uuid
    add_column :affiliate_payouts, :affiliate_uuid, :uuid
    add_column :affiliate_referrals, :affiliate_uuid, :uuid
    add_column :affiliate_referrals, :order_uuid, :uuid
    add_column :affiliate_referrals, :referred_uuid, :uuid
    add_column :ansible_runs, :vm_uuid, :uuid
    add_column :api_tokens, :reseller_uuid, :uuid
    add_column :audit_logs, :auditable_uuid, :uuid
    add_column :audit_logs, :user_uuid, :uuid
    add_column :carts, :user_uuid, :uuid
    add_column :billing_histories, :billable_uuid, :uuid
    add_column :conversions, :cart_uuid, :uuid
    add_column :conversions, :ecommerce_order_uuid, :uuid
    add_column :conversions, :product_uuid, :uuid
    add_column :conversions, :user_uuid, :uuid
    add_column :conversions, :user_session_uuid, :uuid
    add_column :checkout_sessions, :user_uuid, :uuid
    add_column :deposits, :depositable_uuid, :uuid
    add_column :deposits, :payment_method_uuid, :uuid
    add_column :deposits, :transaction_uuid, :uuid
    add_column :deposits, :user_uuid, :uuid
    add_column :ecommerce_orders, :order_uuid, :uuid
    add_column :ecommerce_orders, :orderable_uuid, :uuid
    add_column :ecommerce_orders, :user_uuid, :uuid
    add_column :esim_orders, :order_uuid, :uuid
    add_column :esims, :esim_order_uuid, :uuid
    add_column :external_api_requests, :related_uuid, :uuid
    add_column :external_api_webhooks, :related_uuid, :uuid
    add_column :employees, :department_uuid, :uuid
    add_column :esim_inventories, :product_uuid, :uuid
    add_column :mobile_proxy_orders, :order_uuid, :uuid
    add_column :order_items, :ecommerce_order_uuid, :uuid
    add_column :order_items, :product_uuid, :uuid
    add_column :order_items, :product_pricing_uuid, :uuid
    add_column :notifications, :recipient_uuid, :uuid
    add_column :guest_chats, :assigned_to_uuid, :uuid
    add_column :mobile_proxies, :mobile_proxy_order_uuid, :uuid
    add_column :mobile_proxies, :order_uuid, :uuid
    add_column :product_analytics, :product_uuid, :uuid
    add_column :payment_gateway_transactions, :transaction_uuid, :uuid
    add_column :payment_methods, :owner_uuid, :uuid
    add_column :product_pricings, :product_uuid, :uuid
    add_column :proxmox_operations, :vm_uuid, :uuid
    add_column :reseller_orders, :order_uuid, :uuid
    add_column :reseller_orders, :orderable_uuid, :uuid
    add_column :reseller_orders, :reseller_uuid, :uuid
    add_column :products, :product_category_uuid, :uuid
    add_column :residential_rotating_proxy_orders, :order_uuid, :uuid
    add_column :static_datacenter_proxies, :order_uuid, :uuid
    add_column :static_datacenter_proxies, :static_datacenter_proxy_order_uuid, :uuid
    add_column :static_datacenter_proxy_orders, :order_uuid, :uuid
    add_column :static_isp_proxies, :order_uuid, :uuid
    add_column :static_isp_proxies, :static_isp_proxy_order_uuid, :uuid
    add_column :static_isp_proxy_orders, :order_uuid, :uuid
    add_column :residential_rotating_proxies, :order_uuid, :uuid
    add_column :residential_rotating_proxies, :residential_rotating_proxy_order_uuid, :uuid
    add_column :support_chats, :assigned_to_uuid, :uuid
    add_column :support_chats, :chatable_uuid, :uuid
    add_column :tickets, :assigned_to_uuid, :uuid
    add_column :tickets, :order_uuid, :uuid
    add_column :tickets, :user_uuid, :uuid
    add_column :ticket_messages, :sender_uuid, :uuid
    add_column :ticket_messages, :ticket_uuid, :uuid
    add_column :support_chat_messages, :sender_uuid, :uuid
    add_column :support_chat_messages, :support_chat_uuid, :uuid
    add_column :user_impersonation_logs, :employee_uuid, :uuid
    add_column :user_impersonation_logs, :user_uuid, :uuid
    add_column :vm_orders, :order_uuid, :uuid
    add_column :transactions, :reference_uuid, :uuid
    add_column :transactions, :transactable_uuid, :uuid
    add_column :user_sessions, :user_uuid, :uuid
    add_column :vpn_orders, :order_uuid, :uuid
    add_column :vpns, :vpn_order_uuid, :uuid
    add_column :wallet_transactions, :transaction_uuid, :uuid
    add_column :wallet_transactions, :wallet_uuid, :uuid
    add_column :wallets, :owner_uuid, :uuid
    add_column :wallets, :user_uuid, :uuid
    add_column :webhook_endpoints, :reseller_uuid, :uuid
    add_column :vpn_accounts, :order_uuid, :uuid
    add_column :active_storage_attachments, :blob_uuid, :uuid
    add_column :active_storage_attachments, :record_uuid, :uuid
    add_column :affiliates, :affiliatable_uuid, :uuid
    add_column :orders, :checkout_session_uuid, :uuid
    add_column :orders, :orderable_uuid, :uuid
    add_column :orders, :product_uuid, :uuid
    add_column :orders, :product_pricing_uuid, :uuid
    add_column :vms, :vm_order_uuid, :uuid
    add_column :cart_items, :cart_uuid, :uuid
    add_column :cart_items, :product_uuid, :uuid
    add_column :cart_items, :product_pricing_uuid, :uuid
    add_column :guest_chat_messages, :guest_chat_uuid, :uuid
    add_column :guest_chat_messages, :sender_uuid, :uuid
    add_column :residential_proxy_accounts, :residential_rotating_proxy_uuid, :uuid
    add_column :static_residential_proxy_orders, :order_uuid, :uuid
    add_column :static_residential_proxies, :static_residential_proxy_order_uuid, :uuid
    add_column :webhook_events, :reseller_uuid, :uuid
    add_column :premium_isp_proxies, :premium_isp_proxy_order_uuid, :uuid
    add_column :premium_isp_proxy_orders, :order_uuid, :uuid
    add_column :usa_esim_orders, :order_uuid, :uuid
    add_column :usa_esim_credentials, :user_uuid, :uuid
    execute <<-SQL
      UPDATE active_storage_variant_records t
      SET blob_uuid = p.uuid_id
      FROM active_storage_blobs p
      WHERE t.blob_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE admin_action_logs t
      SET employee_uuid = p.uuid_id
      FROM employees p
      WHERE t.employee_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE affiliate_payouts t
      SET affiliate_uuid = p.uuid_id
      FROM affiliates p
      WHERE t.affiliate_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE affiliate_referrals t
      SET affiliate_uuid = p.uuid_id
      FROM affiliates p
      WHERE t.affiliate_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE affiliate_referrals t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE ansible_runs t
      SET vm_uuid = p.uuid_id
      FROM vms p
      WHERE t.vm_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE api_tokens t
      SET reseller_uuid = p.uuid_id
      FROM resellers p
      WHERE t.reseller_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE carts t
      SET user_uuid = p.uuid_id
      FROM users p
      WHERE t.user_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE conversions t
      SET cart_uuid = p.uuid_id
      FROM carts p
      WHERE t.cart_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE conversions t
      SET ecommerce_order_uuid = p.uuid_id
      FROM ecommerce_orders p
      WHERE t.ecommerce_order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE conversions t
      SET product_uuid = p.uuid_id
      FROM products p
      WHERE t.product_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE conversions t
      SET user_uuid = p.uuid_id
      FROM users p
      WHERE t.user_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE conversions t
      SET user_session_uuid = p.uuid_id
      FROM user_sessions p
      WHERE t.user_session_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE checkout_sessions t
      SET user_uuid = p.uuid_id
      FROM users p
      WHERE t.user_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE deposits t
      SET payment_method_uuid = p.uuid_id
      FROM payment_methods p
      WHERE t.payment_method_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE deposits t
      SET transaction_uuid = p.uuid_id
      FROM transactions p
      WHERE t.transaction_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE deposits t
      SET user_uuid = p.uuid_id
      FROM users p
      WHERE t.user_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE ecommerce_orders t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE ecommerce_orders t
      SET user_uuid = p.uuid_id
      FROM users p
      WHERE t.user_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE esim_orders t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE esims t
      SET esim_order_uuid = p.uuid_id
      FROM esim_orders p
      WHERE t.esim_order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE employees t
      SET department_uuid = p.uuid_id
      FROM departments p
      WHERE t.department_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE esim_inventories t
      SET product_uuid = p.uuid_id
      FROM products p
      WHERE t.product_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE mobile_proxy_orders t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE order_items t
      SET ecommerce_order_uuid = p.uuid_id
      FROM ecommerce_orders p
      WHERE t.ecommerce_order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE order_items t
      SET product_uuid = p.uuid_id
      FROM products p
      WHERE t.product_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE order_items t
      SET product_pricing_uuid = p.uuid_id
      FROM product_pricings p
      WHERE t.product_pricing_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE guest_chats t
      SET assigned_to_uuid = p.uuid_id
      FROM employees p
      WHERE t.assigned_to_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE mobile_proxies t
      SET mobile_proxy_order_uuid = p.uuid_id
      FROM mobile_proxy_orders p
      WHERE t.mobile_proxy_order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE mobile_proxies t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE product_analytics t
      SET product_uuid = p.uuid_id
      FROM products p
      WHERE t.product_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE payment_gateway_transactions t
      SET transaction_uuid = p.uuid_id
      FROM transactions p
      WHERE t.transaction_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE product_pricings t
      SET product_uuid = p.uuid_id
      FROM products p
      WHERE t.product_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE proxmox_operations t
      SET vm_uuid = p.uuid_id
      FROM vms p
      WHERE t.vm_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE reseller_orders t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE reseller_orders t
      SET reseller_uuid = p.uuid_id
      FROM resellers p
      WHERE t.reseller_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE products t
      SET product_category_uuid = p.uuid_id
      FROM product_categories p
      WHERE t.product_category_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE residential_rotating_proxy_orders t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE static_datacenter_proxies t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE static_datacenter_proxies t
      SET static_datacenter_proxy_order_uuid = p.uuid_id
      FROM static_datacenter_proxy_orders p
      WHERE t.static_datacenter_proxy_order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE static_datacenter_proxy_orders t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE static_isp_proxies t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE static_isp_proxies t
      SET static_isp_proxy_order_uuid = p.uuid_id
      FROM static_isp_proxy_orders p
      WHERE t.static_isp_proxy_order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE static_isp_proxy_orders t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE residential_rotating_proxies t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE residential_rotating_proxies t
      SET residential_rotating_proxy_order_uuid = p.uuid_id
      FROM residential_rotating_proxy_orders p
      WHERE t.residential_rotating_proxy_order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE support_chats t
      SET assigned_to_uuid = p.uuid_id
      FROM employees p
      WHERE t.assigned_to_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE tickets t
      SET assigned_to_uuid = p.uuid_id
      FROM employees p
      WHERE t.assigned_to_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE tickets t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE ticket_messages t
      SET ticket_uuid = p.uuid_id
      FROM tickets p
      WHERE t.ticket_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE support_chat_messages t
      SET support_chat_uuid = p.uuid_id
      FROM support_chats p
      WHERE t.support_chat_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE user_impersonation_logs t
      SET employee_uuid = p.uuid_id
      FROM employees p
      WHERE t.employee_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE user_impersonation_logs t
      SET user_uuid = p.uuid_id
      FROM users p
      WHERE t.user_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE vm_orders t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE user_sessions t
      SET user_uuid = p.uuid_id
      FROM users p
      WHERE t.user_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE vpn_orders t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE vpns t
      SET vpn_order_uuid = p.uuid_id
      FROM vpn_orders p
      WHERE t.vpn_order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE wallet_transactions t
      SET wallet_uuid = p.uuid_id
      FROM wallets p
      WHERE t.wallet_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE wallets t
      SET user_uuid = p.uuid_id
      FROM users p
      WHERE t.user_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE webhook_endpoints t
      SET reseller_uuid = p.uuid_id
      FROM resellers p
      WHERE t.reseller_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE vpn_accounts t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE active_storage_attachments t
      SET blob_uuid = p.uuid_id
      FROM active_storage_blobs p
      WHERE t.blob_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE orders t
      SET checkout_session_uuid = p.uuid_id
      FROM checkout_sessions p
      WHERE t.checkout_session_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE orders t
      SET product_uuid = p.uuid_id
      FROM products p
      WHERE t.product_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE orders t
      SET product_pricing_uuid = p.uuid_id
      FROM product_pricings p
      WHERE t.product_pricing_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE vms t
      SET vm_order_uuid = p.uuid_id
      FROM vm_orders p
      WHERE t.vm_order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE cart_items t
      SET cart_uuid = p.uuid_id
      FROM carts p
      WHERE t.cart_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE cart_items t
      SET product_uuid = p.uuid_id
      FROM products p
      WHERE t.product_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE cart_items t
      SET product_pricing_uuid = p.uuid_id
      FROM product_pricings p
      WHERE t.product_pricing_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE guest_chat_messages t
      SET guest_chat_uuid = p.uuid_id
      FROM guest_chats p
      WHERE t.guest_chat_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE residential_proxy_accounts t
      SET residential_rotating_proxy_uuid = p.uuid_id
      FROM residential_rotating_proxies p
      WHERE t.residential_rotating_proxy_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE static_residential_proxy_orders t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE static_residential_proxies t
      SET static_residential_proxy_order_uuid = p.uuid_id
      FROM static_residential_proxy_orders p
      WHERE t.static_residential_proxy_order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE webhook_events t
      SET reseller_uuid = p.uuid_id
      FROM resellers p
      WHERE t.reseller_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE premium_isp_proxies t
      SET premium_isp_proxy_order_uuid = p.uuid_id
      FROM premium_isp_proxy_orders p
      WHERE t.premium_isp_proxy_order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE premium_isp_proxy_orders t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE usa_esim_orders t
      SET order_uuid = p.uuid_id
      FROM orders p
      WHERE t.order_id::text = p.id::text
    SQL
    execute <<-SQL
      UPDATE usa_esim_credentials t
      SET user_uuid = p.uuid_id
      FROM users p
      WHERE t.user_id::text = p.id::text
    SQL
    # Swapping PK for active_storage_variant_records
    remove_column :active_storage_variant_records, :id
    rename_column :active_storage_variant_records, :uuid_id, :id
    execute 'ALTER TABLE active_storage_variant_records ADD PRIMARY KEY (id)'
    # Swapping PK for admin_action_logs
    remove_column :admin_action_logs, :id
    rename_column :admin_action_logs, :uuid_id, :id
    execute 'ALTER TABLE admin_action_logs ADD PRIMARY KEY (id)'
    # Swapping PK for affiliate_payouts
    remove_column :affiliate_payouts, :id
    rename_column :affiliate_payouts, :uuid_id, :id
    execute 'ALTER TABLE affiliate_payouts ADD PRIMARY KEY (id)'
    # Swapping PK for affiliate_referrals
    remove_column :affiliate_referrals, :id
    rename_column :affiliate_referrals, :uuid_id, :id
    execute 'ALTER TABLE affiliate_referrals ADD PRIMARY KEY (id)'
    # Swapping PK for ansible_runs
    remove_column :ansible_runs, :id
    rename_column :ansible_runs, :uuid_id, :id
    execute 'ALTER TABLE ansible_runs ADD PRIMARY KEY (id)'
    # Swapping PK for api_tokens
    remove_column :api_tokens, :id
    rename_column :api_tokens, :uuid_id, :id
    execute 'ALTER TABLE api_tokens ADD PRIMARY KEY (id)'
    # Swapping PK for audit_logs
    remove_column :audit_logs, :id
    rename_column :audit_logs, :uuid_id, :id
    execute 'ALTER TABLE audit_logs ADD PRIMARY KEY (id)'
    # Swapping PK for carts
    remove_column :carts, :id
    rename_column :carts, :uuid_id, :id
    execute 'ALTER TABLE carts ADD PRIMARY KEY (id)'
    # Swapping PK for blog_posts
    remove_column :blog_posts, :id
    rename_column :blog_posts, :uuid_id, :id
    execute 'ALTER TABLE blog_posts ADD PRIMARY KEY (id)'
    # Swapping PK for billing_histories
    remove_column :billing_histories, :id
    rename_column :billing_histories, :uuid_id, :id
    execute 'ALTER TABLE billing_histories ADD PRIMARY KEY (id)'
    # Swapping PK for conversions
    remove_column :conversions, :id
    rename_column :conversions, :uuid_id, :id
    execute 'ALTER TABLE conversions ADD PRIMARY KEY (id)'
    # Swapping PK for daily_analytics_summaries
    remove_column :daily_analytics_summaries, :id
    rename_column :daily_analytics_summaries, :uuid_id, :id
    execute 'ALTER TABLE daily_analytics_summaries ADD PRIMARY KEY (id)'
    # Swapping PK for checkout_sessions
    remove_column :checkout_sessions, :id
    rename_column :checkout_sessions, :uuid_id, :id
    execute 'ALTER TABLE checkout_sessions ADD PRIMARY KEY (id)'
    # Swapping PK for deposits
    remove_column :deposits, :id
    rename_column :deposits, :uuid_id, :id
    execute 'ALTER TABLE deposits ADD PRIMARY KEY (id)'
    # Swapping PK for ecommerce_orders
    remove_column :ecommerce_orders, :id
    rename_column :ecommerce_orders, :uuid_id, :id
    execute 'ALTER TABLE ecommerce_orders ADD PRIMARY KEY (id)'
    # Swapping PK for esim_orders
    remove_column :esim_orders, :id
    rename_column :esim_orders, :uuid_id, :id
    execute 'ALTER TABLE esim_orders ADD PRIMARY KEY (id)'
    # Swapping PK for esims
    remove_column :esims, :id
    rename_column :esims, :uuid_id, :id
    execute 'ALTER TABLE esims ADD PRIMARY KEY (id)'
    # Swapping PK for external_api_requests
    remove_column :external_api_requests, :id
    rename_column :external_api_requests, :uuid_id, :id
    execute 'ALTER TABLE external_api_requests ADD PRIMARY KEY (id)'
    # Swapping PK for external_api_webhooks
    remove_column :external_api_webhooks, :id
    rename_column :external_api_webhooks, :uuid_id, :id
    execute 'ALTER TABLE external_api_webhooks ADD PRIMARY KEY (id)'
    # Swapping PK for employees
    remove_column :employees, :id
    rename_column :employees, :uuid_id, :id
    execute 'ALTER TABLE employees ADD PRIMARY KEY (id)'
    # Swapping PK for esim_inventories
    remove_column :esim_inventories, :id
    rename_column :esim_inventories, :uuid_id, :id
    execute 'ALTER TABLE esim_inventories ADD PRIMARY KEY (id)'
    # Swapping PK for mobile_proxy_orders
    remove_column :mobile_proxy_orders, :id
    rename_column :mobile_proxy_orders, :uuid_id, :id
    execute 'ALTER TABLE mobile_proxy_orders ADD PRIMARY KEY (id)'
    # Swapping PK for order_items
    remove_column :order_items, :id
    rename_column :order_items, :uuid_id, :id
    execute 'ALTER TABLE order_items ADD PRIMARY KEY (id)'
    # Swapping PK for notifications
    remove_column :notifications, :id
    rename_column :notifications, :uuid_id, :id
    execute 'ALTER TABLE notifications ADD PRIMARY KEY (id)'
    # Swapping PK for guest_chats
    remove_column :guest_chats, :id
    rename_column :guest_chats, :uuid_id, :id
    execute 'ALTER TABLE guest_chats ADD PRIMARY KEY (id)'
    # Swapping PK for mobile_proxies
    remove_column :mobile_proxies, :id
    rename_column :mobile_proxies, :uuid_id, :id
    execute 'ALTER TABLE mobile_proxies ADD PRIMARY KEY (id)'
    # Swapping PK for page_analytics
    remove_column :page_analytics, :id
    rename_column :page_analytics, :uuid_id, :id
    execute 'ALTER TABLE page_analytics ADD PRIMARY KEY (id)'
    # Swapping PK for product_analytics
    remove_column :product_analytics, :id
    rename_column :product_analytics, :uuid_id, :id
    execute 'ALTER TABLE product_analytics ADD PRIMARY KEY (id)'
    # Swapping PK for payment_gateway_transactions
    remove_column :payment_gateway_transactions, :id
    rename_column :payment_gateway_transactions, :uuid_id, :id
    execute 'ALTER TABLE payment_gateway_transactions ADD PRIMARY KEY (id)'
    # Swapping PK for product_categories
    remove_column :product_categories, :id
    rename_column :product_categories, :uuid_id, :id
    execute 'ALTER TABLE product_categories ADD PRIMARY KEY (id)'
    # Swapping PK for payment_methods
    remove_column :payment_methods, :id
    rename_column :payment_methods, :uuid_id, :id
    execute 'ALTER TABLE payment_methods ADD PRIMARY KEY (id)'
    # Swapping PK for product_pricings
    remove_column :product_pricings, :id
    rename_column :product_pricings, :uuid_id, :id
    execute 'ALTER TABLE product_pricings ADD PRIMARY KEY (id)'
    # Swapping PK for proxmox_operations
    remove_column :proxmox_operations, :id
    rename_column :proxmox_operations, :uuid_id, :id
    execute 'ALTER TABLE proxmox_operations ADD PRIMARY KEY (id)'
    # Swapping PK for provider_inventory_syncs
    remove_column :provider_inventory_syncs, :id
    rename_column :provider_inventory_syncs, :uuid_id, :id
    execute 'ALTER TABLE provider_inventory_syncs ADD PRIMARY KEY (id)'
    # Swapping PK for reseller_orders
    remove_column :reseller_orders, :id
    rename_column :reseller_orders, :uuid_id, :id
    execute 'ALTER TABLE reseller_orders ADD PRIMARY KEY (id)'
    # Swapping PK for rate_limits
    remove_column :rate_limits, :id
    rename_column :rate_limits, :uuid_id, :id
    execute 'ALTER TABLE rate_limits ADD PRIMARY KEY (id)'
    # Swapping PK for products
    remove_column :products, :id
    rename_column :products, :uuid_id, :id
    execute 'ALTER TABLE products ADD PRIMARY KEY (id)'
    # Swapping PK for resellers
    remove_column :resellers, :id
    rename_column :resellers, :uuid_id, :id
    execute 'ALTER TABLE resellers ADD PRIMARY KEY (id)'
    # Swapping PK for residential_rotating_proxy_orders
    remove_column :residential_rotating_proxy_orders, :id
    rename_column :residential_rotating_proxy_orders, :uuid_id, :id
    execute 'ALTER TABLE residential_rotating_proxy_orders ADD PRIMARY KEY (id)'
    # Swapping PK for static_datacenter_proxies
    remove_column :static_datacenter_proxies, :id
    rename_column :static_datacenter_proxies, :uuid_id, :id
    execute 'ALTER TABLE static_datacenter_proxies ADD PRIMARY KEY (id)'
    # Swapping PK for static_datacenter_proxy_orders
    remove_column :static_datacenter_proxy_orders, :id
    rename_column :static_datacenter_proxy_orders, :uuid_id, :id
    execute 'ALTER TABLE static_datacenter_proxy_orders ADD PRIMARY KEY (id)'
    # Swapping PK for static_isp_proxies
    remove_column :static_isp_proxies, :id
    rename_column :static_isp_proxies, :uuid_id, :id
    execute 'ALTER TABLE static_isp_proxies ADD PRIMARY KEY (id)'
    # Swapping PK for static_isp_proxy_orders
    remove_column :static_isp_proxy_orders, :id
    rename_column :static_isp_proxy_orders, :uuid_id, :id
    execute 'ALTER TABLE static_isp_proxy_orders ADD PRIMARY KEY (id)'
    # Swapping PK for residential_rotating_proxies
    remove_column :residential_rotating_proxies, :id
    rename_column :residential_rotating_proxies, :uuid_id, :id
    execute 'ALTER TABLE residential_rotating_proxies ADD PRIMARY KEY (id)'
    # Swapping PK for support_chats
    remove_column :support_chats, :id
    rename_column :support_chats, :uuid_id, :id
    execute 'ALTER TABLE support_chats ADD PRIMARY KEY (id)'
    # Swapping PK for stores
    remove_column :stores, :id
    rename_column :stores, :uuid_id, :id
    execute 'ALTER TABLE stores ADD PRIMARY KEY (id)'
    # Swapping PK for tickets
    remove_column :tickets, :id
    rename_column :tickets, :uuid_id, :id
    execute 'ALTER TABLE tickets ADD PRIMARY KEY (id)'
    # Swapping PK for ticket_messages
    remove_column :ticket_messages, :id
    rename_column :ticket_messages, :uuid_id, :id
    execute 'ALTER TABLE ticket_messages ADD PRIMARY KEY (id)'
    # Swapping PK for support_chat_messages
    remove_column :support_chat_messages, :id
    rename_column :support_chat_messages, :uuid_id, :id
    execute 'ALTER TABLE support_chat_messages ADD PRIMARY KEY (id)'
    # Swapping PK for user_impersonation_logs
    remove_column :user_impersonation_logs, :id
    rename_column :user_impersonation_logs, :uuid_id, :id
    execute 'ALTER TABLE user_impersonation_logs ADD PRIMARY KEY (id)'
    # Swapping PK for vm_orders
    remove_column :vm_orders, :id
    rename_column :vm_orders, :uuid_id, :id
    execute 'ALTER TABLE vm_orders ADD PRIMARY KEY (id)'
    # Swapping PK for transactions
    remove_column :transactions, :id
    rename_column :transactions, :uuid_id, :id
    execute 'ALTER TABLE transactions ADD PRIMARY KEY (id)'
    # Swapping PK for user_sessions
    remove_column :user_sessions, :id
    rename_column :user_sessions, :uuid_id, :id
    execute 'ALTER TABLE user_sessions ADD PRIMARY KEY (id)'
    # Swapping PK for users
    remove_column :users, :id
    rename_column :users, :uuid_id, :id
    execute 'ALTER TABLE users ADD PRIMARY KEY (id)'
    # Swapping PK for vpn_orders
    remove_column :vpn_orders, :id
    rename_column :vpn_orders, :uuid_id, :id
    execute 'ALTER TABLE vpn_orders ADD PRIMARY KEY (id)'
    # Swapping PK for vpns
    remove_column :vpns, :id
    rename_column :vpns, :uuid_id, :id
    execute 'ALTER TABLE vpns ADD PRIMARY KEY (id)'
    # Swapping PK for wallet_transactions
    remove_column :wallet_transactions, :id
    rename_column :wallet_transactions, :uuid_id, :id
    execute 'ALTER TABLE wallet_transactions ADD PRIMARY KEY (id)'
    # Swapping PK for wallets
    remove_column :wallets, :id
    rename_column :wallets, :uuid_id, :id
    execute 'ALTER TABLE wallets ADD PRIMARY KEY (id)'
    # Swapping PK for webhook_endpoints
    remove_column :webhook_endpoints, :id
    rename_column :webhook_endpoints, :uuid_id, :id
    execute 'ALTER TABLE webhook_endpoints ADD PRIMARY KEY (id)'
    # Swapping PK for vpn_accounts
    remove_column :vpn_accounts, :id
    rename_column :vpn_accounts, :uuid_id, :id
    execute 'ALTER TABLE vpn_accounts ADD PRIMARY KEY (id)'
    # Swapping PK for active_storage_blobs
    remove_column :active_storage_blobs, :id
    rename_column :active_storage_blobs, :uuid_id, :id
    execute 'ALTER TABLE active_storage_blobs ADD PRIMARY KEY (id)'
    # Swapping PK for active_storage_attachments
    remove_column :active_storage_attachments, :id
    rename_column :active_storage_attachments, :uuid_id, :id
    execute 'ALTER TABLE active_storage_attachments ADD PRIMARY KEY (id)'
    # Swapping PK for affiliates
    remove_column :affiliates, :id
    rename_column :affiliates, :uuid_id, :id
    execute 'ALTER TABLE affiliates ADD PRIMARY KEY (id)'
    # Swapping PK for orders
    remove_column :orders, :id
    rename_column :orders, :uuid_id, :id
    execute 'ALTER TABLE orders ADD PRIMARY KEY (id)'
    # Swapping PK for vms
    remove_column :vms, :id
    rename_column :vms, :uuid_id, :id
    execute 'ALTER TABLE vms ADD PRIMARY KEY (id)'
    # Swapping PK for cart_items
    remove_column :cart_items, :id
    rename_column :cart_items, :uuid_id, :id
    execute 'ALTER TABLE cart_items ADD PRIMARY KEY (id)'
    # Swapping PK for departments
    remove_column :departments, :id
    rename_column :departments, :uuid_id, :id
    execute 'ALTER TABLE departments ADD PRIMARY KEY (id)'
    # Swapping PK for guest_chat_messages
    remove_column :guest_chat_messages, :id
    rename_column :guest_chat_messages, :uuid_id, :id
    execute 'ALTER TABLE guest_chat_messages ADD PRIMARY KEY (id)'
    # Swapping PK for residential_proxy_accounts
    remove_column :residential_proxy_accounts, :id
    rename_column :residential_proxy_accounts, :uuid_id, :id
    execute 'ALTER TABLE residential_proxy_accounts ADD PRIMARY KEY (id)'
    # Swapping PK for static_residential_proxy_orders
    remove_column :static_residential_proxy_orders, :id
    rename_column :static_residential_proxy_orders, :uuid_id, :id
    execute 'ALTER TABLE static_residential_proxy_orders ADD PRIMARY KEY (id)'
    # Swapping PK for static_residential_proxies
    remove_column :static_residential_proxies, :id
    rename_column :static_residential_proxies, :uuid_id, :id
    execute 'ALTER TABLE static_residential_proxies ADD PRIMARY KEY (id)'
    # Swapping PK for webhook_events
    remove_column :webhook_events, :id
    rename_column :webhook_events, :uuid_id, :id
    execute 'ALTER TABLE webhook_events ADD PRIMARY KEY (id)'
    # Swapping PK for premium_isp_proxies
    remove_column :premium_isp_proxies, :id
    rename_column :premium_isp_proxies, :uuid_id, :id
    execute 'ALTER TABLE premium_isp_proxies ADD PRIMARY KEY (id)'
    # Swapping PK for premium_isp_proxy_orders
    remove_column :premium_isp_proxy_orders, :id
    rename_column :premium_isp_proxy_orders, :uuid_id, :id
    execute 'ALTER TABLE premium_isp_proxy_orders ADD PRIMARY KEY (id)'
    remove_column :active_storage_variant_records, :blob_id
    rename_column :active_storage_variant_records, :blob_uuid, :blob_id
    remove_column :admin_action_logs, :employee_id
    rename_column :admin_action_logs, :employee_uuid, :employee_id
    remove_column :admin_action_logs, :target_id
    rename_column :admin_action_logs, :target_uuid, :target_id
    remove_column :affiliate_payouts, :affiliate_id
    rename_column :affiliate_payouts, :affiliate_uuid, :affiliate_id
    remove_column :affiliate_referrals, :affiliate_id
    rename_column :affiliate_referrals, :affiliate_uuid, :affiliate_id
    remove_column :affiliate_referrals, :order_id
    rename_column :affiliate_referrals, :order_uuid, :order_id
    remove_column :affiliate_referrals, :referred_id
    rename_column :affiliate_referrals, :referred_uuid, :referred_id
    remove_column :ansible_runs, :vm_id
    rename_column :ansible_runs, :vm_uuid, :vm_id
    remove_column :api_tokens, :reseller_id
    rename_column :api_tokens, :reseller_uuid, :reseller_id
    remove_column :audit_logs, :auditable_id
    rename_column :audit_logs, :auditable_uuid, :auditable_id
    remove_column :audit_logs, :user_id
    rename_column :audit_logs, :user_uuid, :user_id
    remove_column :carts, :user_id
    rename_column :carts, :user_uuid, :user_id
    remove_column :billing_histories, :billable_id
    rename_column :billing_histories, :billable_uuid, :billable_id
    remove_column :conversions, :cart_id
    rename_column :conversions, :cart_uuid, :cart_id
    remove_column :conversions, :ecommerce_order_id
    rename_column :conversions, :ecommerce_order_uuid, :ecommerce_order_id
    remove_column :conversions, :product_id
    rename_column :conversions, :product_uuid, :product_id
    remove_column :conversions, :user_id
    rename_column :conversions, :user_uuid, :user_id
    remove_column :conversions, :user_session_id
    rename_column :conversions, :user_session_uuid, :user_session_id
    remove_column :checkout_sessions, :user_id
    rename_column :checkout_sessions, :user_uuid, :user_id
    remove_column :deposits, :depositable_id
    rename_column :deposits, :depositable_uuid, :depositable_id
    remove_column :deposits, :payment_method_id
    rename_column :deposits, :payment_method_uuid, :payment_method_id
    remove_column :deposits, :transaction_id
    rename_column :deposits, :transaction_uuid, :transaction_id
    remove_column :deposits, :user_id
    rename_column :deposits, :user_uuid, :user_id
    remove_column :ecommerce_orders, :order_id
    rename_column :ecommerce_orders, :order_uuid, :order_id
    remove_column :ecommerce_orders, :orderable_id
    rename_column :ecommerce_orders, :orderable_uuid, :orderable_id
    remove_column :ecommerce_orders, :user_id
    rename_column :ecommerce_orders, :user_uuid, :user_id
    remove_column :esim_orders, :order_id
    rename_column :esim_orders, :order_uuid, :order_id
    remove_column :esims, :esim_order_id
    rename_column :esims, :esim_order_uuid, :esim_order_id
    remove_column :external_api_requests, :related_id
    rename_column :external_api_requests, :related_uuid, :related_id
    remove_column :external_api_webhooks, :related_id
    rename_column :external_api_webhooks, :related_uuid, :related_id
    remove_column :employees, :department_id
    rename_column :employees, :department_uuid, :department_id
    remove_column :esim_inventories, :product_id
    rename_column :esim_inventories, :product_uuid, :product_id
    remove_column :mobile_proxy_orders, :order_id
    rename_column :mobile_proxy_orders, :order_uuid, :order_id
    remove_column :order_items, :ecommerce_order_id
    rename_column :order_items, :ecommerce_order_uuid, :ecommerce_order_id
    remove_column :order_items, :product_id
    rename_column :order_items, :product_uuid, :product_id
    remove_column :order_items, :product_pricing_id
    rename_column :order_items, :product_pricing_uuid, :product_pricing_id
    remove_column :notifications, :recipient_id
    rename_column :notifications, :recipient_uuid, :recipient_id
    remove_column :guest_chats, :assigned_to_id
    rename_column :guest_chats, :assigned_to_uuid, :assigned_to_id
    remove_column :mobile_proxies, :mobile_proxy_order_id
    rename_column :mobile_proxies, :mobile_proxy_order_uuid, :mobile_proxy_order_id
    remove_column :mobile_proxies, :order_id
    rename_column :mobile_proxies, :order_uuid, :order_id
    remove_column :product_analytics, :product_id
    rename_column :product_analytics, :product_uuid, :product_id
    remove_column :payment_gateway_transactions, :transaction_id
    rename_column :payment_gateway_transactions, :transaction_uuid, :transaction_id
    remove_column :payment_methods, :owner_id
    rename_column :payment_methods, :owner_uuid, :owner_id
    remove_column :product_pricings, :product_id
    rename_column :product_pricings, :product_uuid, :product_id
    remove_column :proxmox_operations, :vm_id
    rename_column :proxmox_operations, :vm_uuid, :vm_id
    remove_column :reseller_orders, :order_id
    rename_column :reseller_orders, :order_uuid, :order_id
    remove_column :reseller_orders, :orderable_id
    rename_column :reseller_orders, :orderable_uuid, :orderable_id
    remove_column :reseller_orders, :reseller_id
    rename_column :reseller_orders, :reseller_uuid, :reseller_id
    remove_column :products, :product_category_id
    rename_column :products, :product_category_uuid, :product_category_id
    remove_column :residential_rotating_proxy_orders, :order_id
    rename_column :residential_rotating_proxy_orders, :order_uuid, :order_id
    remove_column :static_datacenter_proxies, :order_id
    rename_column :static_datacenter_proxies, :order_uuid, :order_id
    remove_column :static_datacenter_proxies, :static_datacenter_proxy_order_id
    rename_column :static_datacenter_proxies, :static_datacenter_proxy_order_uuid, :static_datacenter_proxy_order_id
    remove_column :static_datacenter_proxy_orders, :order_id
    rename_column :static_datacenter_proxy_orders, :order_uuid, :order_id
    remove_column :static_isp_proxies, :order_id
    rename_column :static_isp_proxies, :order_uuid, :order_id
    remove_column :static_isp_proxies, :static_isp_proxy_order_id
    rename_column :static_isp_proxies, :static_isp_proxy_order_uuid, :static_isp_proxy_order_id
    remove_column :static_isp_proxy_orders, :order_id
    rename_column :static_isp_proxy_orders, :order_uuid, :order_id
    remove_column :residential_rotating_proxies, :order_id
    rename_column :residential_rotating_proxies, :order_uuid, :order_id
    remove_column :residential_rotating_proxies, :residential_rotating_proxy_order_id
    rename_column :residential_rotating_proxies, :residential_rotating_proxy_order_uuid,
                  :residential_rotating_proxy_order_id
    remove_column :support_chats, :assigned_to_id
    rename_column :support_chats, :assigned_to_uuid, :assigned_to_id
    remove_column :support_chats, :chatable_id
    rename_column :support_chats, :chatable_uuid, :chatable_id
    remove_column :tickets, :assigned_to_id
    rename_column :tickets, :assigned_to_uuid, :assigned_to_id
    remove_column :tickets, :order_id
    rename_column :tickets, :order_uuid, :order_id
    remove_column :tickets, :user_id
    rename_column :tickets, :user_uuid, :user_id
    remove_column :ticket_messages, :sender_id
    rename_column :ticket_messages, :sender_uuid, :sender_id
    remove_column :ticket_messages, :ticket_id
    rename_column :ticket_messages, :ticket_uuid, :ticket_id
    remove_column :support_chat_messages, :sender_id
    rename_column :support_chat_messages, :sender_uuid, :sender_id
    remove_column :support_chat_messages, :support_chat_id
    rename_column :support_chat_messages, :support_chat_uuid, :support_chat_id
    remove_column :user_impersonation_logs, :employee_id
    rename_column :user_impersonation_logs, :employee_uuid, :employee_id
    remove_column :user_impersonation_logs, :user_id
    rename_column :user_impersonation_logs, :user_uuid, :user_id
    remove_column :vm_orders, :order_id
    rename_column :vm_orders, :order_uuid, :order_id
    remove_column :transactions, :reference_id
    rename_column :transactions, :reference_uuid, :reference_id
    remove_column :transactions, :transactable_id
    rename_column :transactions, :transactable_uuid, :transactable_id
    remove_column :user_sessions, :user_id
    rename_column :user_sessions, :user_uuid, :user_id
    remove_column :vpn_orders, :order_id
    rename_column :vpn_orders, :order_uuid, :order_id
    remove_column :vpns, :vpn_order_id
    rename_column :vpns, :vpn_order_uuid, :vpn_order_id
    remove_column :wallet_transactions, :transaction_id
    rename_column :wallet_transactions, :transaction_uuid, :transaction_id
    remove_column :wallet_transactions, :wallet_id
    rename_column :wallet_transactions, :wallet_uuid, :wallet_id
    remove_column :wallets, :owner_id
    rename_column :wallets, :owner_uuid, :owner_id
    remove_column :wallets, :user_id
    rename_column :wallets, :user_uuid, :user_id
    remove_column :webhook_endpoints, :reseller_id
    rename_column :webhook_endpoints, :reseller_uuid, :reseller_id
    remove_column :vpn_accounts, :order_id
    rename_column :vpn_accounts, :order_uuid, :order_id
    remove_column :active_storage_attachments, :blob_id
    rename_column :active_storage_attachments, :blob_uuid, :blob_id
    remove_column :active_storage_attachments, :record_id
    rename_column :active_storage_attachments, :record_uuid, :record_id
    remove_column :affiliates, :affiliatable_id
    rename_column :affiliates, :affiliatable_uuid, :affiliatable_id
    remove_column :orders, :checkout_session_id
    rename_column :orders, :checkout_session_uuid, :checkout_session_id
    remove_column :orders, :orderable_id
    rename_column :orders, :orderable_uuid, :orderable_id
    remove_column :orders, :product_id
    rename_column :orders, :product_uuid, :product_id
    remove_column :orders, :product_pricing_id
    rename_column :orders, :product_pricing_uuid, :product_pricing_id
    remove_column :vms, :vm_order_id
    rename_column :vms, :vm_order_uuid, :vm_order_id
    remove_column :cart_items, :cart_id
    rename_column :cart_items, :cart_uuid, :cart_id
    remove_column :cart_items, :product_id
    rename_column :cart_items, :product_uuid, :product_id
    remove_column :cart_items, :product_pricing_id
    rename_column :cart_items, :product_pricing_uuid, :product_pricing_id
    remove_column :guest_chat_messages, :guest_chat_id
    rename_column :guest_chat_messages, :guest_chat_uuid, :guest_chat_id
    remove_column :guest_chat_messages, :sender_id
    rename_column :guest_chat_messages, :sender_uuid, :sender_id
    remove_column :residential_proxy_accounts, :residential_rotating_proxy_id
    rename_column :residential_proxy_accounts, :residential_rotating_proxy_uuid, :residential_rotating_proxy_id
    remove_column :static_residential_proxy_orders, :order_id
    rename_column :static_residential_proxy_orders, :order_uuid, :order_id
    remove_column :static_residential_proxies, :static_residential_proxy_order_id
    rename_column :static_residential_proxies, :static_residential_proxy_order_uuid, :static_residential_proxy_order_id
    remove_column :webhook_events, :reseller_id
    rename_column :webhook_events, :reseller_uuid, :reseller_id
    remove_column :premium_isp_proxies, :premium_isp_proxy_order_id
    rename_column :premium_isp_proxies, :premium_isp_proxy_order_uuid, :premium_isp_proxy_order_id
    remove_column :premium_isp_proxy_orders, :order_id
    rename_column :premium_isp_proxy_orders, :order_uuid, :order_id
    remove_column :usa_esim_orders, :order_id
    rename_column :usa_esim_orders, :order_uuid, :order_id
    remove_column :usa_esim_credentials, :user_id
    rename_column :usa_esim_credentials, :user_uuid, :user_id
    add_foreign_key :active_storage_variant_records, :active_storage_blobs, column: :blob_id,
                                                                            name: 'fk_rails_993965df05'
    add_foreign_key :admin_action_logs, :employees, column: :employee_id, name: 'fk_rails_83c2657fc7'
    add_foreign_key :affiliate_payouts, :affiliates, column: :affiliate_id, name: 'fk_rails_fa5e30ad71'
    add_foreign_key :affiliate_referrals, :orders, column: :order_id, name: 'fk_rails_ce3871e99e'
    add_foreign_key :affiliate_referrals, :affiliates, column: :affiliate_id, name: 'fk_rails_e04fb8233f'
    add_foreign_key :ansible_runs, :vms, column: :vm_id, name: 'fk_rails_012ec40560'
    add_foreign_key :api_tokens, :resellers, column: :reseller_id, name: 'fk_rails_ab993cc58d'
    add_foreign_key :carts, :users, column: :user_id, name: 'fk_rails_ea59a35211'
    add_foreign_key :billing_histories, :resellers, column: :billable_id, name: 'fk_rails_7c92db159c'
    add_foreign_key :conversions, :carts, column: :cart_id, name: 'fk_rails_1b40a25c17'
    add_foreign_key :conversions, :users, column: :user_id, name: 'fk_rails_56a50915d2'
    add_foreign_key :conversions, :user_sessions, column: :user_session_id, name: 'fk_rails_64f4adf978'
    add_foreign_key :conversions, :products, column: :product_id, name: 'fk_rails_b6f56087f6'
    add_foreign_key :conversions, :ecommerce_orders, column: :ecommerce_order_id, name: 'fk_rails_df1ac5423a'
    add_foreign_key :checkout_sessions, :users, column: :user_id, name: 'fk_rails_452a36f205'
    add_foreign_key :deposits, :transactions, column: :transaction_id, name: 'fk_rails_312db20823'
    add_foreign_key :deposits, :users, column: :user_id, name: 'fk_rails_88307c7ed2'
    add_foreign_key :deposits, :payment_methods, column: :payment_method_id, name: 'fk_rails_e0c0cfabe9'
    add_foreign_key :ecommerce_orders, :orders, column: :order_id, name: 'fk_rails_c69256145c'
    add_foreign_key :ecommerce_orders, :users, column: :user_id, name: 'fk_rails_e8bc831ae3'
    add_foreign_key :esim_orders, :orders, column: :order_id, name: 'fk_rails_6be25960b6'
    add_foreign_key :esims, :esim_orders, column: :esim_order_id, name: 'fk_rails_253981651c'
    add_foreign_key :employees, :departments, column: :department_id, name: 'fk_rails_0025f65a97'
    add_foreign_key :esim_inventories, :products, column: :product_id, name: 'fk_rails_4e04c014bb'
    add_foreign_key :mobile_proxy_orders, :orders, column: :order_id, name: 'fk_rails_8200718eed'
    add_foreign_key :order_items, :ecommerce_orders, column: :ecommerce_order_id, name: 'fk_rails_a3c772e63a'
    add_foreign_key :order_items, :product_pricings, column: :product_pricing_id, name: 'fk_rails_debcc2ccfe'
    add_foreign_key :order_items, :products, column: :product_id, name: 'fk_rails_f1a29ddd47'
    add_foreign_key :guest_chats, :employees, column: :assigned_to_id, name: 'fk_rails_504b3e1503'
    add_foreign_key :mobile_proxies, :mobile_proxy_orders, column: :mobile_proxy_order_id, name: 'fk_rails_71d3fbc3da'
    add_foreign_key :mobile_proxies, :orders, column: :order_id, name: 'fk_rails_f992a4354f'
    add_foreign_key :product_analytics, :products, column: :product_id, name: 'fk_rails_433739dd0b'
    add_foreign_key :payment_gateway_transactions, :transactions, column: :transaction_id, name: 'fk_rails_90f6db0d93'
    add_foreign_key :product_pricings, :products, column: :product_id, name: 'fk_rails_89cd9d47d0'
    add_foreign_key :proxmox_operations, :vms, column: :vm_id, name: 'fk_rails_b467cd4f02'
    add_foreign_key :reseller_orders, :orders, column: :order_id, name: 'fk_rails_10f3b18efc'
    add_foreign_key :reseller_orders, :resellers, column: :reseller_id, name: 'fk_rails_d266d1ee51'
    add_foreign_key :products, :product_categories, column: :product_category_id, name: 'fk_rails_efe167855e'
    add_foreign_key :residential_rotating_proxy_orders, :orders, column: :order_id, name: 'fk_rails_70c70868d4'
    add_foreign_key :static_datacenter_proxies, :orders, column: :order_id, name: 'fk_rails_52ddb43369'
    add_foreign_key :static_datacenter_proxies, :static_datacenter_proxy_orders,
                    column: :static_datacenter_proxy_order_id, name: 'fk_rails_8e9d6842e5'
    add_foreign_key :static_datacenter_proxy_orders, :orders, column: :order_id, name: 'fk_rails_5d06440b46'
    add_foreign_key :static_isp_proxies, :static_isp_proxy_orders, column: :static_isp_proxy_order_id,
                                                                   name: 'fk_rails_0dae2fdd6a'
    add_foreign_key :static_isp_proxies, :orders, column: :order_id, name: 'fk_rails_b8d61a4f35'
    add_foreign_key :static_isp_proxy_orders, :orders, column: :order_id, name: 'fk_rails_104bc41dec'
    add_foreign_key :residential_rotating_proxies, :orders, column: :order_id, name: 'fk_rails_e0ed6ba734'
    add_foreign_key :residential_rotating_proxies, :residential_rotating_proxy_orders,
                    column: :residential_rotating_proxy_order_id, name: 'fk_rails_f92cbc672e'
    add_foreign_key :support_chats, :employees, column: :assigned_to_id, name: 'fk_rails_540e794527'
    add_foreign_key :tickets, :employees, column: :assigned_to_id, name: 'fk_rails_99ff85190e'
    add_foreign_key :tickets, :orders, column: :order_id, name: 'fk_rails_c6410ba81d'
    add_foreign_key :ticket_messages, :tickets, column: :ticket_id, name: 'fk_rails_398b98fd8f'
    add_foreign_key :support_chat_messages, :support_chats, column: :support_chat_id, name: 'fk_rails_77ee8acfc0'
    add_foreign_key :user_impersonation_logs, :employees, column: :employee_id, name: 'fk_rails_14fa00f743'
    add_foreign_key :user_impersonation_logs, :users, column: :user_id, name: 'fk_rails_7b3e1a3637'
    add_foreign_key :vm_orders, :orders, column: :order_id, name: 'fk_rails_f1a54d47a8'
    add_foreign_key :user_sessions, :users, column: :user_id, name: 'fk_rails_9fa262d742'
    add_foreign_key :vpn_orders, :orders, column: :order_id, name: 'fk_rails_fbc7d2bfee'
    add_foreign_key :vpns, :vpn_orders, column: :vpn_order_id, name: 'fk_rails_4df145bf1b'
    add_foreign_key :wallet_transactions, :transactions, column: :transaction_id, name: 'fk_rails_216df4a821'
    add_foreign_key :wallet_transactions, :wallets, column: :wallet_id, name: 'fk_rails_d07bc24ce3'
    add_foreign_key :wallets, :users, column: :user_id, name: 'fk_rails_732f6628c4'
    add_foreign_key :webhook_endpoints, :resellers, column: :reseller_id, name: 'fk_rails_20cc4a8a9b'
    add_foreign_key :vpn_accounts, :orders, column: :order_id, name: 'fk_rails_0336c7616c'
    add_foreign_key :active_storage_attachments, :active_storage_blobs, column: :blob_id, name: 'fk_rails_c3b3935057'
    add_foreign_key :orders, :checkout_sessions, column: :checkout_session_id, name: 'fk_rails_0a71cef549'
    add_foreign_key :orders, :product_pricings, column: :product_pricing_id, name: 'fk_rails_931b4f8ca3'
    add_foreign_key :orders, :products, column: :product_id, name: 'fk_rails_dfb33b2de0'
    add_foreign_key :vms, :vm_orders, column: :vm_order_id, name: 'fk_rails_898bd8a82d'
    add_foreign_key :cart_items, :products, column: :product_id, name: 'fk_rails_681a180e84'
    add_foreign_key :cart_items, :carts, column: :cart_id, name: 'fk_rails_6cdb1f0139'
    add_foreign_key :cart_items, :product_pricings, column: :product_pricing_id, name: 'fk_rails_87f0990da2'
    add_foreign_key :guest_chat_messages, :guest_chats, column: :guest_chat_id, name: 'fk_rails_ff89260748'
    add_foreign_key :residential_proxy_accounts, :residential_rotating_proxies, column: :residential_rotating_proxy_id,
                                                                                name: 'fk_rails_96f460536e'
    add_foreign_key :static_residential_proxy_orders, :orders, column: :order_id, name: 'fk_rails_250d910099'
    add_foreign_key :static_residential_proxies, :static_residential_proxy_orders,
                    column: :static_residential_proxy_order_id, name: 'fk_rails_024a5c2543'
    add_foreign_key :webhook_events, :resellers, column: :reseller_id, name: 'fk_rails_78c5b7eba3'
    add_foreign_key :premium_isp_proxies, :premium_isp_proxy_orders, column: :premium_isp_proxy_order_id,
                                                                     name: 'fk_rails_1ba2803dd0'
    add_foreign_key :premium_isp_proxy_orders, :orders, column: :order_id, name: 'fk_rails_9c1f1767d3'
    add_foreign_key :usa_esim_orders, :orders, column: :order_id, name: 'fk_rails_04a3a2b48f'
    add_foreign_key :usa_esim_credentials, :usa_esim_orders, column: :order_id,
                                                             name: 'usa_esim_credentials_order_id_fkey'
    add_foreign_key :usa_esim_credentials, :users, column: :user_id, name: 'usa_esim_credentials_user_id_fkey'
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
