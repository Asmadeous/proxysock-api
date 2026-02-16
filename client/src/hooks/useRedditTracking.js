// src/hooks/useRedditTracking.js
import { useEffect } from 'react';
import { redditPixel } from '../main';

export const useRedditTracking = () => {
  const trackPageView = () => {
    redditPixel.trackPageView();
  };

  const trackViewContent = (productId, category, value, currency) => {
    redditPixel.trackViewContent(productId, category, value, currency);
  };

  const trackAddToCart = (productId, category, value, currency, quantity) => {
    redditPixel.trackAddToCart(productId, category, value, currency, quantity);
  };

  const trackPurchase = (orderId, value, currency, items) => {
    redditPixel.trackPurchase(orderId, value, currency, items);
  };

  const trackSignUp = (userId) => {
    redditPixel.trackSignUp(userId);
  };

  const trackSearch = (searchTerm) => {
    redditPixel.trackSearch(searchTerm);
  };

  const trackLead = (leadData) => {
    redditPixel.trackLead(leadData);
  };

  return {
    trackPageView,
    trackViewContent,
    trackAddToCart,
    trackPurchase,
    trackSignUp,
    trackSearch,
    trackLead
  };
};