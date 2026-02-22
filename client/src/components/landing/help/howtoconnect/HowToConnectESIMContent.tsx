import { motion } from "framer-motion";
import {
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

export const HowToConnectESIMContent = () => {
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
          <DevicePhoneMobileIcon className="h-8 w-8 text-primary mr-4" />
          eSIM Card Setup & Activation
        </h2>
        <p className="text-muted-foreground text-lg">
          Digital SIM cards for global connectivity without physical SIM
          swapping.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* iPhone Setup */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300"
        >
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
              <DevicePhoneMobileIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-manrope-bold text-foreground">
                iPhone eSIM Setup
              </h3>
              <p className="text-muted-foreground text-sm">
                iOS 12.1+ devices
              </p>
            </div>
          </div>

          <div className="space-y-6 text-foreground">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <h4 className="font-manrope-semibold text-foreground mb-3">
                Requirements:
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  iPhone XS, XS Max, XR or newer
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  iOS 12.1 or later
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Unlocked device (carrier unlocked)
                </li>
              </ul>
            </div>

            <div className="bg-card/50 rounded-xl p-6 border border-border">
              <h4 className="font-manrope-semibold text-foreground mb-4">
                Activation Steps:
              </h4>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    1
                  </span>
                  <span>
                    Go to <strong>Settings</strong> → <strong>Cellular</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    2
                  </span>
                  <span>
                    Tap <strong>Add Cellular Plan</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    3
                  </span>
                  <span>Scan the QR code provided with your eSIM</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    4
                  </span>
                  <span>Follow the on-screen instructions</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    5
                  </span>
                  <span>
                    Label your cellular plans (e.g., "Travel", "Work")
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    6
                  </span>
                  <span>
                    Set default line for calls, messages, and data
                  </span>
                </li>
              </ol>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg">
              <p className="text-blue-600 dark:text-blue-400 text-sm">
                <strong>Note:</strong> You can have multiple eSIM profiles
                stored but only one active at a time (along with physical SIM).
              </p>
            </div>
          </div>
        </motion.div>

        {/* Android Setup */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300"
        >
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
              <DevicePhoneMobileIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-manrope-bold text-foreground">
                Android eSIM Setup
              </h3>
              <p className="text-muted-foreground text-sm">
                Compatible Android devices
              </p>
            </div>
          </div>

          <div className="space-y-6 text-foreground">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <h4 className="font-manrope-semibold text-foreground mb-3">
                Compatible Devices:
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Google Pixel 3 and newer</li>
                <li>• Samsung Galaxy S20 and newer</li>
                <li>• Samsung Galaxy Note 20 and newer</li>
                <li>• OnePlus 11 and newer</li>
              </ul>
            </div>

            <div className="bg-card/50 rounded-xl p-6 border border-border">
              <h4 className="font-manrope-semibold text-foreground mb-4">
                Activation Steps:
              </h4>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    1
                  </span>
                  <span>
                    Go to <strong>Settings</strong> →{" "}
                    <strong>Network & Internet</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    2
                  </span>
                  <span>
                    Tap <strong>Mobile Network</strong> →{" "}
                    <strong>Add Carrier</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    3
                  </span>
                  <span>
                    Select <strong>Download a SIM instead?</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    4
                  </span>
                  <span>
                    Scan QR code or enter activation code manually
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    5
                  </span>
                  <span>Follow setup prompts</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                    6
                  </span>
                  <span>Configure dual SIM settings if needed</span>
                </li>
              </ol>
            </div>

            <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-lg">
              <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                <strong>Tip:</strong> Steps may vary slightly between Android
                manufacturers. Check your device manual for specific
                instructions.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Management and Troubleshooting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 lg:col-span-2"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* eSIM Management */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                  <Cog6ToothIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-manrope-bold text-foreground">
                  eSIM Management
                </h3>
              </div>

              <div className="space-y-4 text-foreground">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-manrope-semibold text-foreground mb-3">
                    Switching Between Plans:
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Go to cellular/mobile network settings</li>
                    <li>• Select the plan you want to activate</li>
                    <li>• Toggle the plan on/off as needed</li>
                    <li>• Set preferences for calls, messages, and data</li>
                  </ul>
                </div>

                <div className="bg-card/50 rounded-lg p-4 border border-border">
                  <h4 className="font-manrope-semibold text-foreground mb-3">
                    Data Usage Monitoring:
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Monitor usage per cellular plan</li>
                    <li>• Set data limits and alerts</li>
                    <li>
                      • Choose which plan to use for background app refresh
                    </li>
                    <li>• Configure automatic switching rules</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-manrope-bold text-foreground">
                  Troubleshooting
                </h3>
              </div>

              <div className="space-y-4 text-foreground">
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                  <h4 className="font-manrope-semibold text-foreground mb-3">
                    Common Issues:
                  </h4>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <strong className="text-red-600 dark:text-red-400">
                        QR Code Won't Scan:
                      </strong>
                      <br />
                      <span className="text-muted-foreground">
                        Ensure good lighting, clean camera lens, try manual entry
                      </span>
                    </li>
                    <li>
                      <strong className="text-red-600 dark:text-red-400">
                        No Service:
                      </strong>
                      <br />
                      <span className="text-muted-foreground">
                        Restart device, check carrier settings, verify plan
                        activation
                      </span>
                    </li>
                    <li>
                      <strong className="text-red-600 dark:text-red-400">
                        Can't Remove eSIM:
                      </strong>
                      <br />
                      <span className="text-muted-foreground">
                        Contact your carrier, may need to reset network settings
                      </span>
                    </li>
                    <li>
                      <strong className="text-red-600 dark:text-red-400">
                        Slow Data:
                      </strong>
                      <br />
                      <span className="text-muted-foreground">
                        Check data plan limits, network coverage, APN settings
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
                  <h4 className="font-manrope-semibold text-foreground mb-2">
                    Reset Network Settings:
                  </h4>
                  <p className="text-orange-600 dark:text-orange-400 text-sm">
                    If experiencing persistent issues, reset network settings
                    (this will remove all saved Wi-Fi passwords and cellular
                    settings).
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
