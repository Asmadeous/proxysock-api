import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { ResourcePage, ResourceHero, ResourceClosing } from "@/components/landing/resources/ResourceLayout";
import "./use-cases.css";

const purposes = [
  { title: "Web scraping", group: "Research & business", copy: "Collect publicly available information for research, price comparisons and analysis.", detail: "Consider the locations, request volume and session duration your workflow needs." },
  { title: "Ecommerce", group: "Research & business", copy: "View regional storefronts and compare product information across markets.", detail: "Match your proxy location to the market you want to observe." },
  { title: "Traffic arbitrage & ad verification", group: "Research & business", copy: "Check how campaign destinations and advertising pages appear in different regions.", detail: "Use location-specific connections to inspect your campaign experience." },
  { title: "Social media", group: "Content & communities", copy: "Support account workflows and check how your content appears in different locations.", detail: "Choose session consistency that suits your tools and follow each platform’s account rules." },
  { title: "Streaming", group: "Content & communities", copy: "Test regional media experiences and content delivery with a connection in your target location.", detail: "Service compatibility and access depend on the streaming provider." },
  { title: "Gaming", group: "Content & communities", copy: "Explore regional connection requirements and test supported gaming workflows.", detail: "Check client compatibility first; a proxy does not guarantee lower latency." },
  { title: "Sneakers & retail", group: "Shopping & specialist tools", copy: "Research product availability and compare regional retail experiences.", detail: "Check retailer policies and the connection requirements of your tools." },
  { title: "Ticketing", group: "Shopping & specialist tools", copy: "Explore regional event listings and supported ticketing workflows.", detail: "Availability and purchasing limits remain subject to the ticketing platform." },
  { title: "Other purposes", group: "Shopping & specialist tools", copy: "Have a workflow that doesn’t fit a category? Tell us what you’re trying to build.", detail: "Share your software, target locations and connection needs with our support team." },
];
const groups = ["All use cases", "Research & business", "Content & communities", "Shopping & specialist tools"];
export default function ProxyPurpose() {
  const [group, setGroup] = useState(groups[0]);
  const visible = purposes.filter(item => group === groups[0] || item.group === group);
  return <ResourcePage name="Proxy Use Cases" path="/proxy-purpose" description="Explore proxy use cases for research, ecommerce, content and specialist workflows. Find the connection requirements that fit your project.">
    <ResourceHero label="Proxy use cases" title="A connection for" accent="what you do next." description="Start with your workflow. Explore how proxies can support your project, then choose the location, session and service type that fit." />
    <section className="use-case-section" aria-labelledby="use-case-title"><div className="proxy-section-heading"><div><p className="proxy-eyebrow">Explore the possibilities</p><h2 id="use-case-title">Different work.<br /><em>A clearer starting point.</em></h2></div><Link to="/proxies" className="proxy-text-link">Compare proxy types <ArrowUpRight size={16} aria-hidden="true" /></Link></div><div className="resource-filters" role="group" aria-label="Filter use cases">{groups.map(item => <button key={item} onClick={() => setGroup(item)} aria-pressed={item === group}>{item}</button>)}</div><p className="use-case-count" role="status">{visible.length} use cases</p><div className="use-case-grid">{visible.map(item => <article key={item.title}><p className="proxy-eyebrow">{item.group}</p><h3>{item.title}</h3><p>{item.copy}</p><div><span>What to consider</span><p>{item.detail}</p></div><Link to={item.title === 'Other purposes' ? '/contact' : '/proxies'} className="proxy-text-link">{item.title === 'Other purposes' ? 'Discuss your workflow' : 'Explore proxy options'} <ArrowUpRight size={15} aria-hidden="true" /></Link></article>)}</div></section>
    <ResourceClosing title="Know your next step?" accent="Find your connection." href="/proxies" action="Explore proxy plans" />
  </ResourcePage>;
}
