import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

export const SelfHelpResourcesSection = () => {
  return (
    <div className="bg-card py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-manrope-bold font-bold text-foreground text-center mb-12">
            Self-Help Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/HowToConnect"
              className="flex items-center p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors group border border-border/50"
            >
              <DocumentTextIcon className="h-8 w-8 text-primary mr-4 group-hover:text-primary/80" />
              <div>
                <h3 className="font-manrope-semibold text-foreground">Documentation</h3>
                <p className="text-muted-foreground text-sm font-inter-regular">
                  Setup guides and tutorials
                </p>
              </div>
            </Link>

            <Link
              to="/faq"
              className="flex items-center p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors group border border-border/50"
            >
              <QuestionMarkCircleIcon className="h-8 w-8 text-primary mr-4 group-hover:text-primary/80" />
              <div>
                <h3 className="font-manrope-semibold text-foreground">FAQ</h3>
                <p className="text-muted-foreground text-sm font-inter-regular">
                  Common questions answered
                </p>
              </div>
            </Link>

            <Link
              to="/about"
              className="flex items-center p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors group border border-border/50"
            >
              <BuildingOfficeIcon className="h-8 w-8 text-primary mr-4 group-hover:text-primary/80" />
              <div>
                <h3 className="font-manrope-semibold text-foreground">About Us</h3>
                <p className="text-muted-foreground text-sm font-inter-regular">
                  Learn about our company
                </p>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
