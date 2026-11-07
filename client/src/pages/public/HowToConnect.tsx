import { Helmet } from "react-helmet-async";
import { HowToConnectHeroSection } from "@/components/landing/help/howtoconnect/HowToConnectHeroSection";
import { HowToConnectTabs } from "@/components/landing/help/howtoconnect/HowToConnectTabs";
import { HowToConnectTroubleshooting } from "@/components/landing/help/howtoconnect/HowToConnectTroubleshooting";
import "./proxies.css";
import "@/components/landing/help/howtoconnect/tutorials.css";

const description = "Step-by-step setup guides for ProxySock proxies, VPS, RDP, VPN and eSIM. Find connection instructions, copyable examples and troubleshooting help.";
const url = "https://www.proxysock.com/HowToConnect";

export default function HowToConnect() {
  return (
    <div className="proxy-page tutorials-page">
      <Helmet>
        <title>Tutorials & Setup Guides | ProxySock</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content="Tutorials & Setup Guides | ProxySock" />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: "ProxySock tutorials and setup guides", description, url, publisher: { "@type": "Organization", name: "ProxySock" } })}</script>
      </Helmet>
      <HowToConnectHeroSection />
      <HowToConnectTabs />
      <HowToConnectTroubleshooting />
    </div>
  );
}
