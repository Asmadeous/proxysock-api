import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Check,
  Globe,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { ProxyPlan } from "@/types";

interface MobileProxyPlansProps {
  showMobilePlans: boolean;
  mobileProxyPlans: ProxyPlan[];
  handleBackToLocationCards: () => void;
  selectedLocationCategory: string;
  selectedPlan: string | number | null;
  togglePlanSelection: (planId: string | number) => void;
}

export const renderMobileProxyPlans = ({
  showMobilePlans,
  mobileProxyPlans,
  handleBackToLocationCards,
  selectedLocationCategory,
  selectedPlan,
  togglePlanSelection,
}: MobileProxyPlansProps) => {
  if (!showMobilePlans || !mobileProxyPlans.length) return null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <button
          onClick={handleBackToLocationCards}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to Locations
        </button>
        <div className="h-4 w-px bg-border"></div>
        <h3 className="text-base font-semibold capitalize">
          {selectedLocationCategory} Mobile Proxies
        </h3>
      </div>
      <div className="grid gap-4">
        {mobileProxyPlans.map((plan) => (
          <Card
            key={`${plan.source_table || "unknown"}-${plan.id}`}
            className={`cursor-pointer transition-all duration-200 ${selectedPlan === plan.id
              ? "border-primary shadow-lg bg-primary/5"
              : "hover:border-primary/50 hover:shadow-md"
              }`}
            onClick={() => togglePlanSelection(plan.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                togglePlanSelection(plan.id);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">
                    {plan.display_name || plan.name}
                  </CardTitle>
                  {plan.description && (
                    <CardDescription className="mt-2">
                      {plan.description}
                    </CardDescription>
                  )}
                </div>
                {selectedPlan === plan.id && (
                  <div className="p-2 bg-primary rounded-full ml-4">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {plan.billing_type && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    {plan.billing_type === "usage_gb"
                      ? "Per GB"
                      : plan.billing_type}
                  </Badge>
                )}
                {plan.duration_days && plan.billing_type !== "usage_gb" && (
                  <Badge variant="success">{plan.duration_days} days</Badge>
                )}
                {plan.billing_type === "usage_gb" && plan.gb_limit && (
                  <Badge variant="warning">Up to {plan.gb_limit} GB</Badge>
                )}
              </div>
              {plan.isp && plan.isp.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {plan.isp.map((isp) => (
                    <div
                      key={isp.id}
                      className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 border"
                    >
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium truncate max-w-32">
                        {isp.name}
                      </span>
                      <img
                        src={`https://flagcdn.com/16x12/${selectedLocationCategory === "usa" ? "us" : "ca"}.png`}
                        alt={`${selectedLocationCategory} flag`}
                        className="w-4 h-3 rounded-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              {plan.billing_type === "usage_gb" && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pricing</span>
                  <span className="text-lg font-bold text-primary">
                    ${Number(plan.price_per_gb || 1).toFixed(2)}/GB
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
