import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { CoreValues } from "@/components/landing/about/CoreValues";
import { Journey } from "@/components/landing/about/Journey";
import { Team } from "@/components/landing/about/Team";
import wordmark from "@/assets/images/proxysock-wordmark.svg";
import "./proxies.css";
import "@/components/landing/about/about.css";

const services = [
  { name: "Proxies", purpose: "Access", description: "Datacenter, ISP and residential IPs for research, browsing and automation.", href: "/proxies" },
  { name: "VPS", purpose: "Build", description: "Virtual servers for the applications and workloads you want to run.", href: "/vps" },
  { name: "RDP", purpose: "Work", description: "Hosted desktops that bring your software and workspace within reach.", href: "/rdp" },
  { name: "VPN", purpose: "Connect", description: "VPN connections through residential IPs, using your preferred compatible client.", href: "/vpn" },
  { name: "eSIM", purpose: "Explore", description: "Mobile data for your travels, without swapping a physical SIM.", href: "/esim" },
];
function CompanyNetwork() {
  return <div className="about-network" role="img" aria-label="ProxySock brings proxies, VPS, RDP, VPN and eSIM services together in one platform">
    <div className="about-network-grid" />
    <span className="about-network-caption">Different needs. One connection.</span>
    <svg viewBox="0 0 600 500" fill="none" aria-hidden="true">
      <circle cx="300" cy="250" r="170" className="about-orbit" />
      <circle cx="300" cy="250" r="115" className="about-orbit" />
      <g className="about-network-paths"><path d="M80 135H170L300 250" /><path d="M500 100H430L300 250" /><path d="M530 290H410L300 250" /><path d="M400 420V355L300 250" /><path d="M80 370H155L300 250" /></g>
      <g className="about-network-signals"><path d="M80 135H170L300 250" /><path d="M500 100H430L300 250" /><path d="M530 290H410L300 250" /><path d="M400 420V355L300 250" /><path d="M80 370H155L300 250" /></g>
      {[[80,135],[500,100],[530,290],[400,420],[80,370]].map(([x,y]) => <g key={x + ':' + y}><circle cx={x} cy={y} r="10" fill="#e44e59" fillOpacity=".25" /><circle cx={x} cy={y} r="3" fill="#ffe1df" /></g>)}
    </svg>
    <div className="about-network-center"><img src={wordmark} alt="" /><span>Built to connect</span></div>
    {services.map((service) => <span key={service.name} className={`about-node about-node-${service.name.toLowerCase()}`}>{service.name}</span>)}
    <span className="about-network-bottom">Access / Compute / Connectivity</span>
  </div>;
}

export default function About() {
  return <div className="proxy-page about-page">
    <Helmet><title>About ProxySock | Infrastructure for your next possibility</title><meta name="description" content="Meet ProxySock: a digital infrastructure platform bringing proxies, virtual servers, remote desktops, residential VPNs and travel eSIMs together." /><link rel="canonical" href="https://www.proxysock.com/about" /><meta property="og:title" content="About ProxySock" /><meta property="og:description" content="The connections and computing power behind what you do next." /><meta property="og:url" content="https://www.proxysock.com/about" /><meta property="og:type" content="website" /></Helmet>
    <section className="proxy-hero about-hero" aria-labelledby="about-title">
      <div className="proxy-hero-copy"><p className="proxy-eyebrow">Company / About ProxySock</p><h1 id="about-title">Behind every<br />connection.<br /><span>A possibility.</span></h1><p className="proxy-hero-description">We’re ProxySock. We bring the connections and computing power people need into one place—so you can build, work and explore online.</p><div className="proxy-actions"><a href="#our-purpose" className="proxy-button proxy-button-white">Get to know us <ArrowDown size={16} aria-hidden="true" /></a><Link to="/contact" className="proxy-button proxy-button-outline">Let’s talk <ArrowUpRight size={16} aria-hidden="true" /></Link></div></div>
      <CompanyNetwork />
    </section>

    <section id="our-purpose" className="about-purpose about-section" aria-labelledby="about-purpose-title">
      <div><p className="proxy-eyebrow">Why we’re here</p><h2 id="about-purpose-title">Your ambition.<br /><em>Fewer barriers.</em></h2></div>
      <div className="about-purpose-copy"><p className="about-lead">Getting online is only the beginning. Having the right infrastructure is what lets you do more.</p><p>A project might need a different IP, a server to run on, or a desktop you can reach remotely. A journey might simply need mobile data. ProxySock brings those needs together through proxies, VPS hosting, remote desktops, residential VPNs and eSIMs.</p><p>Our purpose is straightforward: make digital infrastructure easier to access and manage, whether you’re working on your own, building with a team, or serving customers of your own.</p><Link to="/reseller-program" className="proxy-text-link">Building a business with us? <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
    </section>

    <section className="about-platform about-section" aria-labelledby="about-platform-title">
      <div className="about-section-heading"><div><p className="proxy-eyebrow">What brings us together</p><h2 id="about-platform-title">Different ways forward.<br /><em>One place to start.</em></h2></div><p>Five services. A shared purpose: giving you the infrastructure to take your next step.</p></div>
      <div className="about-services">{services.map(service => <Link to={service.href} key={service.name} className="about-service"><span className="proxy-eyebrow">{service.purpose}</span><h3>{service.name}</h3><p>{service.description}</p><span className="about-service-link">Explore {service.name}<ArrowUpRight size={16} aria-hidden="true" /></span></Link>)}</div>
    </section>

    <CoreValues />
    <Journey />
    <Team />

    <section className="proxy-closing" aria-labelledby="about-closing-title"><div><p className="proxy-eyebrow">Let’s build your next connection</p><h2 id="about-closing-title">You bring the ambition.<br /><span>We bring the connection.</span></h2></div><div className="proxy-closing-actions"><Link to="/dashboard/proxies" className="proxy-button proxy-button-dark">Start Now From $2.99/proxy <ArrowUpRight size={16} aria-hidden="true" /></Link><Link to="/contact" className="proxy-button proxy-button-outline">Contact Sales <ArrowUpRight size={16} aria-hidden="true" /></Link></div></section>
  </div>;
}
