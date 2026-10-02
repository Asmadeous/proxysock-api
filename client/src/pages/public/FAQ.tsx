import { useState } from "react";
import { Search, Plus, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ResourcePage, ResourceHero, ResourceClosing, ResourceEmpty } from "@/components/landing/resources/ResourceLayout";
import { faqData } from "@/components/landing/resources/faq-data";
import { conversionTracker } from "@/utils/redditPixel";

const categories = ["general", "proxies", "vps", "rdp", "vpn", "esim"];
const labels: Record<string, string> = { general: "General", proxies: "Proxies", vps: "VPS", rdp: "RDP", vpn: "VPN", esim: "eSIM" };
export default function FAQ() {
  const [category, setCategory] = useState("general");
  const [query, setQuery] = useState("");
  const questions = query.trim() ? categories.flatMap((key) => (faqData[key] ?? []).map((item) => ({ ...item, category: key }))).filter((item) => `${item.question} ${item.answer}`.toLowerCase().includes(query.trim().toLowerCase())) : (faqData[category] ?? []).map((item) => ({ ...item, category }));
  return <ResourcePage name="Frequently Asked Questions" path="/faq" description="Find answers about ProxySock accounts, payments, proxies, VPS, RDP, VPN and eSIM services.">
    <ResourceHero label="FAQs" title="Good questions." accent="Clearer answers." description="From choosing a service to making your first connection, find the details you need to move forward."><div className="resource-mini-links"><Link to="/HowToConnect">Looking for setup instructions?<ArrowUpRight size={17} aria-hidden="true" /></Link><Link to="/contact">Need help with your service?<ArrowUpRight size={17} aria-hidden="true" /></Link></div></ResourceHero>
    <section className="resource-content" aria-label="Frequently asked questions">
      <div className="resource-filterbar"><p className="resource-count">The help library</p><label className="resource-search"><Search size={15} aria-hidden="true" /><input type="search" aria-label="Search questions" placeholder="Search questions" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
      <div className="resource-faq-layout"><aside className="resource-faq-sidebar"><div className="resource-filters" role="group" aria-label="Question categories">{categories.map((key) => <button key={key} type="button" aria-pressed={!query && category === key} onClick={() => { setCategory(key); setQuery(""); }}>{labels[key]}</button>)}</div></aside><div className="resource-faq-main"><h2>{query.trim() ? "Search results" : `${labels[category]} questions`}</h2>{questions.length ? <div className="proxy-faq-list">{questions.map((item) => <details key={`${item.category}-${item.question}`} onToggle={(event) => { if (event.currentTarget.open) void Promise.resolve(conversionTracker.trackSearch(item.question, `faq_${item.category}`)).catch(() => {}); }}><summary><span>{query.trim() && <span className="resource-faq-result-category">{labels[item.category]}</span>}{item.question}</span><Plus size={17} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div> : <ResourceEmpty title="No answers found."><p>Try a service name or a shorter phrase.</p><button onClick={() => setQuery("")}>Clear search</button></ResourceEmpty>}</div></div>
    </section><ResourceClosing title="Still have a question?" accent="Let's work it out." href="/HowToConnect" action="Explore tutorials" />
  </ResourcePage>;
}
