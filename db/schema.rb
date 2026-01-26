# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_01_26_234500) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "admin_action_logs", force: :cascade do |t|
    t.string "action_type"
    t.datetime "created_at", null: false
    t.bigint "employee_id", null: false
    t.string "ip_address"
    t.jsonb "object_changes"
    t.bigint "target_id", null: false
    t.string "target_type", null: false
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.index ["employee_id"], name: "index_admin_action_logs_on_employee_id"
    t.index ["target_type", "target_id"], name: "index_admin_action_logs_on_target"
  end

  create_table "ansible_runs", force: :cascade do |t|
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.integer "exit_code"
    t.jsonb "extra_vars"
    t.jsonb "inventory"
    t.string "playbook_name"
    t.jsonb "playbook_tags"
    t.datetime "started_at"
    t.string "status"
    t.text "stderr"
    t.text "stdout"
    t.datetime "updated_at", null: false
    t.bigint "vm_id", null: false
    t.index ["vm_id"], name: "index_ansible_runs_on_vm_id"
  end

  create_table "api_tokens", force: :cascade do |t|
    t.boolean "active"
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.string "hashed_token"
    t.datetime "last_used_at"
    t.bigint "reseller_id", null: false
    t.jsonb "scopes"
    t.string "token_name"
    t.datetime "updated_at", null: false
    t.index ["reseller_id"], name: "index_api_tokens_on_reseller_id"
  end

  create_table "audit_logs", force: :cascade do |t|
    t.string "action"
    t.bigint "auditable_id", null: false
    t.string "auditable_type", null: false
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.jsonb "object_changes"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.string "user_type"
    t.index ["auditable_type", "auditable_id"], name: "index_audit_logs_on_auditable"
  end

  create_table "billing_histories", force: :cascade do |t|
    t.bigint "billable_id", null: false
    t.string "billable_type", default: "Reseller"
    t.date "billing_period_end"
    t.date "billing_period_start"
    t.datetime "created_at", null: false
    t.string "currency"
    t.datetime "generated_at"
    t.decimal "net_revenue"
    t.integer "total_orders"
    t.decimal "total_refunds"
    t.decimal "total_revenue"
    t.datetime "updated_at", null: false
    t.index ["billable_id"], name: "index_billing_histories_on_billable_id"
  end

  create_table "cart_items", force: :cascade do |t|
    t.bigint "cart_id", null: false
    t.datetime "created_at", null: false
    t.jsonb "metadata"
    t.bigint "product_id", null: false
    t.bigint "product_pricing_id", null: false
    t.integer "quantity"
    t.decimal "total_price"
    t.decimal "unit_price"
    t.datetime "updated_at", null: false
    t.index ["cart_id"], name: "index_cart_items_on_cart_id"
    t.index ["product_id"], name: "index_cart_items_on_product_id"
    t.index ["product_pricing_id"], name: "index_cart_items_on_product_pricing_id"
  end

  create_table "carts", force: :cascade do |t|
    t.datetime "abandoned_at"
    t.datetime "converted_at"
    t.datetime "created_at", null: false
    t.datetime "recovery_email_sent_at"
    t.string "session_id"
    t.string "status"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["user_id"], name: "index_carts_on_user_id"
  end

  create_table "conversions", force: :cascade do |t|
    t.bigint "cart_id", null: false
    t.datetime "created_at", null: false
    t.bigint "ecommerce_order_id", null: false
    t.string "funnel_stage"
    t.bigint "product_id", null: false
    t.integer "time_to_convert_seconds"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "user_session_id", null: false
    t.index ["cart_id"], name: "index_conversions_on_cart_id"
    t.index ["ecommerce_order_id"], name: "index_conversions_on_ecommerce_order_id"
    t.index ["product_id"], name: "index_conversions_on_product_id"
    t.index ["user_id"], name: "index_conversions_on_user_id"
    t.index ["user_session_id"], name: "index_conversions_on_user_session_id"
  end

  create_table "daily_analytics_summaries", force: :cascade do |t|
    t.decimal "avg_order_value"
    t.decimal "conversion_rate"
    t.datetime "created_at", null: false
    t.date "date"
    t.jsonb "top_products"
    t.integer "total_orders"
    t.integer "total_page_views"
    t.decimal "total_revenue"
    t.integer "total_visitors"
    t.jsonb "traffic_sources"
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_daily_analytics_summaries_on_date"
  end

  create_table "departments", force: :cascade do |t|
    t.boolean "active"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name"
    t.datetime "updated_at", null: false
  end

  create_table "deposits", force: :cascade do |t|
    t.decimal "amount"
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.string "currency"
    t.bigint "depositable_id"
    t.string "depositable_type"
    t.datetime "expires_at"
    t.string "gateway"
    t.datetime "initiated_at"
    t.jsonb "metadata"
    t.bigint "payment_method_id"
    t.string "status"
    t.bigint "transaction_id"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["depositable_type", "depositable_id"], name: "index_deposits_on_depositable_type_and_depositable_id"
    t.index ["payment_method_id"], name: "index_deposits_on_payment_method_id"
    t.index ["transaction_id"], name: "index_deposits_on_transaction_id"
    t.index ["user_id"], name: "index_deposits_on_user_id"
  end

  create_table "ecommerce_orders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "custom_fields"
    t.bigint "order_id", null: false
    t.bigint "orderable_id", null: false
    t.string "orderable_type", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["order_id"], name: "index_ecommerce_orders_on_order_id"
    t.index ["orderable_type", "orderable_id"], name: "index_ecommerce_orders_on_orderable"
    t.index ["user_id"], name: "index_ecommerce_orders_on_user_id"
  end

  create_table "employees", force: :cascade do |t|
    t.boolean "active"
    t.datetime "created_at", null: false
    t.bigint "department_id", null: false
    t.string "email"
    t.string "first_name"
    t.datetime "last_login_at"
    t.string "last_name"
    t.string "password_digest"
    t.string "provider"
    t.string "role"
    t.string "uid"
    t.datetime "updated_at", null: false
    t.string "work_email"
    t.index ["department_id"], name: "index_employees_on_department_id"
    t.index ["email"], name: "index_employees_on_email"
    t.index ["provider", "uid"], name: "index_employees_on_provider_and_uid", unique: true, where: "(provider IS NOT NULL)"
    t.index ["work_email"], name: "index_employees_on_work_email", unique: true
  end

  create_table "esim_inventories", force: :cascade do |t|
    t.string "activation_code"
    t.datetime "created_at", null: false
    t.string "iccid", null: false
    t.string "pin1"
    t.string "pin2"
    t.bigint "product_id"
    t.string "provider", null: false
    t.string "puk1"
    t.string "puk2"
    t.string "status", default: "available"
    t.datetime "updated_at", null: false
    t.index ["iccid"], name: "index_esim_inventories_on_iccid", unique: true
    t.index ["product_id"], name: "index_esim_inventories_on_product_id"
    t.index ["provider", "status"], name: "index_esim_inventories_on_provider_and_status"
  end

  create_table "esim_orders", force: :cascade do |t|
    t.jsonb "api_response", default: {}
    t.string "country_code"
    t.datetime "created_at", null: false
    t.decimal "data_amount_gb"
    t.integer "duration_days"
    t.string "esim_provider"
    t.datetime "expires_at"
    t.bigint "order_id", null: false
    t.string "package_code"
    t.string "provider_order_no"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_esim_orders_on_order_id"
    t.index ["provider_order_no"], name: "index_esim_orders_on_provider_order_no"
  end

  create_table "esims", force: :cascade do |t|
    t.string "activation_code"
    t.datetime "created_at", null: false
    t.bigint "data_total_bytes"
    t.bigint "data_used_bytes"
    t.string "eid"
    t.bigint "esim_order_id", null: false
    t.string "esim_provider"
    t.string "esim_status"
    t.string "esimaccess_esim_tran_no"
    t.string "esimaccess_order_no"
    t.string "esimaccess_transaction_id"
    t.datetime "expires_at"
    t.boolean "has_phone_number"
    t.string "iccid"
    t.string "imsi"
    t.jsonb "metadata"
    t.string "msisdn"
    t.string "pin1"
    t.string "puk1"
    t.text "qr_code_data"
    t.string "qr_code_url"
    t.string "smdp_status"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["esim_order_id"], name: "index_esims_on_esim_order_id"
  end

  create_table "external_api_requests", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "duration_ms"
    t.string "endpoint"
    t.string "error_message"
    t.string "http_method"
    t.string "provider"
    t.bigint "related_id", null: false
    t.string "related_type", null: false
    t.jsonb "request_body"
    t.jsonb "request_headers"
    t.jsonb "response_body"
    t.jsonb "response_headers"
    t.integer "response_status"
    t.datetime "updated_at", null: false
    t.index ["related_type", "related_id"], name: "index_external_api_requests_on_related"
  end

  create_table "external_api_webhooks", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "error_message"
    t.jsonb "payload"
    t.datetime "processed_at"
    t.string "processing_status"
    t.string "provider"
    t.bigint "related_id", null: false
    t.string "related_type", null: false
    t.string "signature"
    t.boolean "signature_verified"
    t.datetime "updated_at", null: false
    t.string "webhook_type"
    t.index ["related_type", "related_id"], name: "index_external_api_webhooks_on_related"
  end

  create_table "mobile_proxies", force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.string "ip_address"
    t.jsonb "metadata"
    t.bigint "mobile_proxy_order_id", null: false
    t.string "myproxyapi_order_id"
    t.bigint "order_id"
    t.string "password"
    t.integer "port"
    t.string "proxy_source"
    t.integer "rotation_interval_minutes"
    t.string "status"
    t.datetime "updated_at", null: false
    t.string "username"
    t.jsonb "whitelisted_ips"
    t.string "xproxy_order_id"
    t.index ["mobile_proxy_order_id"], name: "index_mobile_proxies_on_mobile_proxy_order_id"
    t.index ["order_id"], name: "index_mobile_proxies_on_order_id"
    t.index ["proxy_source"], name: "index_mobile_proxies_on_proxy_source"
  end

  create_table "mobile_proxy_orders", force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.bigint "order_id", null: false
    t.string "proxy_source"
    t.integer "quantity"
    t.boolean "rotation_enabled"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_mobile_proxy_orders_on_order_id"
  end

  create_table "order_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "ecommerce_order_id", null: false
    t.jsonb "metadata"
    t.bigint "product_id", null: false
    t.bigint "product_pricing_id", null: false
    t.integer "quantity"
    t.decimal "total_price"
    t.decimal "unit_price"
    t.datetime "updated_at", null: false
    t.index ["ecommerce_order_id"], name: "index_order_items_on_ecommerce_order_id"
    t.index ["product_id"], name: "index_order_items_on_product_id"
    t.index ["product_pricing_id"], name: "index_order_items_on_product_pricing_id"
  end

  create_table "orders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "currency"
    t.datetime "expires_at"
    t.jsonb "metadata"
    t.string "order_number"
    t.bigint "orderable_id", null: false
    t.string "orderable_type", null: false
    t.bigint "product_id", null: false
    t.bigint "product_pricing_id", null: false
    t.string "provider_order_id"
    t.integer "quantity", default: 1
    t.string "status"
    t.decimal "total_amount"
    t.datetime "updated_at", null: false
    t.index ["order_number"], name: "index_orders_on_order_number", unique: true
    t.index ["orderable_type", "orderable_id"], name: "index_orders_on_orderable"
    t.index ["product_id"], name: "index_orders_on_product_id"
    t.index ["product_pricing_id"], name: "index_orders_on_product_pricing_id"
    t.index ["provider_order_id"], name: "index_orders_on_provider_order_id"
  end

  create_table "page_analytics", force: :cascade do |t|
    t.decimal "avg_time_on_page_seconds"
    t.decimal "bounce_rate"
    t.decimal "conversion_rate"
    t.datetime "created_at", null: false
    t.date "date"
    t.string "page_url"
    t.integer "unique_visitors"
    t.datetime "updated_at", null: false
    t.integer "views"
  end

  create_table "payment_gateway_transactions", force: :cascade do |t|
    t.decimal "amount"
    t.datetime "created_at", null: false
    t.string "currency"
    t.string "gateway"
    t.string "gateway_reference"
    t.string "gateway_transaction_id"
    t.jsonb "request_payload"
    t.jsonb "response_payload"
    t.string "status"
    t.bigint "transaction_id", null: false
    t.datetime "updated_at", null: false
    t.datetime "verified_at"
    t.jsonb "webhook_payload"
    t.index ["gateway_transaction_id"], name: "index_payment_gateway_transactions_on_gateway_transaction_id", unique: true
    t.index ["transaction_id"], name: "index_payment_gateway_transactions_on_transaction_id"
  end

  create_table "payment_methods", force: :cascade do |t|
    t.boolean "active"
    t.string "card_type"
    t.datetime "created_at", null: false
    t.integer "exp_month"
    t.integer "exp_year"
    t.string "gateway"
    t.string "gateway_customer_id"
    t.string "gateway_payment_method_id"
    t.boolean "is_default"
    t.string "last4"
    t.bigint "owner_id", null: false
    t.string "owner_type", null: false
    t.datetime "updated_at", null: false
    t.index ["owner_type", "owner_id"], name: "index_payment_methods_on_owner"
  end

  create_table "product_analytics", force: :cascade do |t|
    t.integer "add_to_cart_count"
    t.decimal "conversion_rate"
    t.datetime "created_at", null: false
    t.date "date"
    t.bigint "product_id", null: false
    t.integer "purchase_count"
    t.decimal "revenue"
    t.datetime "updated_at", null: false
    t.integer "views"
    t.index ["product_id"], name: "index_product_analytics_on_product_id"
  end

  create_table "product_categories", force: :cascade do |t|
    t.boolean "active"
    t.string "available_to", default: "both"
    t.string "category_type"
    t.datetime "created_at", null: false
    t.text "description"
    t.jsonb "metadata"
    t.string "name"
    t.string "slug"
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_product_categories_on_slug"
  end

  create_table "product_pricings", force: :cascade do |t|
    t.boolean "active"
    t.decimal "cost_price"
    t.datetime "created_at", null: false
    t.string "currency"
    t.string "duration_type"
    t.integer "duration_value"
    t.decimal "margin_percentage"
    t.bigint "product_id", null: false
    t.decimal "selling_price"
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_product_pricings_on_product_id"
  end

  create_table "products", force: :cascade do |t|
    t.boolean "active"
    t.string "available_to", default: "both"
    t.datetime "created_at", null: false
    t.text "description"
    t.jsonb "metadata"
    t.string "name"
    t.bigint "product_category_id", null: false
    t.string "product_type"
    t.string "provider"
    t.string "provider_product_id"
    t.string "provider_type", default: "myproxyapi"
    t.string "slug"
    t.datetime "updated_at", null: false
    t.index ["product_category_id"], name: "index_products_on_product_category_id"
    t.index ["product_type"], name: "index_products_on_product_type"
    t.index ["provider_type"], name: "index_products_on_provider_type"
    t.index ["slug"], name: "index_products_on_slug"
  end

  create_table "provider_inventory_syncs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "data_snapshot"
    t.string "error_message"
    t.datetime "last_synced_at"
    t.string "provider"
    t.integer "records_synced"
    t.string "sync_status"
    t.string "sync_type"
    t.datetime "updated_at", null: false
  end

  create_table "proxmox_operations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "error_message"
    t.string "operation_type"
    t.string "proxmox_node"
    t.string "proxmox_vm_id"
    t.jsonb "request_params"
    t.jsonb "response_data"
    t.string "status"
    t.datetime "updated_at", null: false
    t.bigint "vm_id", null: false
    t.index ["vm_id"], name: "index_proxmox_operations_on_vm_id"
  end

  create_table "rate_limits", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "endpoint"
    t.string "identifier"
    t.string "identifier_type"
    t.integer "requests_count"
    t.datetime "updated_at", null: false
    t.datetime "window_end"
    t.datetime "window_start"
  end

  create_table "reseller_orders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "custom_fields"
    t.bigint "order_id", null: false
    t.bigint "orderable_id", null: false
    t.string "orderable_type", null: false
    t.bigint "reseller_id", null: false
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_reseller_orders_on_order_id"
    t.index ["orderable_type", "orderable_id"], name: "index_reseller_orders_on_orderable"
    t.index ["reseller_id"], name: "index_reseller_orders_on_reseller_id"
  end

  create_table "resellers", force: :cascade do |t|
    t.string "api_key_hash"
    t.string "company_name"
    t.datetime "created_at", null: false
    t.string "current_token_jti"
    t.decimal "discount_percentage"
    t.string "email"
    t.decimal "infrastructure_surcharge_percentage", precision: 5, scale: 2, default: "0.0"
    t.string "password_digest"
    t.string "reseller_type", default: "api_only"
    t.string "status"
    t.datetime "token_issued_at"
    t.integer "token_request_count", default: 0
    t.datetime "updated_at", null: false
    t.string "username"
    t.index ["current_token_jti"], name: "index_resellers_on_current_token_jti", unique: true
    t.index ["email"], name: "index_resellers_on_email"
    t.index ["reseller_type"], name: "index_resellers_on_reseller_type"
    t.index ["username"], name: "index_resellers_on_username"
  end

  create_table "residential_proxy_accounts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "myproxyapi_proxy_username_id"
    t.string "proxy_password"
    t.string "proxy_username"
    t.bigint "residential_rotating_proxy_id", null: false
    t.string "status"
    t.decimal "traffic_limit_gb"
    t.decimal "traffic_used_gb"
    t.datetime "updated_at", null: false
    t.index ["residential_rotating_proxy_id"], name: "idx_on_residential_rotating_proxy_id_d9445849ff"
  end

  create_table "residential_rotating_proxies", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.string "hostname"
    t.string "main_password"
    t.string "main_username"
    t.jsonb "metadata"
    t.string "myproxyapi_order_id"
    t.bigint "order_id"
    t.integer "port"
    t.bigint "residential_rotating_proxy_order_id", null: false
    t.string "status"
    t.decimal "traffic_gb_total"
    t.decimal "traffic_gb_used"
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_residential_rotating_proxies_on_order_id"
    t.index ["residential_rotating_proxy_order_id"], name: "idx_on_residential_rotating_proxy_order_id_21359c3ec5"
  end

  create_table "residential_rotating_proxy_orders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "myproxyapi_order_id"
    t.string "myproxyapi_username"
    t.bigint "order_id", null: false
    t.string "status"
    t.datetime "traffic_expires_at"
    t.decimal "traffic_gb_total"
    t.decimal "traffic_gb_used"
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_residential_rotating_proxy_orders_on_order_id"
  end

  create_table "static_datacenter_proxies", force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.string "ip_address"
    t.jsonb "metadata"
    t.string "myproxyapi_order_id"
    t.bigint "order_id"
    t.string "password"
    t.integer "port"
    t.string "protocol"
    t.bigint "static_datacenter_proxy_order_id", null: false
    t.string "status"
    t.datetime "updated_at", null: false
    t.string "username"
    t.jsonb "whitelisted_ips"
    t.index ["order_id"], name: "index_static_datacenter_proxies_on_order_id"
    t.index ["static_datacenter_proxy_order_id"], name: "idx_on_static_datacenter_proxy_order_id_db8248c860"
  end

  create_table "static_datacenter_proxy_orders", force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "myproxyapi_order_id"
    t.bigint "order_id", null: false
    t.string "protocol"
    t.integer "quantity"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_static_datacenter_proxy_orders_on_order_id"
  end

  create_table "static_isp_proxies", force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.string "ip_address"
    t.string "isp_type"
    t.jsonb "metadata"
    t.string "myproxyapi_order_id"
    t.bigint "order_id"
    t.string "password"
    t.integer "port"
    t.string "protocol"
    t.bigint "static_isp_proxy_order_id", null: false
    t.string "status"
    t.datetime "updated_at", null: false
    t.string "username"
    t.jsonb "whitelisted_ips"
    t.index ["order_id"], name: "index_static_isp_proxies_on_order_id"
    t.index ["static_isp_proxy_order_id"], name: "index_static_isp_proxies_on_static_isp_proxy_order_id"
  end

  create_table "static_isp_proxy_orders", force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "isp_type"
    t.string "myproxyapi_order_id"
    t.bigint "order_id", null: false
    t.string "protocol"
    t.integer "quantity"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_static_isp_proxy_orders_on_order_id"
  end

  create_table "static_residential_proxies", force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.jsonb "metadata"
    t.string "myproxyapi_order_id"
    t.string "password"
    t.integer "port"
    t.string "protocol"
    t.bigint "static_residential_proxy_order_id", null: false
    t.string "status"
    t.datetime "updated_at", null: false
    t.string "username"
    t.jsonb "whitelisted_ips"
    t.index ["static_residential_proxy_order_id"], name: "idx_on_static_residential_proxy_order_id_216e7d575e"
  end

  create_table "static_residential_proxy_orders", force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "myproxyapi_order_id"
    t.bigint "order_id", null: false
    t.string "protocol"
    t.integer "quantity"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_static_residential_proxy_orders_on_order_id"
  end

  create_table "stores", force: :cascade do |t|
    t.boolean "active"
    t.datetime "created_at", null: false
    t.string "domain"
    t.string "name"
    t.jsonb "settings"
    t.datetime "updated_at", null: false
  end

  create_table "ticket_messages", force: :cascade do |t|
    t.jsonb "attachments", default: []
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.boolean "internal_note", default: false
    t.bigint "sender_id", null: false
    t.string "sender_type", null: false
    t.bigint "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.index ["sender_type", "sender_id"], name: "index_ticket_messages_on_sender"
    t.index ["sender_type", "sender_id"], name: "index_ticket_messages_on_sender_type_and_sender_id"
    t.index ["ticket_id"], name: "index_ticket_messages_on_ticket_id"
  end

  create_table "tickets", force: :cascade do |t|
    t.bigint "assigned_to_id"
    t.datetime "created_at", null: false
    t.bigint "order_id"
    t.string "priority", default: "normal"
    t.string "status", default: "open", null: false
    t.string "subject", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.string "user_type", null: false
    t.index ["assigned_to_id"], name: "index_tickets_on_assigned_to_id"
    t.index ["order_id"], name: "index_tickets_on_order_id"
    t.index ["status"], name: "index_tickets_on_status"
    t.index ["user_type", "user_id"], name: "index_tickets_on_user"
    t.index ["user_type", "user_id"], name: "index_tickets_on_user_type_and_user_id"
  end

  create_table "transactions", force: :cascade do |t|
    t.decimal "amount"
    t.datetime "created_at", null: false
    t.string "currency"
    t.string "description"
    t.string "gateway_reference"
    t.string "gateway_transaction_id"
    t.jsonb "metadata"
    t.string "payment_gateway"
    t.bigint "reference_id", null: false
    t.string "reference_type", null: false
    t.string "status"
    t.bigint "transactable_id", null: false
    t.string "transactable_type", null: false
    t.string "transaction_type"
    t.datetime "updated_at", null: false
    t.index ["reference_type", "reference_id"], name: "index_transactions_on_reference"
    t.index ["transactable_type", "transactable_id"], name: "index_transactions_on_transactable"
  end

  create_table "user_impersonation_logs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "employee_id", null: false
    t.datetime "ended_at"
    t.string "ip_address"
    t.string "reason"
    t.datetime "started_at"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["employee_id"], name: "index_user_impersonation_logs_on_employee_id"
    t.index ["user_id"], name: "index_user_impersonation_logs_on_user_id"
  end

  create_table "user_sessions", force: :cascade do |t|
    t.string "browser"
    t.string "city"
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "device_type"
    t.datetime "ended_at"
    t.string "ip_address"
    t.datetime "last_activity_at"
    t.string "os"
    t.string "referrer"
    t.datetime "started_at"
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.bigint "user_id", null: false
    t.string "utm_campaign"
    t.string "utm_content"
    t.string "utm_medium"
    t.string "utm_source"
    t.string "utm_term"
    t.index ["user_id"], name: "index_user_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.datetime "email_verified_at"
    t.string "first_name"
    t.datetime "last_login_at"
    t.string "last_name"
    t.jsonb "metadata"
    t.string "password_digest"
    t.string "phone"
    t.string "provider"
    t.string "status"
    t.string "uid"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email"
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true, where: "(provider IS NOT NULL)"
  end

  create_table "vm_orders", force: :cascade do |t|
    t.string "country_code"
    t.integer "cpu_cores"
    t.datetime "created_at", null: false
    t.integer "disk_gb"
    t.bigint "order_id", null: false
    t.string "os_type"
    t.integer "ram_gb"
    t.string "status"
    t.datetime "updated_at", null: false
    t.string "vm_type"
    t.index ["order_id"], name: "index_vm_orders_on_order_id"
  end

  create_table "vms", force: :cascade do |t|
    t.integer "ansible_playbook_run_id"
    t.jsonb "api_response", default: {}
    t.string "country_code"
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.string "ip_address"
    t.jsonb "metadata"
    t.string "proxmox_node"
    t.string "proxmox_vm_id"
    t.string "rdp_password_encrypted"
    t.integer "rdp_port"
    t.string "rdp_username"
    t.string "root_password"
    t.string "ssh_password"
    t.string "ssh_password_encrypted"
    t.integer "ssh_port"
    t.string "ssh_username"
    t.string "status"
    t.datetime "updated_at", null: false
    t.bigint "vm_order_id", null: false
    t.string "vm_type"
    t.index ["vm_order_id"], name: "index_vms_on_vm_order_id"
  end

  create_table "vpn_accounts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.bigint "order_id", null: false
    t.string "password", null: false
    t.string "protocol", default: "wireguard"
    t.string "server", null: false
    t.string "status", default: "pending"
    t.datetime "updated_at", null: false
    t.string "username", null: false
    t.index ["order_id"], name: "index_vpn_accounts_on_order_id"
    t.index ["username"], name: "index_vpn_accounts_on_username", unique: true
  end

  create_table "vpn_orders", force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "myproxyapi_order_id"
    t.bigint "order_id", null: false
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_vpn_orders_on_order_id"
  end

  create_table "vpns", force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.jsonb "metadata"
    t.string "myproxyapi_order_id"
    t.text "ovpn_config_content"
    t.string "ovpn_config_url"
    t.string "status"
    t.datetime "updated_at", null: false
    t.bigint "vpn_order_id", null: false
    t.string "vpn_password"
    t.string "vpn_username"
    t.index ["vpn_order_id"], name: "index_vpns_on_vpn_order_id"
  end

  create_table "wallet_transactions", force: :cascade do |t|
    t.decimal "amount"
    t.decimal "balance_after"
    t.decimal "balance_before"
    t.datetime "created_at", null: false
    t.string "description"
    t.string "entry_hash"
    t.datetime "locked_at"
    t.jsonb "metadata"
    t.string "parent_hash"
    t.bigint "transaction_id", null: false
    t.string "transaction_type"
    t.datetime "updated_at", null: false
    t.bigint "wallet_id", null: false
    t.index ["entry_hash"], name: "index_wallet_transactions_on_entry_hash", unique: true
    t.index ["parent_hash"], name: "index_wallet_transactions_on_parent_hash"
    t.index ["transaction_id"], name: "index_wallet_transactions_on_transaction_id"
    t.index ["wallet_id", "created_at"], name: "index_wallet_transactions_on_wallet_id_and_created_at"
    t.index ["wallet_id"], name: "index_wallet_transactions_on_wallet_id"
  end

  create_table "wallets", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "owner_id"
    t.string "owner_type"
    t.string "status", default: "active"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["owner_type", "owner_id"], name: "index_wallets_on_owner_type_and_owner_id"
    t.index ["user_id"], name: "index_wallets_on_user_id"
  end

  create_table "webhook_endpoints", force: :cascade do |t|
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.jsonb "events", default: []
    t.bigint "reseller_id", null: false
    t.string "secret", null: false
    t.datetime "updated_at", null: false
    t.string "url", null: false
    t.index ["reseller_id", "active"], name: "index_webhook_endpoints_on_reseller_id_and_active"
    t.index ["reseller_id"], name: "index_webhook_endpoints_on_reseller_id"
  end

  create_table "webhook_events", force: :cascade do |t|
    t.integer "attempts"
    t.datetime "created_at", null: false
    t.string "event_type"
    t.datetime "last_attempt_at"
    t.jsonb "payload"
    t.bigint "reseller_id", null: false
    t.text "response_body"
    t.integer "response_code"
    t.string "signature"
    t.string "status"
    t.datetime "updated_at", null: false
    t.string "webhook_url"
    t.index ["reseller_id"], name: "index_webhook_events_on_reseller_id"
  end

  add_foreign_key "admin_action_logs", "employees"
  add_foreign_key "ansible_runs", "vms"
  add_foreign_key "api_tokens", "resellers"
  add_foreign_key "billing_histories", "resellers", column: "billable_id"
  add_foreign_key "cart_items", "carts"
  add_foreign_key "cart_items", "product_pricings"
  add_foreign_key "cart_items", "products"
  add_foreign_key "carts", "users"
  add_foreign_key "conversions", "carts"
  add_foreign_key "conversions", "ecommerce_orders"
  add_foreign_key "conversions", "products"
  add_foreign_key "conversions", "user_sessions"
  add_foreign_key "conversions", "users"
  add_foreign_key "deposits", "payment_methods"
  add_foreign_key "deposits", "transactions"
  add_foreign_key "deposits", "users"
  add_foreign_key "ecommerce_orders", "orders"
  add_foreign_key "ecommerce_orders", "users"
  add_foreign_key "employees", "departments"
  add_foreign_key "esim_inventories", "products"
  add_foreign_key "esim_orders", "orders"
  add_foreign_key "esims", "esim_orders"
  add_foreign_key "mobile_proxies", "mobile_proxy_orders"
  add_foreign_key "mobile_proxies", "orders"
  add_foreign_key "mobile_proxy_orders", "orders"
  add_foreign_key "order_items", "ecommerce_orders"
  add_foreign_key "order_items", "product_pricings"
  add_foreign_key "order_items", "products"
  add_foreign_key "orders", "product_pricings"
  add_foreign_key "orders", "products"
  add_foreign_key "payment_gateway_transactions", "transactions"
  add_foreign_key "product_analytics", "products"
  add_foreign_key "product_pricings", "products"
  add_foreign_key "products", "product_categories"
  add_foreign_key "proxmox_operations", "vms"
  add_foreign_key "reseller_orders", "orders"
  add_foreign_key "reseller_orders", "resellers"
  add_foreign_key "residential_proxy_accounts", "residential_rotating_proxies"
  add_foreign_key "residential_rotating_proxies", "orders"
  add_foreign_key "residential_rotating_proxies", "residential_rotating_proxy_orders"
  add_foreign_key "residential_rotating_proxy_orders", "orders"
  add_foreign_key "static_datacenter_proxies", "orders"
  add_foreign_key "static_datacenter_proxies", "static_datacenter_proxy_orders"
  add_foreign_key "static_datacenter_proxy_orders", "orders"
  add_foreign_key "static_isp_proxies", "orders"
  add_foreign_key "static_isp_proxies", "static_isp_proxy_orders"
  add_foreign_key "static_isp_proxy_orders", "orders"
  add_foreign_key "static_residential_proxies", "static_residential_proxy_orders"
  add_foreign_key "static_residential_proxy_orders", "orders"
  add_foreign_key "ticket_messages", "tickets"
  add_foreign_key "tickets", "employees", column: "assigned_to_id"
  add_foreign_key "tickets", "orders"
  add_foreign_key "user_impersonation_logs", "employees"
  add_foreign_key "user_impersonation_logs", "users"
  add_foreign_key "user_sessions", "users"
  add_foreign_key "vm_orders", "orders"
  add_foreign_key "vms", "vm_orders"
  add_foreign_key "vpn_accounts", "orders"
  add_foreign_key "vpn_orders", "orders"
  add_foreign_key "vpns", "vpn_orders"
  add_foreign_key "wallet_transactions", "transactions"
  add_foreign_key "wallet_transactions", "wallets"
  add_foreign_key "wallets", "users"
  add_foreign_key "webhook_endpoints", "resellers"
  add_foreign_key "webhook_events", "resellers"
end
