import { motion } from "framer-motion";
import {
  SparklesIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";

export const HowToConnectHeroSection = () => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center mb-16"
    >
      <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6">
        <svg
          className="h-10 w-10 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <h1 className="text-4xl sm:text-6xl font-manrope-bold text-foreground mb-6">
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
            className="bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border text-center hover:bg-card/80 transition-colors"
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
