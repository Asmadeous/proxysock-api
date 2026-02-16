import { GlobeAltIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { ClockIcon, ZapIcon, EyeOffIcon, LockIcon } from "lucide-react";

export const VPNFeatures = () => {
  const features = [
    {
      title: "Military-Grade Encryption",
      icon: ShieldCheckIcon,
      description: "AES-256 encryption protects your data",
    },
    {
      title: "Ultra-Fast Speeds",
      icon: ZapIcon,
      description: "Lightning-fast connections worldwide",
    },
    {
      title: "No-Logs Policy",
      icon: EyeOffIcon,
      description: "Your privacy is our priority",
    },
    {
      title: "Global Server Network",
      icon: GlobeAltIcon,
      description: "50+ locations across the world",
    },
    {
      title: "Kill Switch Protection",
      icon: LockIcon,
      description: "Automatic protection if connection drops",
    },
    {
      title: "24/7 Expert Support",
      icon: ClockIcon,
      description: "Round-the-clock assistance",
    },
  ];

  return (
    <div className="bg-card py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-3">
            Why Choose Our VPN Service
          </h2>
          <p className="text-muted-foreground font-inter-regular max-w-2xl mx-auto">
            Experience the most secure and reliable VPN service with cutting-edge
            technology and unparalleled performance
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
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
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm font-inter-regular">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
