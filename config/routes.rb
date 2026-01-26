Rails.application.routes.draw do
  # Reseller API
  namespace :api do
    namespace :v1 do
      # Auth
      post 'auth/token', to: 'auth#token'
      post 'auth/refresh', to: 'auth#refresh'

      # New admin-like routes for V1
      resources :auth, only: [] do
        collection do
          post :zoho_callback
          get :me
        end
      end
      resources :resellers, only: [:index, :show, :update] do
        member do
           post :deposit # Keep existing deposit action
        end
      end
      
      resources :orders, only: [:index, :create, :show] do
        member do
          get :credentials
          post :renew
        end
      end

      resources :products, only: [:index, :show]
      
      # VMs
      resources :vms, only: [:index, :show, :create, :destroy] do
        member do
          post :start
          post :stop
          post :restart
          get :status
        end
      end
    end
  end

  # E-commerce Web API
  namespace :web do
    namespace :api do
      # Auth
      post 'auth/register', to: 'auth#register'
      post 'auth/login', to: 'auth#login'
      get 'auth/google', to: 'auth#google'
      get 'auth/google/callback', to: 'auth#google_callback'
      get 'auth/twitter', to: 'auth#twitter'
      get 'auth/twitter/callback', to: 'auth#twitter_callback'
      get 'auth/failure', to: 'auth#failure'
      
      resources :webhooks, only: [:index, :create, :destroy] do
        post :test, on: :member
      end
      
      get 'billing/balance', to: 'billing#balance'
      get 'billing/transactions', to: 'billing#transactions'
      get 'billing/history', to: 'billing#history'
      
      resources :products, only: [:index, :show]
      resource :cart, only: [:show] do
        post :add_item
        delete :remove_item
      end
      resources :orders, only: [:index, :create, :show] do
        member do
          get :credentials
          post :renew
        end
      end
      resource :wallet, only: [:show] do
        post :deposit
      end
      
      # VMs
      resources :vms, only: [:index, :show, :create, :destroy] do
        member do
          post :start
          post :stop
          get :status
        end
      end
    end
  end

  # Admin API
  namespace :admin do
    namespace :api do
      # Auth
      get 'auth/zoho', to: 'auth#zoho'
      get 'auth/zoho/callback', to: 'auth#zoho_callback'
      get 'auth/failure', to: 'auth#failure'
      
      # Admin routes
      resources :employees
      resources :resellers do
        member do
          post :onboard
        end
      end
      resources :users, only: [:index, :show, :update]
      resources :orders, only: [:index, :show] do
        post :refund, on: :member
      end
    end
  end

  # Shared OmniAuth callback route
  get '/auth/:provider/callback', to: ->(env) {
    strategy = env['omniauth.strategy'].name
    if strategy == 'zoho'
      Admin::Api::AuthController.action(:zoho_callback).call(env)
    elsif strategy == 'google_oauth2'
      Web::Api::AuthController.action(:google_callback).call(env)
    elsif strategy == 'twitter2'
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
  
  get "up" => "rails/health#show", as: :rails_health_check
end
