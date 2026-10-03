import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import "@/pages/public/proxies.css";
import "./legal.css";

export default function LegalLayout({ title, path, updated, sections, children }: { title: string; path: string; updated: string; sections: { id: string; label: string }[]; children: ReactNode }) {
  return <div className="proxy-page legal-page">
    <Helmet><title>{title} | ProxySock</title><meta name="description" content={`Read the ProxySock ${title.toLowerCase()}. Find the information relevant to your account and use of our services.`} /><link rel="canonical" href={`https://www.proxysock.com${path}`} /></Helmet>
    <header className="legal-header"><p className="proxy-eyebrow">ProxySock / Legal</p><h1>{title}</h1><p>Last updated: {updated}</p><nav aria-label="Legal documents">{[['Privacy Policy','/privacy'],['Terms of Service','/terms'],['Cookie Policy','/cookie-policy']].map(([label,href]) => <Link key={href} to={href} aria-current={path===href ? 'page' : undefined}>{label}</Link>)}</nav></header>
    <div className="legal-layout"><aside><nav aria-label="On this page"><p className="proxy-eyebrow">On this page</p><ol>{sections.map(section => <li key={section.id}><a href={`#${section.id}`}>{section.label}</a></li>)}</ol></nav><Link className="proxy-text-link" to="/contact">Questions? Contact us</Link></aside><article className="legal-content" aria-label={title}>{children}</article></div>
  </div>;
}
