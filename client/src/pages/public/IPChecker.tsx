import { useState, useEffect } from "react";
import backgroundNode from "@/assets/images/backgroundNode.webp";
import backgroundNodeRed from "@/assets/images/backgroundNodeRed.webp";
import { useThemeStore } from "@/store/themeStore";
import api from "../../services/api";

import {
  IPCheckerHeroSection,
  IPCheckerLoadingAnimation,
  IPCheckerSearchInterface,
  IPCheckerResultsDisplay,
  IPCheckerErrorDisplay,
  IPCheckerThreatAssessment,
  IPCheckerGeolocationCard,
  IPCheckerNetworkCard,

  IPCheckerTimezoneCard,
  IPCheckerCurrencyCard,
  IPCheckerCarrierCard,
  IPCheckerAdvancedFeatures,
  IPCheckerAdvancedIntelligence,
} from "../../components/landing/tools/IPChecker";

interface IPResult {
  error?: any;
  ip: string;
  is_eu?: boolean;
  count?: string;
  status?: number;

  // Geolocation
  city?: string;
  region?: string;
  region_code?: string;
  country_name?: string;
  country_code?: string;
  continent_name?: string;
  continent_code?: string;
  latitude?: number;
  longitude?: number;
  postal?: string;
  calling_code?: string;
  flag?: string;
  emoji_flag?: string;
  emoji_unicode?: string;

  // ASN Basic
  asn?: {
    asn: string;
    name: string;
    domain?: string;
    route?: string;
    type?: string;
  };

  // Advanced ASN
  asn_details?: {
    domain?: string;
    usage?: string;
    name?: string;
    ipv4_prefixes?: string[];
    ipv6_prefixes?: string[];
    num_ips?: number;
    registry?: string;
    country?: string;
    date?: string;
    status?: string;
    upstream?: Array<{
      asn: string;
      name: string;
      country: string;
    }>;
    downstream?: Array<{
      asn: string;
      name: string;
      country: string;
    }>;
    peers?: Array<{
      asn: string;
      name: string;
      country: string;
    }>;
  };

  // Company
  company?: {
    name?: string;
    domain?: string;
    network?: string;
    type?: string;
  };

  // Mobile Carrier
  carrier?: {
    name?: string;
    mcc?: string;
    mnc?: string;
  };

  // Timezone
  timezone?: {
    name?: string;
    abbr?: string;
    offset?: string;
    is_dst?: boolean;
    current_time?: string;
  };

  // Currency
  currency?: {
    name?: string;
    code?: string;
    symbol?: string;
    native?: string;
    plural?: string;
  };

  // Comprehensive Threat Intelligence
  threat?: {
    is_tor?: boolean;
    is_vpn?: boolean;
    is_icloud_relay?: boolean;
    is_proxy?: boolean;
    is_datacenter?: boolean;
    is_anonymous?: boolean;
    is_known_attacker?: boolean;
    is_known_abuser?: boolean;
    is_threat?: boolean;
    is_bogon?: boolean;
    blocklists?: Array<{
      name: string;
      site: string;
      type: string;
    }>;
    scores?: {
      [key: string]: number;
    };
  };

  // Usage Type
  usage_type?: string;

  // Languages
  languages?: Array<{
    name: string;
    native: string;
    code: string;
  }>;

  // Computed fields for backwards compatibility
  score?: number;
  risk?: string;
  url?: string;

  // Backwards compatibility mapping
  ip_country_name?: string;
  ip_country_code?: string;
  ip_state_name?: string;
  ip_city?: string;
  ip_postcode?: string;
  ISP_Name?: string;
  ISP_Fraud_Score?: number;
  proxy_type?: string;
  connection_type?: string;
}

export default function ModernIPChecker() {
  const [ipAddress, setIpAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<IPResult | null>(null);
  const [error, setError] = useState<string>("");
  const [loadingStage, setLoadingStage] = useState<string>(
    "Detecting your IP address..."
  );

  // Auto-detect and analyze IP on page load
  useEffect(() => {
    const autoAnalyzeIP = async () => {
      try {
        setLoading(true);
        setLoadingStage("Detecting and analyzing your public IP address...");

        // Rely purely on server-side detection for auto-analyze
        const response = await api.get(`/web/api/tools/ip_checker`);
        const data: IPResult = response.data;

        if (data.error) {
          setError(data.error);
        } else {
          setIpAddress(data.ip);
          setResult(data);
        }
      } catch (err: any) {
        console.error("Auto analysis failed:", err);
        setError(
          err.response?.data?.error || err.message || "Failed to automatically analyze your IP address"
        );
      } finally {
        setLoading(false);
      }
    };

    autoAnalyzeIP();
  }, []);

  const handleManualSearch = async () => {
    if (!ipAddress.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);
    setLoadingStage("Analyzing IP address...");

    try {
      const response = await api.get(`/web/api/tools/ip_checker`, {
        params: { ip: ipAddress.trim() }
      });
      const data: IPResult = response.data;

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "An error occurred while analyzing the IP address";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const { dark } = useThemeStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Full Screen Loading Animation */}
      {loading && !result && (
        <IPCheckerLoadingAnimation loadingStage={loadingStage} />
      )}

      {/* Main Content - Hidden during initial loading */}
      <div
        className={`transition-opacity duration-500 ${loading && !result ? "opacity-0" : "opacity-100"
          }`}
      >
        {/* Hero Section Container with Background */}
        <div className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div
            className="absolute inset-0 z-0 opacity-[0.10] pointer-events-none"
            style={{
              backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
          <div className="relative z-10 max-w-7xl mx-auto">
            <IPCheckerHeroSection result={result} />
          </div>
        </div>

        {/* Search Interface - Always show this to allow scanning another IP */}
        <IPCheckerSearchInterface
          ipAddress={ipAddress}
          setIpAddress={setIpAddress}
          handleManualSearch={handleManualSearch}
          loading={loading}
        />

        {/* Error Display */}
        {error && <IPCheckerErrorDisplay error={error} />}

        {/* Results Display */}
        {result && (
          <>
            <IPCheckerResultsDisplay result={result} />

            {/* Intelligence Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
              <IPCheckerThreatAssessment
                threat={result.threat}
                score={result.score}
                risk={result.risk}
              />

              <IPCheckerGeolocationCard data={result} />

              {result.asn && <IPCheckerNetworkCard asn={result.asn} />}

              {result.timezone && <IPCheckerTimezoneCard timezone={result.timezone} />}

              {result.currency && <IPCheckerCurrencyCard currency={result.currency} />}

              {result.carrier && <IPCheckerCarrierCard carrier={result.carrier} />}
            </div>

            {/* Advanced Intelligence Section (Full Report details) */}
            <IPCheckerAdvancedIntelligence
              company={result.company}
              languages={result.languages}
              asnDetails={result.asn_details}
            />

            {/* Advanced Features (Threats/Blocklists) */}
            <IPCheckerAdvancedFeatures
              scores={result.threat?.scores}
              blocklists={result.threat?.blocklists}
            />
          </>
        )}
      </div>

    </div>
  );
}
