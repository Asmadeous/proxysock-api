// src/utils/redditPixel.ts - Updated to use Rails API
import { useEffect } from 'react';
import railsApi from '../lib/railsApi';

// TypeScript declarations
declare global {
  interface Window {
    rdt: any;
    redditPixelTracker?: RedditPixelTracker;
  }
}

class RedditPixelTracker {
  private initialized = false;
  private readonly pixelId: string;

  constructor(pixelId: string) {
    this.pixelId = pixelId;
    this.initOfficialPixel();
  }

  private initOfficialPixel() {
    if (typeof globalThis === 'undefined' || !this.pixelId) return;

    // Reddit pixel implementation
    (function (w: any, d: Document, s: string, r: string) {
      if (w.rdt) return;
      const p = (w.rdt = function (...args: any[]) {
        (p as any).sendEvent ? (p as any).sendEvent(...args) : (p as any).callQueue.push(args);
      });
      (p as any).callQueue = [];
      const t = d.createElement(s) as HTMLScriptElement;
      t.src = r;
      t.async = true;
      const a = d.getElementsByTagName(s)[0];
      a.parentNode?.insertBefore(t, a);
    })(globalThis, document, "script", "https://www.redditstatic.com/ads/pixel.js");

    // Initialize exactly as Reddit docs show
    (globalThis as any).rdt('init', this.pixelId);
    (globalThis as any).rdt('track', 'PageVisit');

    this.initialized = true;
    console.log('🎯 Reddit Pixel initialized');
  }

  private async getCurrentUser() {
    try {
      const response = await railsApi.get<{ user: any }>('/auth/me');
      return response.data.user;
    } catch {
      return null;
    }
  }

  private getClickId() {
    const urlParams = new URLSearchParams(globalThis.location?.search);
    return urlParams.get('reddit_click_id') || urlParams.get('rdt_cid');
  }

  private async hashEmail(email: string) {
    if (!email) return null;
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(email.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('Email hashing failed:', error);
      return null;
    }
  }

  private async sendToConversionsAPI(eventData: any) {
    try {
      // Send to Rails API which will forward to Reddit CAPI
      await railsApi.post('/analytics/reddit-capi', { events: [eventData] });
    } catch (error) {
      console.error('CAPI error:', error);
    }
  }

  async trackPageView() {
    if (this.initialized && (globalThis as any).rdt) {
      try {
        (globalThis as any).rdt('track', 'PageVisit');
      } catch (error) {
        console.warn('Pixel PageVisit failed:', error);
      }
    }

    try {
      const user = await this.getCurrentUser();
      await this.sendToConversionsAPI({
        event_type: 'PageVisit',
        event_time: Math.floor(Date.now() / 1000),
        user_data: {
          click_id: this.getClickId(),
          external_id: user?.id,
          email: user?.email ? await this.hashEmail(user.email) : null,
          user_agent: navigator.userAgent
        },
        user_id: user?.id
      });
    } catch (error) {
      console.error('PageVisit CAPI failed:', error);
    }
  }

  async trackNavigation(pageName: string, href: string) {
    if (this.initialized && (globalThis as any).rdt) {
      try {
        (globalThis as any).rdt('track', 'PageVisit', {
          customEventName: 'Navigation',
          page: pageName
        });
      } catch (error) {
        console.warn('Pixel Navigation failed:', error);
      }
    }

    try {
      const user = await this.getCurrentUser();
      await this.sendToConversionsAPI({
        event_type: 'PageVisit',
        event_time: Math.floor(Date.now() / 1000),
        user_data: {
          click_id: this.getClickId(),
          external_id: user?.id,
          email: user?.email ? await this.hashEmail(user.email) : null,
          user_agent: navigator.userAgent
        },
        custom_data: {
          navigation_target: pageName,
          destination_url: href,
          event_category: 'navigation'
        },
        event_source_url: globalThis.location?.href,
        user_id: user?.id
      });
    } catch (error) {
      console.error('Navigation CAPI failed:', error);
    }
  }

  async trackSearch(searchTerm: string, category: string = 'general') {
    if (this.initialized && (globalThis as any).rdt) {
      try {
        (globalThis as any).rdt('track', 'Search', {
          customEventName: 'Search',
          searchString: searchTerm
        });
      } catch (error) {
        console.warn('Pixel Search failed:', error);
      }
    }

    try {
      const user = await this.getCurrentUser();
      await this.sendToConversionsAPI({
        event_type: 'Search',
        event_time: Math.floor(Date.now() / 1000),
        user_data: {
          click_id: this.getClickId(),
          external_id: user?.id,
          email: user?.email ? await this.hashEmail(user.email) : null,
          user_agent: navigator.userAgent
        },
        custom_data: {
          search_string: searchTerm,
          search_category: category
        },
        event_source_url: globalThis.location?.href,
        user_id: user?.id
      });
    } catch (error) {
      console.error('Search CAPI failed:', error);
    }
  }

  async trackSignUp(data: { userId: string; email: string; method?: string }) {
    if (this.initialized && (globalThis as any).rdt) {
      try {
        (globalThis as any).rdt('track', 'SignUp', { customEventName: 'SignUp' });
      } catch (error) {
        console.warn('Pixel SignUp failed:', error);
      }
    }

    try {
      await this.sendToConversionsAPI({
        event_type: 'SignUp',
        event_time: Math.floor(Date.now() / 1000),
        user_data: {
          click_id: this.getClickId(),
          external_id: data.userId,
          email: await this.hashEmail(data.email),
          user_agent: navigator.userAgent
        },
        custom_data: {
          conversion_id: `signup_${data.userId}`,
          product_category: 'registration'
        },
        event_source_url: globalThis.location?.href,
        user_id: data.userId
      });
      console.log('✅ SignUp tracked');
    } catch (error) {
      console.error('SignUp CAPI failed:', error);
      throw error;
    }
  }

  async trackViewContent(data: {
    productId: string;
    productName: string;
    category: string;
    value: number;
    currency?: string;
  }) {
    if (this.initialized && (globalThis as any).rdt) {
      try {
        (globalThis as any).rdt('track', 'ViewContent', {
          value: data.value,
          currency: data.currency || 'USD',
          itemId: data.productId,
          itemCategory: data.category
        });
      } catch (error) {
        console.warn('Pixel ViewContent failed:', error);
      }
    }

    try {
      const user = await this.getCurrentUser();
      await this.sendToConversionsAPI({
        event_type: 'ViewContent',
        event_time: Math.floor(Date.now() / 1000),
        user_data: {
          click_id: this.getClickId(),
          external_id: user?.id,
          email: user?.email ? await this.hashEmail(user.email) : null,
          user_agent: navigator.userAgent
        },
        custom_data: {
          value: data.value,
          currency: data.currency || 'USD',
          product_id: data.productId,
          product_name: data.productName,
          product_category: data.category
        },
        event_source_url: globalThis.location?.href,
        user_id: user?.id
      });
    } catch (error) {
      console.error('ViewContent CAPI failed:', error);
    }
  }

  async trackLead(data: {
    interest: string;
    value?: number;
    leadType?: string;
  }) {
    if (this.initialized && (globalThis as any).rdt) {
      try {
        (globalThis as any).rdt('track', 'Lead', {
          customEventName: 'Lead',
          value: data.value || 0,
          currency: 'USD'
        });
      } catch (error) {
        console.warn('Pixel Lead failed:', error);
      }
    }

    try {
      const user = await this.getCurrentUser();
      await this.sendToConversionsAPI({
        event_type: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        user_data: {
          click_id: this.getClickId(),
          external_id: user?.id,
          email: user?.email ? await this.hashEmail(user.email) : null,
          user_agent: navigator.userAgent
        },
        custom_data: {
          lead_interest: data.interest,
          lead_type: data.leadType || 'contact',
          value: data.value || 0,
          currency: 'USD'
        },
        event_source_url: globalThis.location?.href,
        user_id: user?.id
      });
      console.log('✅ Lead tracked');
    } catch (error) {
      console.error('Lead CAPI failed:', error);
    }
  }

  async trackAddToCart(data: {
    productId: string;
    productName: string;
    category: string;
    value: number;
    currency?: string;
  }) {
    if (this.initialized && (globalThis as any).rdt) {
      try {
        (globalThis as any).rdt('track', 'AddToCart', {
          itemCount: 1,
          value: data.value,
          currency: data.currency || 'USD',
          itemId: data.productId,
          itemCategory: data.category
        });
      } catch (error) {
        console.warn('Pixel AddToCart failed:', error);
      }
    }

    try {
      const user = await this.getCurrentUser();
      await this.sendToConversionsAPI({
        event_type: 'AddToCart',
        event_time: Math.floor(Date.now() / 1000),
        user_data: {
          click_id: this.getClickId(),
          external_id: user?.id,
          email: user?.email ? await this.hashEmail(user.email) : null,
          user_agent: navigator.userAgent
        },
        custom_data: {
          value: data.value,
          currency: data.currency || 'USD',
          product_id: data.productId,
          product_name: data.productName,
          product_category: data.category,
          item_count: 1
        },
        event_source_url: globalThis.location?.href,
        user_id: user?.id
      });
      console.log('✅ AddToCart tracked');
    } catch (error) {
      console.error('AddToCart CAPI failed:', error);
    }
  }

  async trackPurchase(data: {
    orderId: string;
    value: number;
    currency?: string;
    items?: any[];
    category: string;
  }) {
    if (this.initialized && (globalThis as any).rdt) {
      try {
        (globalThis as any).rdt('track', 'Purchase', {
          value: data.value,
          currency: data.currency || 'USD',
          transactionId: data.orderId,
          itemCount: data.items?.length || 1
        });
      } catch (error) {
        console.warn('Pixel Purchase failed:', error);
      }
    }

    try {
      const user = await this.getCurrentUser();
      await this.sendToConversionsAPI({
        event_type: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        user_data: {
          click_id: this.getClickId(),
          external_id: user?.id,
          email: user?.email ? await this.hashEmail(user.email) : null,
          user_agent: navigator.userAgent
        },
        custom_data: {
          value: data.value,
          currency: data.currency || 'USD',
          transaction_id: data.orderId,
          product_category: data.category,
          item_count: data.items?.length || 1
        },
        event_source_url: globalThis.location?.href,
        user_id: user?.id
      });
      console.log('✅ Purchase tracked');
    } catch (error) {
      console.error('Purchase CAPI failed:', error);
    }
  }
}

// Hook for App.tsx
export const useRedditPixel = (pixelId: string) => {
  useEffect(() => {
    if (!pixelId) return;

    if (!(globalThis as any).redditPixelTracker) {
      (globalThis as any).redditPixelTracker ??= new RedditPixelTracker(pixelId);
    }
  }, [pixelId]);
};

// Hook for tracking with all methods
export const useRedditTracking = () => {
  const tracker = (globalThis as any).redditPixelTracker;

  return {
    trackPageView: () => tracker?.trackPageView(),
    trackNavigation: (pageName: string, href: string) => tracker?.trackNavigation(pageName, href),
    trackSearch: (searchTerm: string, category?: string) => tracker?.trackSearch(searchTerm, category),
    trackLead: (data: { interest: string; value?: number; leadType?: string }) => tracker?.trackLead(data),
    trackSignUp: (data: { userId: string; email: string; method?: string }) =>
      tracker?.trackSignUp(data),
    trackViewContent: (data: {
      productId: string;
      productName: string;
      category: string;
      value: number;
      currency?: string;
    }) => tracker?.trackViewContent(data),
    trackAddToCart: (data: {
      productId: string;
      productName: string;
      category: string;
      value: number;
      currency?: string;
    }) => tracker?.trackAddToCart(data),
    trackPurchase: (data: {
      orderId: string;
      value: number;
      currency?: string;
      items?: any[];
      category: string;
    }) => tracker?.trackPurchase(data)
  };
};

// For existing registration component and contact forms
export const conversionTracker = {
  trackSignUp: (data: { userId: string; email: string; method?: string }) =>
    (globalThis as any).redditPixelTracker?.trackSignUp(data),
  trackNavigation: (pageName: string, href: string) =>
    (globalThis as any).redditPixelTracker?.trackNavigation(pageName, href),
  trackSearch: (searchTerm: string, category?: string) =>
    (globalThis as any).redditPixelTracker?.trackSearch(searchTerm, category),
  trackLead: (data: { interest: string; value?: number; leadType?: string }) =>
    (globalThis as any).redditPixelTracker?.trackLead(data),
  trackPurchase: (data: { orderId: string; value: number; currency?: string; items?: any[]; category: string }) =>
    (globalThis as any).redditPixelTracker?.trackPurchase(data),
  trackViewContent: (data: { productId: string; productName: string; category: string; value: number; currency?: string }) =>
    (globalThis as any).redditPixelTracker?.trackViewContent(data),
  trackAddToCart: (data: { productId: string; productName: string; category: string; value: number; currency?: string }) =>
    (globalThis as any).redditPixelTracker?.trackAddToCart(data)
};

export default conversionTracker;