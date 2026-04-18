export const adminQueryKeys = {
  users: {
    all: () => ["admin", "users"] as const,
    list: (p: object) => ["admin", "users", "list", p] as const,
  },
  employees: {
    all: () => ["admin", "employees"] as const,
    list: (p: object) => ["admin", "employees", "list", p] as const,
  },
  orders: {
    all: () => ["admin", "orders"] as const,
    list: (p: object) => ["admin", "orders", "list", p] as const,
    credentials: (id: number) => ["admin", "orders", "credentials", id] as const,
  },
  resellers: {
    all: () => ["admin", "resellers"] as const,
    list: (p: object) => ["admin", "resellers", "list", p] as const,
    detail: (id: string | number) => ["admin", "resellers", "detail", id] as const,
  },
  affiliates: {
    all: () => ["admin", "affiliates"] as const,
    list: (p: object) => ["admin", "affiliates", "list", p] as const,
  },
  affiliatePayouts: {
    all: () => ["admin", "affiliate_payouts"] as const,
    list: () => ["admin", "affiliate_payouts", "list"] as const,
  },
  blog: {
    all: () => ["admin", "blog"] as const,
    list: (p: object) => ["admin", "blog", "list", p] as const,
  },
  tickets: {
    all: () => ["admin", "tickets"] as const,
    list: (p: object) => ["admin", "tickets", "list", p] as const,
  },
  transactions: {
    all: () => ["admin", "transactions"] as const,
    list: (p: object) => ["admin", "transactions", "list", p] as const,
  },
  promoCodes: {
    all: () => ["admin", "promo_codes"] as const,
    list: (p: object) => ["admin", "promo_codes", "list", p] as const,
  },
  analytics: {
    dashboard: (p: object) => ["admin", "analytics", "dashboard", p] as const,
    revenue: (p: object) => ["admin", "analytics", "revenue", p] as const,
    products: (p: object) => ["admin", "analytics", "products", p] as const,
    conversions: (p: object) => ["admin", "analytics", "conversions", p] as const,
    traffic: (p: object) => ["admin", "analytics", "traffic", p] as const,
    geolocation: () => ["admin", "analytics", "geolocation"] as const,
  },
  overview: {
    stats: () => ["admin", "overview", "stats"] as const,
  },
  products: {
    all: () => ["admin", "products"] as const,
    list: () => ["admin", "products", "list"] as const,
  },
  settings: {
    categories: () => ["admin", "settings", "categories"] as const,
    systemInfo: () => ["admin", "settings", "system_info"] as const,
  },
  logs: {
    audit: (p: object) => ["admin", "logs", "audit", p] as const,
    system: (p: object) => ["admin", "logs", "system", p] as const,
    errors: (p: object) => ["admin", "logs", "errors", p] as const,
  },
  guestChats: {
    all: () => ["admin", "guest_chats"] as const,
    list: (p: object) => ["admin", "guest_chats", "list", p] as const,
    detail: (id: string) => ["admin", "guest_chats", "detail", id] as const,
  },
  supportChats: {
    all: () => ["admin", "support_chats"] as const,
    list: (p: object) => ["admin", "support_chats", "list", p] as const,
    detail: (id: string) => ["admin", "support_chats", "detail", id] as const,
  },
};
