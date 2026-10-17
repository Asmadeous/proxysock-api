import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Globe, Info, MessageSquare, Phone, Plane, Signal, Smartphone, type LucideIcon } from "lucide-react";

import ESIMPurchaseLayout from "./ESIMPurchaseLayout";

import { formatDataVolume, formatPrice, packageCountries, useESIMPackages, useEsimCatalog } from "@/hooks/useESIMPackages";

import { CarrierLogo, PHONE_LINES, carrierOf, toUsaEsimPlan } from "./phoneLines";

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
  stats: Stat[];
  carriers?: string[];
  action: string;
  href: string;
  onNavigate?: () => void;
}

export default function ESIMTypes({ onNavigateUSA, onNavigateGlobal }: ESIMTypesProps = {}) {
  // Live numbers from the catalog, so the page sells what we actually offer.
  const { data: catalog = [], isLoading: catalogLoading, isError, refetch, isFetching } = useEsimCatalog();
  const { pathname } = useLocation();
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
      title: "Phone-number eSIM",
      description: "USA and UK phone numbers, with calls, texts and data depending on your plan.",
      icon: Phone,
      features: [
        [Smartphone, "USA or UK phone number"],
        [MessageSquare, "Compare call, text and data allowances"],
        [Signal, "Mobile data on major carriers"],
      ],
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
      title: "Data-only eSIM",
      description: "Mobile internet for travel, browsing and staying in touch through apps.",
      icon: Globe,
      features: [
        [Signal, "Mobile data, no phone number"],
        [Globe, "Country, regional and global plans"],
        [Plane, "Use messaging and calling apps over data"],
      ],
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
    <ESIMPurchaseLayout>
      <header className="overview-heading">
        <div><h1>eSIM</h1><p>Choose data only or a plan with a phone number.</p></div>
        {pathname.startsWith('/dashboard') && <Link className="overview-button" to="/dashboard/Esim-management">My eSIMs <ArrowUpRight size={14} aria-hidden="true" /></Link>}
      </header>
      {isError && <div className="overview-error" role="alert"><div><strong>We couldn’t load eSIM availability.</strong><p>Try again for current plans and prices.</p></div><button type="button" disabled={isFetching} onClick={() => refetch()}>{isFetching ? 'Retrying…' : 'Try again'}</button></div>}
      <div className="esim-service-grid" aria-busy={loading}>
        {services.map(service => <section key={service.title} className="esim-service-card">
          <service.icon size={23} strokeWidth={1.5} aria-hidden="true" />
          <h2>{service.title}</h2><p>{service.description}</p>
          <dl className="esim-service-stats">{service.stats.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{loading ? 'Loading…' : isError ? 'Unavailable' : value || 'Not available'}</dd></div>)}</dl>
          {service.carriers && service.carriers.length > 0 && !isError && <div className="esim-carriers" aria-label="Carriers">{service.carriers.map(name => <span key={name} title={name}><CarrierLogo carrier={name} className="h-8 w-16" /><span className="sr-only">{name}</span></span>)}</div>}
          <ul className="esim-service-features">{service.features.map(([Icon, text]) => <li key={text}><Icon size={15} strokeWidth={1.5} aria-hidden="true" />{text}</li>)}</ul>
          {service.onNavigate ? <button type="button" className="esim-service-action" onClick={service.onNavigate}>{service.action}<ArrowRight size={15} aria-hidden="true" /></button> : <Link className="esim-service-action" to={service.href}>{service.action}<ArrowRight size={15} aria-hidden="true" /></Link>}
        </section>)}
      </div>
      <aside className="esim-compatibility"><Info size={17} aria-hidden="true" /><p>Your phone must be unlocked and support eSIM. Check the plan’s coverage, validity and device requirements before purchasing.</p></aside>
    </ESIMPurchaseLayout>
  );
}
