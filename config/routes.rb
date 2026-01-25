Rails.application.routes.draw do
  # Reseller API
  namespace :api do
    namespace :v1 do
      # Auth
      post 'auth/token', to: 'auth#token'
      post 'auth/refresh', to: 'auth#refresh'
      
      resources :orders
      resources :resellers, only: [:show, :update]
    end
  end

  # E-commerce Web API
  namespace :web do
    namespace :api do
      post 'auth/register', to: 'auth#register'
      post 'auth/login', to: 'auth#login'
      
      resources :products, only: [:index, :show]
      resources :orders
    end
  end

  # Admin API
  namespace :admin do
    namespace :api do
      # Admin routes
      resources :employees
      resources :resellers
      resources :users
    end
  end

  # Webhooks
  scope :webhooks do
    post 'paystack', to: 'webhooks#paystack'
    post 'plisio', to: 'webhooks#plisio'
  end
  
  get "up" => "rails/health#show", as: :rails_health_check
end
