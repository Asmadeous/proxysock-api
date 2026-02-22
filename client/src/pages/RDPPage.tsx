import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import { RDPHeroSection } from "@/components/landing/rdp/RDPHeroSection";
import { RDPPlansSection } from "@/components/landing/rdp/RDPPlansSection";
import { RDPFeatures } from "@/components/landing/rdp/RDPFeatures";
import { RDPUseCases } from "@/components/landing/rdp/RDPUseCases";
import { RDPFAQ } from "@/components/landing/rdp/RDPFAQ";
import { RDPCTA } from "@/components/landing/rdp/RDPCTA";

export default function RDPPage() {
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
      "Residential RDP Hosting - Windows & Linux Remote Desktop | ProxySock";
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
    name: "ProxySock RDP Hosting Services",
    description:
      "Residential RDP hosting with real IPs for trading, automation, and remote desktop access. Windows Server 2022, Ubuntu, Fedora.",
    brand: {
      "@type": "Brand",
      name: "ProxySock",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "CAD",
      lowPrice: "28.00",
      highPrice: "208.00",
      offerCount: "4",
    },
  };

  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Residential RDP Hosting - Windows & Linux Remote Desktop | ProxySock",
    description:
      "Get residential RDP hosting with real IPs for trading bots, automation, and remote desktop access. Windows Server 2022, Ubuntu, Fedora. Starting from $28 CAD.",
    url: globalThis.location?.href,
  };

  return (
    <>
      <Helmet>
        {/* Enhanced SEO meta tags */}
        <title>
          Residential RDP Hosting - Windows & Linux Remote Desktop | ProxySock -
          99.9% Uptime
        </title>
        <meta
          name="description"
          content="Get residential RDP hosting with real IPs for trading bots, automation, and remote desktop access. Windows Server 2022, Ubuntu, Fedora. Starting from $28 CAD."
        />
        <meta
          name="keywords"
          content="rdp hosting, residential rdp, windows server rdp, linux rdp, remote desktop, trading bots, automation, forex rdp, seo tools"
        />

        {/* Canonical URL for canonicalization */}
        <link rel="canonical" href="https://www.proxysock.com/rdp" />

        {/* Open Graph tags for social media integration */}
        <meta
          property="og:title"
          content="Residential RDP Hosting - Windows & Linux Remote Desktop | ProxySock"
        />
        <meta
          property="og:description"
          content="Get residential RDP hosting with real IPs for trading bots, automation, and remote desktop access."
        />
        <meta property="og:url" content="https://www.proxysock.com/rdp" />
        <meta
          property="og:image"
          content="https://www.proxysock.com/images/rdp-og-image.jpg"
        />
        <meta property="og:type" content="website" />

        {/* Twitter Card tags for social media */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Residential RDP Hosting - Windows & Linux Remote Desktop | ProxySock"
        />
        <meta
          name="twitter:description"
          content="Get residential RDP hosting with real IPs for trading bots, automation, and remote desktop access."
        />
        <meta
          name="twitter:image"
          content="https://www.proxysock.com/images/rdp-og-image.jpg"
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
        <RDPHeroSection trackConversion={trackConversion} />

        {/* Plans Section */}
        <RDPPlansSection trackConversion={trackConversion} />

        {/* Features Section */}
        <RDPFeatures />

        {/* Use Cases */}
        <RDPUseCases />

        {/* Testimonials
        <RDPTestimonials /> */}

        {/* FAQ Section */}
        <RDPFAQ />

        {/* Final CTA */}
        <RDPCTA trackConversion={trackConversion} />
      </div>
    </>
  );
}
