import { motion } from "framer-motion";

import { Post } from "@/pages/blogPost";

interface BlogPostContentProps {
  post: Post;
}

export function BlogPostContent({ post }: BlogPostContentProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="mb-16"
    >
      <div className="max-w-3xl mx-auto">
        <div
          className="prose prose-lg prose-slate dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
            prose-h1:text-3xl prose-h1:mt-12 prose-h1:mb-6
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-5 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-6 prose-p:text-base
            prose-ul:text-foreground prose-ol:text-foreground
            prose-li:mb-3 prose-li:leading-relaxed
            prose-strong:text-foreground prose-strong:font-semibold
            prose-code:text-primary prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:p-6 prose-blockquote:rounded-r-lg prose-blockquote:my-8 prose-blockquote:text-muted-foreground prose-blockquote:border-l-4
            prose-a:text-primary prose-a:no-underline hover:prose-a:text-primary/80 prose-a:font-medium
            prose-pre:bg-slate-950 prose-pre:border prose-pre:border-border prose-pre:rounded-xl
            prose-img:rounded-lg prose-img:shadow-lg prose-img:my-8
            prose-hr:border-border prose-hr:my-12
            prose-table:border-collapse prose-table:border prose-table:border-border
            prose-th:bg-muted prose-th:border prose-th:border-border prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold
            prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </motion.article>
  );
}
