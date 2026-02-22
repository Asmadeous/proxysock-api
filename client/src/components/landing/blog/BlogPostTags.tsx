import { motion } from "framer-motion";
import { Tag } from "lucide-react";
import { Post } from "../../../pages/blogPost";

interface BlogPostTagsProps {
  post: Post;
}

export function BlogPostTags({ post }: BlogPostTagsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="flex items-center gap-4 mb-16 flex-wrap pb-8 border-b border-border"
    >
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Tags</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {post.tags.map((tag: string, index: number) => (
          <span
            key={index}
            className="bg-primary/10 text-primary text-sm px-4 py-2 rounded-full hover:bg-primary/20 transition-colors cursor-pointer font-medium"
          >
            #{tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
