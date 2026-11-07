import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ProxyNetwork } from "./ProxyNetwork";

const proxyTypes = [
  { id: "datacenter", label: "Datacenter", title: "Built for repeatable work.", description: "Datacenter proxies give your tools a dedicated connection for data collection, testing and recurring tasks. A practical starting point for workflows that need consistent IPs.", bestFor: "Data collection & testing", behavior: "Dedicated IPs", features: ["Datacenter-hosted addresses", "Location options by plan", "Choose your quantity and duration"], visual: "Datacenter connection" },
  { id: "isp", label: "ISP", title: "A familiar network identity.", description: "ISP proxies combine ISP-issued addresses with a stable connection. Explore them for search monitoring, e-commerce research and workflows where the network behind the IP matters.", bestFor: "Search & e-commerce research", behavior: "ISP-issued addresses", features: ["ISP and location choices", "Stable connection for recurring tasks", "Plan options available in your account"], visual: "ISP connection" },
  { id: "static", label: "Static residential", title: "Keep your connection consistent.", description: "Static residential proxies keep an assigned address for ongoing work. Choose them when a project benefits from returning through the same residential IP.", bestFor: "Ongoing projects & sessions", behavior: "Static allocation", features: ["Residential IP addresses", "A consistent address for your workflow", "Available locations shown with each plan"], visual: "One assigned address" },
  { id: "rotating", label: "Rotating residential", title: "More addresses. More flexibility.", description: "Connect through a pool of residential IPs and configure how addresses rotate. Useful for location-based research and data collection across different connections.", bestFor: "Location-based research", behavior: "Configurable rotation", features: ["Residential IP pool", "Country, region and city options", "Rotation settings during configuration"], visual: "Residential address pool" },
];

export const ProxyType = () => {
  const [selected, setSelected] = useState(0);
  const current = proxyTypes[selected];
  return (
    <section id="proxy-types" className="proxy-types" aria-labelledby="proxy-types-title">
      <div className="proxy-section-heading"><div><p className="proxy-eyebrow">Find your connection</p><h2 id="proxy-types-title">Different workflows.<br /><em>The right proxy for each.</em></h2></div></div>
      <div className="proxy-type-options" role="group" aria-label="Choose a proxy type">{proxyTypes.map((type, index) => <button key={type.id} type="button" aria-pressed={index === selected} aria-controls="proxy-type-detail" onClick={() => setSelected(index)}><span>{type.label}</span></button>)}</div>
      <div id="proxy-type-detail" className="proxy-type-detail">
        <div className="proxy-type-copy" key={current.id}>
          <p className="proxy-eyebrow">{current.label}</p><h3>{current.title}</h3><p>{current.description}</p>
          <dl><div><dt>Useful for</dt><dd>{current.bestFor}</dd></div><div><dt>Connection style</dt><dd>{current.behavior}</dd></div></dl>
          <ul>{current.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <Link className="proxy-button proxy-button-dark" to="/dashboard/proxies">Browse proxy plans <ArrowRight size={17} aria-hidden="true" /></Link>
          <small>View current prices, locations and availability in your account.</small>
        </div>
        <div className="proxy-type-art"><ProxyNetwork label={current.visual} rotating={current.id === "rotating"} /><div className="proxy-art-caption"><span>Choose a type. Make it your connection.</span><Link to="/locations">Explore locations <ArrowUpRight size={13} aria-hidden="true" /></Link></div></div>
      </div>
    </section>
  );
};
