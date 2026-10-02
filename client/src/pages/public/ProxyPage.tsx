import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { ProxyPageHeroSection } from "@/components/landing/services/proxies/ProxyPageHeroSection";
import { ProxyType } from "@/components/landing/services/proxies/ProxyType";
import "./proxies.css";

const useCases = [
  { title: "Market research", description: "Explore publicly available information and compare what different markets see." },
  { title: "E-commerce insights", description: "Follow product availability, catalogue changes and public pricing across locations." },
  { title: "Search monitoring", description: "Review search results and keep an eye on how your web presence appears in different regions." },
  { title: "Testing & automation", description: "Connect your scripts and test your applications through a proxy-enabled workflow." },
];
const faqs = [
  ["Which proxy type should I choose?", "Start with your workflow. Datacenter proxies suit repeatable data collection and testing. ISP and static residential options suit projects that need a consistent address. Rotating residential proxies offer an address pool for workflows that need different connections. Compare the plan details before you purchase."],
  ["Where can I see prices and available locations?", "Open the proxy plans in your dashboard. Select a category to see available plans, locations and configuration options. Pricing depends on the plan, quantity and duration you choose."],
  ["Can I use HTTP or SOCKS5?", "The proxy purchase flow supports HTTP and SOCKS5 selection. Check your chosen plan and the requirements of the application you want to connect before completing your order."],
  ["Do all plans include unlimited bandwidth?", "Bandwidth allowances depend on the proxy type and plan. Review the bandwidth and usage details for your selected plan before purchasing."],
  ["How do I connect after purchasing?", "Your account contains your proxy connection details. Use the setup documentation to add them to your browser, application or script. Our support team can help if you need a hand."],
];

export default function ProxyPage() {
  return (
    <div className="proxy-page">
      <Helmet><title>Datacenter, ISP & Residential Proxies | ProxySock</title><meta name="description" content="Compare datacenter, ISP, static and rotating residential proxies. Find the right connection for research, testing and automation with ProxySock." /></Helmet>
      <ProxyPageHeroSection />
      <ProxyType />
      <section id="proxy-workflows" className="proxy-workflows" aria-labelledby="proxy-workflows-title">
        <div className="proxy-section-heading"><div><p className="proxy-eyebrow">Put your proxies to work</p><h2 id="proxy-workflows-title">Your workflow.<br /><em>A wider perspective.</em></h2></div></div>
        <div className="proxy-workflow-grid">{useCases.map(({ title, description }) => <article key={title}><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>
      <section id="proxy-setup" className="proxy-setup" aria-labelledby="proxy-setup-title">
        <div className="proxy-section-heading"><div><p className="proxy-eyebrow">From choice to connection</p><h2 id="proxy-setup-title">Set up once.<br /><em>Get on with your work.</em></h2></div><Link className="proxy-text-link" to="/HowToConnect">Read the setup guides <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
        <div className="proxy-setup-grid">
          <article><h3>Choose your connection</h3><p>Compare proxy types, then select the plan, location and quantity that fit your project.</p><span>Options in your dashboard</span></article>
          <article><h3>Connect your tools</h3><p>Find your connection details in your account and follow the guide for your application.</p><span>Step-by-step documentation</span></article>
          <article><h3>Keep moving forward</h3><p>Manage your services from one account. Reach out to our team when you need help.</p><Link to="/contact">Talk to support <ArrowUpRight size={13} aria-hidden="true" /></Link></article>
        </div>
      </section>
      <section id="proxy-faq" className="proxy-faq" aria-labelledby="proxy-faq-title">
        <div><p className="proxy-eyebrow">A little more clarity</p><h2 id="proxy-faq-title">Before you<br /><em>connect.</em></h2><Link className="proxy-text-link" to="/contact">Contact us <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
        <div className="proxy-faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div>
      </section>
      <section className="proxy-closing" aria-labelledby="proxy-closing-title"><div><p className="proxy-eyebrow">Your next connection</p><h2 id="proxy-closing-title">Find your proxy.<br /><span>Make your next move.</span></h2><p>Explore the available plans and choose a connection that works for you.</p></div><div className="proxy-closing-actions"><Link to="/dashboard/proxies" className="proxy-button proxy-button-dark">Explore proxy plans <ArrowRight size={18} aria-hidden="true" /></Link><Link to="/contact" className="proxy-button proxy-button-outline">Contact sales <ArrowUpRight size={16} aria-hidden="true" /></Link></div></section>
    </div>
  );
}
