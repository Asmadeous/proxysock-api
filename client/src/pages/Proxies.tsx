import { motion } from "framer-motion";
import {
  ServerIcon,
  GlobeAltIcon,
  HomeIcon,
  BuildingOfficeIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faTelegram } from "@fortawesome/free-brands-svg-icons";
import logo from "../assets/images/logo.png"; // Adjust the path to your logo
import { useEffect } from "react";

export default function Proxies() {
  const proxyTypes = [
    {
      title: "Datacenter Proxies",
      icon: ServerIcon,
      description: "High-performance dedicated IPs with blazing-fast speeds",
      features: [
        "Unlimited bandwidth",
        "99.9% uptime guarantee",
        "Instant activation",
        "Global locations",
      ],
    },
    {
      title: "ISP Proxies",
      icon: BuildingOfficeIcon,
      description: "Enterprise-grade ISP proxies for ultimate reliability",
      features: [
        "Residential IP addresses",
        "High success rates",
        "Geo-targeting options",
        "24/7 support",
      ],
    },
    {
      title: "Static Residential",
      icon: HomeIcon,
      description: "Stable residential IPs with long session durations",
      features: [
        "Sticky sessions",
        "High anonymity",
        "Rotating IP options",
        "Multiple subnets",
      ],
    },
    {
      title: "Residential Proxies",
      icon: GlobeAltIcon,
      description: "Real residential IPs from actual devices",
      features: [
        "Millions of IPs",
        "Worldwide coverage",
        "Automatic rotation",
        "High anonymity",
      ],
    },
  ];

  useEffect(() => {
    // Tawk.to script
    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = "https://embed.tawk.to/67bef4165710c5190bd5e864/1il0uiubo";
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");
    if (s0?.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    }

    // Cleanup function to remove the script on unmount
    return () => {
      s1.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="bg-gray-900 min-h-screen py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Premium Proxy Solutions
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Choose the perfect proxy type for your needs
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {proxyTypes.map((proxy, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-800/80 backdrop-blur-xl rounded-lg p-4 md:p-5 h-full border border-gray-800 hover:border-gray-700 transition-all duration-300 text-xs md:text-sm"
              >
                <div className="flex items-center mb-3">
                  <proxy.icon className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                </div>

                <h3 className="text-sm md:text-base font-bold text-white mb-2">
                  {proxy.title}
                </h3>
                <p className="text-gray-300 text-xs md:text-sm mb-3">
                  {proxy.description}
                </p>

                <ul className="space-y-1 md:space-y-2 text-gray-300 text-xs md:text-sm">
                  {proxy.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <CheckIcon className="h-4 w-4 text-red-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-10 px-6 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Company Info */}
            <div className="space-y-4 text-center sm:text-left">
              <h3 className="text-lg font-bold text-white flex justify-center sm:justify-start items-center">
                <img
                  src={logo}
                  alt="ProxySock Logo"
                  className="h-10 w-10 mr-3"
                />
                ProxySock
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Premium proxy solutions for all your needs. Fast, reliable, and
                secure proxy services worldwide.
              </p>
              <div className="flex justify-center sm:justify-start space-x-4">
                <a
                  href="https://x.com/cybertwts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition duration-200"
                >
                  <FontAwesomeIcon icon={faTwitter} className="h-6 w-6" />
                </a>
                <a
                  href="https://t.me/Proxy_sock5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition duration-200"
                >
                  <FontAwesomeIcon icon={faTelegram} className="h-6 w-6" />
                </a>
              </div>
            </div>

            {/* Resources */}
            <div className="space-y-4 text-center sm:text-left">
              <h3 className="text-lg font-bold text-white">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/HowToConnect"
                    className="text-gray-400 hover:text-white transition duration-200"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="text-gray-400 hover:text-white transition duration-200"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4 text-center sm:text-left">
              <h3 className="text-lg font-bold text-white">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/contact"
                    className="text-gray-400 hover:text-white transition duration-200"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="text-gray-400 hover:text-white transition duration-200"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-gray-400 hover:text-white transition duration-200"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:support@proxysock.com"
                    className="text-gray-400 hover:text-white transition duration-200"
                  >
                    support@proxysock.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-gray-800 mt-8 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} ProxySock. All rights reserved.
            </p>
            <div className="flex justify-center space-x-6 mt-4">
              <Link
                to="/terms"
                className="text-gray-400 hover:text-white text-sm"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="text-gray-400 hover:text-white text-sm"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
