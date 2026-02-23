/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_RAILS_API_URL: string;
  readonly VITE_WS_URL: string;

  readonly VITE_STRIPE_PUBLIC_KEY: string;

  readonly VITE_PREMSOCKS_API_KEY: string;
  readonly VITE_PREMSOCKS_BASE_URI: string;

  readonly VITE_MY_PROXY_API_CLIENT_NAME: string;
  readonly VITE_MY_PROXY_API_CLIENT_SECRET: string;
  readonly VITE_MY_PROXY_API_USER_ID: string;
  readonly VITE_MY_PROXY_API_BASE_URI: string;
  readonly VITE_EXCHANGE_RATE_API_KEY: string;
  readonly VITE_NEWSDATA_API_KEY: string;
  readonly VITE_REDDIT_PIXEL_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
