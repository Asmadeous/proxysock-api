import { getCategoryIcon } from "@/components/dashboard/Purchase-Products/buy-proxies/getCategoryIcon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Check,
  Globe,
  Info,
  Package,
  Server,
  Sparkles,
  Star,
} from "lucide-react";
import { getCategoryColor } from "@/components/dashboard/Purchase-Products/buy-proxies/getCategoryColor";
import { Badge } from "@/components/ui/badge";
import { renderMobileLocationCards } from "@/components/dashboard/Purchase-Products/buy-proxies/MobileLoctionCards";
import { renderMobileProxyPlans } from "@/components/dashboard/Purchase-Products/buy-proxies/MobileProxyPlans";
import { Skeleton } from "@/components/ui/skeleton";

const ProxyPlanCardSkeleton = () => (
  <Card className="cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="w-10 h-10 rounded-lg" />
          </div>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-2 mb-3">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 border">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="w-4 h-3 rounded-sm" />
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 border">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="w-4 h-3 rounded-sm" />
        </div>
      </div>
    </CardContent>
  </Card>
);

import { Category, ProxyPlan } from "@/types";

interface RenderProxyPlansProps {
  loading: boolean;
  error: string | null;
  selectedCategory: string;
  showMobileLocationCards: boolean;
  selectedCategoryData: Category | null;
  handleLocationCategorySelection: (slug: string) => void;
  showMobilePlans: boolean;
  mobileProxyPlans: ProxyPlan[];
  handleBackToLocationCards: () => void;
  selectedLocationCategory: string;
  selectedPlan: string | number | null;
  togglePlanSelection: (planId: string | number) => void;
}

export const renderProxyPlans = ({
  loading,
  error,
  selectedCategory,
  showMobileLocationCards,
  selectedCategoryData,
  handleLocationCategorySelection,
  showMobilePlans,
  mobileProxyPlans,
  handleBackToLocationCards,
  selectedLocationCategory,
  selectedPlan,
  togglePlanSelection,
}: RenderProxyPlansProps) => {
  if (error) {
    return (
      <Card className="border-l-4 border-l-destructive bg-destructive/5">
        <CardContent className="py-6 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }
  if (selectedCategory === "mobile") {
    if (showMobileLocationCards) {
      return renderMobileLocationCards({
        selectedCategoryData,
        handleLocationCategorySelection,
      });
    } else if (showMobilePlans) {
      return renderMobileProxyPlans({
        showMobilePlans,
        mobileProxyPlans,
        handleBackToLocationCards,
        selectedLocationCategory,
        selectedPlan,
        togglePlanSelection,
      });
    }
    return null;
  }
  if (!selectedCategoryData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Info className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Select a Category</h3>
          <p className="text-sm text-muted-foreground">
            Please select a category to view plans
          </p>
        </CardContent>
      </Card>
    );
  }
  const allPlans = selectedCategoryData?.proxy_plans || [];
  if (!allPlans.length && !loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">No Plans Available</h3>
          <p className="text-sm text-muted-foreground">
            No proxy plans available for this category
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <ProxyPlanCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {allPlans.map((plan) => (
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
                  {plan.is_owned && (
                    <Badge variant="default" className="gap-1">
                      <Star className="w-3 h-3" />
                      Premium
                    </Badge>
                  )}
                  <div
                    className={`p-2 rounded-lg ${getCategoryColor(selectedCategory)}`}
                  >
                    {getCategoryIcon(selectedCategory)}
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
              {[
                "datacenter",
                "isp",
                "premium-isp",
                "static-residential",
              ].includes(selectedCategory) &&
                plan.ips_included && (
                  <Badge variant="secondary" className="gap-1">
                    <Server className="w-3 h-3" />
                    {Number(plan.ips_included)} IPs
                  </Badge>
                )}
              {selectedCategory === "residential" &&
                plan.billing_type === "usage_gb" && (
                  <Badge variant="success" className="gap-1">
                    <Globe className="w-3 h-3" />
                    Per GB Pricing
                  </Badge>
                )}
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
              {selectedCategory === "residential" &&
                plan.gb_min &&
                plan.gb_max && (
                  <Badge variant="outline">
                    {plan.gb_min}-{plan.gb_max} GB range
                  </Badge>
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
                    <span className="text-sm font-medium">{isp.name}</span>
                    {(selectedCategory !== "mobile" ||
                      selectedLocationCategory === "premium") &&
                      isp.locations &&
                      Object.keys(isp.locations).map((countryCode) => (
                        <img
                          key={countryCode}
                          src={`https://flagcdn.com/16x12/${countryCode.toLowerCase()}.png`}
                          alt="flag"
                          className="w-4 h-3 rounded-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      ))}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
