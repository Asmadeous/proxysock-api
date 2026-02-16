import { motion } from "framer-motion";
import backgroundNode from "@/assets/images/backgroundNode.webp";
import backgroundNodeRed from "@/assets/images/backgroundNodeRed.webp";
import {
  GlobeAltIcon,
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  TrophyIcon,
  HeartIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { LifebuoyIcon } from "@heroicons/react/24/solid";
import { useThemeStore } from "../../../store/themeStore";

const stats = [
  { number: "15,000+", label: "Happy Customers", icon: UsersIcon },
  { number: "50,000+", label: "Available IPs", icon: GlobeAltIcon },
  { number: "120+", label: "Countries", icon: BuildingOfficeIcon },
  { number: "99.9%", label: "Uptime SLA", icon: ChartBarIcon },
  { number: "24/7", label: "Support", icon: LifebuoyIcon },
  { number: "5+ Years", label: "Experience", icon: TrophyIcon },
];

export const AboutHeroSection = () => {
  const { dark } = useThemeStore();

  return (
    <div className="relative lg:h-[100vh] flex items-center justify-center bg-background pt-32">
      <div
        className="absolute inset-0 z-0 opacity-20 mt-20"
        style={{
          backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-manrope-bold font-bold text-foreground mb-6 leading-tight">
              About <span className="text-primary">ProxySock</span>
            </h1>
            <p className="text-lg font-inter-regular text-muted-foreground leading-relaxed mb-8">
              We're a leading provider of premium digital infrastructure
              solutions, trusted by over 15,000 businesses worldwide. Our
              mission is to empower organizations with secure, reliable, and
              high-performance proxy services.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-8"
          >
            {stats.slice(0, 4).map((stat, index) => (
              <div key={index} className="text-left">
                <div className="text-4xl md:text-5xl font-manrope-bold font-bold text-foreground mb-2">
                  {stat.number}
                </div>
                <p className="font-inter-regular text-muted-foreground text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
        <div className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-primary rounded-3xl p-8"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary-foreground/20 rounded-lg flex items-center justify-center mr-4">
                    <HeartIcon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-manrope-bold font-bold text-primary-foreground">
                    Our Mission
                  </h2>
                </div>
                <p className="text-primary-foreground font-inter-regular leading-relaxed">
                  To provide businesses with the most reliable, secure, and
                  high-performance digital infrastructure solutions. We believe
                  that every organization, regardless of size, deserves access
                  to enterprise-grade proxy services that enable them to operate
                  securely and efficiently in the digital world.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-primary rounded-3xl p-8"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary-foreground/20 rounded-lg flex items-center justify-center mr-4">
                    <RocketLaunchIcon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-manrope-bold font-bold text-primary-foreground">
                    Our Vision
                  </h2>
                </div>
                <p className="text-primary-foreground font-inter-regular leading-relaxed">
                  To become the global leader in digital infrastructure
                  services, setting new standards for security, performance, and
                  customer satisfaction. We envision a future where businesses
                  can focus on growth while we handle their infrastructure needs
                  with unmatched reliability.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
