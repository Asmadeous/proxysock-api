// components/AutoSEO.tsx
import React, { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

interface MetaInfo {
  title: string;
  description: string;
  keywords?: string[];
  ogType?: "website" | "article" | "product";
  noIndex?: boolean;
}

interface RouteConfig {
  [key: string]: MetaInfo;
}

interface AutoSEOProps {
  children: ReactNode;
  siteName?: string;
  defaultTitle?: string;
  defaultDescription?: string;
}

const AutoSEO: React.FC<AutoSEOProps> = ({
  children,
  siteName = "ProxySock",
  defaultTitle = "ProxySock - Buy Premium Proxies, RDP, VPS & eSIM Online",
  defaultDescription = "Buy premium proxies, RDP, VPS & eSIM. Datacenter, residential, ISP proxies. Windows/Linux hosting. Global eSIM cards. 24/7 support.",
}) => {
  const location = useLocation();
  const baseUrl = "https://proxysock.com";

  // Generate canonical URL
  const canonicalUrl: string = `${baseUrl}${location.pathname}`;

  // Remove trailing slash for consistency (except root)
  const normalizedCanonical: string =
    canonicalUrl.endsWith("/") && canonicalUrl !== baseUrl + "/"
      ? canonicalUrl.slice(0, -1)
      : canonicalUrl;

  // Pre-defined routes configuration for your business
  const routes: RouteConfig = {
    // Public Pages
    "/": {
      title: defaultTitle, // Now uses the defaultTitle prop
      description: defaultDescription, // Also uses defaultDescription prop
      keywords: ["proxy", "VPS", "RDP", "eSIM", "hosting", "servers"],
      ogType: "website",
    },
    "/proxies": {
      title: `Buy Premium Proxies - ${siteName}`,
      description:
        "Buy premium proxies: datacenter, residential, ISP & static residential. SOCKS5/HTTP protocols. Instant activation & global locations.",
      keywords: [
        "buy proxies",
        "datacenter proxy",
        "residential proxy",
        "ISP proxy",
        "static residential proxy",
        "SOCKS5 proxy",
        "HTTP proxy",
      ],
      ogType: "website",
    },
    "/locations": {
      title: `Proxy Locations - Global Coverage - ${siteName}`,
      description:
        "Global proxy network with 100+ countries. High-speed anonymous browsing worldwide. Choose your ideal proxy location.",
      keywords: [
        "proxy locations",
        "global proxy",
        "international proxy",
        "worldwide proxy coverage",
      ],
      ogType: "website",
    },
    "/about": {
      title: `About Us - ${siteName}`,
      description:
        "Learn about ProxySock's mission to provide premium proxy, VPS, RDP & eSIM services with 99.9% uptime and 24/7 support.",
      keywords: ["about", "company", "proxy provider", "VPS hosting"],
      ogType: "website",
    },
    "/contact": {
      title: `Contact Support - ${siteName}`,
      description:
        "Get 24/7 support for proxy, VPS, RDP & eSIM services. Live chat, email & ticket support. Expert assistance available.",
      keywords: ["contact", "support", "help", "customer service"],
      ogType: "website",
    },
    "/faq": {
      title: `FAQ - Frequently Asked Questions - ${siteName}`,
      description:
        "Find answers about proxy servers, VPS hosting, RDP services & eSIM packages. Setup guides, troubleshooting & more.",
      keywords: ["FAQ", "help", "questions", "proxy help", "VPS support"],
      ogType: "website",
    },
    "/proxy-purpose": {
      title: `Proxy Use Cases - ${siteName}`,
      description:
        "Discover proxy uses: web scraping, SEO monitoring, social media management, ad verification & more. Professional solutions.",
      keywords: [
        "proxy uses",
        "web scraping",
        "SEO",
        "social media",
        "automation",
      ],
      ogType: "website",
    },
    "/HowToConnect": {
      title: `How to Connect - Setup Guide - ${siteName}`,
      description:
        "Step-by-step guides to connect proxy, VPS & RDP services. Easy setup tutorials for all platforms and applications.",
      keywords: [
        "setup",
        "configuration",
        "how to connect",
        "tutorial",
        "guide",
      ],
      ogType: "website",
    },
    "/ip-checker": {
      title: `IP Checker Tool - ${siteName}`,
      description:
        "Check your current IP address and location. Verify proxy connection status and test anonymity levels.",
      keywords: ["IP checker", "IP address", "location check", "proxy test"],
      ogType: "website",
    },
    "/cookie-policy": {
      title: `Cookie Policy - ${siteName}`,
      description:
        "Our cookie policy explains how we use cookies to improve your browsing experience.",
      keywords: ["cookie policy", "privacy", "cookies"],
      ogType: "website",
      noIndex: true,
    },

    // Auth Pages (noindex for SEO)
    "/login": {
      title: `Login - ${siteName}`,
      description:
        "Login to your account to manage proxy services, VPS hosting, and RDP solutions.",
      noIndex: true,
    },
    "/register": {
      title: `Create Account - ${siteName}`,
      description:
        "Sign up for premium proxy, VPS, and RDP services. Start your free trial today.",
      keywords: ["register", "sign up", "create account", "trial"],
      noIndex: true,
    },
    "/forgot-password": {
      title: `Reset Password - ${siteName}`,
      description: "Reset your account password securely.",
      noIndex: true,
    },
    "/wait-for-verification": {
      title: `Email Verification - ${siteName}`,
      description: "Please verify your email address to complete registration.",
      noIndex: true,
    },

    // Dashboard Pages (noindex for user privacy)
    "/dashboard": {
      title: `Dashboard - ${siteName}`,
      description:
        "Manage your proxy services, VPS hosting, RDP solutions, and account settings.",
      noIndex: true,
    },
    "/dashboard/buy-proxies": {
      title: `Buy Proxies - ${siteName}`,
      description:
        "Purchase premium proxy packages. Choose from residential, datacenter, and mobile proxies.",
      noIndex: true,
    },
    "/dashboard/esim-packages": {
      title: `eSIM Packages - ${siteName}`,
      description:
        "Browse and purchase eSIM data packages for global connectivity.",
      noIndex: true,
    },
    "/dashboard/vps": {
      title: `VPS Types - ${siteName}`,
      description:
        "Choose from various VPS hosting solutions tailored to your needs.",
      noIndex: true,
    },
    "/dashboard/vps-plans": {
      title: `VPS Plans - ${siteName}`,
      description:
        "Select the perfect VPS hosting plan with flexible configurations.",
      noIndex: true,
    },
    "/dashboard/rdp": {
      title: `RDP Types - ${siteName}`,
      description: "Explore our Remote Desktop Protocol (RDP) server options.",
      noIndex: true,
    },
    "/dashboard/rdp-plans": {
      title: `RDP Plans - ${siteName}`,
      description:
        "Choose your ideal RDP server plan with various specifications.",
      noIndex: true,
    },
    "/dashboard/cart": {
      title: `Shopping Cart - ${siteName}`,
      description: "Review your selected services before checkout.",
      noIndex: true,
    },
    "/dashboard/payments": {
      title: `Payments - ${siteName}`,
      description: "Secure payment processing for your services.",
      noIndex: true,
    },
    "/dashboard/profile": {
      title: `Profile Settings - ${siteName}`,
      description: "Manage your account profile and preferences.",
      noIndex: true,
    },
  };

  // Auto-generate meta info based on route
  const generateMetaInfo = (pathname: string): MetaInfo => {
    // Check for exact match first
    if (routes[pathname]) {
      return routes[pathname];
    }

    // Handle dynamic dashboard routes
    if (pathname.startsWith("/dashboard/")) {
      const dashboardPath = pathname.replace("/dashboard", "");

      if (dashboardPath.startsWith("/vps-plans/")) {
        const vpsType = pathname.split("/").pop();
        return {
          title: `${vpsType?.toUpperCase()} VPS Plans - ${siteName}`,
          description: `Specialized VPS hosting plans for ${vpsType}. High performance and reliability.`,
          noIndex: true,
        };
      }

      if (dashboardPath.startsWith("/rdp-plans/")) {
        const rdpType = pathname.split("/").pop();
        return {
          title: `${rdpType?.toUpperCase()} RDP Plans - ${siteName}`,
          description: `Specialized RDP server plans for ${rdpType}. Fast and secure remote desktop access.`,
          noIndex: true,
        };
      }

      // Other dashboard pages
      const section = pathname.split("/dashboard/")[1]?.split("/")[0];
      return {
        title: `${section
          ?.replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())} - Dashboard - ${siteName}`,
        description: `Manage your ${section?.replace(
          /-/g,
          " "
        )} settings and services.`,
        noIndex: true,
      };
    }

    // Handle Super Admin (noindex)
    if (pathname.startsWith("/sadmin")) {
      return {
        title: `Admin Dashboard - ${siteName}`,
        description: "Administrative control panel.",
        noIndex: true,
      };
    }

    // Handle payment result pages
    if (pathname === "/payments/success") {
      return {
        title: `Payment Successful - ${siteName}`,
        description: "Your payment has been processed successfully.",
        noIndex: true,
      };
    }

    if (pathname === "/payments/failed") {
      return {
        title: `Payment Failed - ${siteName}`,
        description: "There was an issue processing your payment.",
        noIndex: true,
      };
    }

    // In your AutoSEO component, add this pattern matching:
    // if (pathname.startsWith('/blog/') && pathname !== '/blog') {
    //   const blogId = pathname.replace('/blog/', '');
    //   // You could pass blog post data through context or fetch it here
    //   return {
    //     title: `Blog Post - ${siteName}`,
    //     description: 'Read our latest blog post about proxy and hosting services.',
    //     ogType: 'article'
    //   };
    // }

    // Default fallback
    const pathSegments: string[] = pathname.split("/").filter(Boolean);
    const pageName: string =
      pathSegments.length > 0
        ? pathSegments[pathSegments.length - 1].replace(/-/g, " ")
        : "Home";

    const formattedPageName: string =
      pageName.charAt(0).toUpperCase() + pageName.slice(1);

    // Use defaultTitle if provided, otherwise construct from siteName
    const fallbackTitle = defaultTitle || `${siteName} - Premium Services`;

    return {
      title:
        pathSegments.length > 0
          ? `${formattedPageName} - ${siteName}`
          : fallbackTitle,
      description: `${defaultDescription} - ${formattedPageName} page`,
      keywords: ["proxy", "VPS", "RDP", "hosting"],
    };
  };

  const { title, description, keywords, ogType, noIndex }: MetaInfo =
    generateMetaInfo(location.pathname);

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{title}</title>
        <meta name="description" content={description} />
        {keywords && <meta name="keywords" content={keywords.join(", ")} />}
        <link rel="canonical" href={normalizedCanonical} />

        {/* Robots directive */}
        <meta
          name="robots"
          content={noIndex ? "noindex,nofollow" : "index,follow"}
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content={ogType || "website"} />
        <meta property="og:url" content={normalizedCanonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:site_name" content={siteName} />
        <meta
          property="og:image"
          content={`${baseUrl}/assets/images/logo.png`}
        />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={normalizedCanonical} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        <meta
          property="twitter:image"
          content={`${baseUrl}/assets/images/logo.png`}
        />

        {/* Additional SEO Meta Tags */}
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="author" content={siteName} />

        {/* Business-specific meta */}
        <meta name="geo.region" content="US" />
        <meta name="geo.placename" content="Global" />

        {/* Structured Data for Business */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: siteName,
            url: baseUrl,
            logo: `${baseUrl}/assets/images/logo.png`,
            description: defaultDescription,
            serviceType: [
              "Proxy Services",
              "RDP Hosting",
              "VPS Hosting",
              "eSIM Services",
            ],
            areaServed: "Worldwide",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer service",
              availableLanguage: "English",
            },
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Digital Services Catalog",
              itemListElement: [
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Premium Proxy Services",
                    description:
                      "Datacenter, residential, ISP, and static residential proxies with SOCKS5 & HTTP protocols",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "RDP Hosting",
                    description:
                      "Windows, Ubuntu, and Fedora RDP servers with standard and residential IP options",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "VPS Hosting",
                    description:
                      "Linux and Windows VPS hosting with multiple distributions and IP types",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "eSIM Services",
                    description:
                      "Global, regional, and business eSIM cards for international connectivity",
                  },
                },
              ],
            },
          })}
        </script>
      </Helmet>
      {children}
    </>
  );
};

export default AutoSEO;
