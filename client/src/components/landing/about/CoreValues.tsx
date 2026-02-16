import {
  ShieldCheckIcon,
  ChartBarIcon,
  UsersIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";


const coreValues = [
  {
    icon: ShieldCheckIcon,
    title: "Security First",
    description:
      "We prioritize your privacy and data security above all else. Every proxy connection is encrypted and monitored for maximum protection.",
  },
  {
    icon: ChartBarIcon,
    title: "Performance Excellence",
    description:
      "High-speed connections with 99.9% uptime guarantee. Our infrastructure is optimized for maximum throughput and minimal latency.",
  },
  {
    icon: UsersIcon,
    title: "Customer Success",
    description:
      "Your success is our mission. We provide dedicated support and tailored solutions to help you achieve your goals.",
  },
  {
    icon: RocketLaunchIcon,
    title: "Innovation",
    description:
      "Continuously evolving our technology and services to stay ahead of industry trends and customer needs.",
  },
];

export const CoreValues = () => {


  return (
    <div className="relative bg-background py-20">
      <div
        className="absolute inset-0 z-0 opacity-20"
      // style={{
      //   backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
      //   backgroundSize: "cover",
      //   backgroundPosition: "center",
      //   backgroundRepeat: "no-repeat",
      // }}
      ></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-manrope-extrabold  text-foreground mb-4">
            Our Core Values
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreValues.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-primary rounded-3xl p-6 hover:bg-primary/90 transition-colors duration-300"
            >
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-lg flex items-center justify-center mb-4">
                <value.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-manrope-semibold font-semibold text-primary-foreground mb-3">
                {value.title}
              </h3>
              <p className="text-primary-foreground/90 font-inter-regular text-sm leading-relaxed">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
