import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import "@/pages/public/proxies.css";
import "./resources.css";

export function ResourcePage({ name, description, path, children }: { name: string; description: string; path: string; children: ReactNode }) {
  return <div className="proxy-page resource-page"><Helmet><title>{name} | ProxySock</title><meta name="description" content={description} /><link rel="canonical" href={`https://www.proxysock.com${path}`} /><meta property="og:title" content={`${name} | ProxySock`} /><meta property="og:description" content={description} /><meta property="og:url" content={`https://www.proxysock.com${path}`} /><meta property="og:type" content="website" /></Helmet>{children}</div>;
}
export function ResourceHero({ label, title, accent, description, children }: { label: string; title: string; accent: string; description: string; children?: ReactNode }) {
  return <section className={`resource-hero ${children ? "" : "resource-hero-simple"}`}><div><p className="proxy-eyebrow">Resources / {label}</p><h1>{title}<br /><span>{accent}</span></h1><p className="resource-hero-description">{description}</p></div>{children && <div className="resource-hero-aside">{children}</div>}</section>;
}
export function ResourceClosing({ title = "A little guidance.", accent = "A better connection.", href = "/HowToConnect", action = "Explore setup guides" }: { title?: string; accent?: string; href?: string; action?: string }) {
  return <section className="proxy-closing"><div><p className="proxy-eyebrow">Your next step</p><h2>{title}<br /><span>{accent}</span></h2></div><div className="proxy-closing-actions"><Link className="proxy-button proxy-button-dark" to={href}>{action}<ArrowUpRight size={16} aria-hidden="true" /></Link><Link className="proxy-button proxy-button-outline" to="/contact">Contact support<ArrowUpRight size={16} aria-hidden="true" /></Link></div></section>;
}
export function ResourceEmpty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="resource-empty" role="status"><h3>{title}</h3>{children}</div>;
}
