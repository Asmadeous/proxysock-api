import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faTelegram } from "@fortawesome/free-brands-svg-icons";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import logo from "../../../../assets/images/favicon.svg";

interface ContactFooterProps {
  handleSocialClick: (platform: string) => void;
}

export const ContactFooter = ({ handleSocialClick }: ContactFooterProps) => {
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
              Global infrastructure provider with premium data centers and
              worldwide coverage. From premium data centers to global eSIM
              connectivity, we've got the infrastructure you need.
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
                  🌐 <span className="ml-2">Global Proxy Network</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/rdp"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm flex items-center"
                >
                  🖥️ <span className="ml-2">Windows RDP Hosting</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/vps"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm flex items-center"
                >
                  ⚡ <span className="ml-2">VPS Cloud Servers</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/esim"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm flex items-center"
                >
                  📱 <span className="ml-2">Global eSIM Data Plans</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Infrastructure */}
          <div className="space-y-4">
            <h4 className="text-lg font-manrope-bold font-bold text-foreground">
              Infrastructure
            </h4>
            <ul className="space-y-2">
              <li className="text-muted-foreground text-sm flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                25+ Data Centers
              </li>
              <li className="text-muted-foreground text-sm flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                150+ Countries
              </li>
              <li className="text-muted-foreground text-sm flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                99.9% Uptime SLA
              </li>
              <li className="text-muted-foreground text-sm flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                24/7 Monitoring
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-manrope-bold font-bold text-foreground">
              Support
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
                <Link
                  to="/faq"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm"
                >
                  ❓ FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/HowToConnect"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm"
                >
                  📚 Documentation
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
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-border mt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm mb-4 lg:mb-0">
              © {new Date().getFullYear()} ProxySock. All rights reserved.
              Global infrastructure with enterprise-grade reliability.
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
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
