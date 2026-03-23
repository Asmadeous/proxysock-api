import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../../context/AuthContext";
import { VPNHeroSection } from "@/components/landing/vpn/VPNHeroSection";
import { VPNPlansSection } from "@/components/landing/vpn/VPNPlansSection";
import { VPNFeatures } from "@/components/landing/vpn/VPNFeatures";
import { VPNUseCases } from "@/components/landing/vpn/VPNUseCases";
import { VPNFAQ } from "@/components/landing/vpn/VPNFAQ";
import { VPNCTA } from "@/components/landing/vpn/VPNCTA";

export default function VPNPage() {
  const { isLoading } = useAuth();

  // Conversion tracking function
  const trackConversion = (
    action: string,
    _category?: string,
    href?: string,
  ) => {
    if (action.includes("navigation") && href) {
      // Add navigation tracking logic here if needed
    } else if (action.includes("lead") || action.includes("contact")) {
      // Add lead tracking logic here if needed
    } else {
      // Add general engagement tracking logic here if needed
    }
  };

  useEffect(() => {
    document.title =
      "VPN Services - Secure & Fast Virtual Private Network | ProxySock";
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "ProxySock VPN Services",
    description:
      "Secure VPN services with global server coverage, fast speeds, and military-grade encryption. Protect your online privacy and bypass restrictions.",
    brand: {
      "@type": "Brand",
      name: "ProxySock",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "15.00",
      highPrice: "55.00",
      offerCount: "4",
    },
  };

  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Secure VPN Services - ProxySock",
    description:
      "Get secure VPN services with global server coverage, fast speeds, and military-grade encryption. Starting from $15.00 USD.",
    url: globalThis.location?.href,
  };

  return (
    <>
      <Helmet>
        {/* Enhanced SEO meta tags */}
        <title>
          Secure VPN Services | ProxySock - 99.9% Uptime Guaranteed
        </title>
        <meta
          name="description"
          content="Get secure VPN services with global server coverage, fast speeds, and military-grade encryption. Starting from $15.00 USD."
        />
        <meta
          name="keywords"
          content="vpn, virtual private network, secure vpn, fast vpn, privacy vpn, bypass restrictions, global vpn servers, military encryption"
        />

        {/* Canonical URL for canonicalization */}
        <link rel="canonical" href="https://www.proxysock.com/vpn" />

        {/* Open Graph tags for social media integration */}
        <meta
          property="og:title"
          content="VPN Services - Secure & Fast Virtual Private Network | ProxySock"
        />
        <meta
          property="og:description"
          content="Get secure VPN services with global server coverage, fast speeds, and military-grade encryption. Protect your privacy and bypass geo-restrictions."
        />
        <meta property="og:url" content="https://www.proxysock.com/vpn" />
        <meta
          property="og:image"
          content="https://www.proxysock.com/images/vpn-og-image.jpg"
        />
        <meta property="og:type" content="website" />

        {/* Twitter Card tags for social media */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="VPN Services - Secure & Fast Virtual Private Network | ProxySock"
        />
        <meta
          name="twitter:description"
          content="Get secure VPN services with global server coverage, fast speeds, and military-grade encryption. Protect your privacy and bypass geo-restrictions."
        />
        <meta
          name="twitter:image"
          content="https://www.proxysock.com/images/vpn-og-image.jpg"
        />

        {/* Structured Data Scripts */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(webPageData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <VPNHeroSection trackConversion={trackConversion} />

        {/* Plans Section */}
        <VPNPlansSection trackConversion={trackConversion} />

        {/* Features Section */}
        <VPNFeatures />

        {/* Use Cases */}
        <VPNUseCases />

        {/* FAQ Section */}
        <VPNFAQ />

        {/* Final CTA */}
        <VPNCTA trackConversion={trackConversion} />
      </div>
    </>
  );
}
