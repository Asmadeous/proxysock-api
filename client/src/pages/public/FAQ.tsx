import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { conversionTracker } from "../../utils/redditPixel";
import { FAQHeroSection } from "@/components/landing/help/faq/FAQHeroSection";
import { FAQTabs } from "@/components/landing/help/faq/FAQTabs";
import { FAQContact } from "@/components/landing/help/faq/FAQContact";



export default function Faq() {
  // Track FAQ interactions
  const trackFAQInteraction = async (category: string, question: string) => {
    try {
      await conversionTracker.trackSearch(question, category);
      console.log(`✅ FAQ interaction tracked: ${category} - ${question}`);
    } catch (error) {
      console.error("❌ Failed to track FAQ interaction:", error);
    }
  };

  useEffect(() => {
    // Set page title
    document.title =
      "FAQ - ProxySock | Comprehensive Answers About Proxies, RDP, VPS & eSIM Services";
  }, []);

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: "ProxySock FAQ - Comprehensive Answers About Our Services",
    description:
      "Find comprehensive answers to common questions about ProxySock's proxy services, RDP hosting, VPS solutions, and eSIM plans. 50+ detailed questions answered.",
    url: globalThis.location?.origin + "/faq",
    mainEntity: [
      {
        "@type": "Question",
        name: "What payment methods do you accept?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We accept all major Credit/Debit Cards (Visa, MasterCard, American Express, Discover) and various Cryptocurrency payments including Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), Bitcoin Cash (BCH), and other popular cryptocurrencies.",
        },
      },
      {
        "@type": "Question",
        name: "Do you offer refunds?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We have a strict no-refund policy for all digital products once your order is completed and delivered. However, if there are technical issues with your service that cannot be resolved, please contact our support team immediately.",
        },
      },
      {
        "@type": "Question",
        name: "How quickly are services activated after payment?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "All services are activated automatically within 1-5 minutes after payment confirmation. For Credit/Debit card payments, activation is typically instant.",
        },
      },
    ],
  };

  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "FAQ - ProxySock | Comprehensive Answers About Proxies, RDP, VPS & eSIM Services",
    description:
      "Find comprehensive answers to common questions about ProxySock's proxy services, RDP hosting, VPS solutions, and eSIM plans. 50+ detailed questions answered by our experts.",
    url: globalThis.location?.href,
  };

  return (
    <>
      <Helmet>
        {/* Enhanced SEO meta tags */}
        <title>
          FAQ - ProxySock | Comprehensive Answers About Proxies, RDP, VPS & eSIM
          Services
        </title>
        <meta
          name="description"
          content="Find comprehensive answers to common questions about ProxySock's proxy services, RDP hosting, VPS solutions, and eSIM plans. 50+ detailed questions answered by our experts."
        />
        <meta
          name="keywords"
          content="faq, frequently asked questions, proxy faq, rdp faq, vps faq, esim faq, support questions, technical support"
        />

        {/* Canonical URL for canonicalization */}
        <link rel="canonical" href="https://www.proxysock.com/faq" />

        {/* Open Graph tags for social media integration */}
        <meta
          property="og:title"
          content="FAQ - ProxySock | Comprehensive Answers About Proxies, RDP, VPS & eSIM Services"
        />
        <meta
          property="og:description"
          content="Find comprehensive answers to common questions about ProxySock's proxy services, RDP hosting, VPS solutions, and eSIM plans."
        />
        <meta property="og:url" content="https://www.proxysock.com/faq" />
        <meta
          property="og:image"
          content="https://www.proxysock.com/images/faq-og-image.jpg"
        />
        <meta property="og:type" content="website" />

        {/* Twitter Card tags for social media */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="FAQ - ProxySock | Comprehensive Answers About Proxies, RDP, VPS & eSIM Services"
        />
        <meta
          name="twitter:description"
          content="Find comprehensive answers to common questions about ProxySock's proxy services, RDP hosting, VPS solutions, and eSIM plans."
        />
        <meta
          name="twitter:image"
          content="https://www.proxysock.com/images/faq-og-image.jpg"
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
        <FAQHeroSection />

        {/* FAQ Tabs Section */}
        <FAQTabs trackFAQInteraction={trackFAQInteraction} />

        {/* Contact Support Section */}
        <FAQContact />

        {/* Development tracking indicator */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-center mt-8 mb-8">
            <div className="bg-card border border-border text-primary px-4 py-2 rounded-lg text-sm inline-block font-manrope-semibold">
              🎯 Reddit Ads FAQ Tracking: Active
            </div>
          </div>
        )}

        {/* Footer */}
        {/* <FAQFooter handleSocialClick={handleSocialClick} /> */}
      </div>
    </>
  );
}
