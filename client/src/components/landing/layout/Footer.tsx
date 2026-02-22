import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faTelegram } from "@fortawesome/free-brands-svg-icons";
import logoDark from "@/assets/images/PROXY PNG.webp";
import backgroundNode from "@/assets/images/backgroundNode.webp";


export const Footer = () => {
  return (
    <footer className="relative bg-black border-t border-gray-900">
      <div
        className="absolute inset-0 z-0 opacity-15 mt-32"
        style={{
          backgroundImage: `url(${backgroundNode})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <div className="relative z-10 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Company Info */}
          <div className="space-y-6">
            <Link to="/" className="inline-block">
              <img src={logoDark} alt="ProxySock Logo" className="h-10 w-auto" />
            </Link>
            <div className="space-y-4">
              <h3 className="text-xl font-manrope-bold font-bold text-white">
                ProxySock
              </h3>
              <p className="text-gray-400 text-sm font-inter-regular leading-relaxed">
                Global infrastructure provider with premium data centers and
                worldwide coverage. From premium data centers to global eSIM
                connectivity, we've got the infrastructure you need.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://x.com/cybertwts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition duration-200"
                >
                  <FontAwesomeIcon icon={faTwitter} className="h-5 w-5" />
                </a>
                <a
                  href="https://t.me/Proxy_sock5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition duration-200"
                >
                  <FontAwesomeIcon icon={faTelegram} className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-base font-manrope-semibold font-semibold text-white">
              Our Services
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/proxies"
                  className="text-gray-400 hover:text-white transition duration-200 text-sm"
                >
                  Global Network
                </Link>
              </li>
              <li>
                <Link
                  to="/rdp"
                  className="text-gray-400 hover:text-white transition duration-200 text-sm"
                >
                  Windows RDP Hosting
                </Link>
              </li>
              <li>
                <Link
                  to="/vps"
                  className="text-gray-400 hover:text-white transition duration-200 text-sm"
                >
                  VPS Cloud Services
                </Link>
              </li>
              <li>
                <Link
                  to="/esim"
                  className="text-gray-400 hover:text-white transition duration-200 text-sm"
                >
                  Global eSIM Data Plans
                </Link>
              </li>
              <li>
                <Link
                  to="/vpn"
                  className="text-gray-400 hover:text-white transition duration-200 text-sm"
                >
                  Residential VPN
                </Link>
              </li>
              <li>
                <Link
                  to="/reseller-program"
                  className="text-gray-400 hover:text-white transition duration-200 text-sm"
                >
                  Reseller Program
                </Link>
              </li>
            </ul>
          </div>

          {/* Infrastructure */}
          <div className="space-y-4">
            <h4 className="text-base font-manrope-semibold font-semibold text-white">
              Infrastructure
            </h4>
            <ul className="space-y-2">
              <li className="text-gray-400 text-sm font-inter-regular">
                25+ Data Centers
              </li>
              <li className="text-gray-400 text-sm font-inter-regular">
                150+ Countries
              </li>
              <li className="text-gray-400 text-sm font-inter-regular">
                99.9% Uptime SLA
              </li>
              <li className="text-gray-400 text-sm font-inter-regular">
                24/7 Monitoring
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-base font-manrope-semibold font-semibold text-white">
              Support
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/contact"
                  className="text-gray-400 hover:text-white transition duration-200 text-sm"
                >
                  Contact Support
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-gray-400 hover:text-white transition duration-200 text-sm"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  to="/HowToConnect"
                  className="text-gray-400 hover:text-white transition duration-200 text-sm"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@proxysock.com"
                  className="text-gray-400 hover:text-white transition duration-200 text-sm"
                >
                  support@proxysock.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-900 mt-12">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm font-inter-regular mb-4 lg:mb-0">
              © {new Date().getFullYear()} ProxySock. All rights reserved.
              Global infrastructure with enterprise-grade reliability.
            </p>
            <div className="flex flex-wrap gap-6">
              <Link
                to="/terms"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/cookie-policy"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
