import { useCallback, useEffect, useState } from "react";
import type { AxiosInstance } from "axios";
import { CalendarClock, CheckCircle, Clock, Loader2, Repeat, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";

import api from "../../services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Top-ups on a MeiSIM phone-number line: a one-time top-up or a monthly auto top-up,
// paid from the balance. Our team applies the credit to the line by hand.

interface TopupOption { value: number; price: number }

interface Subscription {
  id: string;
  status: "active" | "past_due" | "cancelled";
  topup_value: number;
  price: number;
  next_charge_at: string;
}

interface Topup {
  id: string;
  reference: string;
  status: "pending" | "completed" | "cancelled";
  topup_value: number;
  price: number;
  auto: boolean;
  created_at: string;
}

interface TopupState {
  eligible: boolean;
  one_time_options: TopupOption[];
  min_subscription_value: number;
  subscription: Subscription | null;
  topups: Topup[];
  available_balance: number;
}

const usd = (amount: number) => `$${amount.toFixed(2)}`;
const date = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const STATUS: Record<Topup["status"], { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "Being applied", icon: Clock, className: "text-amber-600" },
  completed: { label: "Applied", icon: CheckCircle, className: "text-emerald-600" },
  cancelled: { label: "Refunded", icon: XCircle, className: "text-muted-foreground" },
};

export default function EsimTopupDialog({
  orderId,
  lineName,
  open,
  onOpenChange,
  client = api,
  ordersPath = "/web/api/orders",
}: {
  orderId: string;
  lineName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Resellers use their own API client and order routes.
  client?: AxiosInstance;
  ordersPath?: string;
}) {
  const base = `${ordersPath}/${orderId}`;
  const [state, setState] = useState<TopupState | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<"once" | "subscribe" | "cancel" | null>(null);
  const [monthly, setMonthly] = useState("10");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const { data } = await client.get<TopupState>(`${base}/topups`);
      setState(data);
      if (data.subscription) setMonthly(String(data.subscription.topup_value));
    } catch (error: any) {
      setLoadError(error.response?.data?.error || "Couldn't load top-ups. Please try again.");
    }
  }, [client, base]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const run = async (kind: "once" | "subscribe" | "cancel", request: () => Promise<unknown>, success: string) => {
    setBusy(kind);
    try {
      await request();
      toast.success(success);
      await load();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const min = state?.min_subscription_value ?? 10;
  const monthlyValue = Number(monthly);
  const monthlyValid = Number.isInteger(monthlyValue) && monthlyValue >= min;
  // Auto top-ups cost exactly the credit chosen.
  const monthlyPrice = monthlyValid ? monthlyValue : null;
  const subscription = state?.subscription;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Top up your line</DialogTitle>
          <DialogDescription>{lineName}</DialogDescription>
        </DialogHeader>

        {loadError ? (
          <div role="alert" className="space-y-3 rounded-lg border border-destructive/30 p-4 text-sm">
            <p>{loadError}</p>
            <Button variant="outline" size="sm" onClick={load}>Try again</Button>
          </div>
        ) : !state ? (
          <div className="flex justify-center py-10" aria-label="Loading">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !state.eligible ? (
          <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            This line can't be topped up right now. Only active USA and UK phone-number lines can be topped up.
          </p>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Paid from your balance ({usd(state.available_balance)} available). Our team applies the credit to your
              line, usually within a few hours.
            </p>

            {/* One-time */}
            <section className="rounded-xl border border-border p-4">
              <h3 className="flex items-center gap-2 font-semibold">
                <Zap aria-hidden="true" className="h-4 w-4 text-primary" />
                One-time top-up
              </h3>
              <div className="mt-3 space-y-2">
                {state.one_time_options.map((option) => (
                  <div key={option.value} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
                    <div>
                      <p className="font-semibold">{usd(option.value)} credit</p>
                      <p className="text-sm text-muted-foreground">You pay {usd(option.price)}</p>
                    </div>
                    <Button
                      disabled={busy !== null}
                      onClick={() =>
                        run("once", () => client.post(`${base}/topups`, { value: option.value }),
                          `Top-up paid. We'll apply ${usd(option.value)} to your line shortly.`)
                      }
                      className="gap-2 rounded-full"
                    >
                      {busy === "once" && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
                      Pay {usd(option.price)}
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            {/* Monthly */}
            <section className="rounded-xl border border-border p-4">
              <h3 className="flex items-center gap-2 font-semibold">
                <Repeat aria-hidden="true" className="h-4 w-4 text-primary" />
                Monthly auto top-up
              </h3>

              {subscription && (
                <div className={`mt-3 rounded-lg px-3 py-2.5 text-sm ${subscription.status === "past_due" ? "bg-destructive/10" : "bg-primary/5"}`}>
                  <p className="font-semibold">
                    {usd(subscription.price)} every month
                  </p>
                  {subscription.status === "past_due" ? (
                    <p role="alert" className="mt-1 text-destructive">
                      Your balance didn't cover this month's charge. Add funds and we'll retry automatically.
                    </p>
                  ) : (
                    <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                      <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
                      Next charge {date(subscription.next_charge_at)}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() =>
                      run("cancel", () => client.delete(`${base}/topup_subscription`), "Auto top-up cancelled.")
                    }
                    className="mt-3 gap-2 rounded-full"
                  >
                    {busy === "cancel" && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
                    Cancel auto top-up
                  </Button>
                </div>
              )}

              <p className="mt-3 text-sm text-muted-foreground">
                {subscription
                  ? "Changing the amount replaces your auto top-up: the new amount is charged now, then every month from your balance."
                  : `Choose any whole amount from ${usd(min)}. The first month is charged now, then every month from your balance.`}
              </p>
              <form
                className="mt-3 flex flex-wrap items-end gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!monthlyValid) return;
                  run("subscribe", () => client.post(`${base}/topup_subscription`, { value: monthlyValue }),
                    `Auto top-up set: ${usd(monthlyValue)} every month.`);
                }}
              >
                <label className="min-w-0 flex-1 text-sm font-medium">
                  Credit each month (USD)
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={min}
                    step={1}
                    value={monthly}
                    onChange={(event) => setMonthly(event.target.value)}
                    aria-invalid={!monthlyValid}
                    aria-describedby="monthly-price"
                    className="mt-1.5"
                  />
                </label>
                <Button type="submit" disabled={busy !== null || !monthlyValid} className="gap-2 rounded-full">
                  {busy === "subscribe" && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
                  {subscription ? "Update" : "Start"}
                </Button>
              </form>
              <p id="monthly-price" className="mt-2 text-sm" aria-live="polite">
                {monthlyPrice !== null
                  ? <>You pay <span className="font-semibold">{usd(monthlyPrice)}</span> a month</>
                  : <span className="text-destructive">Enter a whole amount of {usd(min)} or more</span>}
              </p>
            </section>

            {/* History */}
            {state.topups.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold">Recent top-ups</h3>
                <ul className="mt-2 divide-y divide-border rounded-xl border border-border text-sm">
                  {state.topups.map((topup) => {
                    const status = STATUS[topup.status];
                    const Icon = status.icon;
                    return (
                      <li key={topup.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {usd(topup.topup_value)} credit{topup.auto && " · monthly"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {date(topup.created_at)} · {topup.reference} · paid {usd(topup.price)}
                          </p>
                        </div>
                        <span className={`flex shrink-0 items-center gap-1 text-xs font-medium ${status.className}`}>
                          <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
