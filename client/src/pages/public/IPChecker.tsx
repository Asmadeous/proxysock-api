import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import api from "@/services/api";
import { ResourcePage, ResourceHero, ResourceClosing } from "@/components/landing/resources/ResourceLayout";
import { IPCheckerResultsDisplay, IPCheckerThreatAssessment, IPCheckerGeolocationCard, IPCheckerNetworkCard, IPCheckerTimezoneCard, IPCheckerCurrencyCard, IPCheckerCarrierCard, IPCheckerAdvancedFeatures, IPCheckerAdvancedIntelligence } from "@/components/landing/tools/IPChecker";
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

export default function IPChecker() {
  const [ipAddress, setIpAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<IPResult | null>(null);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  async function lookup(ip?: string) {
    const current = ++requestId.current;
    setLoading(true); setError(""); setResult(null);
    try {
      const response = ip ? await api.get("/web/api/tools/ip_checker", { params: { ip } }) : await api.get("/web/api/tools/ip_checker");
      if (current !== requestId.current) return;
      const data: IPResult = response.data;
      if (data.error || !data.ip) { setError(typeof data.error === "string" ? data.error : "The lookup returned no IP details. Please try again."); }
      else { setIpAddress(data.ip); setResult(data); }
    } catch (err: any) {
      if (current === requestId.current) setError(typeof err.response?.data?.error === "string" ? err.response.data.error : "We couldn't complete this lookup. Check the address and try again.");
    } finally { if (current === requestId.current) setLoading(false); }
  }
  useEffect(() => { void lookup(); return () => { requestId.current += 1; }; }, []);

  return <ResourcePage name="IP Checker" path="/ip-checker" description="Check your public IP or look up an address to explore its geolocation, network and reputation details.">
    <ResourceHero label="IP checker" title="See your connection." accent="Know your network." description="Look up a public IP to explore its location, network and available reputation information. Your current connection is checked automatically.">
      <form className="ip-search-panel" onSubmit={(event) => { event.preventDefault(); if (!loading && ipAddress.trim()) void lookup(ipAddress.trim()); }}>
        <label htmlFor="resource-ip-address">IP address</label><input id="resource-ip-address" type="text" autoComplete="off" spellCheck={false} placeholder="Enter an IPv4 or IPv6 address" value={ipAddress} onChange={(event) => setIpAddress(event.target.value)} />
        <button type="submit" className="proxy-button proxy-button-white" disabled={loading || !ipAddress.trim()}>{loading ? "Checking connection…" : "Look up address"}<ArrowRight size={16} aria-hidden="true" /></button><p className="ip-search-hint">Use the public address you want to inspect. Details depend on the lookup provider.</p>
      </form>
    </ResourceHero>
    <section className="resource-content ip-report" aria-label="IP lookup results" aria-busy={loading}>
      {loading && <div className="ip-status" role="status">Looking up your connection details…</div>}
      {error && <div className="ip-status" role="alert"><h2>We couldn't complete the lookup.</h2><p>{error}</p><button type="button" className="proxy-text-link mt-4" onClick={() => void lookup(ipAddress.trim() || undefined)}>Try again</button></div>}
      {result && <><IPCheckerResultsDisplay result={result} /><p className="resource-note">Location and reputation are estimates reported for this address. They do not identify a person's exact location or guarantee how another service will classify the connection.</p><div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 mt-8"><IPCheckerThreatAssessment threat={result.threat} score={result.score} risk={result.risk} /><IPCheckerGeolocationCard data={result} />{result.asn && <IPCheckerNetworkCard asn={result.asn} />}{result.timezone && <IPCheckerTimezoneCard timezone={result.timezone} />}{result.currency && <IPCheckerCurrencyCard currency={result.currency} />}{result.carrier && <IPCheckerCarrierCard carrier={result.carrier} />}</div><IPCheckerAdvancedIntelligence company={result.company} languages={result.languages} asnDetails={result.asn_details} /><IPCheckerAdvancedFeatures scores={result.threat?.scores} blocklists={result.threat?.blocklists} /></>}
    </section><ResourceClosing title="Checked your connection?" accent="Make the next one." />
  </ResourcePage>;
}
