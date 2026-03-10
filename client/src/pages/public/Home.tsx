import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useRedditPixel, useRedditTracking } from "../../utils/redditPixel";
import { HeroSection } from "@/components/landing/HeroSeciton";
import { EnhancedProductsGrid } from "@/components/landing/EnhancedProductsGrid";
import { EnhancedStatsSection } from "@/components/landing/EnhancedStatsSection";
import { WhyChooseUs } from "@/components/landing/WhyChooseUs";
import { CallToAction } from "@/components/landing/CallToAction";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { SecurePaymentsSection } from "@/components/landing/PaymentMethods";
import { useAuth } from "@/context/AuthContext";
import { Loading } from "@/components/ui/loading";

export default function MainLandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // Initialize Reddit Pixel from environment variable
  useRedditPixel(import.meta.env.VITE_REDDIT_PIXEL_ID);

  // Get Reddit tracking functions
  const { trackPageView, trackNavigation, trackLead, trackViewContent } =
    useRedditTracking();

  useEffect(() => {
    // Track initial page view with Reddit (delayed to not block render)
    const trackTimeout = setTimeout(() => {
      trackPageView?.();
    }, 100);

    return () => {
      clearTimeout(trackTimeout);
    };
  }, [trackPageView]);

  // Reddit conversion tracking function
  const trackConversion = (
    action: string,
    category: string = "engagement",
    href?: string,
  ) => {
    if (action.includes("navigation") && href) {
      trackNavigation?.(action, href);
    } else if (action.includes("lead") || action.includes("contact")) {
      trackLead?.({
        interest: action,
        leadType: category,
        value: category === "conversion" ? 25 : 0, // Assign value for conversions
      });
    } else {
      // For general engagement tracking
      trackNavigation?.(action, globalThis.location?.href || "");
    }
  };

  if (isLoading) {
    return <Loading size="full" text="Initializing ProxySock..." />;
  }

  // Structured Data for SEO (keeping this as it's not ads related)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ProxySock",
    description:
      "Premium digital infrastructure provider offering residential VPN, proxy services, RDP hosting, VPS hosting, and eSIM solutions",
    url: globalThis.location?.origin,
    logo: globalThis.location?.origin + "/logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-XXX-XXX-XXXX",
      contactType: "customer service",
      email: "support@proxysock.com",
      availableLanguage: "English",
    },
    sameAs: ["https://x.com/cybertwts", "https://t.me/Proxy_sock5"],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "1.00",
      highPrice: "199.99",
      offerCount: "4",
    },
  };

  // Additional WebPage Structured Data for better SEO
  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "ProxySock - Premium VPN, Proxy, RDP, VPS & eSIM Services",
    description:
      "Buy premium residential VPN, proxy services, Windows RDP hosting, VPS servers & eSIM cards. Secure residential IPs, 50,000+ IPs, 120+ countries, 99.9% uptime, 24/7 support.",
    url: globalThis.location?.href,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: globalThis.location?.origin,
        },
      ],
    },
  };

  return (
    <>
      <Helmet>
        {/* Enhanced SEO meta tags */}
        <title>
          Premium Residential VPN, Proxy, RDP, VPS & eSIM Services | ProxySock
        </title>
        <meta
          name="description"
          content="Buy premium residential VPN, proxy services, Windows RDP hosting, VPS servers & eSIM cards. Secure residential IPs, 50,000+ IPs, 120+ countries, 99.9% uptime, 24/7 support."
        />
        <meta
          name="keywords"
          content="residential vpn, vpn service, proxy service, RDP hosting, VPS hosting, eSIM cards, datacenter proxy, residential proxy, ISP proxy, Windows RDP, Linux VPS, digital infrastructure, secure vpn"
        />

        {/* Canonical URL for canonicalization */}
        <link rel="canonical" href="https://www.proxysock.com/" />

        {/* Open Graph tags for social media integration */}
        <meta
          property="og:title"
          content="Premium Residential VPN, Proxy, RDP, VPS & eSIM Services | ProxySock"
        />
        <meta
          property="og:description"
          content="Buy premium residential VPN, proxy services, Windows RDP hosting, VPS servers & eSIM cards. Secure residential IPs, 50,000+ IPs, 120+ countries, 99.9% uptime, 24/7 support."
        />
        <meta property="og:url" content="https://www.proxysock.com/" />
        <meta
          property="og:image"
          content="https://www.proxysock.com/images/og-image.jpg"
        />
        <meta property="og:type" content="website" />

        {/* Twitter Card tags for social media */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Premium Residential VPN, Proxy, RDP, VPS & eSIM Services | ProxySock"
        />
        <meta
          name="twitter:description"
          content="Buy premium residential VPN, proxy services, Windows RDP hosting, VPS servers & eSIM cards. Secure residential IPs, 50,000+ IPs, 120+ countries, 99.9% uptime, 24/7 support."
        />
        <meta
          name="twitter:image"
          content="https://www.proxysock.com/images/og-image.jpg"
        />

        {/* Structured Data Scripts */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(webPageData)}
        </script>
      </Helmet>

      <div className="min-h-screen ">
        {/* Enhanced Hero Section with Trust Signals */}
        <HeroSection trackConversion={trackConversion} />

        {/* Enhanced Products Grid Section */}
        <EnhancedProductsGrid
          trackConversion={trackConversion}
          trackViewContent={trackViewContent}
        />

        {/* Enhanced Stats Section */}
        <EnhancedStatsSection />

        {/* Enhanced Why Choose Us */}
        <WhyChooseUs />

        {/* Enhanced Testimonials */}
        <TestimonialsSection />

        {/* Enhanced CTA Section */}
        <CallToAction
          trackConversion={trackConversion}
          isAuthenticated={isAuthenticated}
        />

        {/* Payment Methods Section */}
        <SecurePaymentsSection />
      </div>
    </>
  );
}
