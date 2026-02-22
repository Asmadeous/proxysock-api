import { motion } from "framer-motion";
import { useThemeStore } from "@/store/themeStore";
import {
  DocumentTextIcon,
  ScaleIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import backgroundNode from "@/assets/images/backgroundNode.webp";
import backgroundNodeRed from "@/assets/images/backgroundNodeRed.webp";

export default function Terms() {
  const { dark } = useThemeStore();



  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[70vh] flex items-center justify-center bg-background">
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed
              })`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-8">
              <ScaleIcon className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-tight mb-6">
              Terms of <span className="text-primary">Service</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed mb-8 max-w-3xl mx-auto">
              Legal terms governing your use of ProxySock services. Please read
              carefully before using our platform.
            </p>
            <div className="inline-flex items-center gap-3 bg-card/50 backdrop-blur-sm px-6 py-3 rounded-full border border-border">
              <ClockIcon className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Last Updated: January 29, 2026
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <CheckCircleIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Agreement to Terms
              </h2>
            </div>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using ProxySock's services, you agree to be
                bound by these Terms of Service. If you do not agree to these
                Terms, you may not use our Services.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                These Terms constitute a legally binding agreement between you
                and ProxySock regarding your use of our digital infrastructure
                services.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <DocumentTextIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Services Provided
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl"
              >
                <h4 className="font-semibold text-foreground mb-4 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  Core Services
                </h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Proxy services (datacenter, residential, ISP)
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    USA Residential VPN services
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Windows RDP hosting solutions
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    VPS hosting and cloud servers
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Global eSIM connectivity services
                  </li>
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl"
              >
                <h4 className="font-semibold text-foreground mb-4 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  Support Services
                </h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    24/7 technical support
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Service monitoring and maintenance
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Documentation and tutorials
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Account management tools
                  </li>
                </ul>
              </motion.div>
            </div>
            <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-yellow-700 text-sm font-medium">
                  Services are provided on an "as available" basis. We strive
                  for 99.9% uptime but do not guarantee uninterrupted service
                  availability.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <ShieldCheckIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Account Requirements
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Eligibility
                </h3>
                <p className="text-muted-foreground mb-4">
                  To use our services, you must:
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Be at least 18 years of age
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Have legal capacity to enter contracts
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Provide accurate registration information
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Comply with all applicable laws
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Account Responsibilities
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Maintain confidentiality of account credentials
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Accept responsibility for all account activities
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Report unauthorized access immediately
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Keep billing and contact information current
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <ScaleIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Acceptable Use Policy
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-3" />
                  Permitted Uses
                </h3>
                <p className="text-muted-foreground mb-4">
                  Our services may be used for legitimate purposes including:
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-muted-foreground text-sm">
                      Web development and testing
                    </span>
                  </div>
                  <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-muted-foreground text-sm">
                      Business automation and operations
                    </span>
                  </div>
                  <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-muted-foreground text-sm">
                      Privacy and security enhancement
                    </span>
                  </div>
                  <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-muted-foreground text-sm">
                      Academic and research purposes
                    </span>
                  </div>
                  <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50 md:col-span-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-muted-foreground text-sm">
                      Geographic content access
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-3" />
                  Prohibited Activities
                </h3>
                <p className="text-muted-foreground mb-4">
                  You may NOT use our services for:
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      Legal Violations
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start">
                        <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Any illegal activities
                      </li>
                      <li className="flex items-start">
                        <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Fraud or financial crimes
                      </li>
                      <li className="flex items-start">
                        <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Copyright infringement
                      </li>
                      <li className="flex items-start">
                        <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Unauthorized system access
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      Network Abuse
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start">
                        <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        DDoS attacks
                      </li>
                      <li className="flex items-start">
                        <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Spam or unsolicited emails
                      </li>
                      <li className="flex items-start">
                        <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Malware distribution
                      </li>
                      <li className="flex items-start">
                        <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Excessive bandwidth abuse
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Payment Terms
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Pricing & Billing
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    All prices listed in USD
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Prices subject to change with notice
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Various billing cycles available
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Taxes may apply by location
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Payment Methods
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Credit/debit cards accepted
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Cryptocurrency payments
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Other methods as available
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Automatic renewals available
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-3" />
                Refund Policy
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-muted-foreground text-sm">
                    30-day money-back guarantee for new customers
                  </span>
                </div>
                <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-muted-foreground text-sm">
                    Service credits for verified outages
                  </span>
                </div>
                <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-muted-foreground text-sm">
                    No refunds after 30 days or for consumed services
                  </span>
                </div>
                <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-muted-foreground text-sm">
                    Cancellation available anytime via dashboard
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Service Level Agreement
              </h2>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border mb-6">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-foreground p-4 font-semibold border-b border-border">
                      Uptime Level
                    </th>
                    <th className="text-left text-foreground p-4 font-semibold border-b border-border">
                      Service Credit
                    </th>
                    <th className="text-left text-foreground p-4 font-semibold border-b border-border">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="hover:bg-muted/20">
                    <td className="p-4 border-b border-border/50">99.9%+</td>
                    <td className="p-4 border-b border-border/50">None</td>
                    <td className="p-4 border-b border-border/50">
                      Target performance level
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="p-4 border-b border-border/50">
                      99.0% - 99.8%
                    </td>
                    <td className="p-4 border-b border-border/50">5%</td>
                    <td className="p-4 border-b border-border/50">
                      Minor service disruption
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="p-4 border-b border-border/50">
                      95.0% - 98.9%
                    </td>
                    <td className="p-4 border-b border-border/50">10%</td>
                    <td className="p-4 border-b border-border/50">
                      Significant service issues
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="p-4">Below 95.0%</td>
                    <td className="p-4">25%</td>
                    <td className="p-4">Major service outage</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl">
              <p className="text-yellow-700 text-sm font-medium">
                Service credits must be claimed within 30 days of incident.
                Excludes scheduled maintenance and force majeure events.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <LockClosedIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Data and Privacy
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-purple-500/5 border border-purple-500/20 p-6 rounded-2xl">
                <h3 className="text-purple-400 font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  Data Collection
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Account and billing information
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Service usage logs and statistics
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Technical and diagnostic data
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Communications and support records
                  </li>
                </ul>
              </div>
              <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-2xl">
                <h3 className="text-green-400 font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  Data Protection
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Industry-standard security measures
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Limited data retention periods
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Customer data ownership respected
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Privacy policy compliance
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Cookies & Third-Party Services
              </h2>
            </div>

            <div className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                By using ProxySock, you consent to our use of cookies and third-party
                services as described in our <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a>.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl">
                  <h3 className="text-blue-400 font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    Analytics Services
                  </h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Datadog - Performance monitoring and error tracking
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Usage analytics to improve our services
                    </li>
                  </ul>
                </div>
                <div className="bg-purple-500/5 border border-purple-500/20 p-6 rounded-2xl">
                  <h3 className="text-purple-400 font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                    Marketing Services
                  </h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Reddit Pixel - Advertising measurement
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Conversion tracking for marketing optimization
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl">
                <p className="text-yellow-700 text-sm font-medium">
                  You must accept our cookie policy to access ProxySock. If you do not
                  consent to cookies and tracking, you cannot use our services.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Service Modifications and Termination
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-orange-500/5 border border-orange-500/20 p-6 rounded-2xl"
              >
                <h3 className="text-orange-400 font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  Service Changes
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Features may be modified with notice
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Services may be discontinued (90 days notice)
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Pricing changes (30 days notice)
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Terms updates (30 days notice)
                  </li>
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl"
              >
                <h3 className="text-red-400 font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  Account Termination
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Terms violations
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Non-payment of fees
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Legal requirements
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Business reasons (with refund)
                  </li>
                </ul>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <ScaleIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Limitation of Liability
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-yellow-500/5 border border-yellow-500/20 p-6 rounded-2xl">
                <h3 className="text-yellow-400 font-semibold mb-4 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-3" />
                  Service Disclaimers
                </h3>
                <p className="text-muted-foreground">
                  Services are provided "AS IS" and "AS AVAILABLE" without
                  warranties. We do not guarantee uninterrupted operation,
                  complete security, or fitness for any particular purpose.
                </p>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl">
                <h3 className="text-red-400 font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  Liability Limits
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Total liability limited to amounts paid in previous 12
                    months
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    No liability for indirect or consequential damages
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    No liability for data loss or business interruption
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Customer indemnifies ProxySock for misuse of services
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Dispute Resolution
              </h2>
            </div>
            <div className="space-y-6">
              <div className="flex items-start space-x-6">
                <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-foreground font-semibold mb-2">
                    Good Faith Negotiation
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    30-day period for direct resolution
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-6">
                <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-foreground font-semibold mb-2">
                    Binding Arbitration
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    If negotiation fails, binding arbitration applies
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-6">
                <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-foreground font-semibold mb-2">
                    Court Jurisdiction
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    For injunctive relief only
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="bg-gradient-to-r from-primary/5 to-primary/10 p-8 rounded-3xl border border-primary/20"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Contact Information
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              For questions about these Terms:
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center p-4 bg-card/30 rounded-xl border border-border/50">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-red-500 text-lg">@</span>
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">
                    Legal Department
                  </p>
                  <p className="text-primary hover:text-primary/80 text-sm">
                    legal@proxysock.com
                  </p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-card/30 rounded-xl border border-border/50">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mr-3">
                  <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">
                    General Support
                  </p>
                  <p className="text-primary hover:text-primary/80 text-sm">
                    support@proxysock.com
                  </p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-card/30 rounded-xl border border-border/50">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="h-5 w-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">
                    Business Inquiries
                  </p>
                  <p className="text-primary hover:text-primary/80 text-sm">
                    business@proxysock.com
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl">
              <p className="text-blue-700 text-sm font-medium">
                By using ProxySock's services, you acknowledge that you have
                read, understood, and agree to be bound by these Terms of
                Service.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
