// TypeScript interfaces
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
  
  export interface LocationCategory {
    id: string;
    name: string;
    slug: string;
    description: string;
    countries: string[];
    premium: boolean;
  }
  
  export interface ProxyPlan {
    id: string;
    billing_id?: string;
    name: string;
    display_name?: string;
    price: string | number;
    currency?: string;
    is_owned?: boolean;
    billing_type?: "daily" | "weekly" | "monthly" | "usage_gb";
    gb_included?: number;
    price_per_day?: number;
    price_per_gb?: number;
    base_price?: number;
    source_table?: string;
    duration_days?: number;
    gb_limit?: number;
    features?: string[];
    description?: string;
    gb_min?: number;
    gb_max?: number;
    ips_included?: number;
    isp?: ISP[];
    location_filter?: string;
  }
  
  export interface Category {
    id: string;
    name: string;
    slug: string;
    information?: string[];
    proxy_plans?: ProxyPlan[];
    location_categories?: LocationCategory[];
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
    period: number | string;
    protocol: "http" | "socks5";
    totalPrice?: number;
    metadata?: Record<string, any>;
  }