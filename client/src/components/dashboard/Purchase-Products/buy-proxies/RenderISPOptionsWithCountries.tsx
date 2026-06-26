
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Globe,
  Minus,
  Package,
  Plus,
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
  selectedGlobalCountry: number | null;
  selectedGlobalTarget: number | null;
  selectedGlobalPeriod: string | null;
  handleGlobalCountrySelection: (countryId: number) => void;
  handleGlobalTargetSelection: (targetId: number, sectionId: number) => void;
  handleGlobalPeriodSelection: (periodId: string) => void;
  quantity: number;
  setQuantity: (quantity: number) => void;
  // Residential rotating v2 config
  rrCountry: string;
  setRrCountry: (v: string) => void;
  rrState: string;
  setRrState: (v: string) => void;
  rrCity: string;
  setRrCity: (v: string) => void;
  rrISP: string;
  setRrISP: (v: string) => void;
  rrRotation: string;
  setRrRotation: (v: string) => void;
  rrRegion: string;
  setRrRegion: (v: string) => void;
  rrQuantity: number;
  setRrQuantity: (v: number) => void;
  // Geo lists are fetched on demand from DB-backed endpoints.
  rrCountries: RrGeoOption[];
  rrStates: RrGeoOption[];
  rrCities: RrGeoOption[];
  rrIsps: RrGeoOption[];
  rrIspQuery: string;
  setRrIspQuery: (v: string) => void;
}

type RrGeoOption = { id: string; name: string; asn?: string };

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
        <Sparkles className="w-4 h-4 text-muted-foreground" />
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
        <Cpu className="w-4 h-4 text-muted-foreground" />
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
    {location.cities && location.cities.some((c: any) => Number(c.ips_available) > 0) ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {location.cities.filter((c: any) => Number(c.ips_available) > 0).map((city: any) => (
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
  selectedGlobalCountry,
  selectedGlobalTarget,
  selectedGlobalPeriod,
  handleGlobalCountrySelection,
  handleGlobalTargetSelection,
  handleGlobalPeriodSelection,
  quantity,
  setQuantity,
  rrCountry,
  setRrCountry,
  rrISP,
  setRrISP,
  rrRotation,
  setRrRotation,
  rrRegion,
  setRrRegion,
  rrQuantity,
  setRrQuantity,
  rrCountries,
  rrState,
  setRrState,
  rrCity,
  setRrCity,
  rrStates,
  rrCities,
  rrIsps,
  rrIspQuery,
  setRrIspQuery,
}: RenderISPOptionsProps) => {
  const plan = (selectedCategory === "mobile" && showMobilePlans)
    ? mobileProxyPlans.find((p) => String(p.id) === String(selectedPlan))
    : selectedCategoryData?.proxy_plans?.find((p) => String(p.id) === String(selectedPlan));

  if (!plan) return null;

  const isMobile = selectedCategory === "mobile";
  const isResidential = selectedCategory === "residential";
  const isResidentialRotating = selectedCategory === "residential-rotating";
  const isResiV2 = isResidentialRotating && Number((plan as any).resi) === 1;
  const availableISPs = plan.isp || [];

  let showPeriod = selectedCategory !== "global-isp"; // Hide default period selector for Global ISP
  let periodLabel = isMobile ? "Duration (Days)" : (isResidential && plan.billing_type === "usage_gb" ? "Data Amount (GB)" : "Validity (Months)");

  if (isMobile) {
    if (plan.billing_type === "daily") periodLabel = "Duration (Days)";
    else if (plan.billing_type === "weekly") periodLabel = "Duration (Weeks)";
    else if (plan.billing_type === "monthly") periodLabel = "Duration (Months)";
    else if (plan.billing_type === "usage_gb") periodLabel = "Data Amount (GB)";
    else {
      const planName = String(plan.name);
      if (planName.match(/(\d+)\s*Days?/i) && !planName.toLowerCase().includes("daily")) showPeriod = false;
      else if (planName.toLowerCase().includes("daily")) periodLabel = "Duration (Days)";
      else if (planName.toLowerCase().includes("per-gb")) periodLabel = "Data Amount (GB)";
    }
  }

  const gbMin = Number(plan.gb_min) || 0;
  const gbMax = Number(plan.gb_max) || 0;
  const isGbBilling = plan.billing_type === "usage_gb" || ((isResidential || isResidentialRotating) && gbMin > 0 && gbMax > 0);
  const minValue = isGbBilling ? (gbMin || 1) : 1;
  const maxValue = isGbBilling ? (gbMax || 1000) : 1000;

  // For residential-rotating v2, period selector is replaced by the config panel
  const showPeriodOverride = isResiV2 ? false : showPeriod;

  // Use dynamic options if available on the plan, otherwise fallback to standard values
  const rotationOptions = plan.residential_rotating_config?.rotation_options || [
    { value: '0',    label: 'Always Rotate (New IP per request)' },
    { value: '3',    label: 'Sticky 3 Minutes' },
    { value: '5',    label: 'Sticky 5 Minutes' },
    { value: '30',   label: 'Sticky 30 Minutes' },
    { value: '60',   label: 'Sticky 1 Hour' },
    { value: '240',  label: 'Sticky 4 Hours' },
    { value: '1440', label: 'Sticky 24 Hours' },
  ];

  const regionOptions = plan.residential_rotating_config?.hostname_options || [
    { value: 'ip-na.myproxyapi.com',   label: 'North America' },
    { value: 'ip-eu.myproxyapi.com',   label: 'Europe' },
    { value: 'ip-asia.myproxyapi.com', label: 'Asia' },
  ];

  return (
    <div className="space-y-4">
      {showPeriodOverride && (
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

      {/* ===== Residential Rotating Config (shown for ALL residential-rotating;
             the backend provisions every RR order via the V2 generate-proxy flow) ===== */}
      {isResidentialRotating && (
        <Card className="border-border bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              Residential Rotating Config
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Country */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Country</label>
              <select
                value={rrCountry}
                onChange={e => {
                  setRrCountry(e.target.value);
                  setRrState('');
                  setRrCity('');
                  setRrISP('');
                }}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Any country</option>
                {rrCountries.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* State — loaded from the DB when a country is picked */}
            {rrStates.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">State (Optional)</label>
                <select
                  value={rrState}
                  onChange={e => { setRrState(e.target.value); setRrCity(''); }}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Any state</option>
                  {rrStates.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* City — loaded from the DB when a state is picked */}
            {rrCities.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">City (Optional)</label>
                <select
                  value={rrCity}
                  onChange={e => setRrCity(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Any city</option>
                  {rrCities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* ISP — searchable (~5k per country); loaded when a country is picked */}
            {rrCountry && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">ISP (Optional)</label>
                <input
                  type="text"
                  value={rrIspQuery}
                  onChange={e => setRrIspQuery(e.target.value)}
                  placeholder="Search ISP by name…"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {/* Custom list (not a native <select>) so the selected row uses the
                    app's red accent instead of the browser's blue highlight. */}
                <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border bg-background divide-y divide-border">
                  <button
                    type="button"
                    onClick={() => setRrISP('')}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      rrISP === '' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'
                    }`}
                  >
                    Any ISP
                  </button>
                  {rrIsps.map(isp => (
                    <button
                      key={isp.id}
                      type="button"
                      onClick={() => setRrISP(isp.id)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors truncate ${
                        rrISP === isp.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'
                      }`}
                    >
                      {isp.name}
                    </button>
                  ))}
                </div>
                {rrIspQuery && rrIsps.length === 0 && (
                  <p className="text-[10px] text-muted-foreground">No ISPs match “{rrIspQuery}”.</p>
                )}
              </div>
            )}

            {/* Rotation Strategy */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Rotation Strategy</label>
              <div className="grid grid-cols-1 gap-2">
                {rotationOptions.map((opt: any) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRrRotation(opt.value)}
                    className={`py-2 px-3 rounded-lg border-2 text-xs font-medium text-left transition-all ${
                      rrRotation === opt.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Proxy Region */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Proxy Region</label>
              <div className="grid grid-cols-3 gap-2">
                {regionOptions.map((opt: any) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRrRegion(opt.value)}
                    className={`py-2 px-3 rounded-lg border-2 text-[10px] font-semibold transition-all text-center leading-tight ${
                      rrRegion === opt.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Credentials Quantity */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Number of Credentials</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRrQuantity(Math.max(1, rrQuantity - 1))}
                  disabled={rrQuantity <= 1}
                  className="p-2 rounded-lg border hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center text-xl font-bold">{rrQuantity}</span>
                <button
                  type="button"
                  onClick={() => setRrQuantity(Math.min(10, rrQuantity + 1))}
                  disabled={rrQuantity >= 10}
                  className="p-2 rounded-lg border hover:bg-muted disabled:opacity-30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">Max 10 credential sets</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedCategory === "global-isp" && (
        <Card className="border-border bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              Number of Proxies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(Number(plan.qty_min) || 1, quantity - 1))}
                  disabled={quantity <= (Number(plan.qty_min) || 1)}
                  className="p-3 rounded-xl border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || (Number(plan.qty_min) || 1);
                      const min = Number(plan.qty_min) || 1;
                      const max = (Number(plan.qty_max) > 0 && Number(plan.qty_max) < 999999) ? Number(plan.qty_max) : 999999;
                      setQuantity(Math.max(min, Math.min(max, val)));
                    }}
                    className="w-full text-center font-bold text-2xl bg-transparent border-none focus:outline-none focus:ring-0"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min((Number(plan.qty_max) > 0 && Number(plan.qty_max) < 999999 ? Number(plan.qty_max) : 999999), quantity + 1))}
                  disabled={Number(plan.qty_max) > 0 && Number(plan.qty_max) < 999999 ? quantity >= Number(plan.qty_max) : false}
                  className="p-3 rounded-xl border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {Number(plan.qty_min) > 0 && (
                <p className="text-[10px] text-muted-foreground text-center font-medium">
                  {Number(plan.qty_min) === Number(plan.qty_max)
                    ? `Fixed quantity: ${plan.qty_min} proxies`
                    : `Select ${plan.qty_min} to ${Number(plan.qty_max) >= 999999 ? "unlimited" : plan.qty_max} proxies`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedCategory === "global-isp" && plan.global_isp_config?.countries && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 border w-full">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Available Countries:</span>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {plan.global_isp_config.countries.map((country: any) => (
                <img
                  key={country.id}
                  src={`https://flagcdn.com/16x12/${country.code?.toLowerCase()}.png`}
                  alt={country.name}
                  title={country.name}
                  className="w-4 h-3 rounded-sm flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedCategory === "global-isp" && plan.global_isp_config && (
        <div className="space-y-4 pt-2">
          {/* Global Duration / Periods */}
          {(plan.global_isp_config.periods || []).length > 0 && (
            <Card className="border-border bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  Select Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {(plan.global_isp_config.periods).map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => handleGlobalPeriodSelection(p.id)}
                      className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${selectedGlobalPeriod === p.id
                        ? "border-primary bg-primary text-primary-foreground shadow-md scale-[1.02]"
                        : "border-border bg-background hover:border-primary/50 hover:bg-muted/50"
                        }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Targets Section */}
          <Card className="border-border bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                Select Usage Target
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(plan.global_isp_config.targets || []).map((section: any) => (
                <div key={section.sectionId} className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{section.name}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(section.targets || []).map((target: any) => (
                      <button
                        key={target.id}
                        onClick={() => handleGlobalTargetSelection(target.id, section.sectionId)}
                        className={`py-2 px-3 rounded-md text-[11px] font-semibold transition-all border text-center ${selectedGlobalTarget === target.id
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-background hover:border-primary/50 hover:bg-muted/50"
                          }`}
                      >
                        {target.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Global Locations */}
          <Card className="border-border bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                Select Location / Country
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(plan.global_isp_config.countries || []).map((country: any) => {
                  const flagCode = (country.alpha2 || country.alpha3?.slice(0,2) || 'us').toLowerCase();
                  return (
                    <button
                      key={country.id}
                      onClick={() => handleGlobalCountrySelection(country.id)}
                      className={`flex items-center gap-2 py-2 px-3 rounded-md text-[11px] font-semibold transition-all border ${selectedGlobalCountry === country.id
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background hover:border-primary/50 hover:bg-muted/50"
                        }`}
                    >
                      <img
                        src={`https://flagcdn.com/24x18/${flagCode}.png`}
                        alt={country.name}
                        className="w-4 h-3 rounded-sm object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <span className="truncate">{country.name}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isResidential && availableISPs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              Available Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableISPs.map((isp) => (
              <div key={isp.id} className="border rounded-lg p-3">
                <div className="font-medium text-sm mb-3 flex items-center">
                  <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mr-2"></div>
                  <span className="truncate">{isp.name}</span>
                </div>
                {isp.locations && Object.keys(isp.locations).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(isp.locations)
                      .filter(([_, location]: [string, any]) => !location.cities || location.cities.some((c: any) => Number(c.ips_available) > 0))
                      .map(([countryCode, location]) => (
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
