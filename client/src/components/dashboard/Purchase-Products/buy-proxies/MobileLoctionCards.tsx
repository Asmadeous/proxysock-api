import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Globe, Smartphone, Star } from "lucide-react";

import { Category } from "@/types";

interface MobileLocationCardsProps {
  selectedCategoryData: Category | null;
  handleLocationCategorySelection: (slug: string) => void;
}

export const renderMobileLocationCards = ({
  selectedCategoryData,
  handleLocationCategorySelection,
}: MobileLocationCardsProps) => {
  if (!selectedCategoryData || !("location_categories" in selectedCategoryData))
    return null;

  const locationCategories = (selectedCategoryData as any)
    .location_categories as any[];

  return (
    <div className="grid gap-4">
      {locationCategories.map((locationCategory: any) => (
        <Card
          key={locationCategory.id}
          className="cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-200"
          onClick={() => handleLocationCategorySelection(locationCategory.slug)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleLocationCategorySelection(locationCategory.slug);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {locationCategory.premium && (
                  <Badge variant="default" className="gap-1">
                    <Star className="w-3 h-3" />
                    Premium
                  </Badge>
                )}
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">{locationCategory.name}</CardTitle>
            <CardDescription>{locationCategory.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {locationCategory.countries.map((country: string) => (
                <div
                  key={country}
                  className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 border"
                >
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{country}</span>
                  <img
                    src={`https://flagcdn.com/16x12/${country.toLowerCase()}.png`}
                    alt={`${country} flag`}
                    className="w-4 h-3 rounded-sm"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
