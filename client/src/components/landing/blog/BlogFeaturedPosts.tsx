
import { motion } from "framer-motion";
import {
  ArrowRightIcon,
  FireIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Post } from "@/pages/blogPost";

interface BlogFeaturedPostsProps {
  featuredPosts: Post[];
  onPostClick: (post: Post) => void;
  selectedCategory: string;
  searchTerm: string;
}

export function BlogFeaturedPosts({
  featuredPosts,
  onPostClick,
  selectedCategory,
  searchTerm,
}: BlogFeaturedPostsProps) {
  // Only show featured posts on "All" category and when no search term
  if (selectedCategory !== "All" || searchTerm || featuredPosts.length === 0) {
    return null;
  }

  return (
    <div className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <FireIcon className="h-4 w-4" />
            Featured
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Featured Articles
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hand-picked articles that showcase our best content and insights
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => onPostClick(post)}
              className="bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer group"
            >
              <div className="relative">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full font-medium">
                      FEATURED
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {post.readTime}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-muted-foreground text-sm mb-6 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {post.author}
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRightIcon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
