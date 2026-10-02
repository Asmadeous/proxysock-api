import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { CodeBlock } from "./CodeBlock";
import { proxyCommand } from "./tutorial-guides";

export const HowToConnectHeroSection = () => (
  <section className="tutorial-hero" aria-labelledby="tutorial-title">
    <div className="tutorial-hero-copy">
      <p className="proxy-eyebrow">Resources / Tutorials</p>
      <h1 id="tutorial-title">From setup<br />to <span>connected.</span></h1>
      <p>Clear steps. Useful examples. Everything you need to start using your proxies, servers, VPN and eSIM.</p>
      <div className="proxy-actions"><a href="#setup-guides" className="proxy-button proxy-button-white">Find your guide <ArrowDown size={16} aria-hidden="true" /></a><Link to="/dashboard" className="proxy-button proxy-button-outline">Open dashboard <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
    </div>
    <div className="tutorial-hero-preview">
      <div className="tutorial-preview-label"><span>Your first connection</span><span>HTTP proxy / curl</span></div>
      <CodeBlock code={proxyCommand} title="hello-connection.sh" language="bash" />
      <p>Start with a simple request.<br /><span>Build from there.</span></p>
    </div>
  </section>
);
