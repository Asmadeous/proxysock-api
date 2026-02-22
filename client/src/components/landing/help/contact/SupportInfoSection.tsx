import { motion } from "framer-motion";
import { ClockIcon, UserGroupIcon } from "@heroicons/react/24/outline";

export const SupportInfoSection = () => {
  return (
    <div className="bg-background py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Support Hours */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card/80 backdrop-blur-xl rounded-lg p-6 border border-border"
          >
            <div className="flex items-center mb-6">
              <ClockIcon className="h-8 w-8 text-primary mr-4" />
              <h3 className="text-xl font-manrope-bold font-bold text-foreground">
                Support Hours
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-inter-regular">AI Chatbot</span>
                <span className="text-primary font-manrope-semibold">
                  24/7 Instant
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-inter-regular">Live Chat Support</span>
                <span className="text-primary font-manrope-semibold">
                  24/7 Available
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-inter-regular">Email Support</span>
                <span className="text-primary font-manrope-semibold">
                  24/7 Available
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-inter-regular">Billing Support</span>
                <span className="text-yellow-400 font-manrope-semibold">
                  Priority Response
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-inter-regular">Business Inquiries</span>
                <span className="text-blue-400 font-manrope-semibold">
                  Mon-Fri 9AM-6PM UTC
                </span>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-muted-foreground text-sm font-inter-regular">
                  <strong className="text-foreground">Recommended:</strong> Start
                  with our AI chatbot for instant answers, then escalate to
                  human support if needed.
                </p>
              </div>
            </div>
          </motion.div>

          {/* What We Help With */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card/80 backdrop-blur-xl rounded-lg p-6 border border-border"
          >
            <div className="flex items-center mb-6">
              <UserGroupIcon className="h-8 w-8 text-primary mr-4" />
              <h3 className="text-xl font-manrope-bold font-bold text-foreground">
                What We Help With
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></span>
                <span className="text-muted-foreground font-inter-regular">
                  Proxy setup and configuration
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></span>
                <span className="text-muted-foreground font-inter-regular">
                  RDP connection troubleshooting
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></span>
                <span className="text-muted-foreground font-inter-regular">VPS server management</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></span>
                <span className="text-muted-foreground font-inter-regular">
                  eSIM activation and setup
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3 flex-shrink-0"></span>
                <span className="text-muted-foreground font-inter-regular">
                  Billing and payment issues
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3 flex-shrink-0"></span>
                <span className="text-muted-foreground font-inter-regular">
                  Refund and cancellation requests
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></span>
                <span className="text-muted-foreground font-inter-regular">
                  Account and subscription management
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></span>
                <span className="text-muted-foreground font-inter-regular">
                  Technical integration support
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></span>
                <span className="text-muted-foreground font-inter-regular">
                  Custom business solutions
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
