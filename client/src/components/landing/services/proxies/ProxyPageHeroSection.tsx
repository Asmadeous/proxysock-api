import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ProxyNetwork } from "./ProxyNetwork";

export const ProxyPageHeroSection = () => (
  <section className="proxy-hero" aria-labelledby="proxy-title">
    <div className="proxy-hero-copy">
      <p className="proxy-eyebrow">ProxySock / Proxy services</p>
      <h1 id="proxy-title">The right IP.<br />For your<br /><span>next move.</span></h1>
      <p className="proxy-hero-description">Datacenter, ISP and residential proxies for research, automation and everyday connections. Find the right fit for the way you work.</p>
      <div className="proxy-actions"><a className="proxy-button proxy-button-white" href="#proxy-types">Explore proxy types <ArrowDown size={17} aria-hidden="true" /></a><Link className="proxy-button proxy-button-outline" to="/HowToConnect">View documentation <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
    </div>
    <div className="proxy-hero-art"><ProxyNetwork /></div>
  </section>
);
