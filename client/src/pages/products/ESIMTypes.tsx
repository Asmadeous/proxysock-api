import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Globe, Info, MessageSquare, Phone, Plane, Signal, Smartphone, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { formatDataVolume, formatPrice, packageCountries, useESIMPackages, useEsimCatalog } from "@/hooks/useESIMPackages";

import { CarrierLogo, CountryFlag, PHONE_LINES, carrierOf, toUsaEsimPlan } from "./phoneLines";

interface ESIMTypesProps {
  onNavigateUSA?: () => void;
  onNavigateGlobal?: () => void;
}

type Stat = [string, string];

interface Service {
  title: string;
  description: string;
  icon: LucideIcon;
  features: [LucideIcon, string][];
  flags: string[];
  // Shown after the flags when the service covers more countries than it lists.
  moreFlags?: string;
  stats: Stat[];
  carriers?: string[];
  action: string;
  href: string;
  onNavigate?: () => void;
}

export default function ESIMTypes({ onNavigateUSA, onNavigateGlobal }: ESIMTypesProps = {}) {
  // Live numbers from the catalog, so the page sells what we actually offer.
  const { data: catalog = [], isLoading: catalogLoading } = useEsimCatalog();
  const { packages: dataPlans, loading: dataLoading } = useESIMPackages({});
  const loading = catalogLoading || dataLoading;

  const voice = useMemo(() => {
    const lines = catalog.filter((p) => PHONE_LINES.includes(p.meisim_line)).map(toUsaEsimPlan);
    return {
      count: lines.length,
      from: lines.length ? Math.min(...lines.map((l) => l.price)) : null,
      carriers: Array.from(new Set(lines.map(carrierOf))).sort(),
    };
  }, [catalog]);

  const data = useMemo(() => {
    const fixed = dataPlans.filter((p) => p.volume > 0 && p.data_type !== 2).map((p) => p.volume);
    return {
      count: dataPlans.length,
      countries: new Set(dataPlans.flatMap(packageCountries)).size,
      from: dataPlans.length ? Math.min(...dataPlans.map((p) => p.price)) : null,
      min: fixed.length ? Math.min(...fixed) : null,
      max: fixed.length ? Math.max(...fixed) : null,
      unlimited: dataPlans.some((p) => !p.volume),
      daily: dataPlans.some((p) => p.data_type === 2),
    };
  }, [dataPlans]);

  const dataRange = [
    data.min !== null && data.max !== null ? `${formatDataVolume(data.min)} – ${formatDataVolume(data.max)}` : '',
    data.unlimited ? 'unlimited' : '',
    data.daily ? 'daily plans' : '',
  ].filter(Boolean).join(' · ');

  const services: Service[] = [
    {
      title: "Voice, Data + Text eSIM",
      description: "A real local phone number for everyday calls, texts and mobile data.",
      icon: Phone,
      features: [
        [Smartphone, "USA or UK phone number"],
        [MessageSquare, "Calls and texts included"],
        [Signal, "Mobile data on major carriers"],
      ],
      flags: ["US", "GB"],
      stats: [
        ["Countries", "USA & UK"],
        ["Plans", String(voice.count)],
        ["From", voice.from !== null ? formatPrice(voice.from) : ""],
      ],
      carriers: voice.carriers,
      action: "Browse phone-number plans",
      href: "/dashboard/phone-esim",
      onNavigate: onNavigateUSA,
    },
    {
      title: "Data Only eSIM",
      description: "Mobile internet for travel, browsing and staying in touch through apps.",
      icon: Globe,
      features: [
        [Signal, "Mobile data, no phone number"],
        [Globe, "Country, regional and global plans"],
        [Plane, "Made for travel: use WhatsApp and apps over data"],
      ],
      // A few popular destinations; the Data Only page covers many more.
      flags: ["FR", "GB", "JP", "AE", "TR", "TH"],
      moreFlags: data.countries > 6 ? `+${data.countries - 6} more` : undefined,
      stats: [
        ["Countries", String(data.countries)],
        ["Data", dataRange],
        ["From", data.from !== null ? formatPrice(data.from) : ""],
      ],
      action: "Browse data plans",
      href: "/dashboard/global-esim",
      onNavigate: onNavigateGlobal,
    },
  ];

  return (
    <div className="w-full space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Find your eSIM plan</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
          Choose a service to compare plans, check coverage, and add your selection to the cart.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        {services.map((service) => {
          const Icon = service.icon;
          const button = (
            <>
              {service.action}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </>
          );
          return (
            <section
              key={service.title}
              className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50 sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                  <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
                </span>
                <span className="flex flex-wrap items-center justify-end gap-1.5" aria-label={service.moreFlags ? "Popular destinations" : "Available countries"}>
                  {service.flags.map((code) => <CountryFlag key={code} country={code} className="h-6 w-8" />)}
                  {service.moreFlags && <span className="text-xs font-medium text-muted-foreground">{service.moreFlags}</span>}
                </span>
              </div>
              <h2 className="mt-5 text-2xl font-bold tracking-tight">{service.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.description}</p>
              <dl className="mt-6 grid grid-cols-3 gap-2">
                {service.stats.map(([label, value]) => (
                  <div key={label} className="min-w-0 rounded-xl border border-border bg-background/40 px-3 py-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 text-sm font-bold leading-5">
                      {loading ? <span aria-hidden="true" className="block h-5 w-16 animate-pulse rounded bg-muted" /> : value}
                    </dd>
                  </div>
                ))}
              </dl>
              {service.carriers && service.carriers.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Carriers</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {service.carriers.map((name) => (
                      <li key={name} title={name}>
                        <CarrierLogo carrier={name} className="h-9 w-20" />
                        <span className="sr-only">{name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <ul className="my-6 space-y-3">
                {service.features.map(([FeatureIcon, text]) => (
                  <li key={text} className="flex items-start gap-3 text-sm font-medium">
                    <FeatureIcon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {text}
                  </li>
                ))}
              </ul>
              {service.onNavigate ? (
                <Button onClick={service.onNavigate} className="mt-auto min-h-12 h-auto gap-2 whitespace-normal rounded-full font-semibold">
                  {button}
                </Button>
              ) : (
                <Button asChild className="mt-auto min-h-12 h-auto gap-2 whitespace-normal rounded-full font-semibold">
                  <Link to={service.href}>{button}</Link>
                </Button>
              )}
            </section>
          );
        })}
      </div>

      <aside className="flex gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-5">
        <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <h2 className="text-sm font-semibold">Before you choose</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            Check that your phone is unlocked and supports eSIM. Review the plan's coverage, validity and activation
            instructions before purchasing. Available plans vary by country.
          </p>
        </div>
      </aside>
    </div>
  );
}
