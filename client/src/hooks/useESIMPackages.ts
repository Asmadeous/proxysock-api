import { useState, useEffect, useMemo } from 'react'
import railsApi from '@/lib/railsApi'

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

      const hasRegionalName = regionalNames.some(regionName => {
        if (regionName === 'africa') {
          return name.includes('africa') && !name.includes('south africa')
        }
        return name.includes(regionName) || location.includes(regionName)
      })

      const hasMultipleCountries = locationCode.includes(',') || locationCode.split(',').length > 1

      if (hasRegionalName && hasMultipleCountries) {
        return 'regional'
      }

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
      // Build query params for Rails API
      const params: Record<string, any> = {
        type: 'esim',
        is_active: true
      }

      if (filters.locationCode && filters.locationCode !== '!GL' && filters.locationCode !== '!RG') {
        params.location_code = filters.locationCode
      }
      if (filters.minPrice) {
        params.min_price = filters.minPrice
      }
      if (filters.maxPrice) {
        params.max_price = filters.maxPrice
      }
      if (filters.search) {
        params.search = filters.search
      }
      if (filters.dataType !== undefined) {
        params.data_type = filters.dataType
      }
      if (filters.smsSupport) {
        params.sms_support = true
      }

      // Fetch from Rails API
      const response = await railsApi.get<{ products: any[] }>('/products', { params })
      const products = response.data.products || response.data || []

      // Transform products to ESIMPackage format
      const allPackages: ESIMPackage[] = products.map((product: any) => {
        const pricing = product.pricings?.[0]
        const metadata = product.metadata || {}

        const calculatedScope = getPackageScope(
          metadata.location_code || '',
          metadata.location_name || '',
          product.name
        )

        return {
          id: String(product.id),
          package_code: metadata.package_code || product.id,
          slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
          name: product.name,
          price: pricing?.selling_price || 0,
          currency_code: pricing?.currency || 'USD',
          volume: metadata.volume || 0,
          duration: metadata.duration || 0,
          duration_unit: metadata.duration_unit || 'days',
          location_code: metadata.location_code || '',
          location_name: metadata.location_name || '',
          description: product.description || '',
          data_type: metadata.data_type || 0,
          sms_status: metadata.sms_status || 0,
          speed: metadata.speed,
          network: metadata.network,
          scope: calculatedScope,
          is_active: product.status === 'active',
          created_at: product.created_at,
          updated_at: product.updated_at,
          packageType: metadata.is_topup ? 'topup' : 'base',
          locationNetworkList: metadata.location_network_list || false
        }
      })

      // Apply client-side location filter for special location codes
      let filteredPackages = allPackages
      if (filters.locationCode) {
        if (filters.locationCode === '!GL') {
          filteredPackages = filteredPackages.filter(pkg => pkg.scope === 'global')
        } else if (filters.locationCode === '!RG') {
          filteredPackages = filteredPackages.filter(pkg => pkg.scope === 'regional')
        }
      }

      // Apply client-side scope filter
      if (filters.scope && !filters.locationCode) {
        filteredPackages = filteredPackages.filter(pkg => pkg.scope === filters.scope)
      }

      // Sort by price
      filteredPackages.sort((a, b) => a.price - b.price)

      setPackages(filteredPackages)
    } catch (err) {
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

  if (locationName && locationName.trim()) {
    const name = locationName

    if (name.includes(',')) {
      const locations = name.split(',').map(loc => loc.trim())
      if (locations.length > 3) {
        return locations.slice(0, 3).join(', ') + '...'
      }
    }

    if (name.length > 25) {
      return name.substring(0, 25) + '...'
    }

    return name
  }

  try {
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

    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
    const countryName = displayNames.of(locationCode.toUpperCase())

    if (countryName) {
      if (countryName.length > 25) {
        return countryName.substring(0, 25) + '...'
      }
      return countryName
    }
  } catch (error) {
    console.warn('Failed to get country name for:', locationCode, error)
  }

  return locationCode
}

// Hook for fetching countries (filtered to exclude globals and regions)
export function useESIMCountries() {
  const [countries, setCountries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Scope detection function
  const getPackageScope = (locationCode: string, locationName?: string, packageName?: string): PackageScope => {
    const name = (packageName || '').toLowerCase()
    const location = (locationName || '').toLowerCase()

    if (name.includes('global')) {
      return 'global'
    }

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

    const hasRegionalName = regionalNames.some(regionName => {
      if (regionName === 'africa') {
        return name.includes('africa') && !name.includes('south africa')
      }
      return name.includes(regionName) || location.includes(regionName)
    })

    const hasMultipleCountries = locationCode.includes(',') || locationCode.split(',').length > 1

    if (hasRegionalName && hasMultipleCountries) {
      return 'regional'
    }

    return 'country'
  }

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        // Fetch eSIM products from Rails API
        const response = await railsApi.get<{ products: any[] }>('/products', {
          params: { type: 'esim', is_active: true }
        })

        const products = response.data.products || response.data || []

        // Filter to only country-level packages
        const countryPackages = products.filter((pkg: any) => {
          const metadata = pkg.metadata || {}
          const locationCode = metadata.location_code || ''
          const scope = getPackageScope(locationCode, metadata.location_name, pkg.name)

          const isSingleCountryCode = !locationCode.includes(',') &&
            locationCode.length <= 3 &&
            /^[A-Z]{2,3}$/i.test(locationCode)

          return scope === 'country' && isSingleCountryCode
        })

        // Remove duplicates and convert to country display format
        const uniqueCountries = countryPackages
          .filter((item: any, index: number, self: any[]) =>
            index === self.findIndex(t => (t.metadata?.location_code || '') === (item.metadata?.location_code || ''))
          )
          .map((item: any) => {
            const metadata = item.metadata || {}
            const locationCode = metadata.location_code || ''

            try {
              const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
              const countryName = displayNames.of(locationCode.toUpperCase())
              return {
                location_code: locationCode,
                location_name: metadata.location_name || '',
                display_name: countryName || metadata.location_name || locationCode
              }
            } catch {
              return {
                location_code: locationCode,
                location_name: metadata.location_name || '',
                display_name: metadata.location_name || locationCode
              }
            }
          })
          .sort((a: any, b: any) => a.display_name.localeCompare(b.display_name))

        setCountries(uniqueCountries)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch countries')
      } finally {
        setLoading(false)
      }
    }

    fetchCountries()
  }, [])

  return { countries, loading, error }
}