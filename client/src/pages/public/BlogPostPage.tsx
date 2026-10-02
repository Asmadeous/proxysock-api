import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Bookmark, Share2 } from "lucide-react";
import type { ExtendedPost } from "@/data/blogPost";
import { getBlogPost, getBlogPosts } from "@/services/blog";
import { useRedditTracking } from "@/utils/redditPixel";
import { ReadingProgress } from "@/components/landing/blog/ReadingProgress";
import { ResourcePage, ResourceClosing, ResourceEmpty } from "@/components/landing/resources/ResourceLayout";
import { ResourceArticleCard, articleDate } from "@/components/landing/resources/ResourceArticleCard";

function bookmarks(): string[] {
  try { const saved = JSON.parse(localStorage.getItem("blog_bookmarks") || "[]"); return Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : []; } catch { return []; }
}
export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<ExtendedPost | null>(null);
  const [related, setRelated] = useState<ExtendedPost[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const { trackPageView, trackViewContent } = useRedditTracking();
  useEffect(() => {
    let active = true;
    setStatus("loading"); setPost(null); setRelated([]); setMessage(""); setSaved(bookmarks().includes(id || ""));
    if (!id) { setStatus("missing"); return; }
    getBlogPost(id).then((article) => {
      if (!active) return;
      setPost(article); setStatus("ready"); trackPageView(); trackViewContent({ productId: article.id, productName: article.title, category: "blog_post", value: 0 });
      getBlogPosts({ category: article.category }).then((data) => { if (active) setRelated(data.posts.filter((item) => item.id !== id && item.id !== article.id).slice(0,3)); }).catch(() => {});
    }).catch((error) => { if (active) setStatus(error.response?.status === 404 ? "missing" : "error"); });
    return () => { active = false; };
  }, [id, retry, trackPageView, trackViewContent]);
  function toggleBookmark() {
    if (!id) return;
    try { localStorage.setItem("blog_bookmarks", JSON.stringify(saved ? bookmarks().filter((item) => item !== id) : [...new Set([...bookmarks(), id])])); setSaved(!saved); setMessage(saved ? "Article removed from saved articles." : "Article saved in this browser."); }
    catch { setMessage("Your browser couldn't save this article."); }
  }
  async function share() {
    try {
      if (navigator.share) { await navigator.share({ title: post?.title, text: post?.excerpt, url: window.location.href }); setMessage("Article shared."); }
      else { await navigator.clipboard.writeText(window.location.href); setMessage("Article link copied."); }
    } catch (error) { if (error instanceof Error && error.name === "AbortError") return; setMessage("Couldn't share automatically. You can copy the page address from your browser."); }
  }
  return <ResourcePage name={post ? `${post.title} — Blog` : "Blog article"} path={`/blog/${id || ""}`} description={post?.excerpt || "Read ProxySock's practical guides and infrastructure insights."}>
    <ReadingProgress />
    <article className="resource-post"><header className="resource-post-header"><Link to="/blog" className="proxy-text-link"><ArrowLeft size={15} aria-hidden="true" />Back to the journal</Link>
      {post && <><Helmet><meta property="og:type" content="article" /><meta property="article:published_time" content={post.date} /></Helmet><p className="proxy-eyebrow mt-8">{post.category}</p><h1>{post.title}</h1><p>{post.excerpt}</p><div className="resource-article-meta"><span>{post.author}</span><span>{articleDate(post.date)} · {post.readTime}</span></div><div className="resource-post-actions"><button type="button" onClick={toggleBookmark} aria-pressed={saved}><Bookmark size={15} aria-hidden="true" />{saved ? "Saved" : "Save article"}</button><button type="button" onClick={() => void share()}><Share2 size={15} aria-hidden="true" />Share article</button><span className="resource-post-message" role="status">{message}</span></div></>}
    </header>
    {status === "loading" && <ResourceEmpty title="Loading article…" />}{status === "missing" && <ResourceEmpty title="This article wasn't found."><p>Explore the journal for more guides and insights.</p><Link to="/blog">Browse articles</Link></ResourceEmpty>}{status === "error" && <ResourceEmpty title="We couldn't load this article."><p>Please try again shortly.</p><button type="button" onClick={() => setRetry(retry + 1)}>Try again</button></ResourceEmpty>}
    {post && <><div className="resource-post-body" dangerouslySetInnerHTML={{ __html: post.content }} /><div className="resource-post-tags" aria-label="Article topics">{post.tags.map((tag) => <Link key={tag} to={`/blog?q=${encodeURIComponent(tag)}`}>{tag}</Link>)}</div></>}
    </article>
    {related.length > 0 && <section className="resource-section" aria-labelledby="related-title"><div className="resource-section-heading"><h2 id="related-title">Keep exploring.</h2></div><div className="resource-article-grid">{related.map((article) => <ResourceArticleCard key={article.id} post={article} />)}</div></section>}
    <ResourceClosing title="From reading" accent="to your next connection." />
  </ResourcePage>;
}
