// gtag.js - Place this file in your public folder
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

// Replace G-XXXXXXXXXX with your actual Google Analytics measurement ID
gtag('config', 'G-XXXXXXXXXX', {
  // Enable enhanced ecommerce
  enhanced_ecommerce: true,
  // Optional: disable automatic page view tracking if you want to track manually
  send_page_view: false
});

// Optional: Track page views manually
gtag('event', 'page_view', {
  page_title: document.title,
  page_location: window.location.href
});