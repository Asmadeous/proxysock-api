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

      const mappedPlan: ProxyPlan = {
        id: String(p.id),
        name: p.name,
        price: Number(p.price).toFixed(2),
        currency: p.currency || 'USD',
        ips_included: Number(p.ips_included ?? 0),
        gb_min: Number(p.gb_min ?? 0),
        gb_max: Number(p.gb_max ?? 0),
        is_owned: p.is_owned || p.provider_type === 'xproxy' || p.provider_type === 'inhouse',
        source_table: 'proxy_plans' as const,
        billing_type: p.billing_type,
        duration_days: p.duration_days,
        isp: planISPs
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
      'mobile': 'Mobile'
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

export const fetchMobileProxiesByLocation = async (locationType: 'usa' | 'premium'): Promise<ProxyPlan[]> => {
  try {
    const categoryData = await fetchProxiesByCategorySlug('mobile');
    if (!categoryData || !categoryData.proxy_plans) return [];

    return categoryData.proxy_plans.filter((plan: ProxyPlan) => {
      if (!plan.isp || plan.isp.length === 0) return false;
      return plan.isp.some(isp => isISPValidForLocationType(isp, locationType));
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