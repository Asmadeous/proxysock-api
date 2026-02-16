// src/hooks/useRedditAnalytics.js
import { useRedditTracking } from './useRedditTracking'
import RedditCAPI from '../utils/redditCAPI'

const capi = new RedditCAPI()

export const useRedditAnalytics = () => {
  const pixelTracking = useRedditTracking()

  const trackEvent = async (eventType, pixelData, capiData) => {
    // Track via Pixel (client-side)
    switch (eventType) {
      case 'PageVisit':
        pixelTracking.trackPageView()
        break
      case 'ViewContent':
        pixelTracking.trackViewContent(pixelData.productId, pixelData.category, pixelData.value, pixelData.currency)
        break
      case 'AddToCart':
        pixelTracking.trackAddToCart(pixelData.productId, pixelData.category, pixelData.value, pixelData.currency, pixelData.quantity)
        break
      case 'Purchase':
        pixelTracking.trackPurchase(pixelData.orderId, pixelData.value, pixelData.currency, pixelData.items)
        break
      case 'SignUp':
        pixelTracking.trackSignUp(pixelData.userId)
        break
      case 'Search':
        pixelTracking.trackSearch(pixelData.searchTerm)
        break
      case 'Lead':
        pixelTracking.trackLead(pixelData.leadData)
        break
    }

    // Track via CAPI (server-side)
    try {
      await capi.sendEvent(eventType, capiData.userData, capiData.customData)
    } catch (error) {
      console.error('CAPI tracking failed:', error)
    }
  }

  return { trackEvent }
}