import { motion } from "framer-motion";
import { BookOpenIcon } from "@heroicons/react/24/outline";

interface BlogHeroSectionProps {
  newsArticlesLength: number;
}

export function BlogHeroSection({ newsArticlesLength }: BlogHeroSectionProps) {
  return (
    <div className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-8">
            <BookOpenIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-tight mb-6">
            ProxySock <span className="text-primary">Blog</span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed mb-8 max-w-3xl mx-auto">
            Expert guides, tutorials, and insights for proxies, RDP hosting,
            VPS servers, VPN, and eSIM cards. Stay updated with the latest
            technology news.
          </p>
          {newsArticlesLength > 0 && (
            <div className="inline-flex items-center gap-3 bg-card/50 backdrop-blur-sm px-6 py-3 rounded-full border border-border">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-foreground">
                Live News Updates Available
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
