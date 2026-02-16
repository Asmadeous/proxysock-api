import { motion } from "framer-motion";

export const RDPUseCases = () => {
  const useCases = [
    {
      title: "Forex & Crypto Trading",
      description:
        "Run MetaTrader, trading bots, and automated strategies 24/7 with ultra-low latency and residential IPs.",
    },
    {
      title: "SEO & Marketing Tools",
      description:
        "Host GSA, Scrapebox, and other SEO tools with residential IPs for better success rates.",
    },
    {
      title: "Bot Development & Automation",
      description:
        "Perfect environment for Discord bots, game bots, and automation scripts with trusted IPs.",
    },
  ];

  return (
    <div className="bg-background py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-3">
            Perfect For
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card/80 backdrop-blur-xl rounded-lg p-6 border border-border"
            >
              <h3 className="text-xl font-manrope-bold font-bold text-foreground mb-3">
                {useCase.title}
              </h3>
              <p className="text-muted-foreground font-inter-regular">
                {useCase.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
