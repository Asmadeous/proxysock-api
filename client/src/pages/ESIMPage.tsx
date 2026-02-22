import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../context/AuthContext";
import { ESIMHeroSection } from "@/components/landing/esim/ESIMHeroSection";
import { ESIMPlansSection } from "@/components/landing/esim/ESIMPlansSection";
import { ESIMHowItWorks } from "@/components/landing/esim/ESIMHowItWorks";
import { ESIMCompatibleDevices } from "@/components/landing/esim/ESIMCompatibleDevices";
import { ESIMBenefits } from "@/components/landing/esim/ESIMBenefits";
import { ESIMFAQ } from "@/components/landing/esim/ESIMFAQ";
import { ESIMCTA } from "@/components/landing/esim/ESIMCTA";

export default function ESIMPage() {
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
      "International eSIM Cards - Global Mobile Data | ProxySock";
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
    name: "ProxySock eSIM Services",
    description:
      "International eSIM cards for global connectivity. 200+ countries coverage with instant activation.",
    brand: {
      "@type": "Brand",
      name: "ProxySock",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "6.99",
      highPrice: "49.99",
      offerCount: "50+",
    },
  };

  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "International eSIM Cards - Global Mobile Data | ProxySock",
    description:
      "Buy international eSIM cards for global connectivity. 200+ countries coverage, instant activation, no roaming fees. Perfect for travelers and digital nomads.",
    url: globalThis.location?.href,
  };

  return (
    <>
      <Helmet>
        {/* Enhanced SEO meta tags */}
        <title>
          International eSIM Cards - Global Mobile Data | ProxySock - 99.9%
          Uptime Guaranteed
        </title>
        <meta
          name="description"
          content="Buy international eSIM cards for global connectivity. 200+ countries coverage, instant activation, no roaming fees. Perfect for travelers and digital nomads."
        />
        <meta
          name="keywords"
          content="esim cards, international sim, global mobile data, travel sim, digital sim, roaming sim, worldwide coverage"
        />

        {/* Canonical URL for canonicalization */}
        <link rel="canonical" href="https://www.proxysock.com/esim" />

        {/* Open Graph tags for social media integration */}
        <meta
          property="og:title"
          content="International eSIM Cards - Global Mobile Data | ProxySock"
        />
        <meta
          property="og:description"
          content="Buy international eSIM cards for global connectivity. 200+ countries coverage, instant activation, no roaming fees."
        />
        <meta property="og:url" content="https://www.proxysock.com/esim" />
        <meta
          property="og:image"
          content="https://www.proxysock.com/images/esim-og-image.jpg"
        />
        <meta property="og:type" content="website" />

        {/* Twitter Card tags for social media */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="International eSIM Cards - Global Mobile Data | ProxySock"
        />
        <meta
          name="twitter:description"
          content="Buy international eSIM cards for global connectivity. 200+ countries coverage, instant activation, no roaming fees."
        />
        <meta
          name="twitter:image"
          content="https://www.proxysock.com/images/esim-og-image.jpg"
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
        <ESIMHeroSection trackConversion={trackConversion} />

        {/* Plans Section */}
        <ESIMPlansSection trackConversion={trackConversion} />

        {/* How It Works Section */}
        <ESIMHowItWorks />

        {/* Compatible Devices */}
        <ESIMCompatibleDevices />

        {/* Benefits Section */}
        <ESIMBenefits />

        {/* FAQ Section */}
        <ESIMFAQ />

        {/* Final CTA */}
        <ESIMCTA trackConversion={trackConversion} />
      </div>
    </>
  );
}
