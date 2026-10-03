import { useRef, useState, type FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight, Plus } from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";
import wordmark from "@/assets/images/proxysock-wordmark.svg";
import "./proxies.css";
import "@/components/landing/affiliate/affiliate.css";

const benefits = [
  ["Terms built around your audience.", "Tell us about your channels, traffic and plans. We’ll discuss a commission arrangement that fits the partnership."],
  ["A clear view of your referrals.", "Use your affiliate account to find your referral details, review recorded referrals and earnings, and follow payout requests."],
  ["Services worth talking about.", "Connect your audience with proxies, virtual servers, remote desktops, residential VPNs and travel eSIMs for their next project."],
];
const steps = [
  ["Tell us about your audience", "Share where you publish, who you reach and how you plan to introduce ProxySock."],
  ["Agree on the details", "Our team reviews your inquiry and discusses commission rates, qualifying referrals and payout terms with you."],
  ["Share your connection", "Once your arrangement is confirmed, use your referral details and follow the results in your affiliate account."],
];
const faqs = [
  ["Who can apply?", "Creators, publishers, educators and community owners can tell us about their audience and promotion plans. We review partnership inquiries individually."],
  ["What commission will I earn?", "Custom partnership rates are discussed with our team. Submit your audience and traffic details so we can review your proposal. Confirm your agreed rate and qualifying activity before you start promoting."],
  ["How do I track referrals and earnings?", "Your affiliate dashboard provides your referral information, recorded referrals, earnings and payout history. Sign in to access your affiliate account."],
  ["When and how will I get paid?", "Available payout methods and processing depend on your affiliate account and agreed terms. Confirm these with our team and review the options in your dashboard before requesting a payout."],
  ["Is this the same as the reseller program?", "Affiliates introduce people to ProxySock using referral details. Resellers provide services to their own customers. If you want to sell services as part of your own business, explore our reseller program."],
];

function ReferralVisual() {
  return <div className="affiliate-visual" role="img" aria-label="Your audience follows your referral to ProxySock. Qualifying orders generate commission under your agreed terms.">
    <div className="affiliate-visual-grid" />
    <div className="affiliate-visual-heading"><span>A connection that goes further</span><span>Partner network</span></div>
    <svg viewBox="0 0 600 460" aria-hidden="true" fill="none"><g className="affiliate-paths"><path d="M75 125H200L300 225" /><path d="M75 230H300" /><path d="M75 335H200L300 225" /><path d="M300 225H510V340" /></g><g className="affiliate-signals"><path d="M75 125H200L300 225" /><path d="M75 230H300" /><path d="M75 335H200L300 225" /><path d="M300 225H510V340" /></g></svg>
    <span className="affiliate-source affiliate-source-top">Your content</span><span className="affiliate-source affiliate-source-middle">Your community</span><span className="affiliate-source affiliate-source-bottom">Your recommendation</span>
    <div className="affiliate-hub"><img src={wordmark} alt="" /><span>Your referral connection</span></div>
    <div className="affiliate-result"><span>Qualifying order</span><strong>Commission earned</strong><div><i /><span>At your agreed rate</span></div></div>
    <p className="affiliate-visual-caption">Your audience. Our infrastructure. Shared opportunity.</p>
  </div>;
}

export default function AffiliateProgram() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const submitting = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setStatus("sending");
    try {
      const name = form.name.trim();
      const email = form.email.trim();
      await api.post("/api/v1/guest_chats", {
        guest_name: name, guest_email: email,
        subject: `New Affiliate Application: ${name}`,
        message: `Affiliate Partnership Inquiry:\n-----------------\nName: ${name}\nEmail: ${email}\nDetails: ${form.message.trim()}`,
      });
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
      toast.success("Application received", { description: "Our team will review your inquiry and contact you using the email provided." });
    } catch {
      setStatus("error");
    } finally {
      submitting.current = false;
    }
  }
  return <div className="proxy-page affiliate-page">
    <Helmet><title>Affiliate Program | Partner with ProxySock</title><meta name="description" content="Introduce your audience to ProxySock. Apply for an affiliate partnership, discuss commission terms and track your referrals from your account." /><link rel="canonical" href="https://www.proxysock.com/affiliate-program" /><meta property="og:title" content="Affiliate Program | Partner with ProxySock" /><meta property="og:description" content="Your audience. Our infrastructure. A partnership built around your next opportunity." /><meta property="og:url" content="https://www.proxysock.com/affiliate-program" /><meta property="og:type" content="website" /></Helmet>
    <section className="proxy-hero affiliate-hero" aria-labelledby="affiliate-title"><div className="proxy-hero-copy"><p className="proxy-eyebrow">Partners / Affiliate program</p><h1 id="affiliate-title">Good connections.<br /><span>Shared rewards.</span></h1><p className="proxy-hero-description">Introduce your audience to ProxySock and earn commission on qualifying referrals. Let’s build a partnership around the people you reach and the value you bring.</p><div className="proxy-actions"><a href="#apply-form" className="proxy-button proxy-button-white">Apply for partnership <ArrowDown size={16} aria-hidden="true" /></a><Link to="/dashboard/affiliate" className="proxy-button proxy-button-outline">Affiliate dashboard <ArrowUpRight size={16} aria-hidden="true" /></Link></div></div><ReferralVisual /></section>

    <section className="affiliate-audience affiliate-section" aria-labelledby="affiliate-audience-title"><div><p className="proxy-eyebrow">Built around your reach</p><h2 id="affiliate-audience-title">You know your audience.<br /><em>We help them connect.</em></h2></div><div className="affiliate-audience-list"><article><h3>Creators & publishers</h3><p>Bring useful infrastructure into the articles, videos and resources your audience already turns to.</p></article><article><h3>Educators & communities</h3><p>Help developers, digital professionals and learners find services for their projects.</p></article><article><h3>Consultants & specialists</h3><p>Recommend relevant tools as part of the guidance you give your clients and network.</p></article></div></section>

    <section className="affiliate-section affiliate-benefits" aria-labelledby="affiliate-benefits-title"><div className="proxy-section-heading"><div><p className="proxy-eyebrow">Why partner with us</p><h2 id="affiliate-benefits-title">A useful recommendation.<br /><em>A reason to grow together.</em></h2></div></div><div className="affiliate-three-grid">{benefits.map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p></article>)}</div><div className="affiliate-services"><span>Introduce your audience to</span>{[["Proxies", "/proxies"], ["VPS", "/vps"], ["RDP", "/rdp"], ["VPN", "/vpn"], ["eSIM", "/esim"]].map(([label, href]) => <Link key={href} to={href}>{label}<ArrowUpRight size={13} aria-hidden="true" /></Link>)}</div></section>

    <section className="affiliate-section" aria-labelledby="affiliate-process-title"><div className="proxy-section-heading"><div><p className="proxy-eyebrow">How it works</p><h2 id="affiliate-process-title">A conversation first.<br /><em>A partnership next.</em></h2></div></div><ol className="affiliate-three-grid affiliate-process">{steps.map(([title, description]) => <li key={title}><span className="affiliate-step-node" aria-hidden="true" /><h3>{title}</h3><p>{description}</p></li>)}</ol></section>

    <section id="apply-form" className="affiliate-section affiliate-application" aria-labelledby="affiliate-application-title"><div><p className="proxy-eyebrow">Start the conversation</p><h2 id="affiliate-application-title">Tell us what<br /><em>you’re building.</em></h2><p className="affiliate-application-intro">A little context helps us understand the opportunity. Share your channels, audience and how you’d like to work together.</p><div className="affiliate-review-note"><h3>What happens next?</h3><p>Our team reviews your inquiry and follows up by email to discuss the fit and potential terms.</p></div><Link to="/contact" className="proxy-text-link">Have a question first? <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
      <form onSubmit={submit} className="affiliate-form" aria-label="Affiliate partnership application" aria-busy={status === "sending"}>
        <fieldset disabled={status === "sending"}><legend className="sr-only">Your partnership details</legend><div className="affiliate-form-row"><div><label htmlFor="affiliate-name">Full name</label><input id="affiliate-name" name="name" autoComplete="name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div><div><label htmlFor="affiliate-email">Email address</label><input id="affiliate-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div></div><label htmlFor="affiliate-message">About your audience & project</label><p id="affiliate-message-hint">Include your website or social channels, who you reach, and your promotion plans.</p><textarea id="affiliate-message" name="message" rows={6} required aria-describedby="affiliate-message-hint" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /><p className="affiliate-form-note">We’ll use these details to respond to your inquiry. Read our <Link to="/privacy">Privacy Policy</Link>.</p><button type="submit" className="proxy-button proxy-button-dark" disabled={!form.name.trim() || !form.email.trim() || !form.message.trim() || status === "sending"}>{status === "sending" ? "Sending inquiry…" : "Submit partnership inquiry"}<ArrowUpRight size={16} aria-hidden="true" /></button></fieldset>
        {status === "success" && <div role="status" className="affiliate-feedback"><strong>Your inquiry is with us.</strong><p>Our team will review your details and follow up by email.</p></div>}
        {status === "error" && <div role="alert" className="affiliate-feedback"><strong>We couldn’t send your inquiry.</strong><p>Your details are still here. Please try again, or <Link to="/contact">contact support</Link>.</p></div>}
      </form>
    </section>

    <section className="proxy-faq" aria-labelledby="affiliate-faq-title"><div><p className="proxy-eyebrow">A little more clarity</p><h2 id="affiliate-faq-title">Before we<br /><em>get started.</em></h2><Link to="/reseller-program" className="proxy-text-link">Looking to resell services? <ArrowUpRight size={16} aria-hidden="true" /></Link></div><div className="proxy-faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>
    <section className="proxy-closing" aria-labelledby="affiliate-closing-title"><div><p className="proxy-eyebrow">Your next partnership</p><h2 id="affiliate-closing-title">Let’s make your<br /><span>connections count.</span></h2></div><div className="proxy-closing-actions"><a href="#apply-form" className="proxy-button proxy-button-dark">Apply for partnership <ArrowDown size={16} aria-hidden="true" /></a><Link to="/contact" className="proxy-button proxy-button-outline">Contact us <ArrowUpRight size={16} aria-hidden="true" /></Link></div></section>
  </div>;
}
