import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/services/api";
import { getBlogPost, getBlogPosts } from "@/services/blog";
import IPChecker from "./IPChecker";
import Locations from "./Locations";
import FAQ from "./FAQ";
import Contact from "./Contact";
import BlogPage from "./BlogPage";
import BlogPostPage from "./BlogPostPage";

vi.mock("@/services/api", () => ({ default: { get: vi.fn() } }));
vi.mock("@/services/blog", () => ({ getBlogPosts: vi.fn(), getBlogPost: vi.fn() }));
vi.mock("@/utils/redditPixel", () => {
  const tracking = { trackPageView: vi.fn(), trackSearch: vi.fn(), trackViewContent: vi.fn() };
  return { useRedditTracking: () => tracking, conversionTracker: { trackSearch: vi.fn(), trackLead: vi.fn() } };
});
const posts = [
  { id: "server-guide", title: "A guide to servers", excerpt: "Choose an environment for your project.", category: "VPS", author: "ProxySock", date: "2026-10-01", readTime: "4 min", featured: true, tags: ["hosting"], content: "<h2>Your environment</h2><p>Server guide content.</p>" },
  { id: "travel-guide", title: "Stay connected abroad", excerpt: "A practical eSIM guide.", category: "eSIM", author: "ProxySock", date: "2026-10-01", readTime: "3 min", featured: false, tags: ["travel"], content: "<p>Travel guide content.</p>" },
];
beforeEach(() => {
  vi.stubEnv("VITE_NEWSDATA_API_KEY", "");
  vi.mocked(api.get).mockResolvedValue({ data: { ip: "203.0.113.10", country_name: "Canada" } });
  vi.mocked(getBlogPosts).mockResolvedValue({ posts, total: 2, categories: [{ name: "VPS", count: 1 }, { name: "eSIM", count: 1 }] });
  vi.mocked(getBlogPost).mockResolvedValue(posts[0]);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "success", results: [], nextPage: null }) }));
  localStorage.clear();
});
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
function show(page: React.ReactNode, path = "/") {
  render(<HelmetProvider><MemoryRouter initialEntries={[path]}>{page}</MemoryRouter></HelmetProvider>);
}

describe("Resource tools", () => {
  it("automatically detects an IP and submits manual lookups through the existing API", async () => {
    const user = userEvent.setup();
    show(<IPChecker />);
    expect(screen.getByRole("status")).toHaveTextContent("Looking up");
    await screen.findByRole("heading", { name: "203.0.113.10" });
    expect(api.get).toHaveBeenCalledWith("/web/api/tools/ip_checker");
    vi.mocked(api.get).mockResolvedValueOnce({ data: { ip: "198.51.100.4", country_name: "France" } });
    const input = screen.getByRole("textbox", { name: "IP address" });
    await user.clear(input); await user.type(input, "198.51.100.4{Enter}");
    await screen.findByRole("heading", { name: "198.51.100.4" });
    expect(api.get).toHaveBeenLastCalledWith("/web/api/tools/ip_checker", { params: { ip: "198.51.100.4" } });
  });
  it("shows lookup errors without hiding the form and allows retry", async () => {
    const user = userEvent.setup();
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Unavailable"));
    show(<IPChecker />);
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't complete the lookup.");
    expect(screen.getByRole("textbox", { name: "IP address" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("heading", { name: "203.0.113.10" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("filters locations by service and destination and links to plans", async () => {
    const user = userEvent.setup();
    show(<Locations />);
    await user.click(screen.getByRole("button", { name: "RDP" }));
    await user.type(screen.getByRole("searchbox", { name: "Search locations" }), "New York");
    expect(screen.getByRole("heading", { name: "United States" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "United Kingdom" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New York" })).toHaveAttribute("href", "/dashboard/rdp");
    await user.clear(screen.getByRole("searchbox", { name: "Search locations" }));
    await user.click(screen.getByRole("button", { name: "eSIM" }));
    await user.type(screen.getByRole("searchbox", { name: "Search locations" }), "Japan");
    expect(screen.getByRole("heading", { name: "Asia Pacific" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View available plans" })).toHaveAttribute("href", "/dashboard/global-esim");
  });
  it("opens VPN questions and searches across FAQ categories", async () => {
    const user = userEvent.setup();
    show(<FAQ />);
    await user.click(screen.getByRole("button", { name: "VPN" }));
    expect(screen.getByRole("heading", { name: "VPN questions" })).toBeInTheDocument();
    await user.click(screen.getByText("How do I set up my VPN?"));
    expect(screen.getByText("How do I set up my VPN?").closest("details")).toHaveAttribute("open");
    await user.type(screen.getByRole("searchbox", { name: "Search questions" }), "payment methods");
    expect(screen.getByText("What payment methods do you accept?")).toBeInTheDocument();
    expect(screen.queryByText("How do I set up my VPN?")).not.toBeInTheDocument();
  });
  it("opens support chat and preserves billing and business email destinations", async () => {
    const user = userEvent.setup();
    const opened = vi.fn();
    window.addEventListener("open-chat", opened);
    show(<Contact />);
    await user.click(screen.getByRole("button", { name: "Open support chat" }));
    expect(opened).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Contact billing" })).toHaveAttribute("href", "mailto:billing@proxysock.com");
    expect(screen.getByRole("link", { name: "Contact the business team" })).toHaveAttribute("href", "mailto:business@proxysock.com");
    window.removeEventListener("open-chat", opened);
  });
});

describe("Blog resources", () => {
  it("keeps configured news and pagination with links to the original source", async () => {
    const user = userEvent.setup();
    vi.stubEnv("VITE_NEWSDATA_API_KEY", "test-news-key");
    const newsItem = { article_id: "news-1", title: "Infrastructure update", description: "A source update.", link: "https://example.com/news", source_id: "Example", pubDate: "2026-10-01" };
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ status: "success", results: [newsItem], nextPage: "next-token" })));
    show(<BlogPage />, "/blog?category=News");
    await screen.findByRole("heading", { name: "Infrastructure update" });
    expect(screen.getByRole("link", { name: "Read at source" })).toHaveAttribute("href", "https://example.com/news");
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ status: "success", results: [{ ...newsItem, article_id: "news-2", title: "Another update", link: "https://example.com/other" }], nextPage: null })));
    await user.click(screen.getByRole("button", { name: "Load more news" }));
    await screen.findByRole("heading", { name: "Another update" });
    expect(vi.mocked(fetch).mock.calls[1][0]).toContain("page=next-token");
    expect(screen.getByRole("heading", { name: "Infrastructure update" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more news" })).not.toBeInTheDocument();
  });
  it("renders arriving articles and filters by category and search", async () => {
    const user = userEvent.setup();
    show(<BlogPage />, "/blog");
    await screen.findByRole("heading", { name: "A guide to servers" });
    await user.click(screen.getByRole("button", { name: "eSIM" }));
    expect(screen.getByRole("heading", { name: "Stay connected abroad" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "A guide to servers" })).not.toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", { name: "Search articles" }), "no matching article");
    expect(screen.getByRole("heading", { name: "No articles found." })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("heading", { name: "A guide to servers" })).toBeInTheDocument();
  });
  it("uses a topic query from article links", async () => {
    show(<BlogPage />, "/blog?q=travel");
    await screen.findByRole("heading", { name: "Stay connected abroad" });
    expect(screen.queryByRole("heading", { name: "A guide to servers" })).not.toBeInTheDocument();
  });
  it("renders articles, saves bookmarks and copies share links", async () => {
    const user = userEvent.setup();
    const copy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    show(<Routes><Route path="/blog/:id" element={<BlogPostPage />} /></Routes>, "/blog/server-guide");
    await screen.findByRole("heading", { name: "A guide to servers" });
    expect(screen.getByText("Server guide content.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save article" }));
    expect(JSON.parse(localStorage.getItem("blog_bookmarks")!)).toEqual(["server-guide"]);
    expect(screen.getByRole("button", { name: "Saved" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Share article" }));
    expect(copy).toHaveBeenCalledWith(window.location.href);
    expect(screen.getByRole("status")).toHaveTextContent("Article link copied.");
    expect(screen.getByRole("link", { name: "hosting" })).toHaveAttribute("href", "/blog?q=hosting");
    const related = screen.getByRole("heading", { name: "Keep exploring." }).closest("section")!;
    expect(within(related).queryByRole("heading", { name: "A guide to servers" })).not.toBeInTheDocument();
  });
  it("shows an unavailable article with a route back to the journal", async () => {
    vi.mocked(getBlogPost).mockRejectedValueOnce({ response: { status: 404 } });
    show(<Routes><Route path="/blog/:id" element={<BlogPostPage />} /></Routes>, "/blog/missing");
    await screen.findByRole("heading", { name: "This article wasn't found." });
    expect(screen.getByRole("link", { name: "Browse articles" })).toHaveAttribute("href", "/blog");
  });
});
