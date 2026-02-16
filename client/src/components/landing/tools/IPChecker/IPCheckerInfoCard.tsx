import { Clock, DollarSign, Smartphone } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface IPCheckerInfoCardProps {
  icon: LucideIcon;
  title: string;
  badge: string;
  children: React.ReactNode;
}

export const IPCheckerInfoCard = ({ icon: Icon, title, badge, children }: IPCheckerInfoCardProps) => {
  return (
    <div className="group bg-card/60 backdrop-blur-md rounded-2xl p-6 transition-all duration-300 hover:bg-card/80 hover:scale-[1.02] hover:shadow-2xl border border-border/50 hover:border-primary/30">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center">
          <div className="p-2 bg-primary/10 rounded-xl mr-3 group-hover:bg-primary/20 transition-colors duration-300">
            <Icon className="w-5 h-5 text-primary group-hover:text-primary/80 transition-colors duration-300" />
          </div>
          <h3 className="text-foreground text-sm font-semibold">{title}</h3>
        </div>
        <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/20">
          {badge}
        </span>
      </div>
      {children}
    </div>
  );
};

// Specific card components
export const IPCheckerTimezoneCard = ({ timezone }: { timezone?: any }) => {
  if (!timezone) return null;

  return (
    <IPCheckerInfoCard icon={Clock} title="Timezone Information" badge="Time Data">
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
          <span className="text-muted-foreground text-sm">Timezone</span>
          <span className="text-foreground font-medium">
            {timezone.name}
          </span>
        </div>
        {timezone.current_time && (
          <div className="p-3 bg-secondary/30 rounded-xl">
            <span className="text-muted-foreground text-sm block mb-2">
              Current Time
            </span>
            <span className="text-foreground font-medium">
              {new Date(timezone.current_time).toLocaleString()}
            </span>
          </div>
        )}
        {timezone.offset && (
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
            <span className="text-muted-foreground text-sm">
              UTC Offset
            </span>
            <span className="text-foreground font-medium font-mono">
              {timezone.offset}
            </span>
          </div>
        )}
      </div>
    </IPCheckerInfoCard>
  );
};

export const IPCheckerCurrencyCard = ({ currency }: { currency?: any }) => {
  if (!currency) return null;

  return (
    <IPCheckerInfoCard icon={DollarSign} title="Currency Information" badge="Financial Data">
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
          <span className="text-muted-foreground text-sm">Currency</span>
          <span className="text-foreground font-medium">
            {currency.name}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
          <span className="text-muted-foreground text-sm">Code</span>
          <span className="text-foreground font-medium">
            {currency.code}
          </span>
        </div>
        {currency.symbol && (
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
            <span className="text-muted-foreground text-sm">Symbol</span>
            <span className="text-foreground font-medium text-lg">
              {currency.symbol}
            </span>
          </div>
        )}
      </div>
    </IPCheckerInfoCard>
  );
};

export const IPCheckerCarrierCard = ({ carrier }: { carrier?: any }) => {
  if (!carrier) return null;

  return (
    <IPCheckerInfoCard icon={Smartphone} title="Mobile Carrier" badge="Telecom Data">
      <div className="space-y-4">
        <div className="p-3 bg-secondary/30 rounded-xl">
          <span className="text-muted-foreground text-sm block mb-2">
            Carrier
          </span>
          <span className="text-foreground font-medium">
            {carrier.name}
          </span>
        </div>
        {carrier.mcc && (
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
            <span className="text-muted-foreground text-sm">MCC</span>
            <span className="text-foreground font-medium font-mono">
              {carrier.mcc}
            </span>
          </div>
        )}
        {carrier.mnc && (
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl">
            <span className="text-muted-foreground text-sm">MNC</span>
            <span className="text-foreground font-medium font-mono">
              {carrier.mnc}
            </span>
          </div>
        )}
      </div>
    </IPCheckerInfoCard>
  );
};
