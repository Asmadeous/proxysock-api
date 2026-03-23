# Analytics & SEO Guide

ProxySock implements a robust tracking and search engine optimization strategy to maximize conversion and visibility.

## 📊 Conversion Tracking

### Reddit Conversions API (CAPI)
To combat ad-blockers and cookie restrictions, we use server-side tracking via Reddit CAPI.
- **Backend Service**: `app/services/reddit_conversion_service.rb`
- **Frontend Utility**: `client/src/utils/redditCAPI.js`
- **Events Tracked**:
  - `PageVisit`: Triggered on every page load.
  - `AddToCart`: Triggered when an item is added to the cart.
  - `Purchase`: Triggered after a successful webhook confirmation.
- **Hashing**: User sensitive data (Email) is SHA-256 hashed before being sent to Reddit.

### Reddit Pixel
The client-side companion to CAPI.
- **Utility**: `client/src/utils/redditPixel.ts`
- **Implementation**: Automatically falls back to CAPI if the browser pixel fails to load.

---

## 🔍 Search Engine Optimization (SEO)

### `AutoSEO` Component
The `client/src/components/AutoSEO.tsx` component dynamically updates the document title and meta tags based on the current route.
- **Features**:
  - Dynamic Title Tags.
  - Meta Descriptions.
  - Open Graph (OG) tags for social sharing.
  - Canonical URLs to prevent duplicate content issues.

### Semantic HTML
Our frontend follows HTML5 semantic standards (using `<main>`, `<section>`, `<article>`, and proper `<h1>`-`<h6>` hierarchy) to ensure search engines can easily index our content.

---

## 📈 Marketing Tools
The platform also supports integration placeholders for:
- **Google Analytics 4 (GA4)**
- **Facebook Pixel** (Conversion API)

These can be configured via environment variables in the `.env` files.
