import { motion } from "framer-motion";
import { SignalIcon } from "@heroicons/react/24/outline";
import { ReactNode } from "react";

interface Plan {
  name: string;
  data: string;
  period: string;
  price: string;
}

interface Region {
  name: string;
  icon: ReactNode;
  countries: number;
  totalPlans: number;
  highlights: string[];
  networks: string[];
  popularPlans: Plan[];
}

interface EsimContentProps {
  filteredESIM: Region[];
}

export const EsimContent = ({ filteredESIM }: EsimContentProps) => {
  return (
    <div className="space-y-12">
      <div className="text-start mb-8">
        <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-4">
          eSIM
        </h2>
        <p className="font-inter-regular text-muted-foreground">
          Global eSIM data plans covering 150+ countries worldwide
        </p>
        <div className="flex flex-wrap justify-start py-4 gap-4 mb-8">
          <span className="bg-card border border-border text-muted-foreground px-4 py-2 rounded-full text-sm">
            Data Plans
          </span>
          <span className="bg-card border border-border text-muted-foreground px-4 py-2 rounded-full text-sm">
            Regional
          </span>
          <span className="bg-card border border-border text-muted-foreground px-4 py-2 rounded-full text-sm">
            Global
          </span>
          <span className="bg-card border border-border text-muted-foreground px-4 py-2 rounded-full text-sm">
            Daily/Weekly/Monthly
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredESIM.map((region: Region, index: number) => (
          <motion.div
            key={region.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center mb-6">
              <div className="text-foreground mr-4">{region.icon}</div>
              <div>
                <h3 className="text-xl font-manrope-bold font-bold text-foreground">
                  {region.name}
                </h3>
                <p className="font-inter-regular text-muted-foreground text-sm">
                  {region.countries} countries • {region.totalPlans} plans
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-foreground font-manrope-semibold font-semibold mb-3">
                Key Countries
              </h4>
              <div className="flex flex-wrap gap-2">
                {region.highlights.map((country: string, i: number) => (
                  <span
                    key={i}
                    className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs"
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-foreground font-manrope-semibold font-semibold mb-3">
                Partner Networks
              </h4>
              <div className="space-y-1">
                {region.networks.slice(0, 4).map((network: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center text-sm text-muted-foreground"
                  >
                    <SignalIcon className="h-4 w-4 text-green-500 mr-2" />
                    {network}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-foreground font-manrope-semibold font-semibold mb-3">
                Popular Plans
              </h4>
              <div className="space-y-2">
                {region.popularPlans.map((plan: Plan, i: number) => (
                  <div key={i} className="bg-muted p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-foreground font-medium text-sm">
                          {plan.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {plan.data} • {plan.period}
                        </p>
                      </div>
                      <span className="text-red-400 font-bold">
                        {plan.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
