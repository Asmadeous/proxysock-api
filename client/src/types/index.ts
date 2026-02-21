export interface User {
  id: string;
  username?: string;
  email?: string;
  role: string;
  createdAt?: string | Date;
  nextBillingDate?: string | Date;
  // Add other properties as needed
}


export interface LocationCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  countries: string[];
  premium: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  information?: string[];
  proxy_plans?: ProxyPlan[];
  isp?: ISP[];
  location_categories?: LocationCategory[];
}

export interface ProxyPlan {
  id: string | number; // Used as a unique identifier for the plan
  billing_id?: string | number; // Billing ID for owned proxies
  name: string; // Name of the proxy plan (e.g., "Mobile Proxy 1 Day")
  display_name?: string; // Optional display name for UI
  price: string | number; // Price of the plan (e.g., "5.00" or 5.00)
  currency?: string; // Currency code (e.g., "USD")
  is_owned?: boolean; // Indicates if the proxy is owned (e.g., Bell proxies)
  billing_type?: "daily" | "weekly" | "monthly" | "usage_gb" | "unlimited"; // Billing type for pricing calculations
  gb_included?: number; // Included data in GB
  price_per_day?: number; // Price per day for daily billing
  price_per_gb?: number; // Price per GB for usage-based billing
  base_price?: number; // Base price for owned proxies
  source_table?: string; // Source table in the database (e.g., "proxy_plans")
  duration_days?: number; // Duration in days for the plan
  gb_limit?: number; // Data limit in GB
  features?: string[]; // List of features
  description?: string; // Description of the plan
  gb_min?: number; // Minimum GB for the plan
  gb_max?: number; // Maximum GB for the plan
  ips_included?: number; // Number of IPs included
  isp?: ISP[]; // Optional ISP details (from prior context)
  location_filter?: string; // Location filter for the plan
}


export interface ISP {
  id: number;
  name: string;
  slug: string;
  locations?: Record<string, Location>;
}

export interface Location {
  name: string;
  cities?: City[];
}

export interface City {
  id: number;
  name: string;
  state: string;
  ips_available: number;
}

export interface Order {
  // proxy_id: PremProxy;
  proxy_id: any;
  id: string;
  user_id: string;
  proxy_plan_id: number;
  api_order_id: string | null;
  amount: number;
  currency: string;
  status: string | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
  credentials: Record<string, any> | null;
  cart_items: any[] | null; // Adjust based on your cart_items structure
<<<<<<< HEAD
  total_amount?: number | string;
  product_type?: string;
  product_name?: string;
=======
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
}

export interface CartItem {
  product: string;
  productType: string;
  plan: ProxyPlan | null;
  locations: {
    isp: ISP | null;
    city: City | null;
  };
  locationsString: string;
  period: number;
  protocol: "http" | "socks5";
  totalPrice?: number;
}

export interface Transaction {
  id: string;
  order_id: string;
  user_id: string;
  payment_id: string;
  amount: number;
  currency: string;
  payment_status: string | null;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  featured: boolean;
  tags: string[];
  content: string;
}

export interface ExtendedPost extends Post {
  isNews?: boolean;
  sourceUrl?: string;
  imageUrl?: string | null;
  country?: string[];
  language?: string;
}