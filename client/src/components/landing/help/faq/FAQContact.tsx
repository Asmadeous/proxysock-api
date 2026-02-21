import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export const FAQContact = () => {
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
          <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-4">
            Still have questions?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg font-inter-regular">
            Our expert support team is available 24/7 to help you with any
            questions or technical issues. Get personalized assistance from
            real humans who understand your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/contact"
                className="bg-primary text-primary-foreground px-8 py-4 rounded-lg hover:bg-primary/90 transition-colors font-manrope-semibold text-lg shadow-lg"
              >
                Contact Support Team
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
<<<<<<< HEAD
              <button
                onClick={() => {
                  if ((window as any).Tawk_API) {
                    (window as any).Tawk_API.toggle();
                  }
                }}
                className="bg-muted text-foreground px-8 py-4 rounded-lg hover:bg-muted/80 transition-colors font-manrope-semibold text-lg shadow-lg"
              >
                Start Live Chat
              </button>
=======
              <Link
                to="/contact"
                className="bg-muted text-foreground px-8 py-4 rounded-lg hover:bg-muted/80 transition-colors font-manrope-semibold text-lg shadow-lg"
              >
                Start Live Chat
              </Link>
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
            </motion.div>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-muted-foreground">
              <span className="text-primary font-manrope-semibold">
                ⚡ Live Chat:
              </span>{" "}
              &lt; 5 minutes
            </div>
            <div className="text-muted-foreground">
              <span className="text-green-500 font-manrope-semibold">📧 Email:</span>{" "}
              &lt; 30 minutes
            </div>
            <div className="text-muted-foreground">
              <span className="text-blue-500 font-manrope-semibold">
                📞 Phone:
              </span>{" "}
              24/7 available
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
