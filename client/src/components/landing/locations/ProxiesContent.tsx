import { motion } from "framer-motion";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { ReactNode } from "react";

const ispProviders = [
  {
    name: "AT&T",
    locations: ["New York", "Chicago", "Washington DC", "Ashburn"],
    type: "Tier 1",
    coverage: "National",
    specs: ["Premium IPs", "High Trust Score", "Business Grade"],
  },
  {
    name: "Verizon",
    locations: ["New York", "Los Angeles"],
    type: "Tier 1",
    coverage: "National",
    specs: ["Mobile Network", "High Speed", "Low Detection"],
  },
  {
    name: "Comcast",
    locations: ["Edison NJ", "Middlebury VT"],
    type: "Cable ISP",
    coverage: "Regional",
    specs: ["Residential IPs", "Home User Profile", "Authentic Traffic"],
  },
  {
    name: "Spectrum",
    locations: ["Virginia"],
    type: "Cable ISP",
    coverage: "Regional",
    specs: ["Cable Internet", "Residential Profile", "Clean IPs"],
  },
  {
    name: "Frontier",
    locations: ["San Jose", "Dallas", "Denver", "Las Vegas", "Miami"],
    type: "DSL/Fiber",
    coverage: "Multi-State",
    specs: ["Fiber Network", "DSL Backup", "Rural Coverage"],
  },
];

interface Spec {
  name: string;
  code: string;
  status: string;
  latency: string;
  uptime: string;
  specs?: string[];
}

interface Country {
  country: string;
  flag: string;
  cities: Spec[];
}

interface Region {
  name: string;
  icon: ReactNode;
  countries: Country[];
}

interface ProxiesContentProps {
  filteredInfrastructure: Region[];
  handleCityClick: (city: string, country: string) => void;
}

export const ProxiesContent = ({
  filteredInfrastructure,
  handleCityClick,
}: ProxiesContentProps) => {
  return (
    <>
      <div className="mb-16">
        <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-4">
          Premium ISP Providers
        </h2>
        <p className="font-inter-regular text-muted-foreground ">
          Global proxy network with datacenter, ISP, and residential IPs
        </p>
        <div className="flex flex-wrap justify-start gap-4 mt-4 mb-8">
          <span className="bg-card border border-border text-muted-foreground px-4 py-2 rounded-full text-sm">
            Data Center
          </span>
          <span className="bg-card border border-border text-muted-foreground px-4 py-2 rounded-full text-sm">
            Residential
          </span>
          <span className="bg-card border border-border text-muted-foreground px-4 py-2 rounded-full text-sm">
            Mobile
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ispProviders.map((provider, index) => (
            <motion.div
              key={provider.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-primary rounded-3xl p-6 hover:bg-primary/90 transition-colors duration-300 relative overflow-hidden pb-32"
            >
              <h3 className="text-2xl font-manrope-bold font-bold text-primary-foreground mb-2">
                {provider.name}
              </h3>
              <p className="text-primary-foreground/80 text-sm mb-4">
                {provider.type}
              </p>

              <div className="mb-4">
                <h4 className="text-primary-foreground font-manrope-semibold font-semibold mb-2">
                  Locations
                </h4>
                <div className="text-primary-foreground text-sm space-y-1">
                  {provider.locations.map((location, i) => (
                    <div key={i}>{location}</div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-primary-foreground font-manrope-semibold font-semibold mb-2">
                  Specifications
                </h4>
                <div className="space-y-1">
                  {provider.specs.map((spec, i) => (
                    <div
                      key={i}
                      className="flex items-center text-sm text-primary-foreground"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      {spec}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 text-center absolute -bottom-10 ">
                <div className="text-[100px] font-manrope-bold font-bold text-primary-foreground opacity-20">
                  {provider.name}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Infrastructure Locations */}
      <div className="space-y-12">
        <h2 className="text-3xl font-manrope-bold font-bold text-foreground text-center">
          Infrastructure Locations
        </h2>
        {filteredInfrastructure.map((region, regionIndex) => (
          <motion.div
            key={region.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: regionIndex * 0.1 }}
          >
            <div className="flex items-center mb-8">
              <div className="text-foreground mr-4">{region.icon}</div>
              <h3 className="text-2xl font-manrope-bold font-bold text-foreground">
                {region.name}
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {region.countries.map((country) => (
                <div
                  key={country.country}
                  className="bg-card border border-border rounded-2xl p-6"
                >
                  <div className="flex items-center mb-6">
                    <span className="text-2xl mr-3">{country.flag}</span>
                    <h4 className="text-xl font-manrope-bold font-bold text-foreground">
                      {country.country}
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {country.cities.map((city, cityIndex) => (
                      <div
                        key={cityIndex}
                        onClick={() =>
                          handleCityClick(city.name, country.country)
                        }
                        className="bg-muted p-4 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleCityClick(city.name, country.country);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="text-foreground font-medium">
                              {city.name}
                            </h5>
                            <p className="text-muted-foreground text-sm">
                              {city.code}
                            </p>
                          </div>
                          <div
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${city.status === "optimal"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                              }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mr-1 ${city.status === "optimal"
                                ? "bg-green-400"
                                : "bg-yellow-400"
                                }`}
                            ></div>
                            {city.status}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">
                              Latency:
                            </span>
                            <span className="text-foreground ml-2">
                              {city.latency}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Uptime:
                            </span>
                            <span className="text-foreground ml-2">
                              {city.uptime}
                            </span>
                          </div>
                        </div>

                        {city.specs && (
                          <div className="flex flex-wrap gap-1">
                            {city.specs.map((spec, i) => (
                              <span
                                key={i}
                                className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
};
