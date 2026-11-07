import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export const RDP_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
];
export interface RDPPlan {
  id: string;
  plan_id: string | number;
  name: string;
  slug: string;
  price: number;
  currency_code: string;
  cpu_cores: number | null;
  ram_gb: number | null;
  storage_gb: number | null;
  concurrent_users: number | null;
  session_duration_hours: number | null;
  os_templates: string[];
  features: string[];
  locations: string[];
  management_types: string[];
  is_active: boolean;
  country_pricing?: Record<string, number | { user?: number; reseller?: number }>;
}
export const normalizeRDPCountry = (code: string) => code === 'GB' ? 'UK' : code;
export const supportsRDPCountry = (plan: RDPPlan, code: string) => {
  const normalized = normalizeRDPCountry(code);
  return plan.locations.some(location => location === normalized || location === RDP_COUNTRIES.find(item => item.code === normalized)?.name || (normalized === 'UK' && location === 'GB'));
};
export const rdpPrice = (plan: RDPPlan, code: string) => {
  const country = RDP_COUNTRIES.find(item => item.code === normalizeRDPCountry(code));
  const entry = plan.country_pricing?.[country?.name || code] ?? plan.country_pricing?.[code];
  return typeof entry === 'number' ? entry : entry?.user ?? entry?.reseller ?? plan.price;
};
export const rdpMoney = (amount: number, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
export const rdpOSLabel = (os: string) => ({
  'windows-server-2022-rdp': 'Windows Server 2022',
  'ubuntu-desktop-rdp': 'Ubuntu Desktop', 'fedora-desktop-rdp': 'Fedora Desktop',
} as Record<string, string>)[os] || os.replace(/[-_]/g, ' ');
export const rdpSessionLabel = (hours: number | null) => hours === null ? 'Not specified' : hours > 0 ? `${hours} hours` : 'Unlimited';

export function useRDPCatalog() {
  return useQuery<RDPPlan[]>({
    queryKey: ['rdpPlans'],
    queryFn: async () => {
      const { data } = await api.get('/web/api/products?product_type=rdp&per_page=all');
      return (data.products || []).filter((product: any) => product.active !== false).map((product: any) => ({
        id: String(product.id), plan_id: product.id, name: product.name,
        slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
        price: Number(product.price), currency_code: product.currency || 'USD',
        cpu_cores: product.cpu_cores ?? null, ram_gb: product.ram_gb ?? null, storage_gb: product.storage_gb ?? null,
        concurrent_users: product.concurrent_users ?? null, session_duration_hours: product.session_duration_hours ?? null,
        os_templates: product.os_templates || [], features: product.features || [], locations: product.locations || [],
        management_types: product.management_types || ['unmanaged', 'managed'],
        country_pricing: product.country_pricing, is_active: true,
      }));
    },
    staleTime: 30_000,
    retry: false,
  });
}
