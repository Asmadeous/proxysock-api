<<<<<<< HEAD
import railsApi from '../lib/railsApi';
=======
// supabase removed
// // ============================================================================
// // VPN INTERFACES
// // ============================================================================
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)

import {
  Category,
  ProxyPlan,
  ISP,
<<<<<<< HEAD
  LocationCategory,
} from "@/types/index";
=======
} from "@/types/index";
import api from './api';



>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)

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
<<<<<<< HEAD
  isp?: ISP[];
=======
  isp?: ISP[]; // ADD THIS - ISP data with locations
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
// VPN INTERFACES - UPDATED
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
  isp?: ISP[]; // ADD THIS - ISP data with locations
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
}

export interface VPNCategory {
  id: string;
  name: string;
  slug: string;
  information?: string[];
  vpn_plans?: VPNPlan[];
}

// ============================================================================
<<<<<<< HEAD
// ISP CONFIGURATION
// ============================================================================

interface ISPConfig {
  id: string;
  name: string;
  slug: string;
  locations: Record<string, { name: string }>;
}

interface ISPToLocation {
  [key: string]: ISPConfig;
}

const ispToLocation: ISPToLocation = {
  bell: {
    id: '4',
    name: 'Bell',
    slug: 'BELL',
    locations: { ca: { name: 'Canada' } }
  },
  rogers: {
    id: '5',
    name: 'Rogers',
    slug: 'ROGERS',
    locations: { ca: { name: 'Canada' } }
  },
  telus: {
    id: '6',
    name: 'Telus',
    slug: 'TELUS',
    locations: { ca: { name: 'Canada' } }
  },
  att: {
    id: '7',
    name: 'AT&T',
    slug: 'ATT',
    locations: { us: { name: 'United States' } }
  },
  tmobile: {
    id: '8',
    name: 'T-MOBILE',
    slug: 'TMOBILE',
    locations: { us: { name: 'United States' } }
  },
  verizon: {
    id: '9',
    name: 'VERIZON',
    slug: 'VERIZON',
    locations: { us: { name: 'United States' } }
  },
  datacenter: {
    id: '10',
    name: 'Premium Datacenter',
    slug: 'premium-datacenter',
    locations: { us: { name: 'United States' } }
=======
// VPN SERVICE FUNCTIONS - UPDATED
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
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
  }
};

// ============================================================================
<<<<<<< HEAD
// HELPER FUNCTIONS
// ============================================================================

=======
// EXISTING PROXY INTERFACES (Updated to exclude VPN)
// ============================================================================




>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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

<<<<<<< HEAD
function parseISP(isp: any): ISP[] {
  if (typeof isp === 'string' && isp.startsWith('[')) {
    try {
      const parsed = JSON.parse(isp);
      return Array.isArray(parsed)
        ? parsed.map((i: any) => ({
          id: Number(i.id),
          name: i.name,
          slug: i.slug,
          locations: i.locations || {}
        }))
        : [];
    } catch {
      return [];
    }
  } else if (Array.isArray(isp)) {
    return isp.map((i: any) => ({
      id: Number(i.id),
      name: i.name,
      slug: i.slug,
      locations: i.locations || {}
    }));
  }
  return [];
}

// ============================================================================
// API FUNCTIONS - Using Rails API
// ============================================================================

// Fetch VPN Category
export const fetchVPNCategory = async (): Promise<VPNCategory | null> => {
  console.log('🔥 fetchVPNCategory called');
  try {
    const response = await railsApi.get<{ products: any[] }>('/products', {
      params: { type: 'vpn' }
    });

    const products = response.data.products || response.data || [];

    if (products.length === 0) return null;

    const mappedPlans: VPNPlan[] = products.map((product: any) => {
      const planISPs = parseISP(product.metadata?.isp);
      const locationNames: string[] = [];

      planISPs.forEach(isp => {
        if (isp.locations) {
          Object.values(isp.locations).forEach((loc: any) => {
            if (loc.name && !locationNames.includes(loc.name)) {
              locationNames.push(loc.name);
            }
          });
        }
      });

      const pricing = product.pricings?.[0];

      return {
        id: String(product.id),
        plan_id: product.id,
        name: product.name,
        price: pricing?.selling_price?.toFixed(2) || '0.00',
        currency: pricing?.currency || 'USD',
        bandwidth_gb: product.metadata?.bandwidth_gb || 0,
        features: product.metadata?.features || [],
        locations: locationNames,
        is_active: product.status === 'active',
        isp: planISPs
      };
    });

    return {
      id: 'vpn',
      name: 'Residential VPN',
      slug: 'residential-vpn',
      information: [],
      vpn_plans: mappedPlans
    };
  } catch (error) {
    console.error('Error fetching VPN category:', error);
    throw error;
  }
};

// Fetch Product Categories (excluding VPN)
export const fetchProductCategories = async (): Promise<Category[]> => {
  try {
    const response = await railsApi.get<{ products: any[] }>('/products');
    const products = response.data.products || response.data || [];

    // Group by product type and create categories
    const categoryMap = new Map<string, Category>();

    products.forEach((product: any) => {
      if (product.product_type === 'vpn') return; // Exclude VPN

      const type = product.product_type || 'other';
      if (!categoryMap.has(type)) {
        categoryMap.set(type, {
          id: type,
          name: type.charAt(0).toUpperCase() + type.slice(1),
          slug: type,
          information: []
        });
      }
    });

    return Array.from(categoryMap.values());
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Fetch Proxies by Category Slug
export const fetchProxiesByCategorySlug = async (categorySlug: string): Promise<Category | null> => {
  console.log('🔥 fetchProxiesByCategorySlug called with:', categorySlug);

  if (categorySlug === 'residential-vpn') {
    console.warn('VPN category should use fetchVPNCategory instead');
    return null;
  }

  try {
    const response = await railsApi.get<{ products: any[] }>('/products', {
      params: { type: 'proxy', category: categorySlug }
    });

    const products = response.data.products || response.data || [];

    if (products.length === 0) {
      return {
        id: categorySlug,
        name: categorySlug,
        slug: categorySlug,
        information: [],
        proxy_plans: []
      };
    }

    let locationCategories: LocationCategory[] = [];

    if (categorySlug === 'mobile') {
      locationCategories = [
        {
          id: 'usa',
          name: 'USA Mobile Proxies',
          slug: 'usa',
          description: 'High-speed mobile proxies from major US carriers (AT&T, T-Mobile, Verizon)',
          countries: ['US'],
          premium: false
        },
        {
          id: 'premium',
          name: 'Premium Global Mobile',
          slug: 'premium',
          description: 'Premium mobile proxies from global carriers including Canada',
          countries: ['CA', 'UK', 'DE', 'FR'],
          premium: true
        }
      ];

      return {
        id: categorySlug,
        name: 'Mobile Proxies',
        slug: categorySlug,
        information: [],
        location_categories: locationCategories,
        proxy_plans: []
      };
    }

    const proxyPlans: ProxyPlan[] = products.map((product: any): ProxyPlan => {
      const pricing = product.pricings?.[0];
      const planISPs = parseISP(product.metadata?.isp);

      let billing_type: ProxyPlan['billing_type'] = 'monthly';
      if (categorySlug === 'residential-rotating' || categorySlug === 'residential') {
        billing_type = 'usage_gb';
      }

      return {
        id: String(product.id),
        name: product.name,
        price: pricing?.selling_price?.toFixed(2) || '0.00',
        currency: pricing?.currency || 'USD',
        ips_included: product.metadata?.ips_included || 0,
        gb_min: product.metadata?.gb_min || 0,
        gb_max: product.metadata?.gb_max || 0,
        is_owned: false,
        source_table: 'products',
        billing_type,
        isp: planISPs,
        display_name: product.name
      };
    });

    return {
      id: categorySlug,
      name: categorySlug,
      slug: categorySlug,
      information: [],
      location_categories: locationCategories,
      proxy_plans: sortPlans(proxyPlans)
    };
  } catch (error) {
    console.error('Error fetching proxies by category:', error);
    throw error;
  }
};

// Fetch Mobile Proxies by Location
export const fetchMobileProxiesByLocation = async (locationType: 'usa' | 'premium'): Promise<ProxyPlan[]> => {
  console.log('🔥 fetchMobileProxiesByLocation called with:', locationType);
  try {
    const response = await railsApi.get<{ products: any[] }>('/products', {
      params: { type: 'proxy', category: 'mobile' }
    });

    const products = response.data.products || response.data || [];

    const plans: ProxyPlan[] = products.map((product: any): ProxyPlan => {
      const pricing = product.pricings?.[0];
      const planISPs = parseISP(product.metadata?.isp);

      return {
        id: String(product.id),
        name: product.name,
        price: pricing?.selling_price?.toFixed(2) || '0.00',
        currency: pricing?.currency || 'USD',
        ips_included: product.metadata?.ips_included || 0,
        gb_min: product.metadata?.gb_min || 0,
        gb_max: product.metadata?.gb_max || 0,
        is_owned: locationType === 'premium',
        source_table: 'products',
        location_filter: locationType,
        isp: planISPs,
        display_name: standardizePlanName({
          id: String(product.id),
          name: product.name,
          price: '0',
          currency: 'USD',
          ips_included: 0,
          is_owned: locationType === 'premium',
          gb_min: product.metadata?.gb_min || 0,
          gb_max: product.metadata?.gb_max || 0
        })
      };
    }).filter((plan: ProxyPlan) => {
      if (!plan.isp || plan.isp.length === 0) return locationType === 'premium';
      return plan.isp.some(isp => isISPValidForLocationType(isp, locationType));
    });

    return sortPlans(deduplicatePlans(plans));
=======
// ============================================================================
// PROXY SERVICE FUNCTIONS (Excluding VPN)
// ============================================================================

export const fetchProductCategories = async (): Promise<Category[]> => {
  return [
    { id: '1', slug: 'datacenter', name: 'Datacenter' },
    { id: '2', slug: 'isp', name: 'ISP' },
    { id: '3', slug: 'residential', name: 'Residential' },
    { id: '4', slug: 'mobile', name: 'Mobile' },
  ];
};

export const fetchProxiesByCategorySlug = async (categorySlug: string): Promise<Category | null> => {
  try {
    const { data } = await api.get('/web/api/products?product_type=proxy');
    const allProducts = data.products || [];
    const categoryProducts = allProducts.filter((p: any) => p.category_slug === categorySlug);

    if (categoryProducts.length === 0) return null;

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
        is_owned: false,
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
      'residential': 'Residential',
      'mobile': 'Mobile'
    };

    return {
      id: categorySlug,
      name: categoryNames[categorySlug] || categorySlug,
      slug: categorySlug,
      proxy_plans: sortPlans(deduplicatePlans(plans))
    };
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
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
  } catch (error) {
    console.error(`Error fetching mobile plans for ${locationType}:`, error);
    throw error;
  }
};

<<<<<<< HEAD
// Fetch Owned Proxy Billing Plans
export const fetchOwnedProxyBillingPlansByType = async (
  planType: 'mobile',
  locationType?: 'premium'
): Promise<ProxyPlan[]> => {
  try {
    if (planType !== 'mobile' || locationType !== 'premium') {
      return [];
    }

    const response = await railsApi.get<{ products: any[] }>('/products', {
      params: { type: 'proxy', provider: 'owned', category: 'mobile-premium' }
    });

    const products = response.data.products || response.data || [];

    const mappedPlans: ProxyPlan[] = products.map((product: any): ProxyPlan => {
      const pricing = product.pricings?.[0];

      // Use premium ISPs
      const isps = ['bell', 'rogers', 'telus'].map((ispKey) => ({
        id: parseInt(ispToLocation[ispKey].id, 10),
        name: ispToLocation[ispKey].name,
        slug: ispToLocation[ispKey].slug,
        locations: ispToLocation[ispKey].locations
      }));

      const billing_type = product.metadata?.billing_type || 'monthly';

      return {
        id: String(product.id),
        billing_id: String(product.id),
        name: product.name,
        price: pricing?.selling_price?.toFixed(2) || '0.00',
        currency: 'USD',
        ips_included: 0,
        billing_type,
        base_price: pricing?.selling_price || 0,
        duration_days: product.metadata?.duration_days,
        gb_included: product.metadata?.gb_included || 0,
        gb_limit: product.metadata?.gb_limit,
        features: product.metadata?.features || [],
        is_owned: true,
        description: product.description,
        source_table: 'products',
        isp: isps,
        gb_min: billing_type === 'usage_gb' ? 1 : 0,
        gb_max: product.metadata?.gb_limit || (billing_type === 'usage_gb' ? 1000 : 0)
      };
    });

    return mappedPlans;
  } catch (error) {
    console.error(`Error fetching owned proxy billing plans:`, error);
    return [];
  }
=======
export const fetchOwnedProxyBillingPlansByType = async (
  _planType: 'mobile',
  _locationType?: 'premium'
): Promise<ProxyPlan[]> => {
  return [];
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
};