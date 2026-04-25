# ProxySock Full System API Reference
This document outlines every single endpoint exposed in the ProxySock application, generated directly from the routing engine to ensure 100% accuracy. No endpoint is missed.

## Webhooks

### POST `/esim`
- **Controller**: `webhooks/esim_access`
- **Action**: `webhook`

### GET `/webhooks/esim_access/webhook`
- **Controller**: `webhooks/esim_access`
- **Action**: `webhook`

### POST `/webhooks/fastspring`
- **Controller**: `webhooks`
- **Action**: `fastspring`

### POST `/webhooks/hundredpay`
- **Controller**: `webhooks`
- **Action**: `hundredpay`

### POST `/webhooks/paystack`
- **Controller**: `webhooks`
- **Action**: `paystack`

### POST `/webhooks/payvra`
- **Controller**: `webhooks`
- **Action**: `payvra`

### POST `/webhooks/plisio`
- **Controller**: `webhooks`
- **Action**: `plisio`

## System / Miscellaneous

### GET `/auth/failure`
- **Controller**: `web/api/auth`
- **Action**: `failure`

### GET `/metrics`
- **Controller**: `metrics`
- **Action**: `index`

### POST `/rails/action_mailbox/mailgun/inbound_emails/mime`
- **Controller**: `action_mailbox/ingresses/mailgun/inbound_emails`
- **Action**: `create`

### GET `/rails/action_mailbox/mandrill/inbound_emails`
- **Controller**: `action_mailbox/ingresses/mandrill/inbound_emails`
- **Action**: `health_check`

### POST `/rails/action_mailbox/mandrill/inbound_emails`
- **Controller**: `action_mailbox/ingresses/mandrill/inbound_emails`
- **Action**: `create`

### POST `/rails/action_mailbox/postmark/inbound_emails`
- **Controller**: `action_mailbox/ingresses/postmark/inbound_emails`
- **Action**: `create`

### POST `/rails/action_mailbox/relay/inbound_emails`
- **Controller**: `action_mailbox/ingresses/relay/inbound_emails`
- **Action**: `create`

### POST `/rails/action_mailbox/sendgrid/inbound_emails`
- **Controller**: `action_mailbox/ingresses/sendgrid/inbound_emails`
- **Action**: `create`

### GET `/rails/active_storage/blobs/:signed_id/*filename`
- **Controller**: `active_storage/blobs/redirect`
- **Action**: `show`

### GET `/rails/active_storage/blobs/proxy/:signed_id/*filename`
- **Controller**: `active_storage/blobs/proxy`
- **Action**: `show`

### GET `/rails/active_storage/blobs/redirect/:signed_id/*filename`
- **Controller**: `active_storage/blobs/redirect`
- **Action**: `show`

### POST `/rails/active_storage/direct_uploads`
- **Controller**: `active_storage/direct_uploads`
- **Action**: `create`

### GET `/rails/active_storage/disk/:encoded_key/*filename`
- **Controller**: `active_storage/disk`
- **Action**: `show`

### PUT `/rails/active_storage/disk/:encoded_token`
- **Controller**: `active_storage/disk`
- **Action**: `update`

### GET `/rails/active_storage/representations/:signed_blob_id/:variation_key/*filename`
- **Controller**: `active_storage/representations/redirect`
- **Action**: `show`

### GET `/rails/active_storage/representations/proxy/:signed_blob_id/:variation_key/*filename`
- **Controller**: `active_storage/representations/proxy`
- **Action**: `show`

### GET `/rails/active_storage/representations/redirect/:signed_blob_id/:variation_key/*filename`
- **Controller**: `active_storage/representations/redirect`
- **Action**: `show`

### POST `/rails/conductor/action_mailbox/:inbound_email_id/incinerate`
- **Controller**: `rails/conductor/action_mailbox/incinerates`
- **Action**: `create`

### POST `/rails/conductor/action_mailbox/:inbound_email_id/reroute`
- **Controller**: `rails/conductor/action_mailbox/reroutes`
- **Action**: `create`

### GET `/rails/conductor/action_mailbox/inbound_emails`
- **Controller**: `rails/conductor/action_mailbox/inbound_emails`
- **Action**: `index`

### POST `/rails/conductor/action_mailbox/inbound_emails`
- **Controller**: `rails/conductor/action_mailbox/inbound_emails`
- **Action**: `create`

### GET `/rails/conductor/action_mailbox/inbound_emails/:id`
- **Controller**: `rails/conductor/action_mailbox/inbound_emails`
- **Action**: `show`

### GET `/rails/conductor/action_mailbox/inbound_emails/new`
- **Controller**: `rails/conductor/action_mailbox/inbound_emails`
- **Action**: `new`

### POST `/rails/conductor/action_mailbox/inbound_emails/sources`
- **Controller**: `rails/conductor/action_mailbox/inbound_emails/sources`
- **Action**: `create`

### GET `/rails/conductor/action_mailbox/inbound_emails/sources/new`
- **Controller**: `rails/conductor/action_mailbox/inbound_emails/sources`
- **Action**: `new`

### GET `/up`
- **Controller**: `rails/health`
- **Action**: `show`

### POST `/vm/:id/status`
- **Controller**: `vm_callbacks`
- **Action**: `status`

## Reseller API (V1)

### POST `/api/v1/auth/login`
- **Controller**: `api/v1/auth`
- **Action**: `login`

### GET `/api/v1/auth/me`
- **Controller**: `api/v1/auth`
- **Action**: `me`

### POST `/api/v1/auth/refresh`
- **Controller**: `api/v1/auth`
- **Action**: `refresh`

### POST `/api/v1/auth/token`
- **Controller**: `api/v1/auth`
- **Action**: `token`

### POST `/api/v1/auth/zoho_callback`
- **Controller**: `api/v1/auth`
- **Action**: `zoho_callback`

### GET `/api/v1/billing/balance`
- **Controller**: `api/v1/billing`
- **Action**: `balance`

### POST `/api/v1/billing/request_payout`
- **Controller**: `api/v1/billing`
- **Action**: `request_payout`

### GET `/api/v1/billing/transactions`
- **Controller**: `api/v1/billing`
- **Action**: `transactions`

### POST `/api/v1/billing/transfer_earnings`
- **Controller**: `api/v1/billing`
- **Action**: `transfer_earnings`

### POST `/api/v1/guest_chats`
- **Controller**: `api/v1/guest_chats`
- **Action**: `create`

### GET `/api/v1/guest_chats/:id`
- **Controller**: `api/v1/guest_chats`
- **Action**: `show`

### POST `/api/v1/guest_chats/:id/messages`
- **Controller**: `api/v1/guest_chats`
- **Action**: `add_message`

### GET `/api/v1/notifications`
- **Controller**: `api/v1/notifications`
- **Action**: `index`

### GET `/api/v1/notifications/:id`
- **Controller**: `api/v1/notifications`
- **Action**: `show`

### PUT `/api/v1/notifications/:id/read`
- **Controller**: `api/v1/notifications`
- **Action**: `read`

### POST `/api/v1/notifications/mark_as_read`
- **Controller**: `api/v1/notifications`
- **Action**: `mark_as_read`

### PUT `/api/v1/notifications/read_all`
- **Controller**: `api/v1/notifications`
- **Action**: `read_all`

### GET `/api/v1/notifications/unread_count`
- **Controller**: `api/v1/notifications`
- **Action**: `unread_count`

### GET `/api/v1/orders`
- **Controller**: `api/v1/orders`
- **Action**: `index`

### POST `/api/v1/orders`
- **Controller**: `api/v1/orders`
- **Action**: `create`

### GET `/api/v1/orders/:id`
- **Controller**: `api/v1/orders`
- **Action**: `show`

### POST `/api/v1/orders/:id/cancel`
- **Controller**: `api/v1/orders`
- **Action**: `cancel`

### GET `/api/v1/orders/:id/credentials`
- **Controller**: `api/v1/orders`
- **Action**: `credentials`

### POST `/api/v1/orders/:id/renew`
- **Controller**: `api/v1/orders`
- **Action**: `renew`

### POST `/api/v1/orders/:id/reorder`
- **Controller**: `api/v1/orders`
- **Action**: `reorder`

### POST `/api/v1/orders/:id/update_subscription`
- **Controller**: `api/v1/orders`
- **Action**: `update_subscription`

### POST `/api/v1/orders/checkout_cart`
- **Controller**: `api/v1/orders`
- **Action**: `checkout_cart`

### GET `/api/v1/orders/stats`
- **Controller**: `api/v1/orders`
- **Action**: `stats`

### GET `/api/v1/payouts`
- **Controller**: `api/v1/payouts`
- **Action**: `index`

### POST `/api/v1/payouts`
- **Controller**: `api/v1/payouts`
- **Action**: `create`

### GET `/api/v1/payouts/:id`
- **Controller**: `api/v1/payouts`
- **Action**: `show`

### GET `/api/v1/product_categories`
- **Controller**: `api/v1/product_categories`
- **Action**: `index`

### GET `/api/v1/products`
- **Controller**: `api/v1/products`
- **Action**: `index`

### GET `/api/v1/products/:id`
- **Controller**: `api/v1/products`
- **Action**: `show`

### GET `/api/v1/resellers`
- **Controller**: `api/v1/resellers`
- **Action**: `index`

### GET `/api/v1/resellers/:id`
- **Controller**: `api/v1/resellers`
- **Action**: `show`

### PATCH `/api/v1/resellers/:id`
- **Controller**: `api/v1/resellers`
- **Action**: `update`

### PUT `/api/v1/resellers/:id`
- **Controller**: `api/v1/resellers`
- **Action**: `update`

### POST `/api/v1/resellers/:id/deposit`
- **Controller**: `api/v1/resellers`
- **Action**: `deposit`

### POST `/api/v1/resellers/:id/rotate_dedicated_api_key`
- **Controller**: `api/v1/resellers`
- **Action**: `rotate_dedicated_api_key`

### GET `/api/v1/support_chats`
- **Controller**: `api/v1/support_chats`
- **Action**: `index`

### GET `/api/v1/support_chats/:id`
- **Controller**: `api/v1/support_chats`
- **Action**: `show`

### POST `/api/v1/support_chats/messages`
- **Controller**: `api/v1/support_chats`
- **Action**: `add_message`

### GET `/api/v1/tickets`
- **Controller**: `api/v1/tickets`
- **Action**: `index`

### POST `/api/v1/tickets`
- **Controller**: `api/v1/tickets`
- **Action**: `create`

### GET `/api/v1/tickets/:id`
- **Controller**: `api/v1/tickets`
- **Action**: `show`

### POST `/api/v1/tickets/:id/reply`
- **Controller**: `api/v1/tickets`
- **Action**: `reply`

### GET `/api/v1/users`
- **Controller**: `api/v1/users`
- **Action**: `index`

### POST `/api/v1/users`
- **Controller**: `api/v1/users`
- **Action**: `create`

### GET `/api/v1/users/:id`
- **Controller**: `api/v1/users`
- **Action**: `show`

### PATCH `/api/v1/users/:id`
- **Controller**: `api/v1/users`
- **Action**: `update`

### PUT `/api/v1/users/:id`
- **Controller**: `api/v1/users`
- **Action**: `update`

### DELETE `/api/v1/users/:id`
- **Controller**: `api/v1/users`
- **Action**: `destroy`

### GET `/api/v1/users/:id/orders`
- **Controller**: `api/v1/users`
- **Action**: `orders`

### GET `/api/v1/users/:id/transactions`
- **Controller**: `api/v1/users`
- **Action**: `transactions`

### GET `/api/v1/vms`
- **Controller**: `api/v1/vms`
- **Action**: `index`

### POST `/api/v1/vms`
- **Controller**: `api/v1/vms`
- **Action**: `create`

### GET `/api/v1/vms/:id`
- **Controller**: `api/v1/vms`
- **Action**: `show`

### DELETE `/api/v1/vms/:id`
- **Controller**: `api/v1/vms`
- **Action**: `destroy`

### POST `/api/v1/vms/:id/restart`
- **Controller**: `api/v1/vms`
- **Action**: `restart`

### POST `/api/v1/vms/:id/start`
- **Controller**: `api/v1/vms`
- **Action**: `start`

### GET `/api/v1/vms/:id/status`
- **Controller**: `api/v1/vms`
- **Action**: `status`

### POST `/api/v1/vms/:id/stop`
- **Controller**: `api/v1/vms`
- **Action**: `stop`

### GET `/api/v1/webhook_endpoints`
- **Controller**: `api/v1/webhook_endpoints`
- **Action**: `index`

### POST `/api/v1/webhook_endpoints`
- **Controller**: `api/v1/webhook_endpoints`
- **Action**: `create`

### PATCH `/api/v1/webhook_endpoints/:id`
- **Controller**: `api/v1/webhook_endpoints`
- **Action**: `update`

### PUT `/api/v1/webhook_endpoints/:id`
- **Controller**: `api/v1/webhook_endpoints`
- **Action**: `update`

### DELETE `/api/v1/webhook_endpoints/:id`
- **Controller**: `api/v1/webhook_endpoints`
- **Action**: `destroy`

### POST `/api/v1/webhook_endpoints/:id/verify`
- **Controller**: `api/v1/webhook_endpoints`
- **Action**: `verify`

## Web (E-Commerce) API

### GET `/web/api/affiliate`
- **Controller**: `web/api/affiliates`
- **Action**: `show`

### POST `/web/api/affiliate`
- **Controller**: `web/api/affiliates`
- **Action**: `create`

### POST `/web/api/affiliate/request_payout`
- **Controller**: `web/api/affiliates`
- **Action**: `request_payout`

### POST `/web/api/affiliate/transfer_earnings`
- **Controller**: `web/api/affiliates`
- **Action**: `transfer_earnings`

### GET `/web/api/affiliate_payouts`
- **Controller**: `web/api/affiliate_payouts`
- **Action**: `index`

### GET `/web/api/affiliate_referrals`
- **Controller**: `web/api/affiliate_referrals`
- **Action**: `index`

### POST `/web/api/analytics/reddit-capi`
- **Controller**: `web/api/analytics`
- **Action**: `reddit_capi`

### POST `/web/api/auth/change_password`
- **Controller**: `web/api/auth`
- **Action**: `change_password`

### GET `/web/api/auth/check_username`
- **Controller**: `web/api/auth`
- **Action**: `check_username`

### GET `/web/api/auth/confirm_email`
- **Controller**: `web/api/auth`
- **Action**: `confirm_email`

### GET `/web/api/auth/failure`
- **Controller**: `web/api/auth`
- **Action**: `failure`

### POST `/web/api/auth/forgot_password`
- **Controller**: `web/api/auth`
- **Action**: `forgot_password`

### GET `/web/api/auth/google`
- **Controller**: `web/api/auth`
- **Action**: `google`

### GET `/web/api/auth/google/callback`
- **Controller**: `web/api/auth`
- **Action**: `google_callback`

### POST `/web/api/auth/login`
- **Controller**: `web/api/auth`
- **Action**: `login`

### DELETE `/web/api/auth/logout`
- **Controller**: `web/api/auth`
- **Action**: `logout`

### GET `/web/api/auth/me`
- **Controller**: `web/api/auth`
- **Action**: `me`

### PUT `/web/api/auth/me`
- **Controller**: `web/api/auth`
- **Action**: `update`

### POST `/web/api/auth/refresh`
- **Controller**: `web/api/auth`
- **Action**: `refresh`

### POST `/web/api/auth/register`
- **Controller**: `web/api/auth`
- **Action**: `register`

### POST `/web/api/auth/resend_confirmation`
- **Controller**: `web/api/auth`
- **Action**: `resend_confirmation`

### POST `/web/api/auth/reset_password`
- **Controller**: `web/api/auth`
- **Action**: `reset_password`

### GET `/web/api/auth/twitter`
- **Controller**: `web/api/auth`
- **Action**: `twitter`

### GET `/web/api/auth/twitter/callback`
- **Controller**: `web/api/auth`
- **Action**: `twitter_callback`

### PATCH `/web/api/auth/update_profile`
- **Controller**: `web/api/auth`
- **Action**: `update_profile`

### GET `/web/api/billing/balance`
- **Controller**: `web/api/billing`
- **Action**: `balance`

### GET `/web/api/billing/history`
- **Controller**: `web/api/billing`
- **Action**: `history`

### GET `/web/api/billing/transactions`
- **Controller**: `web/api/billing`
- **Action**: `transactions`

### POST `/web/api/billing/verify_and_sync`
- **Controller**: `web/api/billing`
- **Action**: `verify_and_sync`

### GET `/web/api/blog_posts`
- **Controller**: `web/api/blog_posts`
- **Action**: `index`

### GET `/web/api/blog_posts/:slug`
- **Controller**: `web/api/blog_posts`
- **Action**: `show`

### GET `/web/api/cart`
- **Controller**: `web/api/carts`
- **Action**: `show`

### POST `/web/api/cart/add_item`
- **Controller**: `web/api/carts`
- **Action**: `add_item`

### POST `/web/api/cart/checkout`
- **Controller**: `web/api/carts`
- **Action**: `checkout`

### DELETE `/web/api/cart/remove_item`
- **Controller**: `web/api/carts`
- **Action**: `remove_item`

### POST `/web/api/credential_changes/proxy/:id/credentials`
- **Controller**: `web/api/credential_changes`
- **Action**: `proxy_credentials`

### POST `/web/api/credential_changes/proxy/:id/rotate_ip`
- **Controller**: `web/api/credential_changes`
- **Action**: `proxy_rotate_ip`

### POST `/web/api/credential_changes/vm/:id/password`
- **Controller**: `web/api/credential_changes`
- **Action**: `vm_password`

### GET `/web/api/exchange_rates/show`
- **Controller**: `web/api/exchange_rates`
- **Action**: `show`

### POST `/web/api/monitoring/login`
- **Controller**: `web/api/monitoring`
- **Action**: `login`

### GET `/web/api/notifications`
- **Controller**: `web/api/notifications`
- **Action**: `index`

### GET `/web/api/notifications/:id`
- **Controller**: `web/api/notifications`
- **Action**: `show`

### PUT `/web/api/notifications/:id/read`
- **Controller**: `web/api/notifications`
- **Action**: `read`

### POST `/web/api/notifications/mark_as_read`
- **Controller**: `web/api/notifications`
- **Action**: `mark_as_read`

### PUT `/web/api/notifications/read_all`
- **Controller**: `web/api/notifications`
- **Action**: `read_all`

### GET `/web/api/notifications/unread_count`
- **Controller**: `web/api/notifications`
- **Action**: `unread_count`

### GET `/web/api/orders`
- **Controller**: `web/api/orders`
- **Action**: `index`

### POST `/web/api/orders`
- **Controller**: `web/api/orders`
- **Action**: `create`

### GET `/web/api/orders/:id`
- **Controller**: `web/api/orders`
- **Action**: `show`

### POST `/web/api/orders/:id/change_protocol`
- **Controller**: `web/api/orders`
- **Action**: `change_protocol`

### POST `/web/api/orders/:id/claim_crypto_refund`
- **Controller**: `web/api/orders`
- **Action**: `claim_crypto_refund`

### GET `/web/api/orders/:id/credentials`
- **Controller**: `web/api/orders`
- **Action**: `credentials`

### GET `/web/api/orders/:id/download_invoice`
- **Controller**: `web/api/orders`
- **Action**: `download_invoice`

### GET `/web/api/orders/:id/download_ovpn`
- **Controller**: `web/api/orders`
- **Action**: `download_ovpn`

### GET `/web/api/orders/:id/download_rdp_config`
- **Controller**: `web/api/orders`
- **Action**: `download_rdp_config`

### POST `/web/api/orders/:id/renew`
- **Controller**: `web/api/orders`
- **Action**: `renew`

### POST `/web/api/orders/:id/reorder`
- **Controller**: `web/api/orders`
- **Action**: `reorder`

### POST `/web/api/orders/:id/rotate_ip`
- **Controller**: `web/api/orders`
- **Action**: `rotate_ip`

### POST `/web/api/orders/:id/update_credentials`
- **Controller**: `web/api/orders`
- **Action**: `update_credentials`

### POST `/web/api/orders/:id/update_subscription`
- **Controller**: `web/api/orders`
- **Action**: `update_subscription`

### POST `/web/api/orders/:id/whitelist`
- **Controller**: `web/api/orders`
- **Action**: `whitelist_add`

### DELETE `/web/api/orders/:id/whitelist`
- **Controller**: `web/api/orders`
- **Action**: `whitelist_delete`

### POST `/web/api/orders/checkout_cart`
- **Controller**: `web/api/orders`
- **Action**: `checkout_cart`

### GET `/web/api/orders/stats`
- **Controller**: `web/api/orders`
- **Action**: `stats`

### GET `/web/api/orders/stats`
- **Controller**: `web/api/orders`
- **Action**: `stats`

### GET `/web/api/products`
- **Controller**: `web/api/products`
- **Action**: `index`

### GET `/web/api/products/:id`
- **Controller**: `web/api/products`
- **Action**: `show`

### POST `/web/api/promo_codes/validate`
- **Controller**: `web/api/promo_codes`
- **Action**: `validate`

### GET `/web/api/residential-rotating/countries`
- **Controller**: `web/api/products`
- **Action**: `residential_rotating_countries`

### GET `/web/api/support_chats`
- **Controller**: `web/api/support_chats`
- **Action**: `index`

### GET `/web/api/support_chats/:id`
- **Controller**: `web/api/support_chats`
- **Action**: `show`

### POST `/web/api/support_chats/messages`
- **Controller**: `web/api/support_chats`
- **Action**: `add_message`

### GET `/web/api/tickets`
- **Controller**: `web/api/tickets`
- **Action**: `index`

### POST `/web/api/tickets`
- **Controller**: `web/api/tickets`
- **Action**: `create`

### GET `/web/api/tickets/:id`
- **Controller**: `web/api/tickets`
- **Action**: `show`

### POST `/web/api/tickets/:id/reply`
- **Controller**: `web/api/tickets`
- **Action**: `reply`

### GET `/web/api/tools/ip_checker`
- **Controller**: `web/api/tools`
- **Action**: `ip_checker`

### GET `/web/api/tools/ip_lookup`
- **Controller**: `web/api/tools`
- **Action**: `ip_lookup`

### GET `/web/api/vms`
- **Controller**: `web/api/vms`
- **Action**: `index`

### POST `/web/api/vms`
- **Controller**: `web/api/vms`
- **Action**: `create`

### GET `/web/api/vms/:id`
- **Controller**: `web/api/vms`
- **Action**: `show`

### DELETE `/web/api/vms/:id`
- **Controller**: `web/api/vms`
- **Action**: `destroy`

### POST `/web/api/vms/:id/reboot`
- **Controller**: `web/api/vms`
- **Action**: `reboot`

### POST `/web/api/vms/:id/start`
- **Controller**: `web/api/vms`
- **Action**: `start`

### GET `/web/api/vms/:id/status`
- **Controller**: `web/api/vms`
- **Action**: `status`

### POST `/web/api/vms/:id/stop`
- **Controller**: `web/api/vms`
- **Action**: `stop`

### GET `/web/api/wallet`
- **Controller**: `web/api/wallets`
- **Action**: `show`

### POST `/web/api/wallet/deposit`
- **Controller**: `web/api/wallets`
- **Action**: `deposit`

### GET `/web/api/webhooks`
- **Controller**: `web/api/webhooks`
- **Action**: `index`

### POST `/web/api/webhooks`
- **Controller**: `web/api/webhooks`
- **Action**: `create`

### DELETE `/web/api/webhooks/:id`
- **Controller**: `web/api/webhooks`
- **Action**: `destroy`

### POST `/web/api/webhooks/:id/verify`
- **Controller**: `web/api/webhooks`
- **Action**: `verify`

## Admin API

### GET `/admin/api/affiliate_payouts`
- **Controller**: `admin/api/affiliate_payouts`
- **Action**: `index`

### GET `/admin/api/affiliate_payouts/:id`
- **Controller**: `admin/api/affiliate_payouts`
- **Action**: `show`

### PATCH `/admin/api/affiliate_payouts/:id/process_payout`
- **Controller**: `admin/api/affiliate_payouts`
- **Action**: `process_payout`

### GET `/admin/api/affiliates`
- **Controller**: `admin/api/affiliates`
- **Action**: `index`

### POST `/admin/api/affiliates`
- **Controller**: `admin/api/affiliates`
- **Action**: `create`

### GET `/admin/api/affiliates/:id`
- **Controller**: `admin/api/affiliates`
- **Action**: `show`

### PATCH `/admin/api/affiliates/:id`
- **Controller**: `admin/api/affiliates`
- **Action**: `update`

### PUT `/admin/api/affiliates/:id`
- **Controller**: `admin/api/affiliates`
- **Action**: `update`

### DELETE `/admin/api/affiliates/:id`
- **Controller**: `admin/api/affiliates`
- **Action**: `destroy`

### PATCH `/admin/api/affiliates/:id/configure`
- **Controller**: `admin/api/affiliates`
- **Action**: `configure`

### GET `/admin/api/analytics/conversions`
- **Controller**: `admin/api/analytics`
- **Action**: `conversions`

### GET `/admin/api/analytics/dashboard`
- **Controller**: `admin/api/analytics`
- **Action**: `dashboard`

### GET `/admin/api/analytics/geolocation`
- **Controller**: `admin/api/analytics`
- **Action**: `geolocation`

### GET `/admin/api/analytics/products`
- **Controller**: `admin/api/analytics`
- **Action**: `products`

### GET `/admin/api/analytics/revenue`
- **Controller**: `admin/api/analytics`
- **Action**: `revenue`

### GET `/admin/api/analytics/traffic`
- **Controller**: `admin/api/analytics`
- **Action**: `traffic`

### GET `/admin/api/auth/failure`
- **Controller**: `admin/api/auth`
- **Action**: `failure`

### POST `/admin/api/auth/login`
- **Controller**: `admin/api/auth`
- **Action**: `login`

### GET `/admin/api/auth/zoho`
- **Controller**: `admin/api/auth`
- **Action**: `zoho`

### GET `/admin/api/auth/zoho/callback`
- **Controller**: `admin/api/auth`
- **Action**: `zoho_callback`

### GET `/admin/api/blog_posts`
- **Controller**: `admin/api/blog_posts`
- **Action**: `index`

### POST `/admin/api/blog_posts`
- **Controller**: `admin/api/blog_posts`
- **Action**: `create`

### GET `/admin/api/blog_posts/:slug`
- **Controller**: `admin/api/blog_posts`
- **Action**: `show`

### PATCH `/admin/api/blog_posts/:slug`
- **Controller**: `admin/api/blog_posts`
- **Action**: `update`

### PUT `/admin/api/blog_posts/:slug`
- **Controller**: `admin/api/blog_posts`
- **Action**: `update`

### DELETE `/admin/api/blog_posts/:slug`
- **Controller**: `admin/api/blog_posts`
- **Action**: `destroy`

### PATCH `/admin/api/blog_posts/:slug/publish`
- **Controller**: `admin/api/blog_posts`
- **Action**: `publish`

### PATCH `/admin/api/blog_posts/:slug/unpublish`
- **Controller**: `admin/api/blog_posts`
- **Action**: `unpublish`

### POST `/admin/api/database/query`
- **Controller**: `admin/api/database`
- **Action**: `query`

### GET `/admin/api/database/tables`
- **Controller**: `admin/api/database`
- **Action**: `tables`

### GET `/admin/api/employees`
- **Controller**: `admin/api/employees`
- **Action**: `index`

### POST `/admin/api/employees`
- **Controller**: `admin/api/employees`
- **Action**: `create`

### GET `/admin/api/employees/:id`
- **Controller**: `admin/api/employees`
- **Action**: `show`

### PATCH `/admin/api/employees/:id`
- **Controller**: `admin/api/employees`
- **Action**: `update`

### PUT `/admin/api/employees/:id`
- **Controller**: `admin/api/employees`
- **Action**: `update`

### DELETE `/admin/api/employees/:id`
- **Controller**: `admin/api/employees`
- **Action**: `destroy`

### POST `/admin/api/employees/:id/assign`
- **Controller**: `admin/api/employees`
- **Action**: `assign`

### GET `/admin/api/guest_chats`
- **Controller**: `admin/api/guest_chats`
- **Action**: `index`

### GET `/admin/api/guest_chats/:id`
- **Controller**: `admin/api/guest_chats`
- **Action**: `show`

### POST `/admin/api/guest_chats/:id/assign`
- **Controller**: `admin/api/guest_chats`
- **Action**: `assign`

### POST `/admin/api/guest_chats/:id/close`
- **Controller**: `admin/api/guest_chats`
- **Action**: `close`

### POST `/admin/api/guest_chats/:id/reply`
- **Controller**: `admin/api/guest_chats`
- **Action**: `reply`

### GET `/admin/api/monitoring`
- **Controller**: `admin/api/monitoring`
- **Action**: `index`

### GET `/admin/api/monitoring/audit_logs`
- **Controller**: `admin/api/monitoring`
- **Action**: `audit_logs`

### POST `/admin/api/monitoring/clear_dead`
- **Controller**: `admin/api/monitoring`
- **Action**: `clear_dead`

### POST `/admin/api/monitoring/clear_queue`
- **Controller**: `admin/api/monitoring`
- **Action**: `clear_queue`

### POST `/admin/api/monitoring/clear_retries`
- **Controller**: `admin/api/monitoring`
- **Action**: `clear_retries`

### GET `/admin/api/monitoring/dead_jobs`
- **Controller**: `admin/api/monitoring`
- **Action**: `dead_jobs`

### POST `/admin/api/monitoring/delete_job`
- **Controller**: `admin/api/monitoring`
- **Action**: `delete_job`

### GET `/admin/api/monitoring/error_logs`
- **Controller**: `admin/api/monitoring`
- **Action**: `error_logs`

### GET `/admin/api/monitoring/jobs`
- **Controller**: `admin/api/monitoring`
- **Action**: `jobs`

### GET `/admin/api/monitoring/queues`
- **Controller**: `admin/api/monitoring`
- **Action**: `queues`

### GET `/admin/api/monitoring/retries`
- **Controller**: `admin/api/monitoring`
- **Action**: `retries`

### POST `/admin/api/monitoring/retry_all`
- **Controller**: `admin/api/monitoring`
- **Action**: `retry_all`

### POST `/admin/api/monitoring/retry_job`
- **Controller**: `admin/api/monitoring`
- **Action**: `retry_job`

### GET `/admin/api/monitoring/scheduled_jobs`
- **Controller**: `admin/api/monitoring`
- **Action**: `scheduled_jobs`

### GET `/admin/api/monitoring/system_logs`
- **Controller**: `admin/api/monitoring`
- **Action**: `system_logs`

### GET `/admin/api/notifications`
- **Controller**: `admin/api/notifications`
- **Action**: `index`

### GET `/admin/api/notifications/:id`
- **Controller**: `admin/api/notifications`
- **Action**: `show`

### PUT `/admin/api/notifications/:id/read`
- **Controller**: `admin/api/notifications`
- **Action**: `read`

### POST `/admin/api/notifications/mark_as_read`
- **Controller**: `admin/api/notifications`
- **Action**: `mark_as_read`

### PUT `/admin/api/notifications/read_all`
- **Controller**: `admin/api/notifications`
- **Action**: `read_all`

### GET `/admin/api/notifications/unread_count`
- **Controller**: `admin/api/notifications`
- **Action**: `unread_count`

### GET `/admin/api/orders`
- **Controller**: `admin/api/orders`
- **Action**: `index`

### GET `/admin/api/orders/:id`
- **Controller**: `admin/api/orders`
- **Action**: `show`

### POST `/admin/api/orders/:id/refund`
- **Controller**: `admin/api/orders`
- **Action**: `refund`

### POST `/admin/api/orders/:id/rescue`
- **Controller**: `admin/api/orders`
- **Action**: `rescue`

### GET `/admin/api/products`
- **Controller**: `admin/api/products`
- **Action**: `index`

### POST `/admin/api/products`
- **Controller**: `admin/api/products`
- **Action**: `create`

### GET `/admin/api/products/:id`
- **Controller**: `admin/api/products`
- **Action**: `show`

### PATCH `/admin/api/products/:id`
- **Controller**: `admin/api/products`
- **Action**: `update`

### PUT `/admin/api/products/:id`
- **Controller**: `admin/api/products`
- **Action**: `update`

### DELETE `/admin/api/products/:id`
- **Controller**: `admin/api/products`
- **Action**: `destroy`

### POST `/admin/api/products/sync_esims`
- **Controller**: `admin/api/products`
- **Action**: `sync_esims`

### POST `/admin/api/products/sync_proxies`
- **Controller**: `admin/api/products`
- **Action**: `sync_proxies`

### POST `/admin/api/products/sync_rdp`
- **Controller**: `admin/api/products`
- **Action**: `sync_rdp`

### POST `/admin/api/products/sync_vpn`
- **Controller**: `admin/api/products`
- **Action**: `sync_vpn`

### POST `/admin/api/products/sync_vps`
- **Controller**: `admin/api/products`
- **Action**: `sync_vps`

### GET `/admin/api/promo_codes`
- **Controller**: `admin/api/promo_codes`
- **Action**: `index`

### POST `/admin/api/promo_codes`
- **Controller**: `admin/api/promo_codes`
- **Action**: `create`

### GET `/admin/api/promo_codes/:id`
- **Controller**: `admin/api/promo_codes`
- **Action**: `show`

### PATCH `/admin/api/promo_codes/:id`
- **Controller**: `admin/api/promo_codes`
- **Action**: `update`

### PUT `/admin/api/promo_codes/:id`
- **Controller**: `admin/api/promo_codes`
- **Action**: `update`

### DELETE `/admin/api/promo_codes/:id`
- **Controller**: `admin/api/promo_codes`
- **Action**: `destroy`

### GET `/admin/api/resellers`
- **Controller**: `admin/api/resellers`
- **Action**: `index`

### POST `/admin/api/resellers`
- **Controller**: `admin/api/resellers`
- **Action**: `create`

### GET `/admin/api/resellers/:id`
- **Controller**: `admin/api/resellers`
- **Action**: `show`

### PATCH `/admin/api/resellers/:id`
- **Controller**: `admin/api/resellers`
- **Action**: `update`

### PUT `/admin/api/resellers/:id`
- **Controller**: `admin/api/resellers`
- **Action**: `update`

### DELETE `/admin/api/resellers/:id`
- **Controller**: `admin/api/resellers`
- **Action**: `destroy`

### PATCH `/admin/api/resellers/:id/configure`
- **Controller**: `admin/api/resellers`
- **Action**: `configure`

### POST `/admin/api/resellers/:id/onboard`
- **Controller**: `admin/api/resellers`
- **Action**: `onboard`

### POST `/admin/api/settings/credit_wallet`
- **Controller**: `admin/api/settings`
- **Action**: `credit_wallet`

### POST `/admin/api/settings/debit_wallet`
- **Controller**: `admin/api/settings`
- **Action**: `debit_wallet`

### GET `/admin/api/settings/product_categories`
- **Controller**: `admin/api/settings`
- **Action**: `product_categories`

### POST `/admin/api/settings/product_categories`
- **Controller**: `admin/api/settings`
- **Action**: `create_product_category`

### GET `/admin/api/settings/system_info`
- **Controller**: `admin/api/settings`
- **Action**: `system_info`

### GET `/admin/api/support_chats`
- **Controller**: `admin/api/support_chats`
- **Action**: `index`

### GET `/admin/api/support_chats/:id`
- **Controller**: `admin/api/support_chats`
- **Action**: `show`

### POST `/admin/api/support_chats/:id/assign`
- **Controller**: `admin/api/support_chats`
- **Action**: `assign`

### POST `/admin/api/support_chats/:id/close`
- **Controller**: `admin/api/support_chats`
- **Action**: `close`

### POST `/admin/api/support_chats/:id/reply`
- **Controller**: `admin/api/support_chats`
- **Action**: `reply`

### GET `/admin/api/tickets`
- **Controller**: `admin/api/tickets`
- **Action**: `index`

### GET `/admin/api/tickets/:id`
- **Controller**: `admin/api/tickets`
- **Action**: `show`

### PATCH `/admin/api/tickets/:id`
- **Controller**: `admin/api/tickets`
- **Action**: `update`

### PUT `/admin/api/tickets/:id`
- **Controller**: `admin/api/tickets`
- **Action**: `update`

### POST `/admin/api/tickets/:id/reply`
- **Controller**: `admin/api/tickets`
- **Action**: `reply`

### POST `/admin/api/tickets/:id/rescue_order`
- **Controller**: `admin/api/tickets`
- **Action**: `rescue_order`

### GET `/admin/api/transactions`
- **Controller**: `admin/api/transactions`
- **Action**: `index`

### GET `/admin/api/transactions/:id`
- **Controller**: `admin/api/transactions`
- **Action**: `show`

### GET `/admin/api/usa_esim_credentials`
- **Controller**: `admin/api/usa_esim_credentials`
- **Action**: `index`

### DELETE `/admin/api/usa_esim_credentials/:id`
- **Controller**: `admin/api/usa_esim_credentials`
- **Action**: `destroy`

### POST `/admin/api/usa_esim_credentials/import`
- **Controller**: `admin/api/usa_esim_credentials`
- **Action**: `import`

### GET `/admin/api/users`
- **Controller**: `admin/api/users`
- **Action**: `index`

### GET `/admin/api/users/:id`
- **Controller**: `admin/api/users`
- **Action**: `show`

### PATCH `/admin/api/users/:id`
- **Controller**: `admin/api/users`
- **Action**: `update`

### PUT `/admin/api/users/:id`
- **Controller**: `admin/api/users`
- **Action**: `update`

### DELETE `/admin/api/users/:id`
- **Controller**: `admin/api/users`
- **Action**: `destroy`

### POST `/admin/api/users/:id/impersonate`
- **Controller**: `admin/api/users`
- **Action**: `impersonate`

### POST `/admin/api/users/:id/onboard`
- **Controller**: `admin/api/users`
- **Action**: `onboard`

