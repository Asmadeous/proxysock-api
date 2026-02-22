import { motion } from "framer-motion";
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { ArrowRightIcon, CreditCard } from "lucide-react";

interface ContactMethodsSectionProps {
  trackLeadInteraction: (method: string, interest: string) => void;
  handleChatbotClick: () => void;
  handleLiveSupportClick: () => void;
  handleEmailClick: (type: string) => void;
}

export const ContactMethodsSection = ({
  handleChatbotClick,
  handleLiveSupportClick,
  handleEmailClick,
}: ContactMethodsSectionProps) => {
  return (
    <div className="relative bg-background py-16">
      <div className="absolute inset-0 z-0 opacity-20"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-3">
            Contact Methods
          </h2>
          <p className="text-base font-inter-regular text-muted-foreground max-w-2xl mx-auto">
            Choose the best way to reach our support team. We're here to help
            24/7.
          </p>
        </div>

        {/* Contact Methods Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* AI Chatbot - Primary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-card/80 backdrop-blur-xl rounded-lg p-6 border border-primary shadow-lg shadow-primary/20 relative"
          >
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-manrope-bold">
                START HERE
              </span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-manrope-bold font-bold text-foreground">
                AI Chatbot
              </h3>
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground mb-4 text-sm font-inter-regular">
              Get instant answers to common questions with our intelligent
              chatbot. Available 24/7.
            </p>
            <button
              onClick={handleChatbotClick}
              className="w-full block text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-manrope-semibold"
            >
              Start Chat{" "}
              <ArrowRightIcon className="inline-block h-4 w-4 ml-1" />
            </button>
          </motion.div>

          {/* Live Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card/80 backdrop-blur-xl rounded-lg p-6 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-manrope-bold font-bold text-foreground">
                Live Support
              </h3>
              <UserGroupIcon className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground mb-4 text-sm font-inter-regular">
              Chat with our technical experts for complex issues requiring human
              assistance.
            </p>
            <button
              onClick={handleLiveSupportClick}
              className="w-full block text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-manrope-semibold"
            >
              Request Support{" "}
              <ArrowRightIcon className="inline-block h-4 w-4 ml-1" />
            </button>
          </motion.div>

          {/* Email Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card/80 backdrop-blur-xl rounded-lg p-6 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-manrope-bold font-bold text-foreground">
                Email Support
              </h3>
              <EnvelopeIcon className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground mb-4 text-sm font-inter-regular">
              Send detailed inquiries and get comprehensive responses from our
              support team.
            </p>
            <a
              href="mailto:support@proxysock.com"
              onClick={() => handleEmailClick("support")}
              className="w-full block text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-manrope-semibold"
            >
              Send Email{" "}
              <ArrowRightIcon className="inline-block h-4 w-4 ml-1" />
            </a>
          </motion.div>

          {/* Billing & Payments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-card/80 backdrop-blur-xl rounded-lg p-6 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-manrope-bold font-bold text-foreground">
                Billing Support
              </h3>
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground mb-4 text-sm font-inter-regular">
              Payment issues, refunds, billing questions, and account management
              assistance.
            </p>
            <a
              href="mailto:billing@proxysock.com"
              onClick={() => handleEmailClick("billing")}
              className="w-full block text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-manrope-semibold"
            >
              Contact Billing{" "}
              <ArrowRightIcon className="inline-block h-4 w-4 ml-1" />
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
