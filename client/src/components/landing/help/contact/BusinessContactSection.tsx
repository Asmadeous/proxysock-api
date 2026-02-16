import { motion } from "framer-motion";
import { BuildingOfficeIcon } from "@heroicons/react/24/outline";

interface BusinessContactSectionProps {
  handleBusinessContactClick: () => void;
}

export const BusinessContactSection = ({
  handleBusinessContactClick,
}: BusinessContactSectionProps) => {
  return (
    <div className="bg-card py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-8 text-center"
        >
          <BuildingOfficeIcon className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-manrope-bold font-bold text-foreground mb-4">
            Enterprise & Business Solutions
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto font-inter-regular">
            Custom solutions, bulk orders, enterprise pricing, and dedicated
            account management for businesses.
          </p>
          <a
            href="mailto:business@proxysock.com"
            onClick={handleBusinessContactClick}
            className="inline-flex items-center px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-manrope-semibold"
          >
            <BuildingOfficeIcon className="h-5 w-5 mr-2" />
            Contact Business Team
          </a>
          <p className="text-muted-foreground text-sm mt-3 font-inter-regular">
            Dedicated account manager • Custom pricing available
          </p>
        </motion.div>
      </div>
    </div>
  );
};
