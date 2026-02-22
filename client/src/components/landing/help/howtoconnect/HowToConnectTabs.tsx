import { useState } from "react";
import { motion } from "framer-motion";
import {
  WifiIcon,
  ComputerDesktopIcon,
  ServerIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HowToConnectProxyContent } from "./HowToConnectProxyContent";
import { HowToConnectRDPContent } from "./HowToConnectRDPContent";
import { HowToConnectVPSContent } from "./HowToConnectVPSContent";
import { HowToConnectESIMContent } from "./HowToConnectESIMContent";
import { ShieldCheckIcon } from "lucide-react";
import { HowToConnectVPNContent } from "./HowToConnectVPNContent";

type TabType = "proxies" | "rdp" | "vps" | "esim" | "vpn";

export const HowToConnectTabs = () => {
  const [activeTab, setActiveTab] = useState<TabType>("proxies");

  const tabs = [
    {
      id: "proxies" as TabType,
      name: "Proxy Services",
      icon: WifiIcon,
      description: "HTTP(S) & SOCKS5 proxy setup",
    },
    {
      id: "rdp" as TabType,
      name: "RDP Hosting",
      icon: ComputerDesktopIcon,
      description: "Remote desktop connections",
    },
    {
      id: "vps" as TabType,
      name: "VPS Hosting",
      icon: ServerIcon,
      description: "Virtual private server management",
    },
    {
      id: "esim" as TabType,
      name: "eSIM Cards",
      icon: DevicePhoneMobileIcon,
      description: "Digital SIM card activation",
    },
    {
      id: "vpn" as TabType,
      name: "VPN Service",
      icon: ShieldCheckIcon,
      description: "Residential VPN Setup",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="mb-16"
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabType)}
        className="w-full"
      >
        <div className="flex justify-center mb-8">
          <TabsList className="bg-muted p-1 h-auto rounded-full flex-wrap justify-center sm:flex-nowrap sm:justify-start max-w-full">
            {tabs.map((tab, index) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={`data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm whitespace-nowrap mb-1 mr-1 sm:mb-0 ${index > 0 ? "sm:ml-1" : ""}`}
              >
                <tab.icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {tab.id === "proxies" && <HowToConnectProxyContent />}
              {tab.id === "rdp" && <HowToConnectRDPContent />}
              {tab.id === "vps" && <HowToConnectVPSContent />}
              {tab.id === "esim" && <HowToConnectESIMContent />}
              {tab.id === "vpn" && <HowToConnectVPNContent />}
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
};
