import { useState, useEffect } from "react";
import railsApi from "@/lib/railsApi";
import backgroundNode from "@/assets/images/backgroundNode.webp";
import backgroundNodeRed from "@/assets/images/backgroundNodeRed.webp";
import { useThemeStore } from "@/store/themeStore";

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
} from "../components/landing/tools/IPChecker";

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
  country?: string;
  country_name?: string;
  country_code?: string;
  continent_code?: string;
  latitude?: number;
  longitude?: number;
  postal?: string;
  calling_code?: string;
  flag?: string;

  // Network & ASN
  asn?: any;
  org?: string;

  // Connection Info
  connection_type?: string;

  // Timezone & Currency
  timezone?: {
    id: string;
    abbr: string;
    is_dst: boolean;
    offset: number;
    utc: string;
    current_time: string;
  };
  currency?: {
    name: string;
    code: string;
    symbol: string;
    plural: string;
    exchange_rate: number;
  };

  // Threat Intel
  threat?: {
    is_tor: boolean;
    is_icloud_relay: boolean;
    is_proxy: boolean;
    is_datacenter: boolean;
    is_anonymous: boolean;
    is_known_attacker: boolean;
    is_known_abuser: boolean;
    is_threat: boolean;
    is_bogon: boolean;
    blocklists: Array<{
      name: string;
      site: string;
      type: string;
    }>;
    scores?: {
      proxy_score: number;
      vpn_score: number;
      spam_score: number;
      threat_score: number;
    };
  };

  carrier?: {
    name: string;
    mcc: string;
    mnc: string;
  };

  // Risk Analysis
  risk?: any;
  score?: number;
}

export default function IPChecker() {
  const [ipAddress, setIpAddress] = useState("");
  const [result, setResult] = useState<IPResult | null>(null);
  const [loading, setLoading] = useState(true); // Start true for auto-fetch
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string>("Initializing...");

  // Auto IP Detection on Mount
  useEffect(() => {
    const autoAnalyzeIP = async () => {
      try {
        setLoadingStage("Detecting your connection...");
        await new Promise((resolve) => setTimeout(resolve, 800)); // UX delay

        setLoadingStage("Querying threat intelligence databases...");

        const { data: apiData } = await railsApi.get('/tools/ip_lookup');

        if (!apiData) {
          throw new Error("Failed to analyze IP address");
        }

        setLoadingStage("Processing comprehensive analysis...");
        await new Promise((resolve) => setTimeout(resolve, 500)); // UX delay

        const data: IPResult = apiData;

        if (data.error) {
          setError(data.error);
        } else {
          // Set the detected IP in the input field
          setIpAddress(data.ip);
          setResult(data);
        }
      } catch (err: any) {
        console.error("Auto analysis failed:", err);
        setError(
          err.message || "Failed to automatically analyze your IP address"
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
      const { data: apiData } = await railsApi.get('/tools/ip_lookup', {
        params: { ip: ipAddress.trim() }
      });

      if (!apiData) {
        throw new Error("Analysis failed");
      }

      const data: IPResult = apiData;

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(
        err.message || "An error occurred while analyzing the IP address"
      );
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

        {/* Search Interface - Only show if results are displayed */}
        {result && (
          <IPCheckerSearchInterface
            ipAddress={ipAddress}
            setIpAddress={setIpAddress}
            handleManualSearch={handleManualSearch}
            loading={loading}
          />
        )}

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

            {/* Advanced Features */}
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
