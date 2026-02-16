import { MapPin } from "lucide-react";

interface GeolocationData {
  country_name?: string;
  country_code?: string;
  region?: string;
  region_code?: string;
  city?: string;
  postal?: string;
  latitude?: number;
  longitude?: number;
}

interface IPCheckerGeolocationCardProps {
  data: GeolocationData;
}

export const IPCheckerGeolocationCard = ({ data }: IPCheckerGeolocationCardProps) => {
  return (
    <div className="group bg-card/60 backdrop-blur-md rounded-2xl p-6 transition-all duration-300 hover:bg-card/80 hover:scale-[1.02] hover:shadow-2xl border border-border/50 hover:border-primary/30">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center">
          <div className="p-2 bg-primary/10 rounded-xl mr-3 group-hover:bg-primary/20 transition-colors duration-300">
            <MapPin className="w-5 h-5 text-primary group-hover:text-primary/80 transition-colors duration-300" />
          </div>
          <h3 className="text-foreground text-sm font-semibold">Geolocation Data</h3>
        </div>
        <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/20">
          Location Intelligence
        </span>
      </div>
      <div className="space-y-4">
        {data.country_name && (
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
            <span className="text-muted-foreground text-sm">Country</span>
            <span className="text-foreground font-medium">
              {data.country_name}{" "}
              {data.country_code && `(${data.country_code})`}
            </span>
          </div>
        )}
        {data.region && (
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
            <span className="text-muted-foreground text-sm">Region</span>
            <span className="text-foreground font-medium">
              {data.region}{" "}
              {data.region_code && `(${data.region_code})`}
            </span>
          </div>
        )}
        {data.city && (
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
            <span className="text-muted-foreground text-sm">City</span>
            <span className="text-foreground font-medium">
              {data.city}
            </span>
          </div>
        )}
        {data.postal && (
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
            <span className="text-muted-foreground text-sm">
              Postal Code
            </span>
            <span className="text-foreground font-medium">
              {data.postal}
            </span>
          </div>
        )}
        {data.latitude && data.longitude && (
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
            <span className="text-muted-foreground text-sm">
              Coordinates
            </span>
            <span className="text-foreground font-medium font-mono">
              {data.latitude.toFixed(4)},{" "}
              {data.longitude.toFixed(4)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
