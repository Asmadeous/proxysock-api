import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useRedditTracking } from "../../utils/redditPixel";
import { Post, blogPosts } from "../../data/blogPost";
import { BlogPostBreadcrumbs } from "../../components/landing/blog/BlogPostBreadcrumbs";
import { BlogPostHeroSection } from "../../components/landing/blog/BlogPostHeroSection";
import { BlogPostContent } from "../../components/landing/blog/BlogPostContent";
import { BlogPostTags } from "../../components/landing/blog/BlogPostTags";
import { BlogPostRelated } from "../../components/landing/blog/BlogPostRelated";
import { BlogPostNewsletter } from "../../components/landing/blog/BlogPostNewsletter";
import { ReadingProgress } from "../../components/landing/blog/ReadingProgress"; // Import data and interface from separate file

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { trackPageView, trackViewContent } = useRedditTracking();

  useEffect(() => {
    const currentPost = blogPosts.find((p) => p.id === id);

    if (currentPost) {
      setPost(currentPost);

      // Find related posts (same category, excluding current post)
      const related = blogPosts
        .filter((p) => p.category === currentPost.category && p.id !== id)
        .slice(0, 3);
      setRelatedPosts(related);

      // Track page view and content view
      trackPageView();
      trackViewContent({
        productId: currentPost.id,
        productName: currentPost.title,
        category: "blog_post",
        value: 0,
      });
    } else {
      // Optional: Redirect if post not found
      navigate("/blog");
    }

    setIsLoading(false);
  }, [id, navigate]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: globalThis.location?.href,
        });
      } catch (err) {
        navigator.clipboard.writeText(globalThis.location?.href || "");
        alert("Link copied to clipboard!");
      }
    } else {
      navigator.clipboard.writeText(globalThis.location?.href || "");
      alert("Link copied to clipboard!");
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: Implement bookmark functionality (localStorage, database, etc.)
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Post Not Found
            </h1>
            <p className="text-gray-400 mb-8">
              The blog post you're looking for doesn't exist.
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Reading Progress Bar */}
      <ReadingProgress />

      {/* SEO Meta Tags with Helmet */}
      <Helmet>
        <title>{post.title} | ProxySock Blog</title>
        <meta name="description" content={post.excerpt} />
        <meta name="keywords" content={post.tags.join(", ")} />
        <link rel="canonical" href={`https://proxysock.com/blog/${id}`} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://proxysock.com/blog/${id}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:site_name" content="ProxySock" />
        <meta
          property="og:image"
          content="https://proxysock.com/assets/images/blog-og.png"
        />
        <meta property="article:published_time" content={post.date} />
        <meta property="article:author" content={post.author} />
        <meta property="article:section" content={post.category} />
        {post.tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:url"
          content={`https://proxysock.com/blog/${id}`}
        />
        <meta property="twitter:title" content={post.title} />
        <meta property="twitter:description" content={post.excerpt} />
        <meta
          property="twitter:image"
          content="https://proxysock.com/assets/images/blog-og.png"
        />

        {/* Structured Data for Article */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            image: "https://proxysock.com/assets/images/blog-og.png",
            datePublished: post.date,
            dateModified: post.date,
            author: {
              "@type": "Person",
              name: post.author,
            },
            publisher: {
              "@type": "Organization",
              name: "ProxySock",
              logo: {
                "@type": "ImageObject",
                url: "https://proxysock.com/assets/images/logo.svg",
                width: "200",
                height: "60",
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://proxysock.com/blog/${id}`,
            },
            keywords: post.tags.join(", "),
            articleSection: post.category,
            wordCount: post.content
              ? post.content.replace(/<[^>]*>/g, "").split(" ").length
              : 0,
          })}
        </script>
      </Helmet>

      <article className="pt-8 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back to Blog Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors px-4 py-2 rounded-lg hover:bg-primary/5 group"
            >
              <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Blog</span>
            </Link>
          </motion.div>

          {/* Breadcrumbs */}
          <BlogPostBreadcrumbs category={post.category} />

          {/* Article Header */}
          <BlogPostHeroSection
            post={post}
            isBookmarked={isBookmarked}
            onToggleBookmark={toggleBookmark}
            onShare={handleShare}
          />

          {/* Article Content */}
          <BlogPostContent post={post} />

          {/* Article Tags */}
          <BlogPostTags post={post} />

          {/* Related Posts */}
          <BlogPostRelated
            relatedPosts={relatedPosts}
            currentCategory={post.category}
          />

          {/* Newsletter CTA */}
          <BlogPostNewsletter />
        </div>
      </article>
    </div>
  );
}
