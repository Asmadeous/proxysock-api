import { motion } from "framer-motion";
import { BookOpenIcon, SparklesIcon, LightBulbIcon, ShieldCheckIcon, PlayCircleIcon } from "@heroicons/react/24/outline";

const quickTips = [
  {
    icon: SparklesIcon,
    title: "Test Your Connection",
    description:
      "Always verify your proxy is working by visiting whatismyipaddress.com",
  },
  {
    icon: LightBulbIcon,
    title: "Backup Configuration",
    description: "Save your proxy settings for quick restoration if needed",
  },
  {
    icon: ShieldCheckIcon,
    title: "Use HTTPS",
    description:
      "Always prefer HTTPS proxies for better security and encryption",
  },
  {
    icon: PlayCircleIcon,
    title: "Restart After Setup",
    description:
      "Restart your browser or application after configuring proxies",
  },
];

export const HowToHeroSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center mb-16"
    >
      <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6">
        <BookOpenIcon className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-4xl sm:text-6xl font-manrope-bold font-bold text-foreground mb-6">
        Setup <span className="text-primary">Guides</span>
      </h1>
      <p className="text-muted-foreground max-w-4xl mx-auto text-lg sm:text-xl leading-relaxed">
        Comprehensive step-by-step guides for all ProxySock services. Get
        connected in minutes with our detailed tutorials.
      </p>

      {/* Quick Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 max-w-6xl mx-auto">
        {quickTips.map((tip, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            className="bg-card border border-border p-4 rounded-xl text-center hover:border-primary/50 transition-colors"
          >
            <tip.icon className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="text-foreground font-manrope-semibold text-sm mb-1">
              {tip.title}
            </h3>
            <p className="text-muted-foreground text-xs">{tip.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
