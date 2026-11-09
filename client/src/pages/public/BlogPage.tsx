import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Search } from "lucide-react";
import type { ExtendedPost } from "@/data/blogPost";
import { getBlogPosts } from "@/services/blog";
import { useRedditTracking } from "@/utils/redditPixel";
import { ResourcePage, ResourceHero, ResourceClosing, ResourceEmpty } from "@/components/landing/resources/ResourceLayout";
import { ResourceArticleCard } from "@/components/landing/resources/ResourceArticleCard";

interface NewsItem { article_id?: string; title: string; description?: string; content?: string; source_id?: string; pubDate?: string; link: string; keywords?: string[]; image_url?: string; }
export default function BlogPage() {
  const newsKey = import.meta.env.VITE_NEWSDATA_API_KEY;
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const category = params.get("category") ?? "All";
  const [posts, setPosts] = useState<ExtendedPost[]>([]);
  const [news, setNews] = useState<ExtendedPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState(false);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const { trackPageView, trackViewContent, trackSearch } = useRedditTracking();

  useEffect(() => {
    let active = true;
    setLoading(true);
    getBlogPosts().then((data) => { if (active) { setPosts(data.posts); setCategories(data.categories.map((item) => item.name)); } }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    trackPageView();
    return () => { active = false; };
  }, [trackPageView]);

  async function fetchNews(page?: string, signal?: AbortSignal) {
    if (!newsKey) return;
    setNewsLoading(true); setNewsError(false);
    try {
      const query = new URLSearchParams({ apikey: newsKey, language: "en", category: "technology,business", q: "proxy OR VPS OR RDP OR VPN OR hosting OR cloud OR datacenter OR esim" });
      if (page) query.set("page", page);
      const response = await fetch(`https://newsdata.io/api/1/news?${query}`, { signal });
      if (!response.ok) throw new Error("News unavailable");
      const data = await response.json();
      if (data.status !== "success") throw new Error("News unavailable");
      const items: ExtendedPost[] = (data.results as NewsItem[]).map((item) => ({ id: item.article_id || item.link, title: item.title, excerpt: item.description || item.content?.slice(0, 200) || "", content: item.content || item.description || "", category: "News", author: item.source_id || "News source", date: item.pubDate || "", readTime: "News", featured: false, tags: item.keywords || [], isNews: true, sourceUrl: item.link, imageUrl: item.image_url }));
      if (signal?.aborted) return;
      setNews((previous) => Array.from(new Map((page ? [...previous, ...items] : items).map((item) => [item.id, item])).values()));
      setNextPage(data.nextPage || null);
    } catch { if (!signal?.aborted) setNewsError(true); }
    finally { if (!signal?.aborted) setNewsLoading(false); }
  }
  useEffect(() => { const controller = new AbortController(); void fetchNews(undefined, controller.signal); return () => controller.abort(); }, []);

  const availableCategories = useMemo(() => ["All", ...Array.from(new Set([...categories, ...posts.map((post) => post.category), ...(newsKey ? ["News"] : [])])).filter((item) => item !== "All")], [categories, posts, newsKey]);
  const filtered = useMemo(() => [...posts, ...news].filter((post) => (category === "All" || post.category === category) && `${post.title} ${post.excerpt} ${(post.tags ?? []).join(" ")}`.toLowerCase().includes(search.trim().toLowerCase())), [posts, news, category, search]);
  const featured = category === "All" && !search.trim() ? posts.find((post) => post.featured) : undefined;
  function changeFilter(key: string, value: string) { const next = new URLSearchParams(params); if (value && value !== "All") next.set(key, value); else next.delete(key); setParams(next, { replace: true, preventScrollReset: true }); if (key === "q" && value.length > 2) trackSearch(value, "blog"); }
  function trackPost(post: ExtendedPost) { trackViewContent({ productId: post.id, productName: post.title, category: post.isNews ? "news_article" : "blog_post", value: 0 }); }

  return <ResourcePage name="Blog & Insights" path="/blog" description="Explore ProxySock guides, practical insights and updates about proxies, servers, VPNs and eSIMs.">
    <ResourceHero label="Blog" title="Ideas worth reading." accent="Connections worth making." description="Practical guides, useful perspectives and updates for the infrastructure you use every day."><div className="resource-blog-hero-note"><p className="proxy-eyebrow">From understanding to doing</p><h2>A little knowledge.<br />A better starting point.</h2><p>Ready to configure your service? Our tutorials put the steps and examples in one place.</p><Link to="/HowToConnect">Explore setup guides<ArrowUpRight size={15} aria-hidden="true" /></Link></div></ResourceHero>
    <section className="resource-content" aria-label="Blog articles"><div className="resource-filterbar"><div className="resource-filters" role="group" aria-label="Article categories">{availableCategories.map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => changeFilter("category", item)}>{item}</button>)}</div><label className="resource-search"><Search size={15} aria-hidden="true" /><input type="search" aria-label="Search articles" placeholder="Search articles and topics" value={search} onChange={(event) => changeFilter("q", event.target.value)} /></label></div>
      {loading ? <ResourceEmpty title="Loading articles…" /> : error && !news.length ? <ResourceEmpty title="Articles are temporarily unavailable."><p>Please try again shortly.</p><button onClick={() => window.location.reload()}>Reload articles</button></ResourceEmpty> : <>{featured && <ResourceArticleCard post={featured} featured onOpen={trackPost} />}<div className="resource-section-heading"><h2>{category === "All" ? "From the journal" : category}</h2><span className="resource-count">{filtered.length} {filtered.length === 1 ? "article" : "articles"}</span></div>{filtered.length ? <div className="resource-article-grid">{filtered.filter((post) => post.id !== featured?.id).map((post) => <ResourceArticleCard key={post.id} post={post} onOpen={trackPost} />)}</div> : <ResourceEmpty title="No articles found."><p>Try a different topic or category.</p><button onClick={() => setParams({}, { replace: true })}>Clear filters</button></ResourceEmpty>}</>}
      {(category === "News" || category === "All") && newsKey && <div className="resource-blog-news-actions">{newsError && <p role="status" className="resource-note">News is temporarily unavailable. Your ProxySock articles remain available.</p>}<button type="button" disabled={newsLoading} onClick={() => void fetchNews()}>{newsLoading ? "Loading news…" : "Refresh news"}</button>{nextPage && <button type="button" disabled={newsLoading} onClick={() => void fetchNews(nextPage)}>Load more news</button>}</div>}
    </section><ResourceClosing title="Put what you've learned" accent="into your next connection." />
  </ResourcePage>;
}
