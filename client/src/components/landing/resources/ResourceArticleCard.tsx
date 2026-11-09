import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { ExtendedPost } from "@/data/blogPost";

export function articleDate(date: string) {
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? "" : value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export function ResourceArticleCard({ post, featured = false, onOpen }: { post: ExtendedPost; featured?: boolean; onOpen?: (post: ExtendedPost) => void }) {
  const heading = <>{post.title}</>;
  const destination = post.isNews && post.sourceUrl && /^https?:\/\//i.test(post.sourceUrl) ? post.sourceUrl : `/blog/${post.id}`;
  const articleLink = (children: React.ReactNode, className?: string) => post.isNews ? <a href={destination} className={className} target="_blank" rel="noreferrer" onClick={() => onOpen?.(post)}>{children}</a> : <Link to={destination} className={className} onClick={() => onOpen?.(post)}>{children}</Link>;
  return <article className={featured ? "resource-featured" : "resource-article-card"}>
    {articleLink(<div className="resource-article-image">{post.imageUrl ? <img src={post.imageUrl} alt="" loading="lazy" /> : <div className="resource-article-image-placeholder" aria-hidden="true">{post.category}<span className="sr-only">Article illustration</span></div>}</div>, "resource-article-image-link")}
    <div className="resource-article-body"><span className="resource-count">{featured ? "Featured / " : ""}{post.category}</span>{featured ? <h2>{articleLink(heading)}</h2> : <h3>{articleLink(heading)}</h3>}<p>{post.excerpt}</p><div className="resource-article-meta"><span>{articleDate(post.date)} · {post.readTime}</span>{articleLink(<>{post.isNews ? "Read at source" : "Read article"}<ArrowUpRight size={13} aria-hidden="true" /></>)}</div></div>
  </article>;
}
