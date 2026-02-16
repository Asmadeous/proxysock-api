
import { motion } from "framer-motion";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  ShareIcon,
  BookmarkIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { Post } from "@/pages/blogPost";

interface BlogPostHeroSectionProps {
  post: Post;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onShare: () => void;
}

export function BlogPostHeroSection({
  post,
  isBookmarked,
  onToggleBookmark,
  onShare,
}: BlogPostHeroSectionProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="mb-12"
    >
      {/* Category and Featured Badge */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="bg-primary/10 text-primary text-sm px-4 py-2 rounded-full font-medium border border-primary/20">
          {post.category}
        </span>
        {post.featured && (
          <span className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-600 dark:text-yellow-400 text-xs px-3 py-2 rounded-full flex items-center border border-yellow-500/20">
            <StarIcon className="h-3 w-3 mr-1.5" />
            FEATURED
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-tight tracking-tight max-w-4xl">
        {post.title}
      </h1>

      {/* Excerpt */}
      <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl font-medium">
        {post.excerpt}
      </p>

      {/* Author and Meta Information */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-8 border-b border-border">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <UserIcon className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">
                {post.author}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="h-4 w-4" />
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onShare}
            className="p-3 text-muted-foreground hover:text-foreground bg-card hover:bg-card/80 rounded-xl transition-all duration-200 border border-border hover:border-primary/20"
            title="Share article"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onToggleBookmark}
            className="p-3 text-muted-foreground hover:text-foreground bg-card hover:bg-card/80 rounded-xl transition-all duration-200 border border-border hover:border-primary/20"
            title="Bookmark article"
          >
            {isBookmarked ? (
              <BookmarkSolidIcon className="h-5 w-5 text-primary" />
            ) : (
              <BookmarkIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
