import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { HowToConnectHeroSection } from "@/components/landing/help/howtoconnect/HowToConnectHeroSection";
import { HowToConnectTabs } from "@/components/landing/help/howtoconnect/HowToConnectTabs";
import { HowToConnectTroubleshooting } from "@/components/landing/help/howtoconnect/HowToConnectTroubleshooting";
import backgroundNode from "@/assets/images/backgroundNode.webp";
import backgroundNodeRed from "@/assets/images/backgroundNodeRed.webp";
import { useThemeStore } from "@/store/themeStore";



export default function HowToConnect() {
  const { dark } = useThemeStore();
  useEffect(() => {
    document.title = "How to Connect - Setup Guides | ProxySock";
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    name: "ProxySock Setup Guides - Complete Connection Tutorials",
    description:
      "Comprehensive step-by-step guides for connecting to ProxySock services including proxies, RDP, VPS, and eSIM. Setup instructions for all platforms and devices.",
    url: globalThis.location?.origin + "/HowToConnect",
    author: {
      "@type": "Organization",
      name: "ProxySock",
      url: globalThis.location?.origin,
    },
    publisher: {
      "@type": "Organization",
      name: "ProxySock",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": globalThis.location?.origin + "/HowToConnect",
    },
    articleSection: [
      "Proxy Setup",
      "RDP Connection",
      "VPS Management",
      "eSIM Activation",
    ],
  };

  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "How to Connect - Setup Guides | ProxySock",
    description:
      "Complete setup guides for ProxySock services. Learn how to connect to proxies, RDP servers, VPS hosting, and activate eSIM cards with step-by-step tutorials.",
    url: globalThis.location?.href,
  };

  return (
    <>
      <Helmet>
        <title>How to Connect - Setup Guides | ProxySock</title>
        <meta
          name="description"
          content="Complete setup guides for ProxySock services. Learn how to connect to proxies, RDP servers, VPS hosting, and activate eSIM cards with step-by-step tutorials for all platforms."
        />
        <meta
          name="keywords"
          content="proxy setup, RDP connection, VPS management, eSIM activation, setup guides, connection tutorials, ProxySock documentation"
        />
        <link rel="canonical" href="https://www.proxysock.com/HowToConnect" />
        <meta
          property="og:title"
          content="How to Connect - Setup Guides | ProxySock"
        />
        <meta
          property="og:description"
          content="Complete setup guides for ProxySock services. Learn how to connect to proxies, RDP servers, VPS hosting, and activate eSIM cards with step-by-step tutorials."
        />
        <meta
          property="og:url"
          content="https://www.proxysock.com/HowToConnect"
        />
        <meta
          property="og:image"
          content="https://www.proxysock.com/images/howto-og-image.jpg"
        />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="How to Connect - Setup Guides | ProxySock"
        />
        <meta
          name="twitter:description"
          content="Complete setup guides for ProxySock services. Learn how to connect to proxies, RDP servers, VPS hosting, and activate eSIM cards."
        />
        <meta
          name="twitter:image"
          content="https://www.proxysock.com/images/howto-og-image.jpg"
        />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(webPageData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="pt-16">
          <div className="relative overflow-hidden">
            <div
              className="absolute inset-0 z-0 opacity-[0.10] pointer-events-none"
              style={{
                backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
              <HowToConnectHeroSection />
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <HowToConnectTabs />
            <HowToConnectTroubleshooting />
          </div>
        </div>
      </div>
    </>
  );
}
