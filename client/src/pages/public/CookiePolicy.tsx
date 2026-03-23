// src/pages/CookiePolicy.tsx - Updated with Reddit Ads tracking information

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useThemeStore } from "@/store/themeStore";
import {
  ShieldCheckIcon,
  ChartBarIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { ClockIcon, GlobeAltIcon } from "@heroicons/react/24/solid";
import backgroundNode from "@/assets/images/backgroundNode.webp";
import backgroundNodeRed from "@/assets/images/backgroundNodeRed.webp";
import { CookieIcon } from "lucide-react";

export default function CookiePolicy() {
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
              <CookieIcon className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-tight mb-6">
              Cookie <span className="text-primary">Policy</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed mb-8 max-w-3xl mx-auto">
              Understand how we use cookies and similar technologies to enhance
              your experience, analyze usage, and deliver relevant advertising.
            </p>
            <div className="inline-flex items-center gap-3 bg-card/50 backdrop-blur-sm px-6 py-3 rounded-full border border-border">
              <ClockIcon className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Last Updated: {new Date().toLocaleDateString()}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          <h1 className="text-4xl font-bold text-white mb-8 text-center bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
            Cookie Policy
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <ShieldCheckIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Introduction
              </h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Welcome to ProxySock! This Cookie Policy explains how we use
              cookies and similar technologies to enhance your experience,
              analyze usage, and deliver relevant advertising. By using our
              site, you agree to the use of cookies as described in this policy.
            </p>
            <div className="inline-flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              <GlobeAltIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Effective Date: {new Date().toLocaleDateString()}
              </span>
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
                <CookieIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                What Are Cookies?
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files that are stored on your device
              (computer, tablet, or mobile) when you visit a website. They help
              us remember your preferences, analyze site traffic, improve your
              experience, and measure the effectiveness of our advertising
              campaigns.
            </p>
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
                <CogIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                How We Use Cookies
              </h2>
            </div>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              We use cookies for the following purposes:
            </p>

            <div className="grid gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-green-500/5 border border-green-500/20 p-6 rounded-2xl"
              >
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Essential Cookies
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                      These are necessary for the website to function properly.
                      They enable core features like page navigation, access to
                      secure areas, user authentication, and maintaining your
                      shopping cart.
                    </p>
                    <div className="inline-flex items-center px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                      <span className="text-xs font-medium text-red-400">
                        Cannot be disabled - Required for site functionality
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl"
              >
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Analytics Cookies
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                      We use Google Analytics and our own analytics to
                      understand how visitors interact with our site. This helps
                      us improve the design, functionality, and user experience.
                    </p>
                    <div className="inline-flex items-center px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                      <span className="text-xs font-medium text-blue-400">
                        Services: Google Analytics, Internal Analytics
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-purple-500/5 border border-purple-500/20 p-6 rounded-2xl"
              >
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Preference Cookies
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      These remember your preferences (language, theme, region)
                      and settings to personalize your experience on future
                      visits.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl"
              >
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Advertising & Marketing Cookies
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      These cookies are used to deliver relevant advertisements,
                      measure campaign effectiveness, and track conversions from
                      our advertising partners.
                    </p>
                    <div className="bg-card/30 p-4 rounded-xl border border-border/50">
                      <h4 className="text-foreground font-medium text-sm mb-2">
                        Reddit Ads Pixel
                      </h4>
                      <p className="text-muted-foreground text-xs mb-2">
                        Tracks conversions, measures ad performance, and enables
                        retargeting for users who visited from Reddit ads.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          Page views
                        </span>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          Purchases
                        </span>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          Sign-ups
                        </span>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          Attribution data
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 inline-flex items-center px-3 py-1 bg-orange-500/10 rounded-full border border-orange-500/20">
                      <span className="text-xs font-medium text-orange-400">
                        Can be disabled through browser settings
                      </span>
                    </div>
                  </div>
                </div>
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
                <GlobeAltIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Third-Party Cookies & Services
              </h2>
            </div>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              We work with trusted third-party services that may set their own
              cookies. These services help us provide better functionality and
              measure our marketing effectiveness.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-card/30 p-6 rounded-2xl border border-border/50"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mr-3">
                    <ChartBarIcon className="h-5 w-5 text-orange-500" />
                  </div>
                  <h3 className="text-foreground font-semibold">
                    Google Analytics
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Website analytics and user behavior tracking
                </p>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                >
                  View Privacy Policy →
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card/30 p-6 rounded-2xl border border-border/50"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center mr-3">
                    <GlobeAltIcon className="h-5 w-5 text-red-500" />
                  </div>
                  <h3 className="text-foreground font-semibold">Reddit Ads</h3>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Conversion tracking and advertising measurement
                </p>
                <a
                  href="https://www.reddit.com/policies/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                >
                  View Privacy Policy →
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-card/30 p-6 rounded-2xl border border-border/50"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="h-5 w-5 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <h3 className="text-foreground font-semibold">
                    Live Support Chat
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Customer support chat functionality
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                >
                  Contact Us →
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-card/30 p-6 rounded-2xl border border-border/50"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mr-3">
                    <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="text-foreground font-semibold">
                    Payment Processors
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Secure payment processing and fraud prevention
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  </span>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    PayPal
                  </span>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    Coinbase
                  </span>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8 p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl"
            >
              <div className="flex items-start">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <span className="text-yellow-700 text-xs font-bold">!</span>
                </div>
                <p className="text-yellow-700 text-sm font-medium">
                  <strong>Important:</strong> These third-party cookies are
                  governed by their respective privacy policies. We do not have
                  control over these cookies, but we carefully select partners
                  who meet our privacy standards.
                </p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mr-4">
                <GlobeAltIcon className="h-6 w-6 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Reddit Ads Conversion Tracking
              </h2>
            </div>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              We use Reddit's advertising platform to reach potential customers.
              When you visit our site from a Reddit ad, Reddit's conversion
              pixel helps us understand which ads are most effective.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl"
              >
                <h3 className="text-foreground font-semibold mb-4 flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  What Reddit Tracking Collects:
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Page visits and user navigation patterns
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Purchase completions and transaction details
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Account sign-ups and registration events
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Contact form submissions and support interactions
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Device information (screen size, browser type)
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Attribution data (how you arrived at our site)
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
                <h3 className="text-foreground font-semibold mb-4 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  How This Benefits You:
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    More relevant ads for services you're interested in
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Optimized website for better user experience
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Better pricing through efficient marketing
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    More accurate service recommendations
                  </li>
                </ul>
              </motion.div>
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
                <CogIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Managing Your Cookie Preferences
              </h2>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-foreground font-semibold mb-4 flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Browser Settings
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  You can manage or disable cookies through your browser
                  settings:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-card/30 p-4 rounded-xl border border-border/50"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-blue-500/10 rounded mr-2 flex items-center justify-center">
                        <span className="text-blue-500 text-xs font-bold">
                          C
                        </span>
                      </div>
                      <h4 className="text-foreground font-medium text-sm">
                        Chrome
                      </h4>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Settings → Privacy and Security → Cookies and other site
                      data
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-card/30 p-4 rounded-xl border border-border/50"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-orange-500/10 rounded mr-2 flex items-center justify-center">
                        <span className="text-orange-500 text-xs font-bold">
                          F
                        </span>
                      </div>
                      <h4 className="text-foreground font-medium text-sm">
                        Firefox
                      </h4>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Options → Privacy & Security → Cookies and Site Data
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-card/30 p-4 rounded-xl border border-border/50"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-gray-500/10 rounded mr-2 flex items-center justify-center">
                        <span className="text-gray-500 text-xs font-bold">
                          S
                        </span>
                      </div>
                      <h4 className="text-foreground font-medium text-sm">
                        Safari
                      </h4>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Preferences → Privacy → Manage Website Data
                    </p>
                  </motion.div>
                </div>
              </div>

              <div>
                <h3 className="text-foreground font-semibold mb-4 flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Advertising Opt-Out Options
                </h3>
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl"
                  >
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                        <GlobeAltIcon className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium text-sm mb-1">
                          Reddit Ads
                        </p>
                        <p className="text-muted-foreground text-sm mb-2">
                          Visit Reddit's{" "}
                          <a
                            href="https://www.reddit.com/settings/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 font-medium"
                          >
                            privacy settings
                          </a>{" "}
                          to opt-out of personalized advertising
                        </p>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl"
                  >
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                        <ChartBarIcon className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium text-sm mb-1">
                          Google Analytics
                        </p>
                        <p className="text-muted-foreground text-sm mb-2">
                          Use the{" "}
                          <a
                            href="https://tools.google.com/dlpage/gaoptout"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 font-medium"
                          >
                            Google Analytics Opt-out Browser Add-on
                          </a>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl"
                  >
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                        <ShieldCheckIcon className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium text-sm mb-1">
                          Industry Opt-out
                        </p>
                        <p className="text-muted-foreground text-sm mb-2">
                          Visit{" "}
                          <a
                            href="https://www.aboutads.info/choices/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 font-medium"
                          >
                            AboutAds.info
                          </a>{" "}
                          for comprehensive advertising opt-out options
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="p-6 bg-orange-500/5 border border-orange-500/20 rounded-2xl"
              >
                <div className="flex items-start">
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-orange-700 text-xs font-bold">!</span>
                  </div>
                  <p className="text-orange-700 text-sm font-medium">
                    <strong>Note:</strong> Disabling cookies may affect the
                    functionality of our website. Essential cookies cannot be
                    disabled as they are required for core site features like
                    authentication and security.
                  </p>
                </div>
              </motion.div>
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
                <ClockIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Data Storage and Retention
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-foreground font-semibold mb-4 flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Cookie Retention Periods
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-card/30 rounded-lg border border-border/50">
                    <span className="text-foreground font-medium text-sm">
                      Session Cookies
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Deleted on close
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-card/30 rounded-lg border border-border/50">
                    <span className="text-foreground font-medium text-sm">
                      Preference Cookies
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Up to 1 year
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-card/30 rounded-lg border border-border/50">
                    <span className="text-foreground font-medium text-sm">
                      Analytics Cookies
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Up to 26 months
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-card/30 rounded-lg border border-border/50">
                    <span className="text-foreground font-medium text-sm">
                      Advertising Cookies
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Up to 90 days
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-4 flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Data Processing Location
                </h3>
                <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl">
                  <div className="flex items-start">
                    <GlobeAltIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Cookie data may be processed in the United States and
                      other countries where our service providers operate. We
                      ensure adequate data protection measures are in place.
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
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
                <ShieldCheckIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Your Rights and Choices
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-2xl">
                <h3 className="text-green-400 font-semibold mb-4 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  You Have the Right To:
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Access information about cookies we use
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Opt-out of non-essential cookies
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Request deletion of your data
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Withdraw consent at any time
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    File a complaint with data protection authorities
                  </li>
                </ul>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl">
                <h3 className="text-blue-400 font-semibold mb-4 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Contact Us About Cookies:
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-card/30 rounded-lg border border-border/50">
                    <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-red-500 text-sm font-bold">@</span>
                    </div>
                    <div>
                      <p className="text-foreground font-medium text-sm">
                        Email
                      </p>
                      <a
                        href="mailto:privacy@proxysock.com"
                        className="text-primary hover:text-primary/80 text-sm"
                      >
                        privacy@proxysock.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-card/30 rounded-lg border border-border/50">
                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mr-3">
                      <ShieldCheckIcon className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium text-sm">
                        Support
                      </p>
                      <Link
                        to="/contact"
                        className="text-primary hover:text-primary/80 text-sm"
                      >
                        Contact Form
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-card/30 rounded-lg border border-border/50">
                    <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="h-4 w-4 text-purple-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-foreground font-medium text-sm">
                        Live Chat
                      </p>
                      <span className="text-muted-foreground text-sm">
                        Available 24/7
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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
                Changes to This Policy
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-6">
              We may update this Cookie Policy from time to time to reflect
              changes in our practices, legal requirements, or service
              offerings. When we make significant changes, we will:
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span className="text-muted-foreground text-sm">
                  Update the "Last Updated" date at the top of this policy
                </span>
              </div>
              <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span className="text-muted-foreground text-sm">
                  Notify active users via email for major changes
                </span>
              </div>
              <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span className="text-muted-foreground text-sm">
                  Display a notification banner on our website
                </span>
              </div>
              <div className="flex items-start p-3 bg-card/30 rounded-lg border border-border/50">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span className="text-muted-foreground text-sm">
                  Continue to honor your existing privacy preferences
                </span>
              </div>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl">
              <p className="text-blue-700 text-sm font-medium">
                We encourage you to review this page periodically for the latest
                information.
              </p>
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
            <p className="text-muted-foreground leading-relaxed mb-6">
              If you have any questions about our use of cookies, this policy,
              or your privacy rights, please don't hesitate to reach out:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center p-4 bg-card/30 rounded-xl border border-border/50">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-red-500 text-lg">📧</span>
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">
                    Privacy Team
                  </p>
                  <a
                    href="mailto:privacy@proxysock.com"
                    className="text-primary hover:text-primary/80 text-sm"
                  >
                    privacy@proxysock.com
                  </a>
                </div>
              </div>
              <div className="flex items-center p-4 bg-card/30 rounded-xl border border-border/50">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-500 text-lg">💬</span>
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">
                    General Support
                  </p>
                  <Link
                    to="/contact"
                    className="text-primary hover:text-primary/80 text-sm"
                  >
                    Contact us here
                  </Link>
                </div>
              </div>
              <div className="flex items-center p-4 bg-card/30 rounded-xl border border-border/50">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-purple-500 text-lg">🕒</span>
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">
                    Response Time
                  </p>
                  <span className="text-muted-foreground text-sm">
                    Within 48 hours
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
