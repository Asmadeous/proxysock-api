import { motion } from "framer-motion";

export const RDPContent = ({ filteredInfrastructure, handleCityClick }: { filteredInfrastructure: any[], handleCityClick: (city: string, country: string) => void }) => {
  return (
    <div className="space-y-12">
      <div className="text-start mb-8">
        <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-4">
          RDP Locations
        </h2>
        <p className="font-inter-regular text-muted-foreground">
          Windows Remote Desktop servers in premium data centers
        </p>
        <div className="flex flex-wrap justify-start py-4 gap-4 mb-8">
          <span className="bg-card border border-border text-muted-foreground px-4 py-2 rounded-full text-sm">
            Windows Server 2019
          </span>
          <span className="bg-card border border-border text-muted-foreground px-4 py-2 rounded-full text-sm">
            Windows Server 2022
          </span>
          <span className="bg-card border border-border text-muted-foreground px-4 py-2 rounded-full text-sm">
            Windows 10/11
          </span>
        </div>
      </div>
      {filteredInfrastructure.map((region: any, regionIndex: number) => (
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
            {region.countries
              .filter((country: any) => ["United States", "United Kingdom", "Canada"].includes(country.country))
              .map((country: any) => (
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
                  {country.cities.map((city: any, cityIndex: number) => (
                    <div
                      key={cityIndex}
                      onClick={() =>
                        handleCityClick(city.name, country.country)
                      }
                      className="bg-muted p-4 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
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

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Latency:
                          </span>
                          <span className="text-foreground ml-2">
                            {city.latency}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Uptime:</span>
                          <span className="text-foreground ml-2">
                            {city.uptime}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
