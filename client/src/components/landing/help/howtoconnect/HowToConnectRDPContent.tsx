
import { motion } from "framer-motion";
import {
  ComputerDesktopIcon,
  CodeBracketIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { CodeBlock } from "./CodeBlock";

export const HowToConnectRDPContent = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-12"
    >
      <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
        <h2 className="text-2xl sm:text-3xl font-manrope-bold text-foreground mb-4 flex items-center">
          <ComputerDesktopIcon className="h-8 w-8 text-primary mr-4" />
          Remote Desktop Protocol (RDP) Setup
        </h2>
        <p className="text-muted-foreground text-lg">
          Connect to your Windows RDP server from any device, anywhere in the
          world.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Windows RDP Client */}
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
                Windows RDP Client
              </h3>
              <p className="text-muted-foreground text-sm">
                Built-in remote desktop connection
              </p>
            </div>
          </div>

          <div className="space-y-6 text-foreground">
            <ol className="space-y-4 text-sm">
              <li className="flex items-start">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                  1
                </span>
                <span>
                  Press <strong>Windows + R</strong>, type{" "}
                  <code className="bg-muted px-2 py-1 rounded text-primary font-mono">
                    mstsc
                  </code>
                </span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                  2
                </span>
                <span>Enter your RDP server details:</span>
              </li>
            </ol>
            <div>
              <CodeBlock
                code={`Computer: your_rdp_ip: port
Username: your_rdp_username
Password: your_rdp_password`}
                language="text"
                title="RDP Connection Details"
              />
            </div>
            <ol start={3} className="space-y-4 text-sm">
              <li className="flex items-start">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                  3
                </span>
                <span>
                  Click <strong>Connect</strong> and enter credentials when
                  prompted
                </span>
              </li>
              <li className="flex items-start">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                  4
                </span>
                <span>
                  For security, enable{" "}
                  <strong>Network Level Authentication</strong>
                </span>
              </li>
            </ol>
          </div>
        </motion.div>

        {/* macOS RDP Client */}
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
                macOS RDP Client
              </h3>
              <p className="text-muted-foreground text-sm">
                Microsoft Remote Desktop app
              </p>
            </div>
          </div>

          <div className="space-y-6 text-foreground">
            <div className="bg-card/50 rounded-xl p-6 border border-border">
              <h4 className="font-manrope-semibold text-foreground mb-4">
                Microsoft Remote Desktop
              </h4>
              <ol className="space-y-3 text-sm">
                <li>1. Download from Mac App Store</li>
                <li>
                  2. Click <strong>Add PC</strong>
                </li>
                <li>3. Enter connection details:</li>
              </ol>
              <div className="mt-4">
                <CodeBlock
                  code={`PC Name: your_rdp_ip: port
User Account: Add User Account
Username: your_username
Password: your_password`}
                  language="text"
                  title="macOS RDP Configuration"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile RDP and Security merged */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 lg:col-span-2"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mobile Apps */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                  <DevicePhoneMobileIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-manrope-bold text-foreground">
                  Mobile RDP Apps
                </h3>
              </div>

              <div className="space-y-4 text-foreground">
                <div>
                  <h4 className="font-manrope-semibold text-foreground mb-3">
                    Recommended Apps:
                  </h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      <strong>Microsoft Remote Desktop</strong> (iOS/Android)
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      <strong>RD Client</strong> (Android)
                    </li>
                    <li className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                      <strong>TeamViewer</strong> (Cross-platform)
                    </li>
                  </ul>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-manrope-semibold text-foreground mb-2">
                    Quick Setup:
                  </h4>
                  <ol className="space-y-1 text-sm text-muted-foreground">
                    <li>1. Install app from store</li>
                    <li>2. Add new connection</li>
                    <li>3. Enter server details</li>
                    <li>4. Save and connect</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Security */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                  <ShieldCheckIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-manrope-bold text-foreground">
                  Security Best Practices
                </h3>
              </div>

              <div className="space-y-4 text-foreground">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Use strong, unique passwords</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Enable Network Level Authentication (NLA)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Use non-standard RDP ports when possible</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Implement IP whitelisting if needed</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Regularly update your RDP client</span>
                  </li>
                </ul>
                <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg">
                  <p className="text-blue-600 dark:text-blue-400 text-sm">
                    <strong>Pro Tip:</strong> For enhanced security, consider
                    using VPN connection before connecting to RDP.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
