
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Globe,
  Sparkles,
} from "lucide-react";

import { Category, ProxyPlan } from "@/types";

interface RenderISPOptionsProps {
  selectedCategory: string;
  showMobilePlans: boolean;
  mobileProxyPlans: ProxyPlan[];
  selectedPlan: string | number | null;
  selectedCategoryData: Category | null;
  setPeriod: (period: number) => void;
  period: number;
  protocol: "http" | "socks5";
  setProtocol: (protocol: "http" | "socks5") => void;
  handleISPSelection: (ispId: number) => void;
  handleCitySelection: (cityId: number) => void;
  selectedCity: number | null;
  selectedISP: number | null;
}

const PeriodSelector = ({
  label,
  value,
  minValue,
  maxValue,
  onChange,
  planType,
  gbInfo
}: {
  label: string;
  value: number;
  minValue: number;
  maxValue: number;
  onChange: (val: number) => void;
  planType: string;
  gbInfo: { isGb: boolean; gbMin: number; gbMax: number }
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center rounded-lg border overflow-hidden">
        <button
          onClick={() => onChange(Math.max(minValue, value - 1))}
          disabled={value <= minValue}
          className="p-3 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
        <input
          type="number"
          min={minValue}
          max={maxValue}
          value={value}
          onChange={(e) => {
            const val = Number.parseInt(e.target.value) || minValue;
            onChange(Math.max(minValue, Math.min(maxValue, val)));
          }}
          className="flex-1 py-3 text-center bg-transparent text-xl font-bold focus:outline-none border-x"
          style={{ appearance: "textfield" }}
        />
        <button
          onClick={() => onChange(Math.min(maxValue, value + 1))}
          disabled={value >= maxValue}
          className="p-3 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Increase"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        {gbInfo.isGb
          ? gbInfo.gbMin === gbInfo.gbMax
            ? `This plan requires exactly ${gbInfo.gbMin} GB`
            : `This plan allows ${minValue}-${maxValue} GB of data`
          : planType === "mobile"
            ? "Select the duration for your mobile proxy"
            : "Choose how many months your proxies will be valid"}
      </p>
    </CardContent>
  </Card>
);

const ProtocolSelector = ({ selected, onChange }: { selected: "http" | "socks5", onChange: (val: "http" | "socks5") => void }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm flex items-center gap-2">
        <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        Protocol
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-3">
        {(["http", "socks5"] as const).map((proto) => (
          <button
            key={proto}
            onClick={() => onChange(proto)}
            className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${selected === proto
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
          >
            {proto.toUpperCase()}
          </button>
        ))}
      </div>
    </CardContent>
  </Card>
);

const CountryLocationCard = ({
  countryCode,
  location,
  selectedCity,
  selectedISP,
  isp,
  onISPSelect,
  onCitySelect
}: {
  countryCode: string;
  location: any;
  selectedCity: number | null;
  selectedISP: number | null;
  isp: any;
  onISPSelect: (id: number) => void;
  onCitySelect: (id: number) => void;
}) => (
  <div className="bg-muted/50 rounded-lg p-3 border">
    <div className="flex items-center mb-3">
      <img
        src={`https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`}
        alt={`${location.name} flag`}
        className="w-6 h-4 mr-2 rounded"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      <span className="font-medium text-sm">{location.name}</span>
    </div>
    {location.cities && location.cities.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {location.cities.map((city: any) => (
          <button
            key={city.id}
            onClick={() => {
              onISPSelect(isp.id);
              onCitySelect(city.id);
            }}
            className={`py-2 px-3 rounded-md text-sm font-medium transition-all border text-left ${selectedCity === city.id
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
          >
            {selectedCity === city.id && <Check className="w-3 h-3 mb-1" />}
            <div className="font-medium truncate">{city.name}</div>
            <div className="text-xs opacity-70 truncate">{city.state}</div>
          </button>
        ))}
      </div>
    ) : (
      <button
        onClick={() => onISPSelect(isp.id)}
        className={`w-full py-2 px-3 rounded-md font-medium transition-all border ${selectedISP === isp.id
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
      >
        Select {isp.name}
      </button>
    )}
  </div>
);

export const renderISPOptionsWithCountries = ({
  selectedCategory,
  showMobilePlans,
  mobileProxyPlans,
  selectedPlan,
  selectedCategoryData,
  setPeriod,
  period,
  protocol,
  setProtocol,
  handleISPSelection,
  handleCitySelection,
  selectedCity,
  selectedISP,
}: RenderISPOptionsProps) => {
  const plan = (selectedCategory === "mobile" && showMobilePlans)
    ? mobileProxyPlans.find((p) => p.id === selectedPlan)
    : selectedCategoryData?.proxy_plans?.find((p) => p.id === selectedPlan);

  if (!plan) return null;

  const isMobile = selectedCategory === "mobile";
  const isResidential = selectedCategory === "residential";
  const availableISPs = plan.isp || [];

  let showPeriod = true;
  let periodLabel = isMobile ? "Duration (Days)" : (isResidential && plan.billing_type === "usage_gb" ? "Data Amount (GB)" : "Validity (Months)");

  if (isMobile) {
    if (plan.is_owned) {
      if (plan.billing_type === "daily") periodLabel = "Duration (Days)";
      else if (plan.billing_type === "weekly") periodLabel = "Duration (Weeks)";
      else if (plan.billing_type === "monthly") periodLabel = "Duration (Months)";
      else if (plan.billing_type === "usage_gb") periodLabel = "Data Amount (GB)";
    } else {
      const planName = String(plan.name);
      if (planName.match(/(\d+)\s*Days?/i) && !planName.toLowerCase().includes("daily")) showPeriod = false;
      else if (planName.toLowerCase().includes("daily")) periodLabel = "Duration (Days)";
      else if (planName.toLowerCase().includes("per-gb")) periodLabel = "Data Amount (GB)";
    }
  }

  const gbMin = Number(plan.gb_min) || 0;
  const gbMax = Number(plan.gb_max) || 0;
  const isGbBilling = plan.billing_type === "usage_gb" || (isResidential && gbMin > 0 && gbMax > 0);
  const minValue = isGbBilling ? (gbMin || 1) : 1;
  const maxValue = isGbBilling ? (gbMax || 1000) : 1000;

  return (
    <div className="space-y-4">
      {showPeriod && (
        <PeriodSelector
          label={periodLabel}
          value={period}
          minValue={minValue}
          maxValue={maxValue}
          onChange={setPeriod}
          planType={selectedCategory}
          gbInfo={{
            isGb: isGbBilling || String(plan.name).toLowerCase().includes("per-gb"),
            gbMin,
            gbMax
          }}
        />
      )}

      <ProtocolSelector selected={protocol} onChange={setProtocol} />

      {!isResidential && availableISPs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Available Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableISPs.map((isp) => (
              <div key={isp.id} className="border rounded-lg p-3">
                <div className="font-medium text-sm mb-3 flex items-center">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
                  <span className="truncate">{isp.name}</span>
                </div>
                {isp.locations && Object.keys(isp.locations).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(isp.locations).map(([countryCode, location]) => (
                      <CountryLocationCard
                        key={countryCode}
                        countryCode={countryCode}
                        location={location}
                        selectedCity={selectedCity}
                        selectedISP={selectedISP}
                        isp={isp}
                        onISPSelect={handleISPSelection}
                        onCitySelect={handleCitySelection}
                      />
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => handleISPSelection(isp.id)}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all border-2 ${selectedISP === isp.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                  >
                    Select {isp.name}
                  </button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
