import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { ESIMPlansSection } from "../esim/ESIMPlansSection";
import ServiceVisual from "./ServiceVisual";
import { servicePages, type ServiceKind } from "./service-pages-data";
import "@/pages/public/proxies.css";
import "./service-pages.css";

export default function ServicePage({ kind }: { kind: ServiceKind }) {
  const page = servicePages[kind];
  const [selected, setSelected] = useState(0);
  const option = page.options[selected];
  const optionsId = `${kind}-options`;
  const title = `${page.title} | ProxySock`;
  const url = `https://www.proxysock.com/${kind}`;
  return (
    <div className={`proxy-page service-page service-page-${kind}`}>
      <Helmet><title>{title}</title><meta name="description" content={page.description} /><link rel="canonical" href={url} /><meta property="og:title" content={title} /><meta property="og:description" content={page.description} /><meta property="og:url" content={url} /><meta property="og:type" content="website" /><meta name="twitter:card" content="summary" /><script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "Service", name: page.title, description: page.description, url, provider: { "@type": "Organization", name: "ProxySock" } })}</script></Helmet>
      <section className="proxy-hero service-hero" aria-labelledby={`${kind}-title`}>
        <div className="proxy-hero-copy"><p className="proxy-eyebrow">ProxySock / {page.label}</p><h1 id={`${kind}-title`}>{page.hero[0]}<br />{page.hero[1]}<br /><span>{page.hero[2]}</span></h1><p className="proxy-hero-description">{page.description}</p><div className="proxy-actions"><a href={`#${kind}-plans`} className="proxy-button proxy-button-white">{page.purchaseLabel} <ArrowDown size={17} aria-hidden="true" /></a><Link to="/HowToConnect" className="proxy-button proxy-button-outline">View documentation <ArrowUpRight size={16} aria-hidden="true" /></Link></div></div>
        <div className="proxy-hero-art"><ServiceVisual kind={kind} label={page.options[0].preview} /></div>
      </section>
      <section id={optionsId} className="proxy-types" aria-labelledby={`${kind}-options-title`}>
        <div className="proxy-section-heading"><div><p className="proxy-eyebrow">Built around your workflow</p><h2 id={`${kind}-options-title`}>{page.optionsTitle[0]}<br /><em>{page.optionsTitle[1]}</em></h2></div></div>
        <div className="proxy-type-options service-options" role="group" aria-label={`Choose your ${page.label.toLowerCase()} option`}>{page.options.map((item, i) => <button key={item.name} type="button" aria-pressed={i === selected} aria-controls={`${kind}-option-detail`} onClick={() => setSelected(i)}>{item.name}</button>)}</div>
        <div id={`${kind}-option-detail`} className="proxy-type-detail"><div className="proxy-type-copy" key={option.name}><p className="proxy-eyebrow">{option.name}</p><h3>{option.title}</h3><p>{option.description}</p><dl>{option.facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><ul>{option.features.map((text) => <li key={text}>{text}</li>)}</ul><a href={`#${kind}-plans`} className="proxy-button proxy-button-dark">{page.purchaseLabel} <ArrowDown size={16} aria-hidden="true" /></a></div><div className="proxy-type-art service-detail-art"><ServiceVisual kind={kind} label={option.preview} alternate={selected === 1} /></div></div>
      </section>
      {kind === "esim" ? <div id="esim-plans" className="service-esim-catalog"><ESIMPlansSection /></div> : <section id={`${kind}-plans`} className="service-plans" aria-labelledby={`${kind}-plans-title`}><div className="proxy-section-heading"><div><p className="proxy-eyebrow">Choose your plan</p><h2 id={`${kind}-plans-title`}>{page.plansTitle}</h2></div></div><div className="service-plan-grid">{page.plans?.map((plan) => <article key={plan.name} className={`service-plan ${plan.popular ? "service-plan-popular" : ""}`}><div className="service-plan-header"><h3>{plan.name}</h3>{plan.popular && <span>Popular</span>}</div><p className="service-plan-price">${plan.price}<span>/ month · USD</span></p><ul>{plan.specs.map((spec) => <li key={spec}>{spec}</li>)}</ul><Link to={page.purchaseHref} className="proxy-button proxy-button-dark">Choose {plan.name} <ArrowUpRight size={15} aria-hidden="true" /></Link></article>)}</div><p className="service-plan-note">Review available locations, configuration options and final pricing in your account before purchasing.</p></section>}
      {kind === "esim" && <section className="service-device-check" aria-labelledby="esim-device-title"><div><p className="proxy-eyebrow">Before you choose</p><h2 id="esim-device-title">Your device.<br /><em>Ready to connect?</em></h2></div><div><article><h3>Check eSIM support</h3><p>Confirm your exact phone model and region support eSIM. Device variants can differ.</p></article><article><h3>Check carrier unlock</h3><p>Your phone needs to be carrier-unlocked. Confirm this with your carrier before buying a plan.</p></article><Link className="proxy-text-link" to="/HowToConnect">View installation guides <ArrowUpRight size={15} aria-hidden="true" /></Link></div></section>}
      <section className="proxy-workflows" aria-labelledby={`${kind}-workflows-title`}><div className="proxy-section-heading"><div><p className="proxy-eyebrow">Put it to work</p><h2 id={`${kind}-workflows-title`}>{page.useCasesTitle[0]}<br /><em>{page.useCasesTitle[1]}</em></h2></div></div><div className="proxy-workflow-grid service-workflow-grid">{page.useCases.map(([heading, description]) => <article key={heading}><h3>{heading}</h3><p>{description}</p></article>)}</div></section>
      <section className="proxy-setup" aria-labelledby={`${kind}-setup-title`}><div className="proxy-section-heading"><div><p className="proxy-eyebrow">From choice to connection</p><h2 id={`${kind}-setup-title`}>A few steps.<br /><em>A new possibility.</em></h2></div><Link to="/HowToConnect" className="proxy-text-link">Read the setup guides <ArrowUpRight size={16} aria-hidden="true" /></Link></div><div className="proxy-setup-grid">{page.steps.map(([heading, description]) => <article key={heading}><h3>{heading}</h3><p>{description}</p></article>)}</div></section>
      <section className="proxy-faq" aria-labelledby={`${kind}-faq-title`}><div><p className="proxy-eyebrow">A little more clarity</p><h2 id={`${kind}-faq-title`}>Before you<br /><em>connect.</em></h2><Link className="proxy-text-link" to="/contact">Contact us <ArrowUpRight size={15} aria-hidden="true" /></Link></div><div className="proxy-faq-list">{page.faqs.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>
      <section className="proxy-closing" aria-labelledby={`${kind}-closing-title`}><div><p className="proxy-eyebrow">Your next connection</p><h2 id={`${kind}-closing-title`}>{page.closing[0]}<br /><span>{page.closing[1]}</span></h2></div><div className="proxy-closing-actions"><Link to={page.purchaseHref} className="proxy-button proxy-button-dark">{page.purchaseLabel} <ArrowRight size={17} aria-hidden="true" /></Link><Link to="/contact" className="proxy-button proxy-button-outline">Contact sales <ArrowUpRight size={16} aria-hidden="true" /></Link></div></section>
    </div>
  );
}
