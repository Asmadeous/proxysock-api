import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ClockIcon } from "@heroicons/react/24/outline";
import { Post } from "../../../pages/blogPost";

interface BlogPostRelatedProps {
  relatedPosts: Post[];
  currentCategory: string;
}

export function BlogPostRelated({ relatedPosts, currentCategory }: BlogPostRelatedProps) {
  if (relatedPosts.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="border-t border-border pt-16"
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          More from {currentCategory}
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Continue reading with similar articles that might interest you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {relatedPosts.map((relatedPost, index) => (
          <motion.div
            key={relatedPost.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <Link
              to={`/blog/${relatedPost.id}`}
              className="group block bg-card/50 backdrop-blur-sm rounded-2xl border border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="mb-4">
                  <span className="bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-medium">
                    {relatedPost.category}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                  {relatedPost.title}
                </h3>

                <p className="text-muted-foreground text-sm mb-6 line-clamp-3 leading-relaxed">
                  {relatedPost.excerpt}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    <span>{relatedPost.readTime}</span>
                  </div>
                  <span>
                    {new Date(relatedPost.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
