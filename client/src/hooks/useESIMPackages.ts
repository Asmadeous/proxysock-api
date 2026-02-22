import { useState, useEffect, useMemo } from 'react'

// Supabase has been removed in favor of the Rails API


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

/**
 * Main Hook
 */
export function useESIMPackages(filters: PackageFilters = {}) {
  const [packages, setPackages] = useState<ESIMPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      }).format(priceInCents / 10000)
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

  // Apply filters to query
  const applyFilters = async () => {
    setLoading(true)
    setError(null)

    try {
      // Import the API client inline to avoid circular dependencies if any
      const { default: api } = await import('../services/api');

      // Fetch both usa_esim and esim products
      const [usaRes, globalRes] = await Promise.all([
        api.get('/web/api/products?product_type=usa_esim'),
        api.get('/web/api/products?product_type=esim')
      ]);

      const allFetchedProducts = [
        ...(usaRes.data?.products || []),
        ...(globalRes.data?.products || [])
      ];

      // Map backend products to ESIMPackage interface
      let allPackages: ESIMPackage[] = allFetchedProducts.map((p: any) => {
        // Parse features or default to some basics
        const features = p.features || [];
        const hasSMS = p.sms_quota && p.sms_quota > 0;
        const smsStatus = hasSMS || features.some((f: string) => f.toLowerCase().includes('sms')) ? 1 : 0;

        let locationCode = '!GL'; // Default global
        let locationName = 'Global';

        // Try to infer location from name or description
        const nameLower = p.name.toLowerCase();
        if (nameLower.includes('usa') || nameLower.includes('us ')) {
          locationCode = 'US';
          locationName = 'United States';
        } else if (nameLower.includes('europe') || nameLower.includes('eu ')) {
          locationCode = '!RG';
          locationName = 'Europe';
        } else if (nameLower.includes('global')) {
          locationCode = '!GL';
          locationName = 'Global';
        }

        const calculatedScope = getPackageScope(locationCode, locationName, p.name);

        return {
          id: String(p.id),
          package_code: p.slug,
          slug: p.slug,
          name: p.name,
          price: Number.parseFloat(p.price) * 10000, // Convert to cents for UI
          currency_code: p.currency || 'USD',
          volume: p.data_gb ? p.data_gb * 1024 * 1024 * 1024 : 0, // Convert GB to bytes
          duration: p.duration_days || 30,
          duration_unit: 'days',
          location_code: locationCode,
          location_name: locationName,
          description: p.description || '',
          data_type: p.data_gb === null ? 0 : 1, // 0 unlimited, 1 fixed
          sms_status: smsStatus,
          speed: features.find((f: string) => f.includes('5G') || f.includes('4G')) || '4G/LTE',
          network: p.provider_type || 'Multiple Networks',
          scope: calculatedScope,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          packageType: 'base' as const,
          locationNetworkList: false
        };
      });

      // Apply client-side filters
      if (filters.locationCode && filters.locationCode !== 'all') {
        if (filters.locationCode === '!GL') {
          allPackages = allPackages.filter(pkg => pkg.scope === 'global')
        } else if (filters.locationCode === '!RG') {
          allPackages = allPackages.filter(pkg => pkg.scope === 'regional')
        } else {
          allPackages = allPackages.filter(pkg => pkg.location_code === filters.locationCode)
        }
      }

      if (filters.minPrice) {
        allPackages = allPackages.filter(pkg => pkg.price >= filters.minPrice!)
      }
      if (filters.maxPrice) {
        allPackages = allPackages.filter(pkg => pkg.price <= filters.maxPrice!)
      }
      if (filters.search) {
        const term = filters.search.toLowerCase()
        allPackages = allPackages.filter(pkg =>
          pkg.name.toLowerCase().includes(term) ||
          pkg.description.toLowerCase().includes(term) ||
          pkg.location_name.toLowerCase().includes(term)
        )
      }
      if (filters.dataType !== undefined) {
        allPackages = allPackages.filter(pkg => pkg.data_type === filters.dataType)
      }
      if (filters.smsSupport) {
        allPackages = allPackages.filter(pkg => pkg.sms_status >= 1)
      }

      // Apply client-side scope filter (only if no location filter is set, to avoid conflicts)
      if (filters.scope && !filters.locationCode) {
        allPackages = allPackages.filter(pkg => pkg.scope === filters.scope)
      }

      // Sort by price
      allPackages.sort((a, b) => a.price - b.price);

      setPackages(allPackages)
    } catch (err) {
      console.error("Error fetching eSIM packages:", err);
      setError(err instanceof Error ? err.message : 'Failed to fetch packages')
    } finally {
      setLoading(false)
    }
  }

  // Fetch filtered packages
  useEffect(() => {
    applyFilters()
  }, [filters])

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
    refresh: applyFilters,
  }
}

// Additional utility functions for formatting
export const formatPrice = (priceInCents: number, currencyCode = 'USD'): string => {
  if (Number.isNaN(priceInCents)) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(priceInCents / 10000)
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
  const [countries, setCountries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Scope detection function (same as main hook)
  const getPackageScope = (locationCode: string, locationName?: string, packageName?: string): PackageScope => {
    const name = (packageName || '').toLowerCase()
    const location = (locationName || '').toLowerCase()

    // Global: if name contains "global"
    if (name.includes('global')) {
      return 'global'
    }

    // Regional: package name must match region AND location_code must have multiple countries
    const regionalNames = [
      'europe', 'eu', 'eur', 'european union',
      'caribbean', 'west indies',
      'asia-pacific', 'asia pacific', 'asia', 'apac',
      'south america', 'latin america', 'suramerica',
      'middle east', 'gulf region', 'arab world',
      'africa',
      'north america', 'us & canada',
      'oceania', 'pacific islands', 'australia & nz',
      'eastern europe', 'cee', 'eastern eu',
      'nordic region', 'scandinavia'
    ]

    // Check if package name contains regional name (but exclude country names like "South Africa")
    const hasRegionalName = regionalNames.some(regionName => {
      if (regionName === 'africa') {
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

    return 'country'
  }

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const { default: api } = await import('../services/api');

        // Fetch both usa_esim and esim products
        const [usaRes, globalRes] = await Promise.all([
          api.get('/web/api/products?product_type=usa_esim'),
          api.get('/web/api/products?product_type=esim')
        ]);

        const allFetchedProducts = [
          ...(usaRes.data?.products || []),
          ...(globalRes.data?.products || [])
        ];

        // Process packages to extract locations
        const allPackages = allFetchedProducts.map((p: any) => {
          let locationCode = '!GL';
          let locationName = 'Global';

          const nameLower = p.name.toLowerCase();
          if (nameLower.includes('usa') || nameLower.includes('us ')) {
            locationCode = 'US';
            locationName = 'United States';
          } else if (nameLower.includes('europe') || nameLower.includes('eu ')) {
            locationCode = '!RG';
            locationName = 'Europe';
          } else if (nameLower.includes('global')) {
            locationCode = '!GL';
            locationName = 'Global';
          }

          return {
            location_code: locationCode,
            location_name: locationName,
            name: p.name
          };
        });

        // Calculate scope for each package and filter to only single countries
        const countryPackages = allPackages.filter(pkg => {
          const scope = getPackageScope(pkg.location_code, pkg.location_name, pkg.name)

          // Must be country scope AND have single country code (no commas, typically 2-3 letters)
          const isSingleCountryCode = !pkg.location_code.includes(',') &&
            pkg.location_code.length <= 3 &&
            /^[A-Za-z]{2,3}$/i.test(pkg.location_code)

          return scope === 'country' && isSingleCountryCode && pkg.location_code !== '!GL' && pkg.location_code !== '!RG'
        })

        // Remove duplicates and sort, then convert codes to country names
        const uniqueCountries = countryPackages
          .filter((item, index, self) =>
            index === self.findIndex(t => t.location_code === item.location_code)
          )
          .map(item => {
            // Convert location code to country name using Intl.DisplayNames
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
          .sort((a, b) => a.display_name.localeCompare(b.display_name))

        setCountries(uniqueCountries)
      } catch (err) {
        console.error("Error fetching eSIM countries:", err);
        setError(err instanceof Error ? err.message : 'Failed to fetch countries')
      } finally {
        setLoading(false)
      }
    }

    fetchCountries()
  }, [])

  return { countries, loading, error }
}