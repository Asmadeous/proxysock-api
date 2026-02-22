import { motion } from "framer-motion";
import {
  CodeBracketIcon,
  GlobeAltIcon,
  ChartBarIcon,
  FilmIcon,
  UserGroupIcon,
  PlayIcon,
  ShoppingCartIcon,
  TicketIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import Navbar from "../components/landing/layout/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faTelegram } from "@fortawesome/free-brands-svg-icons";
import { Link } from "react-router-dom";
import logo from "../assets/images/favicon.svg";

export default function ProxyPurpose() {
  const purposes = [
    {
      title: "Proxy for Streaming",
      icon: FilmIcon,
      description:
        "Access geo-restricted streaming content with high-speed proxies.",
    },
    {
      title: "Proxy for Social Media",
      icon: UserGroupIcon,
      description: "Manage multiple accounts securely and avoid bans.",
    },
    {
      title: "Proxy for Web Scraping",
      icon: CodeBracketIcon,
      description:
        "Collect data from websites without getting blocked or detected.",
    },
    {
      title: "Proxy for Gaming",
      icon: PlayIcon,
      description: "Reduce latency and access region-locked games.",
    },
    {
      title: "Proxy for Sneakers",
      icon: ShoppingCartIcon,
      description:
        "Secure limited-edition sneakers with fast and reliable proxies.",
    },
    {
      title: "Proxy for Ecommerce",
      icon: ChartBarIcon,
      description:
        "Monitor competitors and automate tasks in e-commerce platforms.",
    },
    {
      title: "Proxy for Traffic Arbitrage",
      icon: ArrowTrendingUpIcon,
      description:
        "Optimize ad campaigns and maximize ROI with targeted traffic.",
    },
    {
      title: "Proxy for Ticketing",
      icon: TicketIcon,
      description:
        "Secure tickets for events and concerts with high-speed proxies.",
    },
    {
      title: "Proxy for Other Purposes",
      icon: GlobeAltIcon,
      description: "Custom solutions for unique online tasks and applications.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <Navbar />

      {/* Hero Section */}
      <div className="relative min-h-[300px] sm:min-h-[400px] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-md">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4 sm:mb-6 tracking-tight">
            Proxy Purposes
          </h1>
          <p className="text-sm sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed sm:leading-loose">
            ProxySock provides high-quality, dedicated proxies for various
            applications. Our proxies offer the perfect mix of performance,
            security, and privacy, helping you achieve your online goals
            efficiently.
          </p>
        </div>
      </div>

      {/* Purposes Section */}
      <div className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-lg sm:text-2xl font-extrabold text-white mb-3">
              Explore Proxy Use Cases
            </h2>
            <p className="text-gray-300 text-xs sm:text-base max-w-2xl mx-auto">
              Discover how our proxies can be used for various online tasks and
              applications.
            </p>
          </div>

          {/* Grid layout stays even on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {purposes.map((purpose, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 sm:p-6 border border-gray-700 hover:border-gray-500 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <div className="flex items-center justify-center mb-2 sm:mb-4">
                  <purpose.icon className="h-5 sm:h-6 w-5 sm:w-6 text-red-500" />
                </div>
                <h3 className="text-xs sm:text-lg font-semibold text-white mb-2 sm:mb-3">
                  {purpose.title}
                </h3>
                <p className="text-gray-300 text-[10px] sm:text-sm">
                  {purpose.description}
                </p>
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
