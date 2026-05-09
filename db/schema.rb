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

ActiveRecord::Schema[8.1].define(version: 2026_05_07_092823) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "active_storage_attachments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "blob_id"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.uuid "record_id"
    t.string "record_type", null: false
  end

  create_table "active_storage_blobs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "blob_id"
    t.string "variation_digest", null: false
  end

  create_table "admin_action_logs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "action_type"
    t.datetime "created_at", null: false
    t.uuid "employee_id"
    t.string "ip_address"
    t.jsonb "object_changes"
    t.uuid "target_id"
    t.string "target_type", null: false
    t.datetime "updated_at", null: false
    t.string "user_agent"
  end

  create_table "affiliate_payouts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "affiliate_id"
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.datetime "created_at", null: false
    t.text "notes"
    t.datetime "paid_at"
    t.jsonb "payment_details", default: {}
    t.string "payment_method"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["status"], name: "index_affiliate_payouts_on_status"
  end

  create_table "affiliate_referrals", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "affiliate_id"
    t.decimal "commission_amount", precision: 10, scale: 2
    t.datetime "converted_at"
    t.datetime "created_at", null: false
    t.uuid "order_id"
    t.decimal "referee_discount_applied", precision: 5, scale: 2
    t.uuid "referred_id"
    t.string "referred_type", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["status"], name: "index_affiliate_referrals_on_status"
  end

  create_table "affiliates", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "affiliatable_id"
    t.string "affiliatable_type"
    t.decimal "commission_rate", precision: 5, scale: 2, default: "10.0", null: false
    t.datetime "created_at", null: false
    t.decimal "discount_rate", precision: 5, scale: 2, default: "5.0", null: false
    t.string "email"
    t.datetime "last_payout_at"
    t.string "name"
    t.text "notes"
    t.jsonb "payment_details", default: {}
    t.string "referral_code", null: false
    t.string "status", default: "active", null: false
    t.decimal "total_earned", precision: 10, scale: 2, default: "0.0", null: false
    t.decimal "total_paid_out", precision: 10, scale: 2, default: "0.0", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_affiliates_on_email", where: "(email IS NOT NULL)"
    t.index ["referral_code"], name: "index_affiliates_on_referral_code", unique: true
    t.index ["status"], name: "index_affiliates_on_status"
  end

  create_table "ansible_runs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
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
    t.uuid "vm_id"
  end

  create_table "api_tokens", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "active"
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.string "hashed_token"
    t.datetime "last_used_at"
    t.uuid "reseller_id"
    t.jsonb "scopes"
    t.string "token_name"
    t.datetime "updated_at", null: false
  end

  create_table "audit_logs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "action"
    t.uuid "auditable_id"
    t.string "auditable_type", null: false
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.jsonb "object_changes"
    t.datetime "updated_at", null: false
    t.uuid "user_id"
    t.string "user_type"
  end

  create_table "billing_histories", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.decimal "amount_due"
    t.decimal "amount_paid"
    t.uuid "billable_id"
    t.string "billable_type", default: "Reseller"
    t.date "billing_period_end"
    t.date "billing_period_start"
    t.datetime "created_at", null: false
    t.string "currency"
    t.datetime "generated_at"
    t.decimal "net_revenue"
    t.string "status"
    t.integer "total_orders"
    t.decimal "total_refunds"
    t.decimal "total_revenue"
    t.datetime "updated_at", null: false
  end

  create_table "blog_posts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "author", null: false
    t.string "category", null: false
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.text "excerpt", null: false
    t.boolean "featured", default: false, null: false
    t.string "image_url"
    t.boolean "published", default: false, null: false
    t.datetime "published_at"
    t.string "read_time"
    t.string "slug", null: false
    t.jsonb "tags", default: [], null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "views_count", default: 0, null: false
    t.index ["category"], name: "index_blog_posts_on_category"
    t.index ["featured"], name: "index_blog_posts_on_featured"
    t.index ["published"], name: "index_blog_posts_on_published"
    t.index ["published_at"], name: "index_blog_posts_on_published_at"
    t.index ["slug"], name: "index_blog_posts_on_slug", unique: true
  end

  create_table "cart_items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "cart_id"
    t.datetime "created_at", null: false
    t.jsonb "metadata"
    t.uuid "product_id"
    t.uuid "product_pricing_id"
    t.integer "quantity"
    t.decimal "total_price"
    t.decimal "unit_price"
    t.datetime "updated_at", null: false
  end

  create_table "carts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "abandoned_at"
    t.datetime "converted_at"
    t.datetime "created_at", null: false
    t.uuid "orderable_id"
    t.string "orderable_type"
    t.datetime "recovery_email_sent_at"
    t.string "session_id"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["orderable_type", "orderable_id"], name: "index_carts_on_orderable"
  end

  create_table "checkout_sessions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "currency", default: "USD", null: false
    t.string "gateway_reference"
    t.json "metadata"
    t.uuid "orderable_id"
    t.string "orderable_type"
    t.string "payment_method", null: false
    t.string "status", default: "pending", null: false
    t.decimal "total_amount", precision: 10, scale: 2, null: false
    t.datetime "updated_at", null: false
    t.index ["gateway_reference"], name: "index_checkout_sessions_on_gateway_reference", unique: true
    t.index ["orderable_type", "orderable_id"], name: "index_checkout_sessions_on_orderable"
    t.index ["status"], name: "index_checkout_sessions_on_status"
  end

  create_table "conversions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "cart_id"
    t.datetime "created_at", null: false
    t.uuid "ecommerce_order_id"
    t.string "funnel_stage"
    t.uuid "product_id"
    t.integer "time_to_convert_seconds"
    t.datetime "updated_at", null: false
    t.uuid "user_id"
    t.uuid "user_session_id"
  end

  create_table "daily_analytics_summaries", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
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

  create_table "departments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "active"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name"
    t.datetime "updated_at", null: false
  end

  create_table "deposits", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.decimal "amount"
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.string "currency"
    t.uuid "depositable_id"
    t.string "depositable_type"
    t.datetime "expires_at"
    t.string "gateway"
    t.datetime "initiated_at"
    t.jsonb "metadata"
    t.uuid "payment_method_id"
    t.string "status"
    t.uuid "transaction_id"
    t.datetime "updated_at", null: false
    t.uuid "user_id"
  end

  create_table "ecommerce_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "custom_fields"
    t.uuid "order_id"
    t.uuid "orderable_id"
    t.string "orderable_type", null: false
    t.datetime "updated_at", null: false
    t.uuid "user_id"
  end

  create_table "employees", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "active"
    t.datetime "created_at", null: false
    t.uuid "department_id"
    t.string "email"
    t.string "first_name"
    t.datetime "last_login_at"
    t.string "last_name"
    t.datetime "last_seen_at"
    t.string "password_digest"
    t.string "profile_picture_url"
    t.string "provider"
    t.string "role"
    t.integer "token_version", default: 1, null: false
    t.string "uid"
    t.datetime "updated_at", null: false
    t.string "work_email"
    t.index ["email"], name: "index_employees_on_email"
    t.index ["provider", "uid"], name: "index_employees_on_provider_and_uid", unique: true, where: "(provider IS NOT NULL)"
    t.index ["work_email"], name: "index_employees_on_work_email", unique: true
  end

  create_table "esim_inventories", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "activation_code"
    t.datetime "created_at", null: false
    t.string "esim_type", default: "data_only", null: false
    t.string "iccid", null: false
    t.integer "moq", default: 1, null: false
    t.string "pin1"
    t.string "pin2"
    t.uuid "product_id"
    t.string "provider", null: false
    t.string "puk1"
    t.string "puk2"
    t.string "qr_code_url"
    t.string "status", default: "available"
    t.datetime "updated_at", null: false
    t.index ["esim_type"], name: "index_esim_inventories_on_esim_type"
    t.index ["iccid"], name: "index_esim_inventories_on_iccid", unique: true
    t.index ["provider", "status"], name: "index_esim_inventories_on_provider_and_status"
  end

  create_table "esim_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.jsonb "api_response", default: {}
    t.string "country_code"
    t.datetime "created_at", null: false
    t.decimal "data_amount_gb"
    t.integer "duration_days"
    t.string "esim_provider"
    t.string "esim_type", default: "data_only", null: false
    t.datetime "expires_at"
    t.jsonb "metadata", default: {}
    t.integer "moq_quantity", default: 1, null: false
    t.uuid "order_id"
    t.string "package_code"
    t.string "provider_order_no"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["provider_order_no"], name: "index_esim_orders_on_provider_order_no"
  end

  create_table "esims", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "activation_code"
    t.datetime "created_at", null: false
    t.bigint "data_total_bytes"
    t.bigint "data_used_bytes"
    t.string "eid"
    t.uuid "esim_order_id"
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
  end

  create_table "external_api_requests", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "duration_ms"
    t.string "endpoint"
    t.string "error_message"
    t.string "http_method"
    t.string "provider"
    t.uuid "related_id"
    t.string "related_type", null: false
    t.jsonb "request_body"
    t.jsonb "request_headers"
    t.jsonb "response_body"
    t.jsonb "response_headers"
    t.integer "response_status"
    t.datetime "updated_at", null: false
  end

  create_table "external_api_webhooks", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "error_message"
    t.jsonb "payload"
    t.datetime "processed_at"
    t.string "processing_status"
    t.string "provider"
    t.uuid "related_id"
    t.string "related_type", null: false
    t.string "signature"
    t.boolean "signature_verified"
    t.datetime "updated_at", null: false
    t.string "webhook_type"
  end

  create_table "global_isp_proxies", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "city"
    t.string "country_code"
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.string "ip_address"
    t.string "isp_name"
    t.jsonb "metadata", default: {}
    t.string "myproxyapi_order_id"
    t.uuid "order_id"
    t.string "password"
    t.integer "port"
    t.datetime "updated_at", null: false
    t.string "username"
    t.index ["myproxyapi_order_id"], name: "index_global_isp_proxies_on_myproxyapi_order_id"
    t.index ["order_id"], name: "index_global_isp_proxies_on_order_id"
  end

  create_table "global_isp_proxy_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.uuid "global_isp_proxy_id"
    t.string "myproxyapi_order_id"
    t.uuid "order_id", null: false
    t.string "target_id"
    t.string "target_section_id"
    t.datetime "updated_at", null: false
    t.index ["global_isp_proxy_id"], name: "index_global_isp_proxy_orders_on_global_isp_proxy_id"
    t.index ["order_id"], name: "index_global_isp_proxy_orders_on_order_id"
  end

  create_table "guest_chat_messages", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.uuid "guest_chat_id"
    t.uuid "sender_id"
    t.string "sender_type", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_guest_chat_messages_on_created_at"
  end

  create_table "guest_chats", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "assigned_to_id"
    t.datetime "created_at", null: false
    t.string "guest_email", null: false
    t.string "guest_name", null: false
    t.string "session_token", null: false
    t.string "status", default: "open", null: false
    t.string "subject"
    t.datetime "updated_at", null: false
    t.index ["session_token"], name: "index_guest_chats_on_session_token", unique: true
    t.index ["status"], name: "index_guest_chats_on_status"
  end

  create_table "ip_addresses", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "address"
    t.datetime "assigned_at"
    t.datetime "created_at", null: false
    t.string "gateway"
    t.string "netmask"
    t.string "status"
    t.datetime "updated_at", null: false
    t.uuid "vm_id"
    t.index ["vm_id"], name: "index_ip_addresses_on_vm_id"
  end

  create_table "mobile_proxies", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.string "ip_address"
    t.jsonb "metadata"
    t.uuid "mobile_proxy_order_id"
    t.string "myproxyapi_order_id"
    t.uuid "order_id"
    t.string "password"
    t.integer "port"
    t.string "proxy_source"
    t.integer "rotation_interval_minutes"
    t.string "status"
    t.datetime "updated_at", null: false
    t.string "username"
    t.jsonb "whitelisted_ips"
    t.string "xproxy_order_id"
    t.index ["proxy_source"], name: "index_mobile_proxies_on_proxy_source"
  end

  create_table "mobile_proxy_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "myproxyapi_order_id"
    t.uuid "order_id"
    t.string "proxy_source"
    t.integer "quantity"
    t.boolean "rotation_enabled"
    t.string "status"
    t.datetime "updated_at", null: false
  end

  create_table "notifications", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.text "message"
    t.jsonb "metadata"
    t.datetime "read_at"
    t.uuid "recipient_id"
    t.string "recipient_type", null: false
    t.string "title"
    t.datetime "updated_at", null: false
  end

  create_table "order_items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.uuid "ecommerce_order_id"
    t.jsonb "metadata"
    t.uuid "product_id"
    t.uuid "product_pricing_id"
    t.integer "quantity"
    t.decimal "total_price"
    t.decimal "unit_price"
    t.datetime "updated_at", null: false
  end

  create_table "orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "checkout_session_id"
    t.datetime "created_at", null: false
    t.jsonb "credentials", default: []
    t.string "currency"
    t.datetime "expires_at"
    t.jsonb "metadata"
    t.string "order_number"
    t.uuid "orderable_id"
    t.string "orderable_type", null: false
    t.uuid "product_id"
    t.uuid "product_pricing_id"
    t.string "provider_order_id"
    t.integer "quantity", default: 1
    t.string "status"
    t.decimal "total_amount"
    t.datetime "updated_at", null: false
    t.index ["order_number"], name: "index_orders_on_order_number", unique: true
    t.index ["provider_order_id"], name: "index_orders_on_provider_order_id"
  end

  create_table "page_analytics", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
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

  create_table "payment_gateway_transactions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.decimal "amount"
    t.datetime "created_at", null: false
    t.string "currency"
    t.string "gateway"
    t.string "gateway_reference"
    t.string "gateway_transaction_id"
    t.jsonb "request_payload"
    t.jsonb "response_payload"
    t.string "status"
    t.uuid "transaction_id"
    t.datetime "updated_at", null: false
    t.datetime "verified_at"
    t.jsonb "webhook_payload"
    t.index ["gateway_transaction_id"], name: "index_payment_gateway_transactions_on_gateway_transaction_id", unique: true
  end

  create_table "payment_methods", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
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
    t.uuid "owner_id"
    t.string "owner_type", null: false
    t.datetime "updated_at", null: false
  end

  create_table "payouts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.string "gateway", null: false
    t.jsonb "gateway_response", default: {}
    t.jsonb "payment_details", default: {}
    t.string "reference"
    t.uuid "reseller_id", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["reference"], name: "index_payouts_on_reference", unique: true
    t.index ["reseller_id"], name: "index_payouts_on_reseller_id"
    t.index ["status"], name: "index_payouts_on_status"
  end

  create_table "premium_isp_proxies", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "active"
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.string "isp"
    t.string "location"
    t.string "password"
    t.integer "port"
    t.uuid "premium_isp_proxy_order_id"
    t.string "protocol"
    t.datetime "updated_at", null: false
    t.string "username"
  end

  create_table "premium_isp_proxy_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.uuid "order_id"
    t.string "status"
    t.datetime "updated_at", null: false
  end

  create_table "product_analytics", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "add_to_cart_count"
    t.decimal "conversion_rate"
    t.datetime "created_at", null: false
    t.date "date"
    t.uuid "product_id"
    t.integer "purchase_count"
    t.decimal "revenue"
    t.datetime "updated_at", null: false
    t.integer "views"
  end

  create_table "product_categories", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
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

  create_table "product_pricings", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "active"
    t.decimal "api_price", precision: 15, scale: 4
    t.decimal "cost_price"
    t.datetime "created_at", null: false
    t.string "currency"
    t.string "duration_type"
    t.integer "duration_value"
    t.decimal "margin_percentage"
    t.uuid "product_id"
    t.decimal "reseller_selling_price", precision: 15, scale: 4
    t.decimal "selling_price"
    t.datetime "updated_at", null: false
    t.decimal "user_selling_price", precision: 15, scale: 4
  end

  create_table "products", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "active"
    t.string "available_to", default: "both"
    t.datetime "created_at", null: false
    t.text "description"
    t.jsonb "metadata"
    t.string "name"
    t.uuid "product_category_id"
    t.string "product_type"
    t.string "provider"
    t.string "provider_product_id"
    t.string "provider_type", default: "myproxyapi"
    t.string "slug"
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_products_on_active"
    t.index ["name"], name: "index_products_on_name"
    t.index ["product_type"], name: "index_products_on_product_type"
    t.index ["provider"], name: "index_products_on_provider"
    t.index ["provider_type"], name: "index_products_on_provider_type"
    t.index ["slug"], name: "index_products_on_slug"
  end

  create_table "promo_codes", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "active", default: true
    t.string "code"
    t.datetime "created_at", null: false
    t.uuid "created_by_id"
    t.integer "current_uses", default: 0
    t.string "description"
    t.string "discount_type"
    t.decimal "discount_value"
    t.datetime "expires_at"
    t.decimal "max_discount_amount"
    t.integer "max_uses"
    t.decimal "min_order_amount"
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_promo_codes_on_code", unique: true
  end

  create_table "provider_inventory_syncs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
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

  create_table "proxmox_operations", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "error_message"
    t.string "operation_type"
    t.string "proxmox_node"
    t.string "proxmox_vm_id"
    t.jsonb "request_params"
    t.jsonb "response_data"
    t.string "status"
    t.datetime "updated_at", null: false
    t.uuid "vm_id"
  end

  create_table "proxy_assignments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.decimal "gb_limit"
    t.decimal "gb_used", default: "0.0"
    t.boolean "is_owned_proxy", default: true
    t.jsonb "metadata"
    t.uuid "order_id", null: false
    t.uuid "owned_proxy_billing_plan_id"
    t.string "password", null: false
    t.uuid "proxy_instance_id", null: false
    t.string "status", default: "active"
    t.datetime "updated_at", null: false
    t.uuid "user_id"
    t.string "username", null: false
    t.index ["expires_at"], name: "index_proxy_assignments_on_expires_at"
    t.index ["order_id"], name: "index_proxy_assignments_on_order_id"
    t.index ["proxy_instance_id"], name: "index_proxy_assignments_on_proxy_instance_id"
    t.index ["status"], name: "index_proxy_assignments_on_status"
    t.index ["user_id"], name: "index_proxy_assignments_on_user_id"
  end

  create_table "proxy_instances", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "device_type"
    t.decimal "health_score", default: "1.0"
    t.datetime "last_health_check"
    t.jsonb "metadata", default: {}
    t.string "proxy_address", null: false
    t.string "status", default: "available"
    t.decimal "success_rate", default: "1.0"
    t.datetime "updated_at", null: false
    t.index ["proxy_address"], name: "index_proxy_instances_on_proxy_address", unique: true
    t.index ["status"], name: "index_proxy_instances_on_status"
  end

  create_table "rate_limits", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "endpoint"
    t.string "identifier"
    t.string "identifier_type"
    t.integer "requests_count"
    t.datetime "updated_at", null: false
    t.datetime "window_end"
    t.datetime "window_start"
  end

  create_table "reseller_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "custom_fields"
    t.uuid "order_id"
    t.uuid "orderable_id"
    t.string "orderable_type", null: false
    t.uuid "reseller_id"
    t.datetime "updated_at", null: false
  end

  create_table "resellers", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "allowed_product_category_id"
    t.string "api_key_hash"
    t.string "city"
    t.string "company_name"
    t.string "country"
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "current_token_jti"
    t.string "customer_email"
    t.string "dedicated_api_key"
    t.decimal "discount_percentage"
    t.string "email"
    t.decimal "infrastructure_surcharge_percentage", precision: 5, scale: 2, default: "0.0"
    t.datetime "last_seen_at"
    t.integer "myproxyapi_country_id"
    t.string "myproxyapi_user_id"
    t.string "password_digest"
    t.string "permanent_api_key"
    t.string "referred_by_code"
    t.string "reseller_type", default: "api_only"
    t.string "status"
    t.datetime "subscription_expires_at"
    t.decimal "subscription_fee"
    t.datetime "token_issued_at"
    t.integer "token_request_count", default: 0
    t.integer "token_version", default: 1, null: false
    t.datetime "updated_at", null: false
    t.string "username"
    t.decimal "withdrawable_profit"
    t.index ["allowed_product_category_id"], name: "index_resellers_on_allowed_product_category_id"
    t.index ["current_token_jti"], name: "index_resellers_on_current_token_jti", unique: true
    t.index ["email"], name: "index_resellers_on_email"
    t.index ["referred_by_code"], name: "index_resellers_on_referred_by_code"
    t.index ["reseller_type"], name: "index_resellers_on_reseller_type"
    t.index ["username"], name: "index_resellers_on_username"
  end

  create_table "residential_proxy_accounts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "myproxyapi_proxy_username_id"
    t.string "proxy_password"
    t.string "proxy_username"
    t.uuid "residential_rotating_proxy_id"
    t.string "status"
    t.decimal "traffic_limit_gb"
    t.decimal "traffic_used_gb"
    t.datetime "updated_at", null: false
  end

  create_table "residential_rotating_proxies", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.string "hostname"
    t.string "main_password"
    t.string "main_username"
    t.jsonb "metadata"
    t.string "myproxyapi_order_id"
    t.uuid "order_id"
    t.integer "port"
    t.uuid "residential_rotating_proxy_order_id"
    t.string "status"
    t.decimal "traffic_gb_total"
    t.decimal "traffic_gb_used"
    t.datetime "updated_at", null: false
  end

  create_table "residential_rotating_proxy_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "myproxyapi_order_id"
    t.string "myproxyapi_username"
    t.uuid "order_id"
    t.string "status"
    t.datetime "traffic_expires_at"
    t.decimal "traffic_gb_total"
    t.decimal "traffic_gb_used"
    t.datetime "updated_at", null: false
  end

  create_table "static_datacenter_proxies", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.string "ip_address"
    t.jsonb "metadata"
    t.string "myproxyapi_order_id"
    t.uuid "order_id"
    t.string "password"
    t.integer "port"
    t.string "protocol"
    t.uuid "static_datacenter_proxy_order_id"
    t.string "status"
    t.datetime "updated_at", null: false
    t.string "username"
    t.jsonb "whitelisted_ips"
  end

  create_table "static_datacenter_proxy_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "myproxyapi_order_id"
    t.uuid "order_id"
    t.string "protocol"
    t.integer "quantity"
    t.string "status"
    t.datetime "updated_at", null: false
  end

  create_table "static_isp_proxies", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.string "ip_address"
    t.string "isp_type"
    t.jsonb "metadata"
    t.string "myproxyapi_order_id"
    t.uuid "order_id"
    t.string "password"
    t.integer "port"
    t.string "protocol"
    t.uuid "static_isp_proxy_order_id"
    t.string "status"
    t.datetime "updated_at", null: false
    t.string "username"
    t.jsonb "whitelisted_ips"
  end

  create_table "static_isp_proxy_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "isp_type"
    t.string "myproxyapi_order_id"
    t.uuid "order_id"
    t.string "protocol"
    t.integer "quantity"
    t.string "status"
    t.datetime "updated_at", null: false
  end

  create_table "static_residential_proxies", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.jsonb "metadata"
    t.string "myproxyapi_order_id"
    t.string "password"
    t.integer "port"
    t.string "protocol"
    t.uuid "static_residential_proxy_order_id"
    t.string "status"
    t.datetime "updated_at", null: false
    t.string "username"
    t.jsonb "whitelisted_ips"
  end

  create_table "static_residential_proxy_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "myproxyapi_order_id"
    t.uuid "order_id"
    t.string "protocol"
    t.integer "quantity"
    t.string "status"
    t.datetime "updated_at", null: false
  end

  create_table "stores", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "active"
    t.datetime "created_at", null: false
    t.string "domain"
    t.string "name"
    t.jsonb "settings"
    t.datetime "updated_at", null: false
  end

  create_table "support_chat_messages", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.text "body"
    t.datetime "created_at", null: false
    t.datetime "read_at"
    t.uuid "sender_id"
    t.string "sender_type", null: false
    t.uuid "support_chat_id"
    t.datetime "updated_at", null: false
  end

  create_table "support_chats", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "assigned_to_id"
    t.uuid "chatable_id"
    t.string "chatable_type", null: false
    t.datetime "created_at", null: false
    t.string "session_token", null: false
    t.string "status", default: "open"
    t.string "subject"
    t.datetime "updated_at", null: false
    t.index ["session_token"], name: "index_support_chats_on_session_token"
  end

  create_table "ticket_messages", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.jsonb "attachments", default: []
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.boolean "internal_note", default: false
    t.uuid "sender_id"
    t.string "sender_type", null: false
    t.uuid "ticket_id"
    t.datetime "updated_at", null: false
  end

  create_table "tickets", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "assigned_to_id"
    t.datetime "created_at", null: false
    t.uuid "deposit_id"
    t.uuid "order_id"
    t.string "priority", default: "normal"
    t.string "status", default: "open", null: false
    t.string "subject", null: false
    t.datetime "updated_at", null: false
    t.uuid "user_id"
    t.string "user_type", null: false
    t.index ["deposit_id"], name: "index_tickets_on_deposit_id"
    t.index ["status"], name: "index_tickets_on_status"
  end

  create_table "transactions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.decimal "amount"
    t.datetime "created_at", null: false
    t.string "currency"
    t.string "description"
    t.string "gateway_reference"
    t.string "gateway_transaction_id"
    t.jsonb "metadata"
    t.string "payment_gateway"
    t.uuid "reference_id"
    t.string "reference_type", null: false
    t.string "status"
    t.uuid "transactable_id"
    t.string "transactable_type", null: false
    t.string "transaction_type"
    t.datetime "updated_at", null: false
  end

  create_table "usa_esim_credentials", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.bigint "PIN1", default: 1111, null: false
    t.bigint "PIN2", default: 2222, null: false
    t.bigint "PUK1", null: false
    t.bigint "PUK2", null: false
    t.timestamptz "assigned_at"
    t.timestamptz "created_at", default: -> { "now()" }
    t.text "iccid", null: false
    t.uuid "order_id"
    t.text "provider", default: "lyca", null: false
    t.text "qr_activation_code"
    t.text "qr_code"
    t.text "status", default: "available"
    t.timestamptz "updated_at", default: -> { "now()" }
    t.uuid "user_id"
    t.text "zip_code"
    t.index ["provider"], name: "usa_esim_credentials_provider_idx"
    t.index ["status"], name: "usa_esim_credentials_status_idx"
    t.check_constraint "provider = ANY (ARRAY['colt'::text, 'lyca'::text])", name: "usa_esim_credentials_provider_check"
    t.check_constraint "status = ANY (ARRAY['available'::text, 'assigned'::text])", name: "usa_esim_credentials_status_check"
    t.unique_constraint ["iccid"], name: "usa_esim_credentials_iccid_key"
  end

  create_table "usa_esim_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.uuid "order_id"
    t.string "provider"
    t.integer "quantity"
    t.string "status"
    t.decimal "total_amount"
    t.datetime "updated_at", null: false
  end

  create_table "user_impersonation_logs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.uuid "employee_id"
    t.datetime "ended_at"
    t.string "ip_address"
    t.string "reason"
    t.datetime "started_at"
    t.datetime "updated_at", null: false
    t.uuid "user_id"
  end

  create_table "user_sessions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
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
    t.uuid "user_id"
    t.string "utm_campaign"
    t.string "utm_content"
    t.string "utm_medium"
    t.string "utm_source"
    t.string "utm_term"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "city"
    t.string "country"
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "email"
    t.string "email_confirmation_token"
    t.datetime "email_verified_at"
    t.string "first_name"
    t.string "ip_address"
    t.boolean "jellyfin_account_created", default: false
    t.string "jellyfin_password"
    t.string "jellyfin_username"
    t.datetime "last_login_at"
    t.string "last_name"
    t.datetime "last_seen_at"
    t.jsonb "metadata"
    t.integer "myproxyapi_country_id"
    t.string "myproxyapi_user_id"
    t.string "owner_type", default: "platform", null: false
    t.string "password_digest"
    t.datetime "password_reset_sent_at"
    t.string "password_reset_token"
    t.string "phone"
    t.string "profile_picture_url"
    t.string "provider"
    t.string "referred_by_code"
    t.uuid "reseller_id"
    t.string "status"
    t.integer "token_version", default: 1, null: false
    t.string "uid"
    t.datetime "updated_at", null: false
    t.string "username"
    t.index ["email"], name: "index_users_on_email"
    t.index ["owner_type"], name: "index_users_on_owner_type"
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true, where: "(provider IS NOT NULL)"
    t.index ["referred_by_code"], name: "index_users_on_referred_by_code"
    t.index ["reseller_id"], name: "index_users_on_reseller_id"
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  create_table "vm_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "country_code"
    t.integer "cpu_cores"
    t.datetime "created_at", null: false
    t.integer "disk_gb"
    t.uuid "order_id"
    t.string "os_type"
    t.integer "ram_gb"
    t.string "status"
    t.datetime "updated_at", null: false
    t.string "vm_type"
  end

  create_table "vms", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "ansible_playbook_run_id"
    t.jsonb "api_response", default: {}
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "dns_name"
    t.datetime "expires_at"
    t.string "hostname"
    t.string "ip_address"
    t.jsonb "metadata"
    t.string "private_ip_address", comment: "Private IP on vmbr1 for Windows VMs"
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
    t.uuid "vm_order_id"
    t.string "vm_type"
    t.index ["private_ip_address"], name: "index_vms_on_private_ip_address", unique: true
  end

  create_table "vpn_accounts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.uuid "order_id"
    t.string "password", null: false
    t.string "protocol", default: "wireguard"
    t.string "server", null: false
    t.string "status", default: "pending"
    t.datetime "updated_at", null: false
    t.string "username", null: false
    t.index ["username"], name: "index_vpn_accounts_on_username", unique: true
  end

  create_table "vpn_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.string "myproxyapi_order_id"
    t.uuid "order_id"
    t.string "status"
    t.datetime "updated_at", null: false
  end

  create_table "vpns", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "country_code"
    t.datetime "created_at", null: false
    t.jsonb "metadata"
    t.string "myproxyapi_order_id"
    t.text "ovpn_config_content"
    t.string "ovpn_config_url"
    t.string "status"
    t.datetime "updated_at", null: false
    t.uuid "vpn_order_id"
    t.string "vpn_password"
    t.string "vpn_username"
  end

  create_table "wallet_transactions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.decimal "amount"
    t.decimal "balance_after"
    t.decimal "balance_before"
    t.datetime "created_at", null: false
    t.string "description"
    t.string "entry_hash"
    t.datetime "locked_at"
    t.jsonb "metadata"
    t.string "parent_hash"
    t.uuid "transaction_id"
    t.string "transaction_type"
    t.datetime "updated_at", null: false
    t.uuid "wallet_id"
    t.index ["entry_hash"], name: "index_wallet_transactions_on_entry_hash", unique: true
    t.index ["parent_hash"], name: "index_wallet_transactions_on_parent_hash"
  end

  create_table "wallets", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.uuid "owner_id"
    t.string "owner_type"
    t.string "status", default: "active"
    t.datetime "updated_at", null: false
    t.uuid "user_id"
    t.string "wallet_type", default: "main", null: false
    t.index ["owner_id", "owner_type", "wallet_type"], name: "index_wallets_on_owner_and_type"
  end

  create_table "webhook_endpoints", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.jsonb "events", default: []
    t.uuid "reseller_id"
    t.string "secret", null: false
    t.datetime "updated_at", null: false
    t.string "url", null: false
  end

  create_table "webhook_events", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "attempts"
    t.datetime "created_at", null: false
    t.string "event_type"
    t.datetime "last_attempt_at"
    t.jsonb "payload"
    t.uuid "reseller_id"
    t.text "response_body"
    t.integer "response_code"
    t.string "signature"
    t.string "status"
    t.datetime "updated_at", null: false
    t.string "webhook_url"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "admin_action_logs", "employees"
  add_foreign_key "affiliate_payouts", "affiliates"
  add_foreign_key "affiliate_referrals", "affiliates"
  add_foreign_key "affiliate_referrals", "orders"
  add_foreign_key "ansible_runs", "vms"
  add_foreign_key "api_tokens", "resellers"
  add_foreign_key "billing_histories", "resellers", column: "billable_id"
  add_foreign_key "cart_items", "carts"
  add_foreign_key "cart_items", "product_pricings"
  add_foreign_key "cart_items", "products"
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
  add_foreign_key "guest_chat_messages", "guest_chats"
  add_foreign_key "guest_chats", "employees", column: "assigned_to_id"
  add_foreign_key "mobile_proxies", "mobile_proxy_orders"
  add_foreign_key "mobile_proxies", "orders"
  add_foreign_key "mobile_proxy_orders", "orders"
  add_foreign_key "order_items", "ecommerce_orders"
  add_foreign_key "order_items", "product_pricings"
  add_foreign_key "order_items", "products"
  add_foreign_key "orders", "checkout_sessions"
  add_foreign_key "orders", "product_pricings"
  add_foreign_key "orders", "products"
  add_foreign_key "payment_gateway_transactions", "transactions"
  add_foreign_key "payouts", "resellers"
  add_foreign_key "premium_isp_proxies", "premium_isp_proxy_orders"
  add_foreign_key "premium_isp_proxy_orders", "orders"
  add_foreign_key "product_analytics", "products"
  add_foreign_key "product_pricings", "products"
  add_foreign_key "products", "product_categories"
  add_foreign_key "proxmox_operations", "vms"
  add_foreign_key "proxy_assignments", "orders"
  add_foreign_key "proxy_assignments", "proxy_instances"
  add_foreign_key "reseller_orders", "orders"
  add_foreign_key "reseller_orders", "resellers"
  add_foreign_key "resellers", "product_categories", column: "allowed_product_category_id"
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
  add_foreign_key "support_chat_messages", "support_chats"
  add_foreign_key "support_chats", "employees", column: "assigned_to_id"
  add_foreign_key "ticket_messages", "tickets"
  add_foreign_key "tickets", "deposits"
  add_foreign_key "tickets", "employees", column: "assigned_to_id"
  add_foreign_key "tickets", "orders"
  add_foreign_key "usa_esim_credentials", "usa_esim_orders", column: "order_id", name: "usa_esim_credentials_order_id_fkey"
  add_foreign_key "usa_esim_credentials", "users", name: "usa_esim_credentials_user_id_fkey"
  add_foreign_key "usa_esim_orders", "orders"
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
