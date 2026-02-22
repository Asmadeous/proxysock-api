import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import { VPSHeroSection } from "@/components/landing/vps/VPSHeroSection";
import { VPSPlansSection } from "@/components/landing/vps/VPSPlansSection";
import { VPSFeatures } from "@/components/landing/vps/VPSFeatures";
import { VPSUseCases } from "@/components/landing/vps/VPSUseCases";

import { VPSFAQ } from "@/components/landing/vps/VPSFAQ";
import { VPSCTA } from "@/components/landing/vps/VPSCTA";

export default function VPSPage() {
  const { isLoading } = useAuth();

  // Conversion tracking function
  const trackConversion = (
    action: string,
    _category?: string,
    href?: string
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
      "Residential VPS Hosting - Windows & Linux Virtual Private Servers | ProxySock";
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
    name: "ProxySock VPS Hosting Services",
    description:
      "Residential VPS hosting with real IPs for automation, development, and web hosting. Windows Server 2022, Ubuntu, Fedora.",
    brand: {
      "@type": "Brand",
      name: "ProxySock",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "CAD",
      lowPrice: "23.00",
      highPrice: "88.00",
      offerCount: "4",
    },
  };

  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Residential VPS Hosting - Windows & Linux Virtual Private Servers | ProxySock",
    description:
      "Get residential VPS hosting with real IPs for web scraping, automation, and development. Windows Server 2022, Ubuntu, Fedora. Starting from $23 CAD.",
    url: globalThis.location?.href,
  };

  return (
    <>
      <Helmet>
        {/* Enhanced SEO meta tags */}
        <title>
          Residential VPS Hosting - Windows & Linux Virtual Private Servers |
          ProxySock - 99.9% Uptime
        </title>
        <meta
          name="description"
          content="Get residential VPS hosting with real IPs for web scraping, automation, and development. Windows Server 2022, Ubuntu, Fedora. Starting from $23 CAD."
        />
        <meta
          name="keywords"
          content="vps hosting, residential vps, windows server vps, linux vps, virtual private server, automation, web scraping, development"
        />

        {/* Canonical URL for canonicalization */}
        <link rel="canonical" href="https://www.proxysock.com/vps" />

        {/* Open Graph tags for social media integration */}
        <meta
          property="og:title"
          content="Residential VPS Hosting - Windows & Linux Virtual Private Servers | ProxySock"
        />
        <meta
          property="og:description"
          content="Get residential VPS hosting with real IPs for web scraping, automation, and development."
        />
        <meta property="og:url" content="https://www.proxysock.com/vps" />
        <meta
          property="og:image"
          content="https://www.proxysock.com/images/vps-og-image.jpg"
        />
        <meta property="og:type" content="website" />

        {/* Twitter Card tags for social media */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Residential VPS Hosting - Windows & Linux Virtual Private Servers | ProxySock"
        />
        <meta
          name="twitter:description"
          content="Get residential VPS hosting with real IPs for web scraping, automation, and development."
        />
        <meta
          name="twitter:image"
          content="https://www.proxysock.com/images/vps-og-image.jpg"
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
        <VPSHeroSection trackConversion={trackConversion} />

        {/* Plans Section */}
        <VPSPlansSection trackConversion={trackConversion} />

        {/* Features Section */}
        <VPSFeatures />

        {/* Use Cases */}
        <VPSUseCases />

        {/* Testimonials */}
        {/* <VPSTestimonials /> */}

        {/* FAQ Section */}
        <VPSFAQ />

        {/* Final CTA */}
        <VPSCTA trackConversion={trackConversion} />
      </div>
    </>
  );
}
