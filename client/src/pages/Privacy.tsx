import { motion } from "framer-motion";
import { useThemeStore } from "@/store/themeStore";
import {
  ShieldCheckIcon,
  EyeIcon,
  LockClosedIcon,
  UserGroupIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import backgroundNode from "@/assets/images/backgroundNode.webp";
import backgroundNodeRed from "@/assets/images/backgroundNodeRed.webp";
import { ChartBarIcon, CogIcon, CookieIcon } from "lucide-react";

export default function Privacy() {
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
              <ShieldCheckIcon className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-tight mb-6">
              Privacy <span className="text-primary">Policy</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed mb-8 max-w-3xl mx-auto">
              Your privacy and data protection are our top priorities. Learn how
              we collect, use, and protect your personal information.
            </p>
            <div className="inline-flex items-center gap-3 bg-card/50 backdrop-blur-sm px-6 py-3 rounded-full border border-border">
              <ClockIcon className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Last Updated: January 1, 2025
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
                <EyeIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Introduction
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              ProxySock respects your privacy and is committed to protecting
              your personal information. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you
              use our digital infrastructure services.
            </p>
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
                <UserGroupIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Information We Collect
              </h2>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">
                      Account information: name, email address, phone number
                    </span>
                  </div>
                  <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">
                      Billing information: payment details and billing address
                    </span>
                  </div>
                  <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">
                      Communication records: support tickets and correspondence
                    </span>
                  </div>
                  <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">
                      Usage data: service usage patterns and connection logs
                    </span>
                  </div>
                  <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50 md:col-span-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">
                      Technical data: IP addresses, browser type, device
                      information
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Service Usage Data
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl"
                  >
                    <h4 className="font-semibold text-foreground mb-4 flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      Proxy Services
                    </h4>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Connection timestamps
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Data transfer volumes
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Geographic preferences
                      </li>
                    </ul>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-green-500/5 border border-green-500/20 p-6 rounded-2xl"
                  >
                    <h4 className="font-semibold text-foreground mb-4 flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      Hosting Services
                    </h4>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Resource usage statistics
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Server configuration data
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Performance metrics
                      </li>
                    </ul>
                  </motion.div>
                </div>
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
                <LockClosedIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                How We Use Your Information
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl"
              >
                <h4 className="font-semibold text-foreground mb-4 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  Service Delivery
                </h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Account management
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Technical support
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Service optimization
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Security monitoring
                  </li>
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl"
              >
                <h4 className="font-semibold text-foreground mb-4 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  Business Operations
                </h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Payment processing
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Legal compliance
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Service improvement
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Customer communication
                  </li>
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-green-500/5 border border-green-500/20 p-6 rounded-2xl"
              >
                <h4 className="font-semibold text-foreground mb-4 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  Analytics
                </h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Usage analysis
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Performance monitoring
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Product development
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Customer insights
                  </li>
                </ul>
              </motion.div>
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
                <ShieldCheckIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Data Sharing and Protection
              </h2>
            </div>

            <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-2xl mb-8">
              <div className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-2">
                    We Do Not Sell Personal Data
                  </h3>
                  <p className="text-muted-foreground">
                    We never sell, rent, or trade your personal information to
                    third parties for marketing purposes.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                Limited Data Sharing
              </h3>
              <p className="text-muted-foreground mb-6">
                We may share information only in these specific circumstances:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start p-4 bg-card/30 rounded-lg border border-border/50">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <p className="text-foreground font-medium text-sm">
                      Service Providers
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Trusted partners who assist with payments, hosting, and
                      support
                    </p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-card/30 rounded-lg border border-border/50">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <p className="text-foreground font-medium text-sm">
                      Legal Requirements
                    </p>
                    <p className="text-muted-foreground text-xs">
                      When required by law or legal process
                    </p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-card/30 rounded-lg border border-border/50">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <p className="text-foreground font-medium text-sm">
                      Security
                    </p>
                    <p className="text-muted-foreground text-xs">
                      To prevent fraud or protect our services
                    </p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-card/30 rounded-lg border border-border/50">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <p className="text-foreground font-medium text-sm">
                      With Consent
                    </p>
                    <p className="text-muted-foreground text-xs">
                      When you explicitly authorize sharing
                    </p>
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
                <ClockIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Data Retention
              </h2>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-foreground p-4 font-semibold border-b border-border">
                      Data Type
                    </th>
                    <th className="text-left text-foreground p-4 font-semibold border-b border-border">
                      Retention Period
                    </th>
                    <th className="text-left text-foreground p-4 font-semibold border-b border-border">
                      Purpose
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="hover:bg-muted/20">
                    <td className="p-4 border-b border-border/50">
                      Account Information
                    </td>
                    <td className="p-4 border-b border-border/50">
                      While active + 7 years
                    </td>
                    <td className="p-4 border-b border-border/50">
                      Legal compliance
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="p-4 border-b border-border/50">
                      Usage Logs
                    </td>
                    <td className="p-4 border-b border-border/50">30 days</td>
                    <td className="p-4 border-b border-border/50">
                      Security & support
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="p-4 border-b border-border/50">
                      Payment Records
                    </td>
                    <td className="p-4 border-b border-border/50">7 years</td>
                    <td className="p-4 border-b border-border/50">
                      Tax & accounting
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="p-4">Support Communications</td>
                    <td className="p-4">3 years</td>
                    <td className="p-4">Service improvement</td>
                  </tr>
                </tbody>
              </table>
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
                <CheckCircleIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Your Privacy Rights
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl">
                <h3 className="text-blue-400 font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  Data Rights
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-foreground mr-1">Access:</strong>{" "}
                    Request copies of your data
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-foreground mr-1">
                      Correction:
                    </strong>{" "}
                    Update inaccurate information
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-foreground mr-1">Deletion:</strong>{" "}
                    Request data removal
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-foreground mr-1">
                      Portability:
                    </strong>{" "}
                    Receive data in portable format
                  </li>
                </ul>
              </div>
              <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-2xl">
                <h3 className="text-green-400 font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  Communication Control
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-foreground mr-1">Opt-out:</strong>{" "}
                    Unsubscribe from marketing
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-foreground mr-1">
                      Preferences:
                    </strong>{" "}
                    Control communication types
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <strong className="text-foreground mr-1">Frequency:</strong>{" "}
                    Adjust notification settings
                  </li>
                </ul>
              </div>
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
                Security Measures
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-purple-500/5 border border-purple-500/20 p-6 rounded-2xl"
              >
                <h3 className="text-purple-400 font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  Technical Safeguards
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    End-to-end encryption
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Advanced firewalls
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Regular security audits
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Multi-factor authentication
                  </li>
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-orange-500/5 border border-orange-500/20 p-6 rounded-2xl"
              >
                <h3 className="text-orange-400 font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  Organizational Safeguards
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Employee training
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Access controls
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Incident response protocols
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Regular policy reviews
                  </li>
                </ul>
              </motion.div>
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
                <CookieIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Cookies and Tracking
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              We use cookies to enhance your experience:
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl text-center">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-foreground font-medium text-sm mb-1">
                  Essential Cookies
                </p>
                <p className="text-muted-foreground text-xs">
                  Required for basic functionality
                </p>
              </div>
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl text-center">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <ChartBarIcon className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-foreground font-medium text-sm mb-1">
                  Analytics Cookies
                </p>
                <p className="text-muted-foreground text-xs">
                  Help us understand usage patterns
                </p>
              </div>
              <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl text-center">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <CogIcon className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-foreground font-medium text-sm mb-1">
                  Preference Cookies
                </p>
                <p className="text-muted-foreground text-xs">
                  Remember your settings
                </p>
              </div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl">
              <p className="text-blue-700 text-sm font-medium">
                You can control cookies through your browser settings.
              </p>
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
                <ClockIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Updates to This Policy
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              We may update this Privacy Policy periodically. Material changes
              will be communicated through:
            </p>
            <div className="space-y-3">
              <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span className="text-muted-foreground text-sm">
                  Email notifications to registered users
                </span>
              </div>
              <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span className="text-muted-foreground text-sm">
                  Website banner announcements
                </span>
              </div>
              <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span className="text-muted-foreground text-sm">
                  Account dashboard notifications
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.9 }}
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
              <h2 className="text-2xl font-bold text-foreground">Contact Us</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              For privacy-related questions or requests:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center p-4 bg-card/30 rounded-xl border border-border/50">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-red-500 text-lg">@</span>
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">Email</p>
                  <p className="text-primary hover:text-primary/80 text-sm">
                    privacy@proxysock.com
                  </p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-card/30 rounded-xl border border-border/50">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mr-3">
                  <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">Support</p>
                  <p className="text-primary hover:text-primary/80 text-sm">
                    Contact form on our website
                  </p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-card/30 rounded-xl border border-border/50">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3">
                  <UserGroupIcon className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">
                    GDPR Matters
                  </p>
                  <p className="text-primary hover:text-primary/80 text-sm">
                    dpo@proxysock.com
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
              <p className="text-yellow-700 text-sm font-medium">
                For urgent privacy matters, mark your communication as "URGENT -
                PRIVACY MATTER" in the subject line.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
