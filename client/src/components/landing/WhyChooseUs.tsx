import { motion } from "framer-motion";
import {
  BoltIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ClockIcon,
  GlobeAltIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";
import { useThemeStore } from "../../store/themeStore";
import backgroundNode from "../../assets/images/backgroundNode.webp";
import backgroundNodeRed from "../../assets/images/backgroundNodeRed.webp";


export const WhyChooseUs = () => {
  const { dark } = useThemeStore();
  return (
    <section
      className="relative bg-background py-24 overflow-hidden"
      aria-labelledby="features-heading"
    >
      <div
        className="absolute inset-0 z-0 opacity-20 -rotate-[23deg]"
        style={{
          backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            id="features-heading"
            className="text-4xl md:text-5xl font-manrope-bold font-bold text-foreground mb-4"
          >
            Why 15,000+ Businesses Choose ProxySock
          </h2>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
          {[
            {
              icon: BoltIcon,
              title: "Instant Setup",
              description: "Ready in 60 seconds",
            },
            {
              icon: ShieldCheckIcon,
              title: "Enterprise Security",
              description: "Bank-grade encryption",
            },
            {
              icon: ChartBarIcon,
              title: "Lightning Speed",
              description: "1Gbps+ connections",
            },
            {
              icon: ClockIcon,
              title: "24/7 Expert Support",
              description: "Always here to help",
            },
            {
              icon: GlobeAltIcon,
              title: "Global Network",
              description: "120+ countries",
            },
            {
              icon: ServerIcon,
              title: "99.9% Uptime SLA",
              description: "Guaranteed reliability",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center gap-4 group"
            >
              <div className="flex-shrink-0">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-foreground/10 rounded-lg group-hover:bg-primary-foreground/20 transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-foreground" />
                </div>
              </div>
              <div className="text-left">
                <h3 className="text-foreground font-manrope-semibold font-semibold text-base mb-0.5">
                  {feature.title}
                </h3>
                <p className="text-foreground font-inter-regular text-sm">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
