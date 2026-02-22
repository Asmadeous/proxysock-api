import { motion } from "framer-motion";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export const HowToConnectTroubleshooting = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-r from-red-500/5 to-orange-500/5 border border-red-500/20 rounded-2xl p-8 mt-12 backdrop-blur-xl"
    >
      <h2 className="text-2xl sm:text-3xl font-manrope-bold text-foreground mb-8 flex items-center">
        <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-4" />
        General Troubleshooting & Support
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h3 className="font-manrope-semibold text-foreground mb-4 text-xl">
            Common Solutions:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="space-y-3 text-muted-foreground text-sm">
              <li className="flex items-start">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Verify all connection details are correct</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Check your internet connection stability</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Restart your device and applications</span>
              </li>
            </ul>
            <ul className="space-y-3 text-muted-foreground text-sm">
              <li className="flex items-start">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Disable firewall/antivirus temporarily</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Clear browser cache and cookies</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Update your software/apps to latest version</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-card/50 rounded-xl p-6 border border-border">
          <h3 className="font-manrope-semibold text-foreground mb-4 text-xl">
            Need Help?
          </h3>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Our expert support team is available 24/7 to assist you with any
            connection issues or technical questions.
          </p>
          <div className="space-y-4">
            <Link
              to="/contact"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-manrope-semibold"
            >
              Contact Support
            </Link>
            <a
              href="mailto:support@proxysock.com"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-card text-card-foreground border border-border rounded-lg hover:bg-muted transition-colors text-sm font-manrope-semibold"
            >
              support@proxysock.com
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
