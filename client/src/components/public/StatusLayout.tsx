import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useThemeStore } from "@/store/themeStore";
import { ArrowLeft } from "lucide-react";
import "@/pages/public/proxies.css";
import "./status.css";

export default function StatusLayout({ label, mark, children }: { label: string; mark: string; children: ReactNode }) {
  const dark = useThemeStore(state => state.dark);
  return <div className={`landing-theme ${dark ? 'dark' : ''}`}><main className="proxy-page status-page"><Link to="/" className="status-back"><ArrowLeft size={16} aria-hidden="true" />Back to website</Link><div className="status-layout"><aside className="status-brand"><p className="proxy-eyebrow">ProxySock / {label}</p><div className="status-orbits" aria-hidden="true"><i /><i /><span>{mark}</span></div><p>Your next connection<br /><span>is within reach.</span></p></aside><section className="status-content">{children}</section></div></main></div>;
}
