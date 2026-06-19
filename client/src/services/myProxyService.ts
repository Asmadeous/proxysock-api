// // ============================================================================
// // VPN INTERFACES
// // ============================================================================

import {
  Category,
  ProxyPlan,
  ISP,
} from "@/types/index";
import api from './api';




// ============================================================================
// VPN INTERFACES
// ============================================================================

export interface VPNPlan {
  id: string;
  plan_id: number;
  name: string;
  price: string | number;
  currency: string;
  bandwidth_gb: number;
  features: string[];
  locations: string[];
  is_active: boolean;
  isp?: ISP[];
}

export interface VPNCategory {
  id: string;
  name: string;
  slug: string;
  information?: string[];
  vpn_plans?: VPNPlan[];
  alpha3?: string; // Assuming these are meant to be added, not replace
  alpha2?: string;
  code?: string;
}


// // ============================================================================
// // EXISTING PROXY INTERFACES (Updated to exclude VPN)
// // ============================================================================







// // ============================================================================
// // PROXY SERVICE FUNCTIONS (Excluding VPN)
// // ============================================================================





// ============================================================================
// VPN SERVICE FUNCTIONS
// ============================================================================

export const fetchVPNCategory = async (): Promise<VPNCategory | null> => {
  try {
    const { data } = await api.get('/web/api/products?product_type=vpn');
    const allProducts = data.products || [];

    if (allProducts.length === 0) return null;

    const plans: VPNPlan[] = allProducts.map((p: any) => {
      let isps: ISP[] = [];
      if (typeof p.isp === 'string') {
        try { isps = JSON.parse(p.isp); } catch (e) { }
      } else if (Array.isArray(p.isp)) {
        isps = p.isp;
      }

      return {
        id: String(p.id),
        plan_id: p.id,
        name: p.name,
        price: Number(p.price).toFixed(2),
        currency: p.currency || 'USD',
        bandwidth_gb: Number(p.data_gb || 0),
        features: p.features || [],
        locations: p.location_name ? [p.location_name] : [],
        is_active: true,
        isp: isps
      };
    });

    return {
      id: 'vpn',
      name: 'VPN Services',
      slug: 'vpn',
      information: [
        'High-speed, secure VPN connections globally.',
        'No logs policy and kill switch functionality.',
        'Access to geo-restricted content easily.',
      ],
      vpn_plans: plans.sort((a, b) => Number(a.price) - Number(b.price))
    };
  } catch (err) {
    console.error(`Error fetching VPN category:`, err);
    return null;
  }
};

// ============================================================================
// EXISTING PROXY INTERFACES (Updated to exclude VPN)
// ============================================================================




function standardizePlanName(plan: ProxyPlan): string {
  if (plan.is_owned) {
    return plan.name;
  }

  const name = plan.name.toLowerCase();
  
  // Don't rename residential rotating proxies to "Mobile Proxy"
  if (name.includes('residential') || name.includes('rotating')) {
    return plan.name;
  }

  if (plan.billing_type === 'usage_gb' || (plan.gb_min && Number(plan.gb_min) > 0)) {
    return 'Per-GB Mobile Proxy';
  } else if (name.includes('1 day') || plan.duration_days === 1) {
    return '1 x Mobile Proxy - 1 Day';
  } else if (name.includes('7 day') || plan.duration_days === 7) {
    return '1 x Mobile Proxy - 7 Days';
  } else if (name.includes('30 day') || plan.duration_days === 30) {
    return '1 x Mobile Proxy - 30 Days';
  }

  return plan.name;
}

function sortPlans(plans: ProxyPlan[]): ProxyPlan[] {
  return plans.sort((a, b) => {
    if (a.is_owned && !b.is_owned) return -1;
    if (!a.is_owned && b.is_owned) return 1;

    const billingTypePriority: Record<string, number> = {
      usage_gb: 1,
      daily: 2,
      weekly: 3,
      monthly: 4,
    };

    const aPriority = billingTypePriority[a.billing_type ?? ''] ?? 999;
    const bPriority = billingTypePriority[b.billing_type ?? ''] ?? 999;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Sort by GB range for residential products
    if (Number(a.gb_min) !== Number(b.gb_min)) {
      return Number(a.gb_min) - Number(b.gb_min);
    }

    return Number(a.price) - Number(b.price);
  });
}

function isISPValidForLocationType(isp: ISP, locationType: 'usa' | 'premium'): boolean {
  const ispSlug = isp.slug.toLowerCase();

  if (locationType === 'usa') {
    return ['att', 'tmobile', 'verizon'].includes(ispSlug);
  } else if (locationType === 'premium') {
    return ['bell', 'rogers', 'telus'].includes(ispSlug);
  }

  return true;
}

function deduplicatePlans(plans: ProxyPlan[]): ProxyPlan[] {
  const seenIds = new Set<string>();
  return plans.filter(plan => {
    const id = String(plan.id);
    if (seenIds.has(id)) {
      console.warn(`Duplicate plan found with ID: ${id}, name: ${plan.name}`);
      return false;
    }
    seenIds.add(id);
    return true;
  });
}

// ============================================================================
// PROXY SERVICE FUNCTIONS (Excluding VPN)
// ============================================================================

export const fetchProductCategories = async (): Promise<Category[]> => {
  return [
    { id: '1', slug: 'datacenter', name: 'Datacenter' },
    { id: '2', slug: 'isp', name: 'ISP' },
    { id: '3', slug: 'premium-isp', name: 'Premium ISP' },
    { id: '4', slug: 'static-residential', name: 'Static Residential' },
    { id: '5', slug: 'residential-rotating', name: 'Residential Rotating Proxies' },
    { id: '6', slug: 'mobile', name: 'Mobile' },
    { id: '7', slug: 'global-isp', name: 'Global ISP' },
  ];
};

export const fetchProxiesByCategorySlug = async (categorySlug: string): Promise<Category | null> => {
  try {
    const { data } = await api.get<{ products: any[] }>(`/web/api/products?product_type=proxy&category_slug=${categorySlug}`);
    const categoryProducts = data.products || [];
    // Always return a category object so the UI can show "No plans" instead of "Select category"

    const plans = categoryProducts.map((p: any) => {
      let planISPs: ISP[] = [];
      if (typeof p.isp === 'string') {
        try { planISPs = JSON.parse(p.isp); } catch (e) { }
      } else if (Array.isArray(p.isp)) {
        planISPs = p.isp;
      }

      let gbMin = Number(p.gb_min ?? 0);
      let gbMax = Number(p.gb_max ?? 0);

      // Global ISP uses proxy quantity ranges (qty_min/qty_max), NOT GB
      let qtyMin = Number(p.qty_min ?? 0);
      let qtyMax = Number(p.qty_max ?? 0);

      if (categorySlug === 'global-isp') {
        // Don't use gb_min/gb_max for Global ISP
        gbMin = 0;
        gbMax = 0;

        // Parse quantity ranges from name if not provided by backend
        if (qtyMin === 0 && qtyMax === 0) {
          if (p.ips_included && Number(p.ips_included) > 0) {
            qtyMin = Number(p.ips_included);
            qtyMax = Number(p.ips_included);
          } else {
            const name = String(p.name);
            const rangeMatch = name.match(/(\d+)-(\d+)\s*x/i);
            const singleMatch = name.match(/(\d+)\s*x/i);
            
            if (rangeMatch) {
              qtyMin = parseInt(rangeMatch[1]);
              qtyMax = parseInt(rangeMatch[2]);
            } else if (singleMatch) {
              const val = parseInt(singleMatch[1]);
              qtyMin = val;
              qtyMax = val === 1 ? 1 : 999999; // open-ended for top tier
            }
          }
        }
      }

      const mappedPlan: ProxyPlan = {
        id: String(p.id),
        name: p.name,
        price: Number(p.price).toFixed(2),
        currency: p.currency || 'USD',
        ips_included: Number(p.ips_included ?? 0),
        gb_min: gbMin,
        gb_max: gbMax,
        is_owned: p.is_owned || p.provider_type === 'xproxy' || p.provider_type === 'inhouse',
        source_table: 'proxy_plans' as const,
        country_code: p.country_code,
        billing_type: p.billing_type,
        duration_days: p.duration_days,
        isp: planISPs,
        global_isp_config: p.global_isp_config || (p.targets ? {
          targets: p.targets,
          countries: (p.countries || []).map((c: any) => ({
            ...c,
            code: c.alpha2 || c.code // Ensure code is available for flags
          })),
          periods: p.periods
        } : undefined),
        qty_min: qtyMin || undefined,
        qty_max: qtyMax || undefined,
        resi: p.resi,
        residential_rotating_config: p.residential_rotating_config
      };

      mappedPlan.display_name = standardizePlanName(mappedPlan);
      return mappedPlan;
    });

    const categoryNames: Record<string, string> = {
      'datacenter': 'Datacenter',
      'isp': 'ISP',
      'premium-isp': 'Premium ISP',
      'static-residential': 'Static Residential',
      'residential-rotating': 'Residential Rotating Proxies',
      'mobile': 'Mobile',
      'global-isp': 'Global ISP'
    };

    const result: any = {
      id: categorySlug,
      name: categoryNames[categorySlug] || categorySlug,
      slug: categorySlug,
      proxy_plans: sortPlans(deduplicatePlans(plans))
    };

    if (categorySlug === 'mobile') {
      result.location_categories = [
        {
          id: 'usa',
          slug: 'usa',
          name: 'USA',
          description: 'High-speed 5G/4G Mobile proxies from top USA carriers.',
          countries: ['USA'],
          premium: false,
        },
        {
          id: 'premium',
          slug: 'premium',
          name: 'Canada',
          description: 'Premium mobile proxies with high-speed 5G/4G connectivity.',
          countries: ['Canada'],
          premium: true,
        },
      ];
    }

    return result;
  } catch (err) {
    console.error(`Error fetching proxy category ${categorySlug}:`, err);
    return null;
  }
};

export const fetchResidentialRotatingCountries = async (): Promise<
  { id: string; name: string; isps?: { id: string; name: string }[] }[]
> => {
  try {
    const { data } = await api.get('/web/api/residential-rotating/countries');
    return data.countries || data || [];
  } catch (err) {
    console.error('Error fetching residential rotating countries:', err);
    return [];
  }
};

// Maps the UI location category to the ISO country code stored in product metadata.
const COUNTRY_CODE_BY_LOCATION: Record<'usa' | 'premium', string> = {
  usa: 'US',
  premium: 'CA',
};

export const fetchMobileProxiesByLocation = async (locationType: 'usa' | 'premium'): Promise<ProxyPlan[]> => {
  try {
    const categoryData = await fetchProxiesByCategorySlug('mobile');
    if (!categoryData || !categoryData.proxy_plans) return [];

    const targetCountry = COUNTRY_CODE_BY_LOCATION[locationType];

    return categoryData.proxy_plans.filter((plan: ProxyPlan) => {
      // Source of truth: the country_code stored in product metadata.
      if (plan.country_code) {
        return plan.country_code.toUpperCase() === targetCountry;
      }
      // Fallback for legacy plans that carry carrier ISP slugs instead of a country_code.
      if (plan.isp && plan.isp.length > 0) {
        return plan.isp.some(isp => isISPValidForLocationType(isp, locationType));
      }
      // No country_code and no ISP: treat USA as the default region so plans aren't silently dropped.
      return locationType === 'usa';
    });
  } catch (error) {
    console.error(`Error fetching mobile plans for ${locationType}:`, error);
    throw error;
  }
};

export const fetchOwnedProxyBillingPlansByType = async (
  _planType: 'mobile',
  _locationType?: 'premium'
): Promise<ProxyPlan[]> => {
  return [];
};