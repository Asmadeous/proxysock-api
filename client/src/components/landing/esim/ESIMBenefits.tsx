import { motion } from "framer-motion";
import {
  Smartphone,
  Zap,
  Wifi,
  Globe,
} from "lucide-react";

export const ESIMBenefits = () => {
  const benefits = [
    {
      title: "No Physical SIM",
      icon: Smartphone,
      description: "100% digital activation",
    },
    {
      title: "Instant Delivery",
      icon: Zap,
      description: "Get QR code in seconds",
    },
    {
      title: "Keep Your Number",
      icon: Wifi,
      description: "Use both SIMs simultaneously",
    },
    {
      title: "Global Coverage",
      icon: Globe,
      description: "200+ countries supported",
    },
  ];

  return (
    <div className="bg-card py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-3">
            Why Choose Our eSIM
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-lg mb-3">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-foreground font-manrope-semibold font-semibold mb-1">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground text-sm font-inter-regular">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
