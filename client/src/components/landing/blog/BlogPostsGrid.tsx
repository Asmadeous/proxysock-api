import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  DocumentTextIcon,
  GlobeAltIcon,
  TagIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  NewspaperIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { ExtendedPost } from "@/data/blogPost";

interface BlogPostsGridProps {
  filteredPosts: ExtendedPost[];
  newsError: string | null;
  selectedCategory: string;
  isLoadingNews: boolean;
  newsArticles: ExtendedPost[];
  onPostClick: (post: ExtendedPost) => void;
  onLoadMoreNews: () => void;
  nextPage: string | null;
  onClearFilters: () => void;
  onTagClick: (tag: string) => void;
  onViewAllNews: () => void;
}

export function BlogPostsGrid({
  filteredPosts,
  newsError,
  selectedCategory,
  isLoadingNews,
  newsArticles,
  onPostClick,
  onLoadMoreNews,
  nextPage,
  onClearFilters,
  onTagClick,
  onViewAllNews,
}: Readonly<BlogPostsGridProps>) {
  const renderPostsList = () => {
    if (isLoadingNews && filteredPosts.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-muted-foreground text-lg">
            Loading content...
          </p>
        </div>
      );
    }

    if (filteredPosts.length > 0) {
      return filteredPosts.map((post, index) => (
        <motion.article
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: Math.min(index * 0.1, 0.5),
            ease: "easeOut",
          }}
          onClick={() => onPostClick(post)}
          className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row">
            {/* News article image */}
            {post.isNews && post.imageUrl && (
              <div className="sm:w-32 sm:h-32 flex-shrink-0">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              </div>
            )}

            <div className="flex-1 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  className={`${post.isNews
                    ? "bg-green-500/10 text-green-600 border border-green-500/20"
                    : "bg-primary/10 text-primary border border-primary/20"
                    } text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5`}
                >
                  {post.isNews && (
                    <NewspaperIcon className="h-3 w-3" />
                  )}
                  {post.category}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3" />
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ClockIcon className="h-3 w-3" />
                  {post.readTime}
                </div>
                {post.isNews &&
                  post.country &&
                  post.country.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <GlobeAltIcon className="h-3 w-3" />
                      {post.country[0].toUpperCase()}
                    </div>
                  )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                {post.title}
              </h2>

              <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed text-base">
                {post.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {post.isNews ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                        <NewspaperIcon className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {post.author}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {post.tags?.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
                  <span className="text-sm font-medium">
                    {post.isNews ? "Read Article" : "Read More"}
                  </span>
                  <ChevronRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </motion.article>
      ));
    }

    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <DocumentTextIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No articles found
        </h3>
        <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
          We couldn't find any articles matching your search criteria.
        </p>
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
        >
          Clear filters
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Posts List */}
          <div className="lg:col-span-2">
            {/* Modern News Error Alert */}
            {newsError && selectedCategory === "News" && (
              <div className="mb-8 bg-destructive/10 border border-destructive/20 rounded-xl p-6 flex items-start gap-4">
                <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-destructive font-semibold text-lg">
                    Unable to load news
                  </p>
                  <p className="text-muted-foreground mt-1">{newsError}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {renderPostsList()}
            </div>

            {/* Modern Load More News Button */}
            {selectedCategory === "News" && nextPage && (
              <div className="mt-12 text-center">
                <button
                  onClick={onLoadMoreNews}
                  disabled={isLoadingNews}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-card hover:bg-card/80 border border-border text-card-foreground rounded-xl transition-all duration-200 disabled:opacity-50 hover:shadow-lg font-medium"
                >
                  {isLoadingNews ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span>Loading more articles...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More News</span>
                      <ArrowRightIcon className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Modern Live News Feed Widget */}
            {newsArticles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border overflow-hidden"
              >
                <div className="p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <NewspaperIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Live Tech News
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Latest updates from the industry
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {newsArticles.slice(0, 5).map((news) => (
                      <button
                        key={news.id}
                        onClick={() => onPostClick(news)}
                        className="block w-full text-left group p-3 -m-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <p className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-2">
                          {news.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {new Date(news.date).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{news.author}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={onViewAllNews}
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm font-medium"
                  >
                    View All News
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Modern Newsletter CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-primary"
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
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Stay Updated
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Weekly insights & guides
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  Get the latest guides on proxies, RDP, VPS, VPN, and eSIM delivered
                  to your inbox every week.
                </p>
                <Link
                  to="/register"
                  className="block w-full text-center px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
                >
                  Subscribe Now
                </Link>
              </div>
            </motion.div>

            {/* Modern Popular Tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <TagIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Popular Topics
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Trending in our blog
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-wrap gap-3">
                  {[
                    "datacenter proxies",
                    "residential proxies",
                    "Windows RDP",
                    "Ubuntu VPS",
                    "eSIM cards",
                    "web scraping",
                    "forex trading",
                    "SEO tools",
                    "game servers",
                    "Docker",
                    "MetaTrader",
                    "international travel",
                  ].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => onTagClick(tag)}
                      className="bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary text-xs px-4 py-2 rounded-full transition-all duration-200 hover:shadow-sm"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Modern Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Quick Links
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Get started today
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <ul className="space-y-1">
                  {[
                    {
                      to: "/dashboard/buy-proxies",
                      label: "Buy Proxies",
                      icon: "🌐",
                    },
                    {
                      to: "/dashboard/buy-rdp",
                      label: "Buy RDP",
                      icon: "🖥️",
                    },
                    {
                      to: "/dashboard/buy-vps",
                      label: "Buy VPS",
                      icon: "⚡",
                    },
                    {
                      to: "/dashboard/esim-packages",
                      label: "Buy eSIM",
                      icon: "📱",
                    },
                    {
                      to: "/dashboard/vpn",
                      label: "Buy VPN",
                      icon: "🛡️",
                    },
                  ].map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="flex items-center justify-between p-3 -m-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm">{link.icon}</span>
                          <span className="text-sm font-medium">
                            {link.label}
                          </span>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Modern Resources */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Resources</h3>
                    <p className="text-xs text-muted-foreground">
                      Help & documentation
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <ul className="space-y-1">
                  {[
                    {
                      to: "/HowToConnect",
                      label: "Setup Guides",
                      icon: "📚",
                    },
                    { to: "/faq", label: "FAQ", icon: "❓" },
                    { to: "/contact", label: "Contact Support", icon: "💬" },
                  ].map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="flex items-center justify-between p-3 -m-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm">{link.icon}</span>
                          <span className="text-sm font-medium">
                            {link.label}
                          </span>
                        </div>
                        <ChevronRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
