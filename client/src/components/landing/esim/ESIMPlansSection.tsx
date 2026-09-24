import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import api from "../../../services/api";

interface ESIMPlansSectionProps {
  trackConversion?: (
    eventName: string,
    eventType: string,
    pagePath: string
  ) => void;
}

type ServiceType = "voice" | "data";
type VoiceCountry = "US" | "GB";

interface VoicePlan {
  id: string;
  country: VoiceCountry;
  provider: string;
  name: string;
  price: number;
  currencyCode: string;
  voice: string;
  sms: string;
  data: string;
  duration: number;
  durationUnit: string;
  description: string;
  features: string[];
}

interface DataPlan {
  id: string;
  name: string;
  price: number;
  currencyCode: string;
  data: string;
  duration: number;
  durationUnit: string;
  coverage: string;
}

const countryContent: Record<
  VoiceCountry,
  {
    shortLabel: string;
    title: string;
    description: string;
    notice: string;
  }
> = {
  US: {
    shortLabel: "USA",
    title: "USA phone-number eSIMs",
    description:
      "Get a real US number with calling, texting, and mobile data on supported US networks.",
    notice:
      "Some US carriers require your device IMEI or EID during checkout. Have your device details ready before purchasing.",
  },
  GB: {
    shortLabel: "UK",
    title: "UK phone-number eSIMs",
    description:
      "Get a real UK number with calls, texts, and data. Roaming allowances vary by plan and network.",
    notice:
      "UK plans may need to be activated in the UK before first use. Review each plan's activation and roaming terms before purchasing.",
  },
};

const normalizeProvider = (product: any) => {
  const value =
    product.network_operator ||
    product.plan_network ||
    product.provider_name ||
    product.providerName ||
    product.provider ||
    "Mobile network";

  return String(value)
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getPlanCountry = (product: any): VoiceCountry => {
  const values = [
    product.country_code,
    product.country,
    product.region,
    product.location_code,
    product.location_name,
    ...(Array.isArray(product.countries) ? product.countries : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /(^|\s)(gb|uk)(\s|$)|united kingdom|great britain/.test(values)
    ? "GB"
    : "US";
};

const includesFeature = (features: string[], pattern: RegExp) =>
  features.find((feature) => pattern.test(feature));

const formatVoicePlans = (products: any[]): VoicePlan[] =>
  products.map((product) => {
    const features = Array.isArray(product.features)
      ? product.features.map(String)
      : [];
    const voiceValue =
      product.voice ?? product.voice_minutes ?? product.calling_minutes;
    const smsValue = product.sms ?? product.sms_quota;
    const unlimitedVoice = includesFeature(features, /unlimited.*(voice|call)/i);
    const unlimitedSms = includesFeature(features, /unlimited.*(sms|text)/i);

    return {
      id: String(product.id ?? product.product_id ?? product.productId),
      country: getPlanCountry(product),
      provider: normalizeProvider(product),
      name: product.plan_title || product.name || "Phone-number eSIM",
      price: Number(product.price || product.retail_price || 0) * 100,
      currencyCode: product.currency || product.currency_code || "USD",
      voice:
        voiceValue === null || unlimitedVoice
          ? "Unlimited"
          : voiceValue
            ? `${voiceValue}${typeof voiceValue === "number" ? " min" : ""}`
            : "Included",
      sms:
        smsValue === null || unlimitedSms
          ? "Unlimited"
          : smsValue
            ? String(smsValue)
            : "Included",
      data: product.data_gb
        ? `${Number(product.data_gb)} GB`
        : product.data_amount || product.plan_data_limit || "Plan allowance",
      duration: Number(product.duration_days || product.duration || 30),
      durationUnit: product.duration_unit || "days",
      description:
        product.plan_description ||
        product.description ||
        "A phone-number eSIM with voice, text, and mobile data.",
      features,
    };
  });

const formatDataPlans = (products: any[]): DataPlan[] => {
  const groups: Record<string, DataPlan> = {};

  products.forEach((product) => {
    const locationName =
      product.location_name ||
      product.metadata?.location_name ||
      product.country_name ||
      "Global";
    const price = Number(product.price || product.retail_price || 0) * 100;
    const plan: DataPlan = {
      id: String(product.id ?? product.product_id ?? product.productId),
      name: locationName,
      price,
      currencyCode: product.currency || product.currency_code || "USD",
      data: product.data_gb
        ? `${Number(product.data_gb)} GB`
        : product.data_amount || "High-speed data",
      duration: Number(product.duration_days || product.duration || 7),
      durationUnit: product.duration_unit || "days",
      coverage: product.location_name || "Regional coverage",
    };

    if (!groups[locationName] || price < groups[locationName].price) {
      groups[locationName] = plan;
    }
  });

  return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
};

const PlanSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-5" aria-hidden="true">
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-5 w-full max-w-44 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-7 w-20 animate-pulse rounded bg-muted" />
    </div>
    <div className="mb-6 grid grid-cols-3 gap-2">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
    <div className="h-10 animate-pulse rounded-lg bg-muted" />
  </div>
);

export const ESIMPlansSection = ({ trackConversion }: ESIMPlansSectionProps) => {
  const [serviceType, setServiceType] = useState<ServiceType>("voice");
  const [voiceCountry, setVoiceCountry] = useState<VoiceCountry>("US");
  const [voicePlans, setVoicePlans] = useState<VoicePlan[]>([]);
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [dataSearch, setDataSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setHasError(false);
        const [voiceResponse, dataResponse] = await Promise.all([
          api.get("/web/api/products?product_type=usa_esim"),
          api.get("/web/api/products?product_type=esim"),
        ]);

        setVoicePlans(formatVoicePlans(voiceResponse.data.products || []));
        setDataPlans(formatDataPlans(dataResponse.data.products || []));
      } catch (error) {
        console.error("Failed to load eSIM plans:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const selectedVoicePlans = useMemo(
    () => voicePlans.filter((plan) => plan.country === voiceCountry),
    [voiceCountry, voicePlans]
  );

  const filteredDataPlans = useMemo(() => {
    const query = dataSearch.trim().toLowerCase();
    const matches = query
      ? dataPlans.filter((plan) =>
          `${plan.name} ${plan.coverage}`.toLowerCase().includes(query)
        )
      : dataPlans;

    return matches.slice(0, query ? 24 : 12);
  }, [dataPlans, dataSearch]);

  const formatPrice = (priceInCents: number, currencyCode = "USD") =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(priceInCents / 100);

  const trackPurchase = () =>
    trackConversion?.(
      "esim_plan_purchase",
      "conversion",
      "/dashboard/esim"
    );

  const activeCountry = countryContent[voiceCountry];

  return (
    <section className="relative bg-background py-16 sm:py-20" aria-labelledby="esim-plans-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h2 id="esim-plans-title" className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Find your eSIM plan
          </h2>
          <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
            A local phone number or data for your next trip. Choose the service you need.
          </p>
        </header>

        <div className="mb-8 grid w-full gap-1 rounded-lg border border-border bg-muted/40 p-1 sm:inline-grid sm:w-auto sm:grid-cols-2"
          role="group" aria-label="eSIM service type">
          {([
            ["voice", "Voice, Data + Text eSIM"],
            ["data", "Data Only eSIM"],
          ] as const).map(([value, label]) => (
            <button key={value} id={value + "-esim-tab"} type="button"
              aria-pressed={serviceType === value}
              onClick={() => setServiceType(value)}
              className={`min-h-12 rounded-md px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                serviceType === value
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {serviceType === "voice" && (
          <div
            id="voice-esim-panel"
            role="region"
            aria-labelledby="voice-esim-tab"
          >
            <div className="mb-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border pb-5">
              <span className="text-sm font-semibold text-foreground">Choose your number’s country</span>
              <div
                className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-80"
                role="group"
                aria-label="Phone-number eSIM country"
              >
                {(Object.keys(countryContent) as VoiceCountry[]).map((country) => {
                  const content = countryContent[country];
                  const count = voicePlans.filter(
                    (plan) => plan.country === country
                  ).length;
                  const isActive = voiceCountry === country;

                  return (
                    <button
                      key={country}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setVoiceCountry(country)}
                      className={`relative flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border px-6 py-3 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-foreground/30 bg-card text-foreground hover:border-primary hover:bg-primary/10"
                      }`}
                    >
                      {content.shortLabel}
                      {!isLoading && count > 0 && (
                        <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-7 grid gap-4">
              <div className="max-w-2xl">
                <h3 className="text-2xl font-bold text-foreground">
                  {activeCountry.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {activeCountry.description}
                </p>
              </div>
              <div className="max-w-3xl border-l-2 border-border pl-4 text-sm leading-6 text-muted-foreground">
                <p>{activeCountry.notice}</p>
              </div>
            </div>

            {hasError ? (
              <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
                <h4 className="font-semibold text-foreground">
                  We couldn&apos;t load the plans
                </h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  Refresh the page or try again in a moment.
                </p>
              </div>
            ) : isLoading ? (
              <div className="grid gap-5 md:grid-cols-2" aria-label="Loading plans">
                {[0, 1, 2].map((item) => (
                  <PlanSkeleton key={item} />
                ))}
              </div>
            ) : selectedVoicePlans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
                <h4 className="font-semibold text-foreground">
                  {activeCountry.shortLabel} plans are currently unavailable
                </h4>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Please check back for available plans, or explore the other service options.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {selectedVoicePlans.map((plan) => (
                  <article
                    key={plan.id}
                    className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-6 sm:p-7"
                  >
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 basis-40">
                        <p className="mb-1 text-sm font-medium text-muted-foreground">
                          {plan.provider}
                        </p>
                        <h4 className="text-lg font-semibold leading-7 text-foreground">
                          {plan.name}
                        </h4>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-2xl font-semibold tracking-tight text-foreground">
                          {formatPrice(plan.price, plan.currencyCode)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {plan.duration} {plan.durationUnit}
                        </p>
                      </div>
                    </div>

                    <dl className="mb-5 divide-y divide-border border-y border-border">
                      {[["Data", plan.data], ["Calls", plan.voice], ["Texts", plan.sms]].map(([label, value]) => (
                        <div key={label} className="flex items-baseline justify-between gap-5 py-3 text-sm">
                          <dt className="text-muted-foreground">{label}</dt>
                          <dd className="text-right font-medium text-foreground">{value}</dd>
                        </div>
                      ))}
                    </dl>

                    <details className="mb-6 text-sm">
                      <summary className="w-fit cursor-pointer rounded py-2 font-medium text-foreground underline decoration-border underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        Plan details
                      </summary>
                      <p className="mt-2 leading-6 text-muted-foreground">{plan.description}</p>
                      {plan.features.length > 0 && (
                        <ul className="mt-3 list-disc space-y-2 pl-5 leading-6 text-muted-foreground">
                          {plan.features.map((feature, index) => <li key={index}>{feature}</li>)}
                        </ul>
                      )}
                    </details>

                    <Link
                      to="/dashboard/esim"
                      onClick={trackPurchase}
                      className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      View available plans
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {serviceType === "data" && (
          <div
            id="data-esim-panel"
            role="region"
            aria-labelledby="data-esim-tab"
          >
            <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h3 className="text-2xl font-bold text-foreground">
                  Data-only eSIMs by destination
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Mobile internet without a phone number, regular calls, or SMS.
                  Apps such as WhatsApp and FaceTime work over your data connection.
                </p>
              </div>

              <label className="relative block w-full lg:w-80">
                <span className="sr-only">Search destinations</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={dataSearch}
                  onChange={(event) => setDataSearch(event.target.value)}
                  placeholder="Search a destination"
                  className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            {hasError ? (
              <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
                <h4 className="font-semibold text-foreground">
                  We couldn&apos;t load the plans
                </h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  Refresh the page or try again in a moment.
                </p>
              </div>
            ) : isLoading ? (
              <div className="grid gap-5 md:grid-cols-2" aria-label="Loading plans">
                {[0, 1, 2].map((item) => (
                  <PlanSkeleton key={item} />
                ))}
              </div>
            ) : filteredDataPlans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
                <h4 className="font-semibold text-foreground">No destinations found</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try another country or region.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  {filteredDataPlans.map((plan) => (
                    <article
                      key={plan.id}
                      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-foreground">
                          {plan.name}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {plan.data} · {plan.duration} {plan.durationUnit}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted-foreground">
                          From
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {formatPrice(plan.price, plan.currencyCode)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-8 flex justify-center">
                  <Link
                    to="/dashboard/esim"
                    onClick={trackPurchase}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Explore all data plans
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
