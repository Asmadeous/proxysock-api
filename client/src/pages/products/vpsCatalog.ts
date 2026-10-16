import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export const VPS_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
];
export interface VPSPlan {
  id: string;
  plan_id: string | number;
  name: string;
  slug: string;
  price: number;
  currency_code: string;
  cpu_cores: number | null;
  ram_gb: number | null;
  storage_gb: number | null;
  os_templates: string[];
  features: string[];
  locations: string[];
  management_types: string[];
  is_active: boolean;
  country_pricing?: Record<string, number | { user?: number; reseller?: number }>;
}
export const normalizeVPSCountry = (code: string) => code === 'GB' ? 'UK' : code;
export const supportsVPSCountry = (plan: VPSPlan, code: string) => {
  const normalized = normalizeVPSCountry(code);
  return plan.locations.some(location => location === normalized || location === VPS_COUNTRIES.find(item => item.code === normalized)?.name || (normalized === 'UK' && location === 'GB'));
};
export const vpsPrice = (plan: VPSPlan, code: string) => {
  const country = VPS_COUNTRIES.find(item => item.code === normalizeVPSCountry(code));
  const entry = plan.country_pricing?.[country?.name || code] ?? plan.country_pricing?.[code];
  return typeof entry === 'number' ? entry : entry?.user ?? entry?.reseller ?? plan.price;
};
export const vpsMoney = (amount: number, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
export const vpsOSLabel = (os: string) => ({
  'ubuntu-server-vps': 'Ubuntu Server', 'debian-server-vps': 'Debian',
  'rocky-server-vps': 'Rocky Linux', 'alma-server-vps': 'AlmaLinux',
  'windows-server-2022-vps': 'Windows Server 2022',
} as Record<string, string>)[os] || os.replace(/[-_]/g, ' ');

export function useVPSCatalog() {
  return useQuery<VPSPlan[]>({
    queryKey: ['vpsPlans'],
    queryFn: async () => {
      const { data } = await api.get('/web/api/products?product_type=vps&per_page=all');
      return (data.products || []).filter((product: any) => product.active !== false).map((product: any) => ({
        id: String(product.id), plan_id: product.id, name: product.name,
        slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
        price: Number(product.price), currency_code: product.currency || 'USD',
        cpu_cores: product.cpu_cores ?? null, ram_gb: product.ram_gb ?? null, storage_gb: product.storage_gb ?? null,
        os_templates: product.os_templates || [], features: product.features || [], locations: product.locations || [],
        management_types: product.management_types || ['unmanaged', 'managed'],
        country_pricing: product.country_pricing, is_active: true,
      }));
    },
    staleTime: 30_000,
    retry: false,
  });
}
