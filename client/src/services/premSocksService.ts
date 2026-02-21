
// Supabase completely removed. Mock object to prevent compile/runtime crash.
const supabase: any = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: {}, error: null }),
    signInWithOAuth: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    refreshSession: async () => ({ data: { session: null }, error: null })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        order: async () => ({ data: [], error: null }),
        not: () => ({ order: async () => ({ data: [], error: null }) })
      }),
      order: async () => ({ data: [], error: null }),
      not: () => ({ order: async () => ({ data: [], error: null }) }),
      neq: () => ({ order: async () => ({ data: [], error: null }) })
    }),
    insert: async () => ({ error: null }),
    update: () => ({ eq: async () => ({ error: null }) })
  }),
  functions: { invoke: async () => ({ data: null, error: null }) },
  channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) }),
  removeChannel: async () => {}
};
// src/services/premsocks.ts


// Define the Proxy type based on the prem_proxies table structure
export interface Proxy {
  id: string; // UUID as string
  proxy_id: number;
  ip: string;
  port: number | null;
  country: string | null;
  city: string | null;
  speed: number | null;
  version: number | null;
  last_sync: string; // ISO string from timestamp
}

// Fetch all proxies and filter by country or city
export async function fetchAndFilterProxies(
  country?: string,
  city?: string
): Promise<Proxy[]> {
  try {
    // Fetch all proxies from the table
    const { data, error } = await supabase
      .from("prem_proxies")
      .select("id, proxy_id, ip, port, country, city, speed, version, last_sync");

    if (error) {
      throw new Error(`Error fetching proxies: ${error.message}`);
    }

    let proxies = data as Proxy[];

    // Apply client-side filtering if country or city is provided
    if (country) {
      proxies = proxies.filter((proxy) =>
        proxy.country?.toLowerCase().includes(country.toLowerCase())
      );
    }
    if (city) {
      proxies = proxies.filter((proxy) =>
        proxy.city?.toLowerCase().includes(city.toLowerCase())
      );
    }

    return proxies;
  } catch (error) {
    console.error("Failed to fetch and filter proxies:", error);
    throw error; // Let the caller handle the error
  }
}