import { motion } from "framer-motion";
import { useThemeStore } from "../../../../store/themeStore";
import backgroundNode from "../../../../assets/images/backgroundNode.webp";
import backgroundNodeRed from "../../../../assets/images/backgroundNodeRed.webp";
import { Bot, Clock, CreditCard, Zap } from "lucide-react";

export const ContactHeroSection = () => {
  const { dark } = useThemeStore();

  return (
    <div className="relative h-[90vh] mx-auto flex items-center justify-center bg-background">
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-32">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-tight font-manrope-bold"
        >
          Contact <span className="text-primary">ProxySock</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl mx-auto text-base sm:text-lg font-inter-regular text-muted-foreground"
        >
          Get expert support for all your digital infrastructure needs. Our team
          is here to help with proxies, RDP hosting, VPS servers, and eSIM
          services.
        </motion.p>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 flex justify-center"
        >
          <div className="bg-card border border-border rounded-full px-6 py-3 inline-flex items-center justify-center gap-8 text-sm flex-wrap">
            <span className="flex items-center gap-1 text-foreground">
              <Bot className="w-4 h-4 mr-1" />
              AI Chatbot Available
            </span>
            <span className="flex items-center gap-1 text-foreground">
              <Zap className="w-4 h-4 mr-1" />
              Response Time: &lt; 30 minutes
            </span>
            <span className="flex items-center gap-1 text-foreground">
              <Clock className="w-4 h-4 mr-1" />
              24/7 Support Available
            </span>
            <span className="flex items-center gap-1 text-foreground">
              <CreditCard className="w-4 h-4 mr-1" />
              Dedicated Billing Support
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
