import { useState } from 'react';

// MeiSIM phone-number lines (US and UK), shown the way MeiSIM's own plan cards and plan
// window show them: the same pills, description, details and requirements, with our
// prices and styling.

export type LineCountry = 'US' | 'GB';

export interface USAESIMPlan {
  id: string;
  provider: string;
  name: string;
  price: number;
  currency_code: string;
  // MeiSIM's data allowance as it shows it, including "See plan"; empty when it has none.
  data_amount: string;
  duration: number;
  duration_unit: string;
  term_months: number | null;
  requires_imei: boolean;
  requires_eid: boolean;
  // Calls and texts as MeiSIM shows them, "0" included.
  voice: string;
  sms: string;
  phone_number: string;
  includes_number: string;
  networks: string;
  hotspot: string;
  topup: string;
  intl_minutes: string;
  intl_call_to: string;
  roaming_free: string;
  roaming_data_only: string;
  coverage: string;
  description: string;
  activation_note: string;
  warnings: string;
  country: LineCountry;
  // Activated by MeiSIM's team onto the phone's EID within 24 hours, with no QR code.
  manual: boolean;
  // MeiSIM offers an activation address on every US line except Moxee.
  accepts_address: boolean;
}

const text = (value: unknown) => (value === null || value === undefined ? '' : String(value).trim());

export const toUsaEsimPlan = (p: any): USAESIMPlan => ({
  id: String(p.id),
  provider: p.network || 'Mobile network',
  name: p.name,
  price: Number(p.price) || 0,
  currency_code: p.currency || 'USD',
  data_amount: text(p.data_limit),
  duration: Number(p.validity_days) || 30,
  duration_unit: 'Days',
  term_months: Number(p.term_months) || null,
  requires_imei: p.requires_imei !== false,
  requires_eid: p.requires_eid !== false,
  voice: text(p.voice),
  sms: text(p.sms),
  phone_number: text(p.phone_number),
  includes_number: text(p.includes_number),
  networks: text(p.networks),
  hotspot: text(p.hotspot),
  topup: text(p.topup),
  intl_minutes: text(p.intl_minutes),
  intl_call_to: text(p.intl_call_to),
  roaming_free: text(p.roaming_free),
  roaming_data_only: text(p.roaming_data_only),
  coverage: text(p.coverage),
  description: text(p.description),
  activation_note: text(p.activation_note),
  warnings: text(p.warnings),
  country: p.number_country === 'GB' || p.meisim_line === 'uk_prepaid' ? 'GB' : 'US',
  manual: p.manual_fulfilment === true,
  accepts_address: p.accepts_address === true,
});

export const PHONE_LINES = ['us_prepaid', 'uk_prepaid'];

export const COUNTRIES: Record<LineCountry, { name: string; heading: string; facts: string[] }> = {
  US: { name: 'USA', heading: 'USA phone-number plans', facts: ["Needs your phone's IMEI (and EID on most carriers)", 'Mobile data works inside the US only'] },
  GB: { name: 'UK', heading: 'UK phone-number plans', facts: ['No IMEI or EID needed', 'EU roaming included · activate in the UK first'] },
};

// MeiSIM names some networks with and without "Prepaid" ("AT&T" / "AT&T Prepaid"); group them.
export const carrierOf = (plan: USAESIMPlan) => plan.provider.replace(/\s+prepaid$/i, '');

const shown = (value: string) => value !== '' && value !== '0';

export type Pill = { kind: 'number' | 'data' | 'days' | 'calls' | 'texts' | 'intl'; label: string };

// MeiSIM's card pills: number, data, days (US only), calls and texts unless 0 — or
// "Data only" when both are — and international minutes.
export const planPills = (plan: USAESIMPlan): Pill[] => {
  const pills: Pill[] = [{ kind: 'number', label: `${plan.country === 'GB' ? 'UK' : 'US'} Number` }];
  if (plan.data_amount) pills.push({ kind: 'data', label: plan.data_amount });
  if (plan.country === 'US') pills.push({ kind: 'days', label: `${plan.duration} days` });
  if (shown(plan.voice)) pills.push({ kind: 'calls', label: plan.voice });
  if (shown(plan.sms)) pills.push({ kind: 'texts', label: plan.sms });
  if (!shown(plan.voice) && !shown(plan.sms) && plan.data_amount) pills.push({ kind: 'data', label: 'Data only' });
  if (plan.intl_minutes) pills.push({ kind: 'intl', label: `${plan.intl_minutes} intl mins` });
  return pills;
};

// "USD / mo", or "USD for 3 months" on plans paid for several months at once.
export const priceSuffix = (plan: USAESIMPlan) => {
  const months = plan.term_months || Math.round(plan.duration / 30);
  return months > 1 ? `USD for ${months} months` : 'USD / mo';
};

export const summaryLine = (plan: USAESIMPlan) =>
  [plan.data_amount, `${plan.duration} days`, plan.country === 'GB' ? 'UK + Europe Roaming' : 'United States']
    .filter(Boolean)
    .join(' · ');

// MeiSIM lists the description one sentence per line in its plan window.
export const descriptionLines = (plan: USAESIMPlan) =>
  plan.description
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=\.)\s+(?=[A-Z0-9$])/))
    .map((line) => line.trim().replace(/\.$/, ''))
    .filter(Boolean);

// Carrier logos served from /public/carriers (official files from Wikimedia Commons or
// the carrier's own site). MeiSIM sends none for phone-number lines, so a carrier
// without an entry here shows its name only. `dark` logos have white lettering.
export const CARRIER_LOGOS: Record<string, { src: string; dark?: boolean }> = {
  'AT&T': { src: '/carriers/att.svg' },
  'T-Mobile': { src: '/carriers/t-mobile.svg' },
  Lycamobile: { src: '/carriers/lycamobile.svg' },
  'Moxee 2': { src: '/carriers/moxee.svg' },
  Moxee: { src: '/carriers/moxee.svg' },
  'LinkUp Mobile': { src: '/carriers/linkup.png', dark: true },
  MobileX: { src: '/carriers/mobilex.svg', dark: true },
  'O2 UK': { src: '/carriers/o2.svg' },
  'Three UK': { src: '/carriers/three.svg' },
};

// Every logo sits in the same-sized tile so a row of logos lines up, whatever their shape.
export function CarrierLogo({ carrier, className = 'h-10 w-24' }: { carrier: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const logo = CARRIER_LOGOS[carrier];
  if (!logo || failed) return null;
  return (
    <span
      aria-hidden="true"
      className={`${className} inline-flex shrink-0 items-center justify-center rounded-md border p-1.5 ${logo.dark ? 'border-white/25 bg-neutral-900' : 'border-black/10 bg-white'}`}
    >
      <img src={logo.src} alt="" onError={() => setFailed(true)} className="max-h-full max-w-full object-contain" />
    </span>
  );
}

const flagUrl = (country: LineCountry, width: number) => `https://flagcdn.com/w${width}/${country.toLowerCase()}.png`;

export function CountryFlag({ country, className = 'h-[30px] w-10' }: { country: LineCountry; className?: string }) {
  return (
    <img
      src={flagUrl(country, 80)}
      srcSet={`${flagUrl(country, 160)} 2x`}
      alt=""
      aria-hidden="true"
      className={`${className} shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-border`}
    />
  );
}

type Option = { value: string; label: string; test: (plan: USAESIMPlan) => boolean };

const isSmsOnly = (plan: USAESIMPlan) => /sms only|sms verification|incoming sms/i.test(plan.name);
// Talk-and-text plans name no data allowance ("Unlimited Talk & Text Only").
const isTalkAndText = (plan: USAESIMPlan) =>
  !isSmsOnly(plan) && /talk\s*(&|and)\s*text/i.test(plan.name) && !/\d+\s*(gb|mb)|data/i.test(plan.name);
const hasIntlCalling = (plan: USAESIMPlan) => /international|intl/i.test(`${plan.name} ${plan.voice}`);
const months = (plan: USAESIMPlan) => Math.max(1, Math.round(plan.duration / 30));

// "8GB UK · 8GB roaming" -> 8; "Unlimited UK · 30GB roaming" -> Infinity.
const ukDataGb = (plan: USAESIMPlan) => {
  if (/^unlimited/i.test(plan.data_amount)) return Infinity;
  const match = plan.data_amount.match(/(\d+(?:\.\d+)?)\s*GB/i);
  return match ? Number(match[1]) : NaN;
};

// Each country gets filters that fit its own plans; options no plan matches are hidden.
export const filterGroups = (country: LineCountry, plans: USAESIMPlan[]): { id: string; label: string; options: Option[] }[] => {
  const carriers = Array.from(new Set(plans.map(carrierOf))).sort();
  const carrier = {
    id: 'carrier', label: 'Carrier',
    options: carriers.map((name) => ({ value: name, label: name, test: (plan: USAESIMPlan) => carrierOf(plan) === name })),
  };
  const groups = country === 'US'
    ? [
        carrier,
        {
          id: 'includes', label: "What's included",
          options: [
            { value: 'all', label: 'Calls, texts + data', test: (plan: USAESIMPlan) => !isSmsOnly(plan) && !isTalkAndText(plan) },
            { value: 'talk', label: 'Talk & text only', test: isTalkAndText },
            { value: 'sms', label: 'SMS only', test: isSmsOnly },
            { value: 'intl', label: 'International calling', test: hasIntlCalling },
          ],
        },
        {
          id: 'length', label: 'Length',
          options: Array.from(new Set(plans.map(months))).sort((a, b) => a - b).map((m) => ({
            value: String(m), label: `${m} ${m === 1 ? 'month' : 'months'}`, test: (plan: USAESIMPlan) => months(plan) === m,
          })),
        },
      ]
    : [
        carrier,
        {
          id: 'data', label: 'UK data',
          options: [
            { value: 'upto25', label: 'Up to 25 GB', test: (plan: USAESIMPlan) => ukDataGb(plan) <= 25 },
            { value: 'mid', label: '40–125 GB', test: (plan: USAESIMPlan) => ukDataGb(plan) > 25 && ukDataGb(plan) <= 125 },
            { value: 'big', label: '200 GB+', test: (plan: USAESIMPlan) => ukDataGb(plan) > 125 && Number.isFinite(ukDataGb(plan)) },
            { value: 'unlimited', label: 'Unlimited', test: (plan: USAESIMPlan) => ukDataGb(plan) === Infinity },
          ],
        },
        {
          id: 'intl', label: 'International minutes',
          options: [{ value: 'yes', label: 'Included', test: hasIntlCalling }],
        },
      ];
  return groups
    .map((group) => ({ ...group, options: group.options.filter((option) => plans.some(option.test)) }))
    .filter((group) => group.options.length > 1 || (group.id === 'intl' && group.options.length === 1));
};
