import { motion } from "framer-motion";
import { ExtendedPost } from "@/pages/blogPost";
import { NewspaperIcon } from "@heroicons/react/24/outline";

interface BlogNewsTickerProps {
  newsArticles: ExtendedPost[];
  onPostClick: (post: ExtendedPost) => void;
  onViewAllNews: () => void;
}

export function BlogNewsTicker({
  newsArticles,
  onPostClick,
  onViewAllNews,
}: BlogNewsTickerProps) {
  const latestNews = newsArticles.slice(0, 5);

  if (latestNews.length === 0) return null;

  // Create duplicated array for seamless infinite scrolling
  const duplicatedNews = [...latestNews, ...latestNews];

  // Calculate animation duration based on number of items (slower for more items)
  const animationDuration = Math.max(20, latestNews.length * 4);

  return (
    <div className="bg-gray/50 border-b border-border/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Header Section */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/25"></div>
            <NewspaperIcon className="h-5 w-5 text-primary" />
            <span className="text-primary font-bold text-sm uppercase tracking-wider font-manrope">
              Breaking News
            </span>
          </div>

          {/* Desktop: Scrolling News */}
          <div className="hidden md:flex flex-1 overflow-hidden mx-8">
            <motion.div
              className="flex gap-8 items-center"
              animate={{
                x: [-100, -100 - duplicatedNews.length * 200],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: animationDuration,
                  ease: "linear",
                },
              }}
              style={{ width: `${duplicatedNews.length * 200}px` }}
            >
              {duplicatedNews.map((news, index) => (
                <motion.button
                  key={`${news.id}-${index}`}
                  onClick={() => onPostClick(news)}
                  className="text-muted-foreground hover:text-primary transition-all duration-300 text-sm font-medium whitespace-nowrap hover:scale-105 transform flex-shrink-0 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="inline-block w-2 h-2 bg-primary/60 rounded-full mr-3 group-hover:bg-primary transition-colors"></span>
                  {news.title}
                </motion.button>
              ))}
            </motion.div>
          </div>

          {/* Mobile: View All Button */}
          <div className="md:hidden flex-shrink-0">
            <motion.button
              onClick={onViewAllNews}
              className="text-primary hover:text-primary/80 transition-all duration-300 text-sm font-semibold bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-lg border border-primary/20 hover:border-primary/40"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View All →
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
