import api from "./api";

// Define the Proxy type based on the prem_proxies table structure
export interface Proxy {
  id: string;
  proxy_id: number;
  ip: string;
  port: number | null;
  country: string | null;
  city: string | null;
  speed: number | null;
  version: number | null;
  last_sync: string;
}

// Fetch all proxies and filter by country or city via Rails API
export async function fetchAndFilterProxies(country?: string, city?: string): Promise<Proxy[]> {
  try {
    const params: Record<string, string> = {};
    if (country) params.country = country;
    if (city) params.city = city;

    const { data } = await api.get("/api/v1/proxies", { params });
    return (data.proxies || data || []) as Proxy[];
  } catch (error) {
    console.error("Failed to fetch and filter proxies:", error);
    throw error;
  }
}