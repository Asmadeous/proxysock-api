import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faTelegram } from "@fortawesome/free-brands-svg-icons";
import logo from "../../../../assets/images/favicon.svg";

export const FAQFooter = ({ handleSocialClick }: { handleSocialClick: (platform: string) => void }) => {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img
                src={logo}
                alt="ProxySock Logo"
                className="h-10 w-10 mr-3"
              />
              <h3 className="text-xl font-manrope-bold font-bold text-foreground">
                ProxySock
              </h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Premium digital infrastructure solutions trusted by thousands of
              businesses worldwide. Proxies, RDP, VPS, and eSIM services with
              24/7 expert support and 99.9% uptime guarantee.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://x.com/cybertwts"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSocialClick("twitter")}
                className="text-muted-foreground hover:text-foreground transition duration-200 transform hover:scale-110"
              >
                <FontAwesomeIcon icon={faTwitter} className="h-6 w-6" />
              </a>
              <a
                href="https://t.me/Proxy_sock5"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSocialClick("telegram")}
                className="text-muted-foreground hover:text-foreground transition duration-200 transform hover:scale-110"
              >
                <FontAwesomeIcon icon={faTelegram} className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-manrope-bold font-bold text-foreground">
              Our Services
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/proxies"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm flex items-center"
                >
                  🌐 <span className="ml-2">Proxy Services</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/rdp"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm flex items-center"
                >
                  🖥️ <span className="ml-2">RDP Hosting</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/vps"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm flex items-center"
                >
                  ⚡ <span className="ml-2">VPS Hosting</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/esim"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm flex items-center"
                >
                  📱 <span className="ml-2">eSIM Plans</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-lg font-manrope-bold font-bold text-foreground">
              Help & Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/HowToConnect"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm"
                >
                  📚 Documentation
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm"
                >
                  ❓ FAQ (50+ questions)
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm"
                >
                  ℹ️ About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/locations"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm"
                >
                  🗺️ Server Locations
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-manrope-bold font-bold text-foreground">
              Get Support
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/contact"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm"
                >
                  💬 Contact Support
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@proxysock.com"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm"
                >
                  📧 support@proxysock.com
                </a>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm"
                >
                  📋 Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm"
                >
                  🔒 Privacy Policy
                </Link>
              </li>
            </ul>
            <div className="bg-card p-3 rounded-lg">
              <p className="text-foreground font-manrope-semibold text-sm mb-1">
                Response Times:
              </p>
              <p className="text-muted-foreground text-xs">
                Live Chat: &lt; 5 minutes
              </p>
              <p className="text-muted-foreground text-xs">Email: &lt; 30 minutes</p>
              <p className="text-muted-foreground text-xs">Phone: 24/7 available</p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-border mt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm mb-4 lg:mb-0">
              © {new Date().getFullYear()} ProxySock. All rights reserved.
              Premium digital infrastructure solutions with 24/7 support.
            </p>
            <div className="flex flex-wrap gap-6">
              <Link
                to="/terms"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/cookie-policy"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Cookies
              </Link>
              <Link
                to="/refund"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
