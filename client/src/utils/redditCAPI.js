// src/utils/redditCAPI.js

class RedditCAPI {
  constructor() {
    this.endpoint = ''; // Stubbed
  }

  async sendEvent(eventType, userData, customData = {}) {
    try {
      const payload = {
        event_type: eventType,
        event_time: Date.now(),
        event_source_url: window.location.href,
        user_data: this.prepareUserData(userData),
        custom_data: customData
      };

      const response = await fetch(`${import.meta.env.VITE_RAILS_API_URL}/analytics/reddit-capi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send Reddit CAPI event');
      }

      const data = await response.json();
      console.log(`[RedditCAPI] Event ${eventType} sent:`, data);
      return data;

    } catch (error) {
      console.error('Reddit CAPI Error:', error)
      throw error
    }
  }

  prepareUserData(userData) {
    const prepared = {}

    if (userData.email) {
      prepared.email = this.hashEmail(userData.email)
    }

    if (userData.clickId) prepared.click_id = userData.clickId
    if (userData.uuid) prepared.uuid = userData.uuid
    if (userData.ipAddress) prepared.ip_address = userData.ipAddress
    if (userData.userAgent) prepared.user_agent = userData.userAgent
    if (userData.externalId) prepared.external_id = userData.externalId
    if (userData.mobileAdId) prepared.mobile_advertising_id = userData.mobileAdId

    return prepared
  }

  // Hash email for privacy
  async hashEmail(email) {
    const encoder = new TextEncoder()
    const data = encoder.encode(email.toLowerCase().trim())
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Note: Phone number tracking removed as not collected
}

export default RedditCAPI