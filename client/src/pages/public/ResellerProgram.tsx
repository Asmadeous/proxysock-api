import { useRef, useState, type FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight, Plus } from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";
import wordmark from "@/assets/images/proxysock-wordmark.svg";
import "./proxies.css";
import "@/components/landing/affiliate/affiliate.css";
import "@/components/landing/reseller/reseller.css";

const partnerships = [
  { id: "api_only", name: "API Reseller", heading: "Your platform. Our provisioning.", description: "Connect your own storefront or application to ProxySock. Use the reseller API to place orders and manage supported services from your existing workflow.", audience: "For businesses building their own customer experience.", own: "Your storefront, customer relationships and sales experience.", provide: "Reseller API access, service provisioning and account tools.", workflow: ["Fund your reseller wallet", "Place orders through the API", "Retrieve service access details"] },
  { id: "single_product", name: "Single Product Specialist", heading: "One product. A focused partnership.", description: "Build your offering around the service your audience needs most. Tell us your product focus so we can discuss the right catalogue access, commercial terms and setup.", audience: "For businesses focused on a particular service or customer niche.", own: "Your product positioning, audience and customer relationships.", provide: "A discussion of service access and terms for your chosen product.", workflow: ["Choose your product focus", "Discuss access and pricing", "Agree on your reseller setup"] },
  { id: "infrastructure", name: "Infrastructure Partner", heading: "Your customers. A connected backend.", description: "Use our infrastructure workflow to create customer orders and payment links. After payment, supported services are provisioned and access details are delivered to the customer.", audience: "For businesses that want help connecting orders, payments and delivery.", own: "Your customer relationships and the services you offer.", provide: "Customer order tools, payment links and service delivery workflows.", workflow: ["Create a customer order", "Share a payment link", "Deliver access after payment"] },
] as const;
type Partnership = typeof partnerships[number]['id'];
const products = [
  { name: "Proxies", id: "proxies", href: "/proxies", description: "Datacenter, ISP and residential IPs for your customers’ online workflows." },
  { name: "VPS", id: "vps", href: "/vps", description: "Virtual servers for applications, tools and computing workloads." },
  { name: "RDP", id: "rdp", href: "/rdp", description: "Hosted desktops for customers who need a remote workspace." },
  { name: "VPN", id: "vpn", href: "/vpn", description: "Residential VPN connections for compatible clients." },
  { name: "eSIM", id: "esim", href: "/esim", description: "Mobile data plans for travellers with compatible devices." },
];
const faqs = [
  ["Which partnership should I choose?", "Choose API Reseller if you want to integrate services into your own platform. Choose Single Product Specialist to discuss an offering focused on one service. Choose Infrastructure Partner if you want a workflow that connects customer orders, payments and delivery."],
  ["How is reseller pricing determined?", "Pricing and commercial terms depend on your partnership, product selection and expected volume. Include these details in your application so our team can discuss the options with you."],
  ["Do I need to build my own storefront?", "API resellers manage their own customer experience. Infrastructure partnerships use ProxySock’s customer order and payment workflows. We’ll confirm what your selected setup includes during onboarding."],
  ["Can I start with a single product?", "Yes. Select Single Product Specialist and the service you want to focus on. Our team will discuss product access and terms for that proposal."],
  ["How do I access my reseller account?", "Existing resellers can use the reseller sign-in page. Submitting this form sends an inquiry to our team; it does not create or approve a reseller account automatically."],
  ["How is this different from being an affiliate?", "Resellers offer services to their own customers. Affiliates refer people to ProxySock and earn commission under their program terms. If you want to make recommendations rather than manage a service offering, explore the affiliate program."],
];
const initialForm = { name: "", email: "", company: "", resellerType: "api_only" as Partnership, productsWanted: [] as string[], volume: "", message: "" };

function ResellerVisual() {
  return <div className="reseller-visual" role="img" aria-label="Your business connects to ProxySock infrastructure to provide services to your customers">
    <div className="reseller-visual-header"><span>Built for your business</span><span>Connected infrastructure</span></div>
    <svg viewBox="0 0 600 490" fill="none" aria-hidden="true"><g className="reseller-paths"><path d="M300 95V230" /><path d="M300 230V335H90V400" /><path d="M300 230V400" /><path d="M300 230V335H510V400" /></g><g className="reseller-signals"><path d="M300 95V230" /><path d="M300 230V335H90V400" /><path d="M300 230V400" /><path d="M300 230V335H510V400" /></g></svg>
    <div className="reseller-store"><span>Your business</span><strong>Your storefront & customers</strong><div><i /><i /><i /></div></div>
    <div className="reseller-platform"><img src={wordmark} alt="" /><span>Orders / Provisioning / Service access</span></div>
    <div className="reseller-endpoints"><span>Customer A</span><span>Customer B</span><span>Customer C</span></div>
    <p>One partnership. More possibilities for your customers.</p>
  </div>;
}

export default function ResellerProgram() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const pending = useRef(false);
  const selected = partnerships.find(partnership => partnership.id === form.resellerType)!;
  function chooseType(type: Partnership) {
    if (pending.current) return;
    setForm(previous => ({ ...previous, resellerType: type, productsWanted: type === "single_product" ? previous.productsWanted.slice(0, 1) : previous.productsWanted }));
  }
  function chooseProduct(id: string) {
    setForm(previous => ({ ...previous, productsWanted: previous.resellerType === "single_product" ? [id] : previous.productsWanted.includes(id) ? previous.productsWanted.filter(product => product !== id) : [...previous.productsWanted, id] }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setStatus("sending");
    try {
      const name = form.name.trim(), email = form.email.trim(), company = form.company.trim();
      await api.post("/api/v1/guest_chats", {
        guest_name: name, guest_email: email, subject: `New Reseller Application: ${company}`,
        message: `Reseller Inquiry:\n-----------------\nName: ${name}\nEmail: ${email}\nCompany: ${company}\nReseller Type: ${form.resellerType}\nProducts Wanted: ${form.productsWanted.join(', ')}\nExpected Volume: ${form.volume || 'To be discussed'}\nAdditional Info: ${form.message.trim() || 'N/A'}`,
      });
      setForm(initialForm);
      setStatus("success");
      toast.success("Application submitted", { description: "Our team will review your details and follow up by email." });
    } catch {
      setStatus("error");
    } finally { pending.current = false; }
  }
  return <div className="proxy-page reseller-page">
    <Helmet><title>Reseller Program | Build your business with ProxySock</title><meta name="description" content="Explore ProxySock reseller partnerships for API integration, a single product focus or infrastructure workflows. Tell us about your business and discuss your options." /><link rel="canonical" href="https://www.proxysock.com/reseller-program" /><meta property="og:title" content="Reseller Program | ProxySock" /><meta property="og:description" content="Your business. Our infrastructure. Explore a reseller partnership built around your customers." /><meta property="og:url" content="https://www.proxysock.com/reseller-program" /><meta property="og:type" content="website" /></Helmet>
    <section className="proxy-hero reseller-hero" aria-labelledby="reseller-title"><div className="proxy-hero-copy"><p className="proxy-eyebrow">Partners / Reseller program</p><h1 id="reseller-title">Your business.<br /><span>Our infrastructure.</span></h1><p className="proxy-hero-description">Bring proxies, servers and connectivity to your customers. Choose a reseller partnership that fits how you sell, deliver and grow.</p><div className="proxy-actions"><a href="#partnership-options" className="proxy-button proxy-button-white">Find your partnership <ArrowDown size={16} aria-hidden="true" /></a><Link to="/reseller/login" className="proxy-button proxy-button-outline">Reseller sign in <ArrowUpRight size={16} aria-hidden="true" /></Link></div></div><ResellerVisual /></section>

    <section id="partnership-options" className="affiliate-section" aria-labelledby="reseller-options-title"><div className="proxy-section-heading"><div><p className="proxy-eyebrow">Choose how we work together</p><h2 id="reseller-options-title">Your model.<br /><em>Your way forward.</em></h2></div></div><div className="reseller-options" role="group" aria-label="Partnership options">{partnerships.map(partnership => <button key={partnership.id} type="button" aria-pressed={selected.id === partnership.id} aria-controls="reseller-option-detail" disabled={status === "sending"} onClick={() => chooseType(partnership.id)}>{partnership.name}<ArrowUpRight size={16} aria-hidden="true" /></button>)}</div><div id="reseller-option-detail" className="reseller-option-detail"><div><p className="proxy-eyebrow">{selected.name}</p><h3>{selected.heading}</h3><p>{selected.description}</p><p className="reseller-fit">{selected.audience}</p><a href="#apply-form" className="proxy-button proxy-button-dark">Apply as {selected.name} <ArrowDown size={16} aria-hidden="true" /></a></div><div className="reseller-responsibilities"><dl><div><dt>You bring</dt><dd>{selected.own}</dd></div><div><dt>We provide</dt><dd>{selected.provide}</dd></div></dl><ol>{selected.workflow.map(step => <li key={step}><span aria-hidden="true" />{step}</li>)}</ol></div></div></section>

    <section className="affiliate-section reseller-catalog" aria-labelledby="reseller-catalog-title"><div className="proxy-section-heading"><div><p className="proxy-eyebrow">Build your offering</p><h2 id="reseller-catalog-title">Services your customers need.<br /><em>Room to find your focus.</em></h2></div></div><div className="reseller-product-grid">{products.map(product => <Link key={product.id} to={product.href}><h3>{product.name}</h3><p>{product.description}</p><span>Explore service <ArrowUpRight size={15} aria-hidden="true" /></span></Link>)}</div><p className="reseller-catalog-note">Product access, availability and commercial terms are confirmed for your reseller arrangement.</p></section>

    <section className="affiliate-section" aria-labelledby="reseller-benefits-title"><div className="proxy-section-heading"><div><p className="proxy-eyebrow">A practical partnership</p><h2 id="reseller-benefits-title">Focus on your customers.<br /><em>Connect the rest.</em></h2></div></div><div className="affiliate-three-grid">{[["Connected order workflows", "Keep service ordering and delivery connected through your reseller tools and supported API operations."], ["Terms around your business", "Discuss the products, expected volume and commercial arrangement that make sense for your offering."], ["Tools for the day-to-day", "Use your reseller account to work with orders, service access and the account tools available to your partnership."]].map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

    <section id="apply-form" className="affiliate-section affiliate-application reseller-application" aria-labelledby="reseller-application-title"><div><p className="proxy-eyebrow">Let’s talk business</p><h2 id="reseller-application-title">Tell us where<br /><em>you want to go.</em></h2><p className="affiliate-application-intro">Share your business, product interests and expected volume. We’ll use this to discuss the right partnership and next steps.</p><div className="affiliate-review-note"><h3>A conversation before onboarding.</h3><p>Your application is an inquiry. Our team reviews the details, follows up by email and discusses access and terms before your reseller setup is confirmed.</p></div><Link to="/contact" className="proxy-text-link">Have a question first? <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
      <form className="affiliate-form reseller-form" aria-label="Reseller application" aria-busy={status === "sending"} onSubmit={submit}><fieldset disabled={status === "sending"}><legend className="sr-only">Your business details</legend><div className="affiliate-form-row"><div><label htmlFor="reseller-name">Full name</label><input id="reseller-name" name="name" autoComplete="name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div><div><label htmlFor="reseller-email">Work email</label><input id="reseller-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div></div><label htmlFor="reseller-company">Company name</label><input id="reseller-company" name="company" autoComplete="organization" required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
      <div className="affiliate-form-row reseller-form-options"><div><label htmlFor="reseller-type">Partnership type</label><select id="reseller-type" value={form.resellerType} onChange={e => chooseType(e.target.value as Partnership)}>{partnerships.map(partnership => <option key={partnership.id} value={partnership.id}>{partnership.name}</option>)}</select></div><div><label htmlFor="reseller-volume">Monthly volume (optional)</label><select id="reseller-volume" value={form.volume} onChange={e => setForm({ ...form, volume: e.target.value })}><option value="">To be discussed</option><option value="<1k">Under $1k</option><option value="1k-5k">$1k – $5k</option><option value="5k-10k">$5k – $10k</option><option value="10k+">$10k+</option></select></div></div>
      <fieldset className="reseller-product-choices"><legend>Products of interest (optional)</legend><p>{form.resellerType === "single_product" ? "Choose one product to focus on." : "Select the services you’d like to offer."}</p><div>{products.map(product => <label key={product.id}><input type={form.resellerType === "single_product" ? "radio" : "checkbox"} name="products" value={product.id} checked={form.productsWanted.includes(product.id)} onChange={() => chooseProduct(product.id)} />{product.name}</label>)}</div></fieldset>
      <label htmlFor="reseller-message">About your project (optional)</label><textarea id="reseller-message" rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Your website, target customers and how you plan to offer services…" /><p className="affiliate-form-note">We’ll use these details to respond to your application. Read our <Link to="/privacy">Privacy Policy</Link>.</p><button type="submit" className="proxy-button proxy-button-dark" disabled={status === "sending" || !form.name.trim() || !form.email.trim() || !form.company.trim()}>{status === "sending" ? "Sending application…" : "Submit reseller application"}<ArrowUpRight size={16} aria-hidden="true" /></button></fieldset>
      {status === "success" && <div className="affiliate-feedback" role="status"><strong>Your application is with us.</strong><p>Our team will review your details and follow up by email.</p></div>}{status === "error" && <div className="affiliate-feedback" role="alert"><strong>We couldn’t send your application.</strong><p>Your details are still here. Please try again or <Link to="/contact">contact support</Link>.</p></div>}</form>
    </section>

    <section className="proxy-faq" aria-labelledby="reseller-faq-title"><div><p className="proxy-eyebrow">Before we partner</p><h2 id="reseller-faq-title">A clearer path<br /><em>to getting started.</em></h2><Link to="/affiliate-program" className="proxy-text-link">Prefer to refer customers? <ArrowUpRight size={16} aria-hidden="true" /></Link></div><div className="proxy-faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>
    <section className="proxy-closing" aria-labelledby="reseller-closing-title"><div><p className="proxy-eyebrow">Build with ProxySock</p><h2 id="reseller-closing-title">Your next chapter.<br /><span>Our shared opportunity.</span></h2></div><div className="proxy-closing-actions"><a href="#apply-form" className="proxy-button proxy-button-dark">Apply for partnership <ArrowDown size={16} aria-hidden="true" /></a><Link to="/contact" className="proxy-button proxy-button-outline">Contact Sales <ArrowUpRight size={16} aria-hidden="true" /></Link></div></section>
  </div>;
}
