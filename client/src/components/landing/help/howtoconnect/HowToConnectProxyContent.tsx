import { motion } from "framer-motion";
import {
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  CodeBracketIcon,
  WifiIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

import { CodeBlock } from "./CodeBlock";

export const HowToConnectProxyContent = () => {
  const proxyTypes = [
    {
      title: "Datacenter Proxies",
      desc: "High-speed, reliable proxies from data centers",
      colorClass: "bg-blue-500/20 text-blue-400",
      iconClass: "text-blue-500",
    },
    {
      title: "Residential Proxies",
      desc: "Real IP addresses from residential networks",
      colorClass: "bg-green-500/20 text-green-400",
      iconClass: "text-green-500",
    },
    {
      title: "ISP Proxies",
      desc: "Perfect blend of speed and legitimacy",
      colorClass: "bg-purple-500/20 text-purple-400",
      iconClass: "text-purple-500",
    },
    {
      title: "Static Residential",
      desc: "Dedicated residential IPs that don't rotate",
      colorClass: "bg-yellow-500/20 text-yellow-400",
      iconClass: "text-yellow-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-12"
    >
      {/* Enhanced Proxy Types Overview */}
      <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
        <h2 className="text-2xl sm:text-3xl font-manrope-bold text-foreground mb-6 flex items-center">
          <WifiIcon className="h-8 w-8 text-primary mr-4" />
          Proxy Service Types
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {proxyTypes.map((type, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card/80 backdrop-blur-sm p-6 rounded-xl border border-border hover:border-primary/80 transition-all duration-300 group"
            >
              <div
                className={`w-12 h-12 ${type.colorClass} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <WifiIcon className={`h-6 w-6 ${type.iconClass}`} />
              </div>
              <h3 className="font-manrope-semibold text-foreground mb-3 text-lg">
                {type.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {type.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Enhanced Platform Setup Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Windows Setup */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300"
        >
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
              <ComputerDesktopIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-manrope-bold text-foreground">
                Windows Configuration
              </h3>
              <p className="text-muted-foreground text-sm">
                System-wide and browser proxy setup
              </p>
            </div>
          </div>

          <div className="space-y-6 text-foreground">
            <div className="bg-card/50 rounded-xl p-6 border border-border">
              <h4 className="font-manrope-semibold text-foreground mb-4 flex items-center">
                <Cog6ToothIcon className="h-5 w-5 text-blue-500 mr-2" />
                System-wide Proxy Setup
              </h4>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    1
                  </span>
                  <span>
                    Open <strong>Settings</strong> →{" "}
                    <strong>Network & Internet</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    2
                  </span>
                  <span>Click <strong>Proxy</strong> in the sidebar</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    3
                  </span>
                  <span>
                    Toggle <strong>Use a proxy server</strong> to{" "}
                    <strong>On</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    4
                  </span>
                  <span>Enter your proxy details below:</span>
                </li>
              </ol>
              <div className="mt-4">
                <CodeBlock
                  code={`Address: your_proxy_ip
Port: your_proxy_port
Username: your_username
Password: your_password`}
                  language="text"
                  title="Proxy Configuration"
                />
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
              <h4 className="font-manrope-semibold text-foreground mb-3 flex items-center">
                <GlobeAltIcon className="h-5 w-5 text-blue-500 mr-2" />
                Browser Extensions (Recommended)
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                For Chrome/Firefox, use proxy extensions for better control:
              </p>
              <ul className="text-sm space-y-2">
                <li>
                  • <strong className="text-foreground">FoxyProxy</strong> - Advanced proxy management
                </li>
                <li>
                  • <strong className="text-foreground">Proxy SwitchyOmega</strong> - Rule-based switching
                </li>
                <li>
                  • <strong className="text-foreground">ProxySwitcher</strong> - Simple toggle interface
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* macOS Setup */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300"
        >
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
              <CodeBracketIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-manrope-bold text-foreground">
                macOS Configuration
              </h3>
              <p className="text-muted-foreground text-sm">
                System preferences proxy setup
              </p>
            </div>
          </div>

          <div className="space-y-6 text-foreground">
            <div className="bg-card/50 rounded-xl p-6 border border-border">
              <h4 className="font-manrope-semibold text-foreground mb-4 flex items-center">
                <Cog6ToothIcon className="h-5 w-5 text-purple-500 mr-2" />
                System Preferences Setup
              </h4>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    1
                  </span>
                  <span>
                    Open <strong>System Preferences</strong> →{" "}
                    <strong>Network</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    2
                  </span>
                  <span>
                    Select your network connection → <strong>Advanced</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    3
                  </span>
                  <span>Go to <strong>Proxies</strong> tab</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    4
                  </span>
                  <span>
                    Check <strong>Web Proxy (HTTP)</strong> and{" "}
                    <strong>Secure Web Proxy (HTTPS)</strong>
                  </span>
                </li>
              </ol>
              <div className="mt-4">
                <CodeBlock
                  code={`Web Proxy Server: your_proxy_ip:port
Username: your_username
Password: your_password`}
                  language="text"
                  title="Proxy Configuration"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile Setup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300"
        >
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
              <DevicePhoneMobileIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-manrope-bold text-foreground">
                Mobile Devices
              </h3>
              <p className="text-muted-foreground text-sm">
                iOS and Android proxy configuration
              </p>
            </div>
          </div>

          <div className="space-y-6 text-foreground">
            <div className="bg-card/50 rounded-xl p-6 border border-border">
              <h4 className="font-manrope-semibold text-foreground mb-4 flex items-center">
                <DevicePhoneMobileIcon className="h-5 w-5 text-green-500 mr-2" />
                Android Setup
              </h4>
              <ol className="space-y-2 text-sm">
                <li>1. <strong>Settings</strong> → <strong>Wi-Fi</strong></li>
                <li>2. Long-press network → <strong>Modify Network</strong></li>
                <li>3. <strong>Advanced</strong> → <strong>Proxy</strong> → <strong>Manual</strong></li>
                <li>4. Enter proxy details and save</li>
              </ol>
            </div>

            <div className="bg-card/50 rounded-xl p-6 border border-border">
              <h4 className="font-manrope-semibold text-foreground mb-4 flex items-center">
                <DevicePhoneMobileIcon className="h-5 w-5 text-blue-500 mr-2" />
                iOS Setup
              </h4>
              <ol className="space-y-2 text-sm">
                <li>1. <strong>Settings</strong> → <strong>Wi-Fi</strong></li>
                <li>2. Tap your network → <strong>Configure Proxy</strong></li>
                <li>3. Select <strong>Manual</strong> and enter details</li>
                <li>4. Tap <strong>Save</strong> to apply changes</li>
              </ol>
            </div>
          </div>
        </motion.div>

        {/* Programming Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300"
        >
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
              <CodeBracketIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-manrope-bold text-foreground">
                Programming Integration
              </h3>
              <p className="text-muted-foreground text-sm">
                Code examples for popular languages
              </p>
            </div>
          </div>

          <div className="space-y-6 text-foreground">
            <div className="bg-card/50 rounded-xl p-6 border border-border">
              <h4 className="font-manrope-semibold text-foreground mb-4 flex items-center">
                <CodeBracketIcon className="h-5 w-5 text-yellow-500 mr-2" />
                Python (requests)
              </h4>
              <CodeBlock
                code={`import requests

proxies = {
    'http': 'http://username:password@proxy_ip:port',
    'https': 'https://username:password@proxy_ip:port'
}

response = requests.get('https://httpbin.org/ip', proxies=proxies)
print(response.json())`}
                language="python"
                title="Python Proxy Example"
              />
            </div>

            <div className="bg-card/50 rounded-xl p-6 border border-border">
              <h4 className="font-manrope-semibold text-foreground mb-4 flex items-center">
                <CodeBracketIcon className="h-5 w-5 text-green-500 mr-2" />
                Node.js (axios)
              </h4>
              <CodeBlock
                code={`const axios = require('axios');

const proxy = {
    host: 'proxy_ip',
    port: proxy_port,
    auth: {
        username: 'your_username',
        password: 'your_password'
    }
};

axios.get('https://httpbin.org/ip', { proxy })
    .then(response => console.log(response.data));`}
                language="javascript"
                title="Node.js Proxy Example"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
