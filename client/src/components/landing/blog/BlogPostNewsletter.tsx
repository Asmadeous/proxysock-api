import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export function BlogPostNewsletter() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.8 }}
      className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border text-center mt-16 max-w-4xl mx-auto overflow-hidden"
    >
      <div className="p-8 sm:p-12">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg
            className="h-8 w-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h3 className="text-3xl font-bold text-foreground mb-4">
          Stay Updated with ProxySock
        </h3>

        <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
          Get the latest guides, tutorials, and insights about proxies, RDP, VPS, and eSIM delivered directly to your inbox. Join thousands of professionals who trust our expertise.
        </p>

        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
        >
          Subscribe to Our Newsletter
          <ChevronRightIcon className="h-5 w-5" />
        </Link>
      </div>
    </motion.section>
  );
}
