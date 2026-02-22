import backgroundNode from "@/assets/images/backgroundNode.webp";
import backgroundNodeRed from "@/assets/images/backgroundNodeRed.webp";
import { motion } from "framer-motion";
import { RocketLaunchIcon, HeartIcon } from "@heroicons/react/24/outline";
import { useThemeStore } from "../../../store/themeStore";

export const MissionVision = () => {
  const { dark } = useThemeStore();

  return (
    <div className="relative bg-background py-20 px-4 sm:px-6 lg:px-8">
      <div
        className="absolute inset-0 z-0 opacity-20 rotate-180"
        style={{
          backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
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
              high-performance digital infrastructure solutions. We believe that
              every organization, regardless of size, deserves access to
              enterprise-grade proxy services that enable them to operate
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
              To become the global leader in digital infrastructure services,
              setting new standards for security, performance, and customer
              satisfaction. We envision a future where businesses can focus on
              growth while we handle their infrastructure needs with unmatched
              reliability.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
