import { ArrowRight, Gauge, Globe2, Headphones, Layers3, ShieldCheck, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import "./trust-sections.css";

const benefits = [
  { icon: Zap, title: "Get going sooner.", description: "Automated provisioning gets your order moving after payment. Find your service details in your account when it’s ready." },
  { icon: ShieldCheck, title: "Keep access in your hands.", description: "Manage your service credentials and connection details from your account, with the tools to configure your own environment." },
  { icon: Gauge, title: "Find your fit.", description: "Choose the connection type, server resources, or data plan that suits the way you work. Build around what your project needs." },
  { icon: Headphones, title: "A little help goes a long way.", description: "Get help with setup, connection questions, and your services through our support team and step-by-step guides." },
  { icon: Globe2, title: "Work beyond borders.", description: "Explore proxy locations and travel data plans to find the coverage you need, wherever your next project takes you." },
  { icon: Layers3, title: "Bring it all together.", description: "Keep your proxies, servers, VPNs, and eSIMs in one account. Manage your orders, services, and billing in one place." },
];

export const WhyChooseUs = () => (
  <section className="trust-section trust-benefits" aria-labelledby="features-heading">
    <div className="trust-section-rail"><span>The ProxySock advantage</span></div>
    <div className="trust-section-intro">
      <h2 id="features-heading">More possibilities.<br /><span>Less to manage.</span></h2>
      <div className="trust-section-summary"><p>The services you need, with a simpler way to set up, stay connected, and keep your work moving.</p></div>
    </div>
    <div className="trust-benefit-grid">
      {benefits.map((benefit) => (
        <article className="trust-benefit" key={benefit.title}>
          <div className="trust-benefit-top"><benefit.icon size={26} strokeWidth={1.4} aria-hidden="true" /></div>
          <h3>{benefit.title}</h3>
          <p>{benefit.description}</p>
        </article>
      ))}
    </div>
    <div className="trust-benefits-footer"><p>A clear path from choosing a service to getting connected.</p><Link to="/HowToConnect" className="trust-text-link">Browse setup guides <ArrowRight size={16} aria-hidden="true" /></Link></div>
  </section>
);
