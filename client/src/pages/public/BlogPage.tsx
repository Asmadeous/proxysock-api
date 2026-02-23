// BlogPage.tsx - SEO-optimized blog with Reddit pixel tracking and Newsdata.io integration
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRedditTracking } from "../../utils/redditPixel";
import { blogPosts, type ExtendedPost } from "../../data/blogPost";
import { BlogHeroSection } from "../../components/landing/blog/BlogHeroSection";
import { BlogNewsTicker } from "../../components/landing/blog/BlogNewsTicker";
import { BlogSearchFilter } from "../../components/landing/blog/BlogSearchFilter";
import { BlogFeaturedPosts } from "../../components/landing/blog/BlogFeaturedPosts";
import { BlogPostsGrid } from "../../components/landing/blog/BlogPostsGrid";
import backgroundNode from "@/assets/images/backgroundNode.webp";
import backgroundNodeRed from "@/assets/images/backgroundNodeRed.webp";
import { useThemeStore } from "@/store/themeStore";

// Newsdata.io Types
interface NewsArticle {
  title: string;
  link: string;
  keywords: string[] | null;
  creator: string[] | null;
  video_url: string | null;
  description: string | null;
  content: string | null;
  pubDate: string;
  image_url: string | null;
  source_id: string;
  country: string[];
  category: string[];
  language: string;
}

interface NewsResponse {
  status: string;
  totalResults: number;
  results: NewsArticle[];
  nextPage: string | null;
}



interface Category {
  name: string;
  count: number;
}

// Newsdata.io API Configuration
const NEWSDATA_API_KEY =
  import.meta.env.VITE_NEWSDATA_API_KEY || "YOUR_NEWSDATA_API_KEY";
const NEWSDATA_BASE_URL = "https://newsdata.io/api/1/news";

// Categories for filtering
const categories: Category[] = [
  { name: "All", count: blogPosts.length },
  {
    name: "Proxies",
    count: blogPosts.filter((p) => p.category === "Proxies").length,
  },
  { name: "RDP", count: blogPosts.filter((p) => p.category === "RDP").length },
  { name: "VPS", count: blogPosts.filter((p) => p.category === "VPS").length },
  {
    name: "eSIM",
    count: blogPosts.filter((p) => p.category === "eSIM").length,
  },
  {
    name: "Tutorials",
    count: blogPosts.filter((p) => p.category === "Tutorials").length,
  },
  { name: "News", count: 0 }, // Will be updated dynamically
];

export default function BlogPage() {
  const { dark } = useThemeStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredPosts, setFilteredPosts] = useState<ExtendedPost[]>(blogPosts);
  const [newsArticles, setNewsArticles] = useState<ExtendedPost[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { trackPageView, trackSearch, trackViewContent } = useRedditTracking();

  // Fetch news from Newsdata.io
  const fetchNews = async (page: string | null = null) => {
    setIsLoadingNews(true);
    setNewsError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        apikey: NEWSDATA_API_KEY,
        language: "en",
        category: "technology,business",
        q: "proxy OR VPS OR RDP OR hosting OR cloud OR datacenter OR esim",
      });

      if (page) {
        params.append("page", page);
      }

      const response = await fetch(`${NEWSDATA_BASE_URL}?${params}`);

      if (!response.ok) {
        throw new Error(`News API Error: ${response.status}`);
      }

      const data: NewsResponse = await response.json();

      if (data.status === "success") {
        // Transform news data to match your blog post structure
        const transformedNews: ExtendedPost[] = data.results.map(
          (article, index) => ({
            id: `news-${Date.now()}-${index}`,
            title: article.title,
            excerpt:
              article.description ||
              (article.content
                ? article.content.substring(0, 200) + "..."
                : ""),
            content: article.content || article.description || "",
            author: article.source_id || "News Source",
            date: article.pubDate || new Date().toISOString(),
            category: "News",
            tags: article.keywords || ["technology", "news"],
            readTime: "3 min read",
            featured: false,
            isNews: true,
            sourceUrl: article.link,
            imageUrl: article.image_url,
            country: article.country,
            language: article.language,
          })
        );

        setNewsArticles((prevNews) =>
          page ? [...prevNews, ...transformedNews] : transformedNews
        );
        setNextPage(data.nextPage || null);

        // Update news count in categories
        const newsCategory = categories.find((cat) => cat.name === "News");
        if (newsCategory) {
          newsCategory.count = transformedNews.length;
        }
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      setNewsError(
        error instanceof Error ? error.message : "Failed to fetch news"
      );
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Fetch news on component mount
  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    // SEO Meta Tags
    document.title =
      "ProxySock Blog - Guides for Proxies, RDP, VPS & eSIM Services | Latest Tech News";

    const metaDescription = document.createElement("meta");
    metaDescription.setAttribute("name", "description");
    metaDescription.content =
      "Find answers to common questions about our proxy, VPS, RDP, and eSIM services. Get help with setup, billing, technical issues, and stay updated with latest tech news.";
    document.head.appendChild(metaDescription);

    const metaKeywords = document.createElement("meta");
    metaKeywords.setAttribute("name", "keywords");
    metaKeywords.content =
      "proxy guides, RDP tutorials, VPS hosting guides, eSIM setup, web scraping tutorial, forex RDP, game server VPS, datacenter proxies, residential proxies, Windows RDP, Ubuntu VPS, tech news, cloud computing news";
    document.head.appendChild(metaKeywords);

    // Open Graph
    const ogTitle = document.createElement("meta");
    ogTitle.setAttribute("property", "og:title");
    ogTitle.content =
      "ProxySock Blog - Expert Guides for Digital Infrastructure & Tech News";
    document.head.appendChild(ogTitle);

    // Structured Data for Blog
    const structuredData = document.createElement("script");
    structuredData.type = "application/ld+json";
    structuredData.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "ProxySock Blog",
      description:
        "Expert guides for proxies, RDP, VPS, and eSIM services with latest tech news",
      url: "https://proxysock.com/blog",
      publisher: {
        "@type": "Organization",
        name: "ProxySock",
        logo: {
          "@type": "ImageObject",
          url: "https://proxysock.com/assets/images/logo.svg",
        },
      },
      blogPost: blogPosts.slice(0, 5).map((post) => ({
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date,
        author: {
          "@type": "Person",
          name: post.author,
        },
      })),
    });
    document.head.appendChild(structuredData);

    // Track page view with Reddit Pixel
    trackPageView();

    // Cleanup
    return () => {
      metaDescription.remove();
      metaKeywords.remove();
      ogTitle.remove();
      structuredData.remove();
    };
  }, [trackPageView]);

  useEffect(() => {
    // Filter posts based on category and search
    let filtered: ExtendedPost[] = [];

    // Combine blog posts and news articles
    const allContent: ExtendedPost[] = [...blogPosts, ...newsArticles];

    if (selectedCategory === "All") {
      filtered = allContent;
    } else if (selectedCategory === "News") {
      filtered = newsArticles;
    } else {
      filtered = blogPosts.filter((post) => post.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.tags?.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );

      // Track search with Reddit Pixel
      if (searchTerm.length > 2) {
        trackSearch(searchTerm, "blog");
      }
    }

    setFilteredPosts(filtered);
  }, [selectedCategory, searchTerm, newsArticles]); // Removed trackSearch from deps to prevent loop

  const handlePostClick = (post: ExtendedPost) => {
    // Track content view with Reddit Pixel
    trackViewContent({
      productId: post.id,
      productName: post.title,
      category: post.isNews ? "news_article" : "blog_post",
      value: 0,
    });

    // For news articles, open in new tab
    if (post.isNews && post.sourceUrl) {
      globalThis.open(post.sourceUrl, "_blank");
    } else {
      navigate(`/blog/${post.id}`);
    }
  };

  const handleLoadMoreNews = () => {
    if (nextPage && !isLoadingNews) {
      fetchNews(nextPage);
    }
  };

  const featuredPosts = blogPosts.filter((post) => post.featured);

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-[0.10] pointer-events-none"
          style={{
            backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="relative z-10">
          <BlogHeroSection newsArticlesLength={newsArticles.length} />
        </div>
      </div>

      {/* Modern News Ticker */}
      <BlogNewsTicker
        newsArticles={newsArticles}
        onPostClick={handlePostClick}
        onViewAllNews={() => setSelectedCategory("News")}
      />

      {/* Modern Search and Filter Section */}
      <BlogSearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        isLoadingNews={isLoadingNews}
        onRefreshNews={() => fetchNews()}
      />

      {/* Modern Featured Posts Section */}
      <BlogFeaturedPosts
        featuredPosts={featuredPosts}
        onPostClick={handlePostClick}
        selectedCategory={selectedCategory}
        searchTerm={searchTerm}
      />

      {/* Modern Blog Posts Grid */}
      <BlogPostsGrid
        filteredPosts={filteredPosts}
        newsError={newsError}
        selectedCategory={selectedCategory}
        isLoadingNews={isLoadingNews}
        newsArticles={newsArticles}
        onPostClick={handlePostClick}
        onLoadMoreNews={handleLoadMoreNews}
        nextPage={nextPage}
        onClearFilters={() => {
          setSearchTerm("");
          setSelectedCategory("All");
        }}
        onTagClick={setSearchTerm}
        onViewAllNews={() => setSelectedCategory("News")}
      />

      {/* Related Products CTA */}
      {/* <BlogRelatedProducts /> */}

      {/* Footer */}
      {/* <BlogFooter /> */}
    </div>
  );
}
