import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { conversionTracker } from "../utils/redditPixel";
import { ContactHeroSection } from "@/components/landing/help/contact/ContactHeroSection";
import { ContactMethodsSection } from "@/components/landing/help/contact/ContactMethodsSection";
import { BusinessContactSection } from "@/components/landing/help/contact/BusinessContactSection";
import { SocialContactSection } from "@/components/landing/help/contact/SocialContactSection";
import { SupportInfoSection } from "@/components/landing/help/contact/SupportInfoSection";
import { SelfHelpResourcesSection } from "@/components/landing/help/contact/SelfHelpResourcesSection";



export default function Contact() {
  useEffect(() => {
    document.title = "Contact ProxySock - 24/7 Support for Proxy, RDP, VPS & eSIM Services";
  }, []);

  // Reddit Ads lead tracking functions
  const trackLeadInteraction = async (
    method: string,
    interest: string = "general"
  ) => {
    try {
      await conversionTracker.trackLead({
        interest: interest,
        value: 25, // Estimated lead value for contact attempts
      });
      console.log(`✅ Reddit lead conversion tracked: ${method} - ${interest}`);
    } catch (error) {
      console.error("❌ Failed to track Reddit lead conversion:", error);
    }
  };

  const handleChatbotClick = () => {
    trackLeadInteraction("chatbot", "support");
    // Trigger global guest chat widget
    window.dispatchEvent(new CustomEvent("open-chat"));
  };

  const handleLiveSupportClick = () => {
    trackLeadInteraction("live_chat", "technical_support");
    // Trigger global guest chat widget
    window.dispatchEvent(new CustomEvent("open-chat"));
  };

  const handleEmailClick = (type: string) => {
    trackLeadInteraction("email", type);
    // Email links will naturally open email client
  };

  const handleBusinessContactClick = () => {
    trackLeadInteraction("email", "business");
    // Email link will naturally open email client
  };

  const handleSocialClick = (platform: string) => {
    trackLeadInteraction("social", platform);
    // Links will naturally open in new tab
  };

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ProxySock",
    description:
      "Premium digital infrastructure provider offering proxy services, RDP hosting, VPS hosting, and eSIM solutions with 24/7 support",
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
  };

  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Contact ProxySock - 24/7 Support for Proxy, RDP, VPS & eSIM Services",
    description:
      "Get expert support for all your digital infrastructure needs. Contact ProxySock for proxies, RDP hosting, VPS servers, and eSIM services. 24/7 support available.",
    url: globalThis.location?.href,
  };

  return (
    <>
      <Helmet>
        {/* Enhanced SEO meta tags */}
        <title>
          Contact ProxySock - 24/7 Support for Proxy, RDP, VPS & eSIM Services
        </title>
        <meta
          name="description"
          content="Get expert support for all your digital infrastructure needs. Contact ProxySock for proxies, RDP hosting, VPS servers, and eSIM services. 24/7 support available."
        />
        <meta
          name="keywords"
          content="contact proxysock, support, proxy support, RDP support, VPS support, eSIM support, customer service, technical support"
        />

        {/* Canonical URL for canonicalization */}
        <link rel="canonical" href="https://www.proxysock.com/contact" />

        {/* Open Graph tags for social media integration */}
        <meta
          property="og:title"
          content="Contact ProxySock - 24/7 Support for Proxy, RDP, VPS & eSIM Services"
        />
        <meta
          property="og:description"
          content="Get expert support for all your digital infrastructure needs. Contact ProxySock for proxies, RDP hosting, VPS servers, and eSIM services. 24/7 support available."
        />
        <meta property="og:url" content="https://www.proxysock.com/contact" />
        <meta
          property="og:image"
          content="https://www.proxysock.com/images/contact-og-image.jpg"
        />
        <meta property="og:type" content="website" />

        {/* Twitter Card tags for social media */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Contact ProxySock - 24/7 Support for Proxy, RDP, VPS & eSIM Services"
        />
        <meta
          name="twitter:description"
          content="Get expert support for all your digital infrastructure needs. Contact ProxySock for proxies, RDP hosting, VPS servers, and eSIM services. 24/7 support available."
        />
        <meta
          name="twitter:image"
          content="https://www.proxysock.com/images/contact-og-image.jpg"
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
        <ContactHeroSection />

        {/* Contact Methods */}
        <ContactMethodsSection
          trackLeadInteraction={trackLeadInteraction}
          handleChatbotClick={handleChatbotClick}
          handleLiveSupportClick={handleLiveSupportClick}
          handleEmailClick={handleEmailClick}
        />

        {/* Business Contact */}
        <BusinessContactSection
          handleBusinessContactClick={handleBusinessContactClick}
        />

        {/* Social Contact */}
        <SocialContactSection handleSocialClick={handleSocialClick} />

        {/* Support Information */}
        <SupportInfoSection />

        {/* Self-Help Resources */}
        <SelfHelpResourcesSection />

        {/* Development tracking indicator */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-center mt-8 mb-8">
            <div className="bg-card border border-border text-primary px-4 py-2 rounded-lg text-sm inline-block font-manrope-semibold">
              🎯 Reddit Ads Lead Tracking: Active
            </div>
          </div>
        )}

        {/* Footer */}
        {/* <ContactFooter handleSocialClick={handleSocialClick} /> */}
      </div>
    </>
  );
}
