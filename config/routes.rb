# frozen_string_literal: true

Rails.application.routes.draw do
  mount Rswag::Ui::Engine => '/api-docs'
  mount Rswag::Api::Engine => '/api-docs'
  # Reseller API
  namespace :api do
    namespace :v1 do
      # Auth
      post 'auth/token', to: 'auth#token'
      post 'auth/login', to: 'auth#login'
      post 'auth/refresh', to: 'auth#refresh'

      # New admin-like routes for V1
      resources :auth, only: [] do
        collection do
          post :zoho_callback
          get :me
        end
      end
      resources :resellers, only: %i[index show update] do
        member do
          post :deposit # Keep existing deposit action
        end
      end

      resources :orders, only: %i[index create show] do
        get :stats, on: :collection
        member do
          get :credentials
          post :renew
          post :cancel
        end
      end

      resources :webhook_endpoints, only: %i[index create update destroy] do
        post :test, on: :member
      end

      resources :products, only: %i[index show]

      resources :tickets, only: %i[index create show] do
        post :reply, on: :member
      end

      resources :notifications, only: [:index] do
        post :mark_as_read, on: :collection
      end

      get 'billing/balance', to: 'billing#balance'
      get 'billing/transactions', to: 'billing#transactions'
      post 'billing/transfer_earnings', to: 'billing#transfer_earnings'
      post 'billing/request_payout', to: 'billing#request_payout'

      # VMs
      resources :vms, only: %i[index show create destroy] do
        member do
          post :start
          post :stop
          post :restart
          get :status
        end
      end

      # Guest Chat (public, no auth)
      resources :guest_chats, only: %i[create show] do
        post :messages, on: :member, action: :add_message
      end
      resources :support_chats, only: %i[index show] do
        post :messages, on: :collection, action: :add_message
      end
    end
  end

  # E-commerce Web API
  namespace :web do
    namespace :api do
      get 'exchange_rates/show'
      # Auth
      post 'auth/register', to: 'auth#register'
      post 'auth/login', to: 'auth#login'
      get 'auth/check_username', to: 'auth#check_username'
      get 'auth/me', to: 'auth#me'
      patch 'auth/update_profile', to: 'auth#update_profile'
      put 'auth/me', to: 'auth#update'
      post 'auth/change_password', to: 'auth#change_password'
      post 'auth/refresh', to: 'auth#refresh'
      delete 'auth/logout', to: 'auth#logout'
      get 'auth/confirm_email', to: 'auth#confirm_email'
      post 'auth/resend_confirmation', to: 'auth#resend_confirmation'
      post 'auth/forgot_password', to: 'auth#forgot_password'
      post 'auth/reset_password', to: 'auth#reset_password'
      get 'auth/google', to: 'auth#google'
      get 'auth/google/callback', to: 'auth#google_callback'
      get 'auth/twitter', to: 'auth#twitter'
      get 'auth/twitter/callback', to: 'auth#twitter_callback'
      get 'auth/failure', to: 'auth#failure'

      resources :webhooks, only: %i[index create destroy] do
        post :test, on: :member
      end

      get 'billing/balance', to: 'billing#balance'
      get 'billing/transactions', to: 'billing#transactions'
      get 'billing/history', to: 'billing#history'
      post 'billing/verify_and_sync', to: 'billing#verify_and_sync'

      resources :products, only: %i[index show]
      resource :cart, only: [:show] do
        post :add_item
        delete :remove_item
        post :checkout
      end

      resources :tickets, only: %i[index create show] do
        post :reply, on: :member
      end

      resources :orders, only: %i[index create show] do
        get :stats, on: :collection
        collection do
          post :checkout_cart
          get :stats
        end
        member do
          get :credentials
          post :renew
          post :reorder
          get :download_ovpn
          get :download_invoice
          get :download_rdp_config
        end
      end
      resource :wallet, only: [:show] do
        post :deposit
      end

      resources :notifications, only: [:index] do
        post :mark_as_read, on: :collection
      end

      # VMs
      resources :vms, only: %i[index show create destroy] do
        member do
          post :start
          post :stop
          post :reboot
          get :status
        end
      end

      resources :credential_changes, only: [] do
        collection do
          post 'vm/:id/password', to: 'credential_changes#vm_password'
          post 'proxy/:id/credentials', to: 'credential_changes#proxy_credentials'
          post 'proxy/:id/rotate_ip', to: 'credential_changes#proxy_rotate_ip'
        end
      end

      resources :analytics, only: [] do
        collection do
          post 'reddit-capi', to: 'analytics#reddit_capi'
        end
      end

      resources :tools, only: [] do
        collection do
          get :ip_lookup
        end
      end

      # Tools
      get 'tools/ip_checker', to: 'tools#ip_checker'

      resources :notifications, only: %i[index show] do
        member do
          put :read
        end
        collection do
          get :unread_count
          put :read_all
        end
      end

      # Blog (public read, no auth required — handled in controller)
      resources :blog_posts, only: %i[index show], param: :slug

      # Affiliate Program
      resource :affiliate, only: %i[show create] do
        post :request_payout
        post :transfer_earnings
      end
      resources :affiliate_referrals, only: [:index]
      resources :affiliate_payouts,   only: [:index]

      resources :support_chats, only: %i[index show] do
        post :messages, on: :collection, action: :add_message
      end
    end
  end

  # Admin API
  namespace :admin do
    namespace :api do
      # Auth
      get 'auth/zoho', to: 'auth#zoho'
      get 'auth/zoho/callback', to: 'auth#zoho_callback'
      post 'auth/login', to: 'auth#login'
      get 'auth/failure', to: 'auth#failure'

      # Admin routes
      resources :employees do
        post :assign, on: :member
      end

      resources :products

      resources :tickets, only: %i[index show update] do
        member do
          post :reply
          post :rescue_order
        end
      end

      resources :notifications, only: [:index] do
        post :mark_as_read, on: :collection
      end

      namespace :analytics do
        get :dashboard
        get :traffic
        get :products
        get :conversions
        get :revenue
        get :geolocation
      end

      resources :guest_chats, only: %i[index show] do
        member do
          post :reply
          post :assign
          post :close
        end
      end

      resources :resellers do
        member do
          post :onboard
          patch :configure
        end
      end
      resources :users, only: %i[index show update destroy] do
        post :impersonate, on: :member
        post :onboard,     on: :member
      end
      resources :orders, only: %i[index show] do
        post :refund,   on: :member
        post :rescue,   on: :member
      end

      # Affiliates management
      resources :affiliates do
        member do
          patch :configure
        end
      end
      resources :affiliate_payouts, only: %i[index show] do
        patch :process_payout, on: :member
      end

      # Blog CMS
      resources :blog_posts, param: :slug do
        member do
          patch :publish
          patch :unpublish
        end
      end
      resources :support_chats, only: %i[index show] do
        member do
          post :reply
          post :assign
          post :close
        end
      end

      # System Monitoring
      get 'monitoring', to: 'monitoring#index'
    end
  end

  # Shared OmniAuth callback route
  get '/auth/:provider/callback', to: lambda { |env|
    strategy = env['omniauth.strategy'].name
    case strategy
    when 'zoho'
      Admin::Api::AuthController.action(:zoho_callback).call(env)
    when 'google_oauth2'
      Web::Api::AuthController.action(:google_callback).call(env)
    when 'twitter2'
      Web::Api::AuthController.action(:twitter_callback).call(env)
    end
  }
  get '/auth/failure', to: 'web/api/auth#failure'

  # Webhooks
  scope :webhooks do
    post 'paystack', to: 'webhooks#paystack'
    post 'plisio', to: 'webhooks#plisio'
    post 'payvra', to: 'webhooks#payvra'
  end

  # VM Status Callback (Ansible playbooks POST here on completion/failure)
  post 'vm/:id/status', to: 'vm_callbacks#status', as: :vm_callback_status

  # Prometheus metrics scrape endpoint
  get 'metrics', to: 'metrics#index'

  get 'up' => 'rails/health#show', as: :rails_health_check
end
