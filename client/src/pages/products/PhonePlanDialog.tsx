import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Cpu, Globe, Loader2, MapPin, Phone, QrCode, Signal, Smartphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeviceAddress, DeviceDetails, DeviceDetailsErrors, validateDeviceDetails } from '@/utils/esim/deviceDetails';

import { CountryFlag, USAESIMPlan, carrierOf, descriptionLines, summaryLine } from './phoneLines';

const EMPTY_ADDRESS: DeviceAddress = { address_line_1: '', city: '', state: '', zip_code: '' };

const formatPrice = (price: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);

// Notices use our brand red: a light tint with a red icon, readable in light and dark mode.
const NOTICE = 'space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3 leading-6';
const ICON = 'h-4 w-4 shrink-0 text-primary';

const sentences = (value: string) => value.split(/(?<=\.)\s+/).map((s) => s.trim().replace(/\.$/, '')).filter(Boolean);

interface PhonePlanDialogProps {
  plan: USAESIMPlan | null;
  submitLabel: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (plan: USAESIMPlan, details?: DeviceDetails) => void;
}

// The plan window, laid out like MeiSIM's "Plan Details & Purchase" window: the plan's
// details, the notices MeiSIM shows for its carrier, and exactly the device details
// MeiSIM asks for. Name, email, gift and payment are left to our cart and checkout.
export default function PhonePlanDialog({ plan, submitLabel, isSubmitting, onClose, onSubmit }: PhonePlanDialogProps) {
  const [imei, setImei] = useState('');
  const [eid, setEid] = useState('');
  const [address, setAddress] = useState<DeviceAddress>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<DeviceDetailsErrors>({});

  useEffect(() => {
    setImei('');
    setEid('');
    setAddress(EMPTY_ADDRESS);
    setErrors({});
  }, [plan?.id]);

  if (!plan) return null;

  const carrier = carrierOf(plan);
  const us = plan.country === 'US';
  const overTheAir = us && (carrier === 'AT&T' || carrier === 'T-Mobile');
  const mobileX = carrier === 'MobileX';
  const moxee = /moxee/i.test(carrier);
  const idPrefix = `plan-${plan.id}`;

  const specs: [string, string][] = ([
    [`${us ? 'US' : 'UK'} phone number`, plan.phone_number || (plan.includes_number ? 'Yes' : '')],
    ['Network', plan.networks || plan.provider],
    ['Hotspot', plan.hotspot],
    ['Top-up', plan.topup],
    ['Activation', plan.activation_note],
    ['Calls', plan.voice],
    ['SMS', plan.sms],
    ['Intl minutes', plan.intl_minutes ? `${plan.intl_minutes} minutes/month` : ''],
  ] as [string, string][]).filter(([, value]) => value !== '');

  const roaming = ([
    [Globe, 'Roaming countries (calls, texts & data free)', plan.roaming_free],
    [Phone, 'Call these countries from the UK (uses international minutes)', plan.intl_minutes ? plan.intl_call_to : ''],
    [Signal, 'Data-only roaming countries (no calls or texts)', plan.roaming_data_only],
  ] as const).filter(([, , value]) => value);

  const paste = async (set: (value: string) => void) => {
    try {
      set((await navigator.clipboard.readText()).trim());
    } catch {
      // Clipboard access denied; the field can still be typed into.
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!plan.requires_imei) {
      onSubmit(plan);
      return;
    }
    const result = validateDeviceDetails(
      { imei, eid, address: plan.accepts_address ? address : EMPTY_ADDRESS },
      plan.requires_eid,
      plan.accepts_address,
    );
    setErrors(result.errors);
    if (result.details) onSubmit(plan, result.details);
  };

  const field = (
    id: string, label: string, value: string, onChange: (value: string) => void,
    error?: string, props: React.ComponentProps<'input'> = {},
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`${idPrefix}-${id}`}>{label}</Label>
      <Input
        id={`${idPrefix}-${id}`} value={value} onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error} aria-describedby={error ? `${idPrefix}-${id}-error` : undefined} {...props}
      />
      {error && <p id={`${idPrefix}-${id}-error`} className="text-sm text-destructive">{error}</p>}
    </div>
  );

  const deviceField = (id: 'imei' | 'eid', label: string, value: string, set: (v: string) => void, placeholder: string, hint: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label htmlFor={`${idPrefix}-${id}`} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
        {id === 'imei' ? <Smartphone aria-hidden="true" className={ICON} /> : <Cpu aria-hidden="true" className={ICON} />}
        {label}
      </Label>
      <div className="flex gap-2">
        <Input
          id={`${idPrefix}-${id}`} value={value} onChange={(e) => set(e.target.value)} inputMode="numeric" autoComplete="off"
          placeholder={placeholder} aria-invalid={!!errors[id]} aria-describedby={`${idPrefix}-${id}-hint`}
        />
        <Button type="button" variant="outline" onClick={() => paste(set)}>Paste</Button>
      </div>
      <div id={`${idPrefix}-${id}-hint`} className="text-xs text-muted-foreground">{hint}</div>
      {errors[id] && <p className="text-sm text-destructive">{errors[id]}</p>}
    </div>
  );

  const setAddressField = (key: keyof DeviceAddress) => (value: string) => setAddress((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Plan details</DialogTitle>
          <DialogDescription className="sr-only">Details and device requirements for {plan.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate aria-label={`Phone details for ${plan.name}`} className="space-y-5 text-sm">
          <div>
            <p className="text-base font-bold leading-6">{plan.name}</p>
            <p className="mt-1 text-muted-foreground">{summaryLine(plan)}</p>
            <p className="mt-2 text-xl font-extrabold">{formatPrice(plan.price, plan.currency_code)} {plan.currency_code}</p>
          </div>

          {plan.warnings && (
            <div className={NOTICE}>
              <p className="flex items-center gap-1.5 font-semibold"><AlertTriangle aria-hidden="true" className={ICON} />Restrictions:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {sentences(plan.warnings).map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
          )}

          <dl className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
            {specs.map(([label, value]) => (
              <div key={label} className={label === 'Activation' ? 'sm:col-span-2' : ''}>
                <dt className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {label.endsWith('phone number') && <Smartphone aria-hidden="true" className="h-3.5 w-3.5 text-primary" />}
                  {label}
                </dt>
                <dd className="mt-0.5 font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          {roaming.map(([Icon, label, countries]) => (
            <details key={label} className="rounded-lg border border-border p-3">
              <summary className="flex cursor-pointer items-center gap-1.5 font-medium"><Icon aria-hidden="true" className={ICON} />{label}</summary>
              <p className="mt-2 leading-6 text-muted-foreground">{countries}</p>
            </details>
          ))}

          {plan.description && (
            <ul className="list-disc space-y-1 pl-5 leading-6">
              {descriptionLines(plan).map((line) => <li key={line}>{line}</li>)}
            </ul>
          )}

          {us && (
            <div className={NOTICE}>
              <p className="flex items-center gap-2 font-semibold"><CountryFlag country="US" className="h-3.5 w-5" />This is a United States plan: mobile data works only inside the US.</p>
              <p>Take this line abroad and its mobile data will not work. There is no international roaming, and a VPN cannot change that, since a VPN needs a working internet connection.</p>
              <p className="flex gap-1.5"><MapPin aria-hidden="true" className={`${ICON} mt-1`} /><span>Abroad you can still call and text on the number over Wi-Fi, with a VPN set to a US location. Turn the VPN on before you activate and whenever you call or text; Wi-Fi calling only connects while it is on.</span></p>
              <p>Any free VPN app from the App Store or Google Play works. If you need data outside the US, buy a travel eSIM for the country you're visiting instead.</p>
            </div>
          )}

          {overTheAir && (
            <div className={NOTICE}>
              <p className="flex items-center gap-1.5 font-semibold"><QrCode aria-hidden="true" className={ICON} />No QR code for this plan, and you don't need one.</p>
              <p>{carrier} activates your US number directly onto the phone whose EID you enter below, over the air. Nothing to scan.</p>
              <p className="flex gap-1.5 font-medium"><AlertTriangle aria-hidden="true" className={`${ICON} mt-1`} /><span>Enter the EID of the phone you'll actually use. The line is tied to that handset and can't be moved to another phone afterwards.</span></p>
            </div>
          )}

          {plan.requires_imei && (
            <p className="font-semibold">
              {plan.requires_eid
                ? 'Both IMEI and EID are required by the carrier. Without them, the activation will fail.'
                : 'Your IMEI is required. This plan needs no EID.'}
            </p>
          )}

          {plan.requires_imei && (mobileX
            ? deviceField('imei', 'Your device IMEI2 * (eSIM IMEI · 15 digits)', imei, setImei, 'e.g. 355438091234567', (
                <>
                  <p className="flex gap-1.5 font-medium text-foreground"><AlertTriangle aria-hidden="true" className={`${ICON} mt-0.5`} /><span>MobileX activates on your second IMEI (IMEI2). Dial *#06#: your phone shows two IMEI numbers. Enter the one labeled IMEI2 (the eSIM one), not the first.</span></p>
                  <p className="mt-1">Dial *#06# and use the IMEI2 value</p>
                </>
              ))
            : deviceField('imei', 'Your device IMEI * (15 digits)', imei, setImei, 'e.g. 355438091234567', 'Dial *#06# on your phone to find it'))}

          {plan.requires_imei && moxee && !plan.requires_eid && (
            <p className={`${NOTICE} flex gap-1.5`}>
              <CheckCircle2 aria-hidden="true" className={`${ICON} mt-1`} />
              <span>No EID needed for this plan. This line activates on an eSIM we provide: your QR code is emailed to you once the order is ready, and you install it like any travel eSIM. We only ask for your phone's IMEI above, for your account record.</span>
            </p>
          )}

          {plan.requires_eid && deviceField('eid', 'Your device EID * (32-digit eSIM identifier)', eid, setEid, '32 digits', (
            <>
              <p className="font-medium text-foreground">Where to find your EID:</p>
              <p>iPhone: Settings → General → About → scroll to "EID"</p>
              <p>Android: Settings → About phone → SIM status → EID</p>
            </>
          ))}

          {plan.accepts_address && (
            <fieldset className="space-y-3 rounded-lg border border-border p-3">
              <legend className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide"><MapPin aria-hidden="true" className={ICON} />Activation address</legend>
              <p className="text-xs leading-5 text-muted-foreground">
                The US address you'll use this line at. It is the address for emergency (911) calls, and the carrier picks your number's area code from its ZIP.
              </p>
              <div className="space-y-3">
                {field('address_line_1', 'Street address', address.address_line_1, setAddressField('address_line_1'), errors.address_line_1, { autoComplete: 'address-line1' })}
                <div className="grid grid-cols-3 gap-3">
                  {field('city', 'City', address.city, setAddressField('city'), errors.city, { autoComplete: 'address-level2' })}
                  {field('state', 'State', address.state, setAddressField('state'), errors.state, { autoComplete: 'address-level1', maxLength: 2 })}
                  {field('zip_code', 'ZIP', address.zip_code, setAddressField('zip_code'), errors.zip_code, { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 10 })}
                </div>
              </div>
            </fieldset>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={isSubmitting} className="min-h-11 flex-1 gap-2 rounded-full">
              {isSubmitting && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Provisioning...' : submitLabel}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="min-h-11 rounded-full">Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
