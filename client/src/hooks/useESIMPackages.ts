import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'




export type PackageScope = 'global' | 'regional' | 'country'

export interface ESIMPackage {
  locationNetworkList: boolean
  id: string
  package_code: string
  slug: string
  name: string
  price: number
  currency_code: string
  volume: number
  duration: number
  duration_unit: string
  location_code: string
  location_name: string
  description: string
  data_type: number
  sms_status: number
  speed?: string
  network?: string
  scope: PackageScope
  is_active: boolean
  created_at: string
  updated_at: string
  packageType: 'base' | 'topup'
}

export interface PackageFilters {
  locationCode?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  dataType?: number
  smsSupport?: boolean
  scope?: PackageScope
}

// Utility Types
interface CategorizedPackages {
  global: { base: ESIMPackage[]; topup: ESIMPackage[] }
  regional: { base: ESIMPackage[]; topup: ESIMPackage[] }
  country: { base: ESIMPackage[]; topup: ESIMPackage[] }
}

const MEISIM_GLOBAL_MIN_COUNTRIES = 50

const dataUnitBytes: Record<string, number> = { MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 }

// MeiSIM travel plans carry countries / data_limit / validity_days instead of
// eSIM Access's location_code / volume_bytes / duration.
export function mapMeisimPackage(p: any): ESIMPackage {
  const countries: string[] = Array.isArray(p.countries) ? p.countries : []
  const regions: string[] = Array.isArray(p.regions) ? p.regions : []
  const scope: PackageScope =
    countries.length >= MEISIM_GLOBAL_MIN_COUNTRIES ? 'global' : countries.length > 1 ? 'regional' : 'country'
  const amount = Number.parseFloat(p.data_limit)
  const unitBytes = dataUnitBytes[String(p.data_unit || 'MB').toUpperCase()] || dataUnitBytes.MB
  const hasFixedData = Number.isFinite(amount) && amount > 0

  return {
    id: String(p.id),
    package_code: p.slug || '',
    slug: p.slug,
    name: p.name,
    price: Number.parseFloat(p.price),
    currency_code: p.currency || 'USD',
    volume: hasFixedData ? amount * unitBytes : 0,
    duration: Number(p.validity_days) || 30,
    duration_unit: 'days',
    location_code: countries.join(',') || '!GL',
    location_name:
      scope === 'global' ? 'Global' : scope === 'regional' ? regions.join(', ') || `${countries.length} countries` : countries[0] || 'Global',
    description: p.description || '',
    data_type: hasFixedData ? 1 : 0,
    sms_status: 0,
    speed: p.network || '4G/LTE',
    network: p.network || 'Multiple Networks',
    scope,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    packageType: 'base',
    locationNetworkList: false,
  }
}

/**
 * Main Hook
 */
export function useESIMPackages(filters: PackageFilters = {}) {
  const { data: allPackagesRaw = [], isLoading: loading, error: queryError } = useQuery(
    ['esimPackages'],
    async () => {
      const { default: api } = await import('../services/api');
      const { data } = await api.get('/web/api/products?product_type=esim&per_page=all');
      return data.products || [];
    }
  );

  const error = queryError ? String(queryError) : null;

  // Scope detection: regions must match region name AND have multiple country codes
  const getPackageScope = useMemo(() => {
    return (locationCode: string, locationName?: string, packageName?: string): PackageScope => {
      const name = (packageName || '').toLowerCase()
      const location = (locationName || '').toLowerCase()

      // Global: if name contains "global"
      if (name.includes('global')) {
        return 'global'
      }

      // Regional: package name must match region AND location_code must have multiple countries
      const regionalNames = [
        // Europe
        'europe', 'eu', 'eur', 'european union',
        // Caribbean
        'caribbean', 'west indies',
        // Asia-Pacific
        'asia-pacific', 'asia pacific', 'asia', 'apac',
        // South America
        'south america', 'latin america', 'suramerica',
        // Middle East
        'middle east', 'gulf region', 'arab world',
        // Africa (but not "south africa" which is a country)
        'africa',
        // North America
        'north america', 'us & canada',
        // Oceania
        'oceania', 'pacific islands', 'australia & nz',
        // Eastern Europe
        'eastern europe', 'cee', 'eastern eu',
        // Nordic Region
        'nordic region', 'scandinavia'
      ]

      // Check if package name contains regional name (but exclude country names like "South Africa")
      const hasRegionalName = regionalNames.some(regionName => {
        if (regionName === 'africa') {
          // Special check: "africa" but not "south africa"
          return name.includes('africa') && !name.includes('south africa')
        }
        return name.includes(regionName) || location.includes(regionName)
      })

      // Check if location_code has multiple country codes (comma separated)
      const hasMultipleCountries = locationCode.includes(',') || locationCode.split(',').length > 1

      // Must have both: regional name AND multiple country codes
      if (hasRegionalName && hasMultipleCountries) {
        return 'regional'
      }

      // Everything else with single location codes are countries
      return 'country'
    }
  }, [])

  // Format price from cents to human-readable format
  const formatPrice = useMemo(() => {
    return (priceInCents: number, currencyCode = 'USD'): string => {
      if (Number.isNaN(priceInCents)) return '-'
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(priceInCents)
    }
  }, [])

  // Format data volume from bytes to human-readable units
  const formatDataVolume = useMemo(() => {
    return (bytes: number): string => {
      if (bytes === 0 || Number.isNaN(bytes)) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
  }, [])

  // Get display name for scope
  const getScopeDisplayName = useMemo(() => {
    return (scope: PackageScope): string => {
      switch (scope) {
        case 'global':
          return '🌍 Global Coverage'
        case 'regional':
          return '🌎 Multi-Country'
        case 'country':
          return '🇺🇳 Single Country'
        default:
          return scope
      }
    }
  }, [])

  // Categorize base and top-up packages by scope
  const categorizePackages = useMemo(() => {
    return (
      basePackages: any[],
      topupPackages: any[]
    ): CategorizedPackages => {
      const categorized: CategorizedPackages = {
        global: { base: [], topup: [] },
        regional: { base: [], topup: [] },
        country: { base: [], topup: [] },
      }

      basePackages.forEach(pkg => {
        const scope = getPackageScope(pkg.location_code || pkg.locationCode || '', pkg.location_name || pkg.location || '', pkg.name)
        categorized[scope].base.push({
          ...pkg,
          packageType: 'base',
          scope,
        })
      })

      topupPackages.forEach(pkg => {
        const scope = getPackageScope(pkg.location_code || pkg.locationCode || '', pkg.location_name || pkg.location || '', pkg.name)
        categorized[scope].topup.push({
          ...pkg,
          packageType: 'topup',
          scope,
        })
      })

      return categorized
    }
  }, [getPackageScope])

  // Process and filter packages
  const packages = useMemo(() => {
    if (!allPackagesRaw.length) return [];

    // MeiSIM US phone-number lines are listed on the USA eSIM page, not with data plans.
    const dataProducts = allPackagesRaw.filter((p: any) => p.meisim_line !== 'us_prepaid');

    // Map backend products to ESIMPackage interface
    let processed: ESIMPackage[] = dataProducts.map((p: any) => {
      if (p.provider === 'meisim') return mapMeisimPackage(p);

      // Use metadata fields directly from the API
      const locationCode = p.location_code || '!GL';
      const locationName = p.location_name || 'Global';
      const packageCode = p.package_code || p.slug || '';

      // SMS status: check direct sms_status field first, fallback to esim_type checking
      let smsStatus = 0;
      if (p.sms_status !== undefined && p.sms_status !== null) {
        smsStatus = Number(p.sms_status);
      } else {
        const hasSMS = (p.sms_quota && p.sms_quota > 0) ||
          p.esim_type === 'voice_data_sms' ||
          p.esim_type === 'data_sms' ||
          (p.features || []).some((f: string) => f.toLowerCase().includes('sms'));
        smsStatus = hasSMS ? 1 : 0;
      }

      // Check direct data_type first
      let dataType = p.data_gb === null ? 0 : 1;
      if (p.data_type !== undefined && p.data_type !== null) {
        dataType = Number(p.data_type);
      }

      const calculatedScope = getPackageScope(locationCode, locationName, p.name);

      return {
        id: String(p.id),
        package_code: packageCode,
        slug: p.slug,
        name: p.name,
        price: Number.parseFloat(p.price), // Already in dollars from DB
        currency_code: p.currency || 'USD',
        volume: p.volume_bytes || (p.data_gb ? p.data_gb * 1024 * 1024 * 1024 : 0),
        duration: p.duration || p.duration_days || 30,
        duration_unit: (p.duration_unit || 'days').toLowerCase(),
        location_code: locationCode,
        location_name: locationName,
        description: p.description || '',
        data_type: dataType,
        sms_status: smsStatus,
        speed: p.speed || (p.features || []).find((f: string) => f.includes('5G') || f.includes('4G')) || '4G/LTE',
        network: p.network || p.provider_type || 'Multiple Networks',
        scope: p.scope || calculatedScope,
        is_active: true,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString(),
        packageType: p.metadata?.package_type || 'base',
        locationNetworkList: p.location_network_list || false
      };
    });

    // Apply client-side filters
    if (filters.locationCode && filters.locationCode !== 'all') {
      if (filters.locationCode === '!GL') {
        processed = processed.filter(pkg => pkg.scope === 'global')
      } else if (filters.locationCode === '!RG') {
        processed = processed.filter(pkg => pkg.scope === 'regional')
      } else {
        processed = processed.filter(pkg => pkg.location_code.split(',').includes(filters.locationCode!))
      }
    }

    if (filters.minPrice) {
      processed = processed.filter(pkg => pkg.price >= filters.minPrice!)
    }
    if (filters.maxPrice) {
      processed = processed.filter(pkg => pkg.price <= filters.maxPrice!)
    }
    if (filters.search) {
      const term = filters.search.toLowerCase()
      processed = processed.filter(pkg =>
        pkg.name.toLowerCase().includes(term) ||
        pkg.description.toLowerCase().includes(term) ||
        pkg.location_name.toLowerCase().includes(term)
      )
    }
    if (filters.dataType !== undefined) {
      processed = processed.filter(pkg => pkg.data_type === filters.dataType)
    }
    if (filters.smsSupport) {
      processed = processed.filter(pkg => pkg.sms_status >= 1)
    }

    // Apply client-side scope filter (only if no location filter is set, to avoid conflicts)
    if (filters.scope && !filters.locationCode) {
      processed = processed.filter(pkg => pkg.scope === filters.scope)
    }

    // Sort by price
    processed.sort((a, b) => a.price - b.price);

    return processed;
  }, [allPackagesRaw, filters, getPackageScope]);

  // Return state and utilities
  return {
    packages,
    loading,
    error,

    // Utilities
    formatPrice,
    formatDataVolume,
    getScopeDisplayName,
    getPackageScope,
    categorizePackages,

    // Helper actions
    refresh: () => { },
  }
}

// Additional utility functions for formatting
export const formatPrice = (priceInCents: number, currencyCode = 'USD'): string => {
  if (Number.isNaN(priceInCents)) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(priceInCents)
}

export const formatDataVolume = (bytes: number): string => {
  if (bytes === 0 || Number.isNaN(bytes)) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatDuration = (duration: number, unit: string): string => {
  if (!duration || duration === 0) return 'Unlimited'

  const unitMap: { [key: string]: string } = {
    'day': 'day',
    'days': 'day',
    'week': 'week',
    'weeks': 'week',
    'month': 'month',
    'months': 'month',
    'year': 'year',
    'years': 'year',
  }

  const normalizedUnit = unitMap[unit.toLowerCase()] || unit
  const plural = duration > 1 ? 's' : ''

  return `${duration} ${normalizedUnit}${plural}`
}

export const getScopeDisplayName = (scope: PackageScope): string => {
  switch (scope) {
    case 'global':
      return '🌍 Global Coverage'
    case 'regional':
      return '🌎 Multi-Country'
    case 'country':
      return '🇺🇳 Single Country'
    default:
      return scope
  }
}

export const getLocationDisplayName = (locationCode: string, locationName?: string): string => {
  if (locationCode === '!GL') return '🌍 Global'
  if (locationCode === '!' || locationCode === '!RG') return '🌎 Regional'

  // Use provided location name if available
  if (locationName && locationName.trim()) {
    const name = locationName

    // If location contains commas (multiple countries), truncate to first 3
    if (name.includes(',')) {
      const locations = name.split(',').map(loc => loc.trim())
      if (locations.length > 3) {
        return locations.slice(0, 3).join(', ') + '...'
      }
    }

    // If single location name is too long, truncate
    if (name.length > 25) {
      return name.substring(0, 25) + '...'
    }

    return name
  }

  // Try to convert country code to country name using Intl.DisplayNames
  try {
    // Handle multiple country codes (comma separated)
    if (locationCode.includes(',')) {
      const codes = locationCode.split(',').map(code => code.trim())
      const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })

      const countryNames = codes.map(code => {
        try {
          return displayNames.of(code.toUpperCase()) || code
        } catch {
          return code
        }
      })

      if (countryNames.length > 3) {
        return countryNames.slice(0, 3).join(', ') + '...'
      }
      return countryNames.join(', ')
    }

    // Single country code
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
    const countryName = displayNames.of(locationCode.toUpperCase())

    if (countryName) {
      // Truncate if too long
      if (countryName.length > 25) {
        return countryName.substring(0, 25) + '...'
      }
      return countryName
    }
  } catch (error) {
    // Fallback if Intl.DisplayNames fails
    console.warn('Failed to get country name for:', locationCode, error)
  }

  // Fallback to original code if conversion fails
  return locationCode
}

// Hook for fetching countries (filtered to exclude globals and regions)
export function useESIMCountries() {
  const { data: countries = [], isLoading: loading, error: queryError } = useQuery(
    ['esimCountries'],
    async () => {
      const { default: api } = await import('../services/api');

      // Scope detection function (needed internally)
      const getPackageScopeInternal = (locationCode: string, locationName?: string, packageName?: string): PackageScope => {
        const name = (packageName || '').toLowerCase()
        const location = (locationName || '').toLowerCase()
        if (name.includes('global')) return 'global'
        const regionalNames = ['europe', 'eu', 'eur', 'european union', 'caribbean', 'west indies', 'asia-pacific', 'asia pacific', 'asia', 'apac', 'south america', 'latin america', 'suramerica', 'middle east', 'gulf region', 'arab world', 'africa', 'north america', 'us & canada', 'oceania', 'pacific islands', 'australia & nz', 'eastern europe', 'cee', 'eastern eu', 'nordic region', 'scandinavia']
        const hasRegionalName = regionalNames.some(regionName => {
          if (regionName === 'africa') return name.includes('africa') && !name.includes('south africa')
          return name.includes(regionName) || location.includes(regionName)
        })
        const hasMultipleCountries = locationCode.includes(',') || locationCode.split(',').length > 1
        if (hasRegionalName && hasMultipleCountries) return 'regional'
        return 'country'
      }

      // Fetch ONLY esim products (Global)
      const { data } = await api.get('/web/api/products?product_type=esim&per_page=all');
      const allFetchedProducts: any[] = data.products || [];

      // Process packages to extract locations. Each country a MeiSIM travel plan
      // covers becomes a filter option; US phone-number lines are not data plans.
      const allPackages = allFetchedProducts
        .filter((p: any) => p.meisim_line !== 'us_prepaid')
        .flatMap((p: any) => {
          if (p.provider === 'meisim') {
            return (Array.isArray(p.countries) ? p.countries : []).map((code: string) => ({
              location_code: code, location_name: code, name: code,
            }));
          }
          return [{
            location_code: p.location_code || '!GL',
            location_name: p.location_name || 'Global',
            name: p.name
          }];
        });

      // Calculate scope for each package and filter to only single countries
      const countryPackages = allPackages.filter((pkg: any) => {
        const scope = getPackageScopeInternal(pkg.location_code, pkg.location_name, pkg.name)
        const isSingleCountryCode = !pkg.location_code.includes(',') && pkg.location_code.length <= 3 && /^[A-Za-z]{2,3}$/i.test(pkg.location_code)
        return scope === 'country' && isSingleCountryCode && pkg.location_code !== '!GL' && pkg.location_code !== '!RG'
      })

      // Remove duplicates and sort, then convert codes to country names
      const uniqueCountries = countryPackages
        .filter((item: any, index: number, self: any[]) => index === self.findIndex((t: any) => t.location_code === item.location_code))
        .map((item: any) => {
          try {
            const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
            const countryName = displayNames.of(item.location_code.toUpperCase())
            return {
              ...item,
              display_name: countryName || item.location_name || item.location_code
            }
          } catch (error) {
            return {
              ...item,
              display_name: item.location_name || item.location_code
            }
          }
        })
        .sort((a: any, b: any) => a.display_name.localeCompare(b.display_name))

      return uniqueCountries;
    }
  );

  const error = queryError ? String(queryError) : null;

  return { countries, loading, error }
}