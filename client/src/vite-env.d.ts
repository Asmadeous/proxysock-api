/// <reference types="vite/client" />

interface ImportMetaEnv {
<<<<<<< HEAD
  // Rails API
  readonly VITE_RAILS_API_URL: string;

  // Stripe (if still needed)
  readonly VITE_STRIPE_PUBLIC_KEY: string;

  // Paystack
  readonly VITE_PAYSTACK_PUBLIC_KEY: string;

  // Reddit Pixel
  readonly VITE_REDDIT_PIXEL_ID: string;

  // External APIs
=======
  readonly VITE_API_URL: string;
  
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  
  readonly VITE_STRIPE_PUBLIC_KEY: string;
  
  readonly VITE_PREMSOCKS_API_KEY: string;
  readonly VITE_PREMSOCKS_BASE_URI: string;

>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
  readonly VITE_MY_PROXY_API_CLIENT_NAME: string;
  readonly VITE_MY_PROXY_API_CLIENT_SECRET: string;
  readonly VITE_MY_PROXY_API_USER_ID: string;
  readonly VITE_MY_PROXY_API_BASE_URI: string;
  readonly VITE_EXCHANGE_RATE_API_KEY: string;
  readonly VITE_NEWSDATA_API_KEY: string;
<<<<<<< HEAD
=======
  
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
