import { CheckCircle } from "lucide-react";

export const IPCheckerFooter = () => {
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <h3 className="text-xl font-bold text-foreground">ProxySock</h3>
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
                className="text-muted-foreground hover:text-foreground transition duration-200 transform hover:scale-110"
              >
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://t.me/Proxy_sock5"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition duration-200 transform hover:scale-110"
              >
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-foreground">Our Services</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/proxies"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm flex items-center"
                >
                  🌐 <span className="ml-2">Global Proxy Network</span>
                </a>
              </li>
              <li>
                <a
                  href="/rdp"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm flex items-center"
                >
                  🖥️ <span className="ml-2">Windows RDP Hosting</span>
                </a>
              </li>
              <li>
                <a
                  href="/vps"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm flex items-center"
                >
                  ⚡ <span className="ml-2">VPS Cloud Servers</span>
                </a>
              </li>
              <li>
                <a
                  href="/esim"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm flex items-center"
                >
                  📱 <span className="ml-2">Global eSIM Data Plans</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Infrastructure */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-foreground">Infrastructure</h4>
            <ul className="space-y-2">
              <li className="text-muted-foreground text-sm flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                25+ Data Centers
              </li>
              <li className="text-muted-foreground text-sm flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                150+ Countries
              </li>
              <li className="text-muted-foreground text-sm flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                99.9% Uptime SLA
              </li>
              <li className="text-muted-foreground text-sm flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                24/7 Monitoring
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-foreground">Support</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/contact"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm"
                >
                  💬 Contact Support
                </a>
              </li>
              <li>
                <a
                  href="/faq"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm"
                >
                  ❓ FAQ
                </a>
              </li>
              <li>
                <a
                  href="/HowToConnect"
                  className="text-muted-foreground hover:text-foreground transition duration-200 text-sm"
                >
                  📚 Documentation
                </a>
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
              <a
                href="/terms"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Terms
              </a>
              <a
                href="/privacy"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Privacy
              </a>
              <a
                href="/cookie-policy"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
