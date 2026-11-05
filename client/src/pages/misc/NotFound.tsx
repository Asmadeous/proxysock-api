import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import StatusLayout from "@/components/public/StatusLayout";
export default function NotFound() {
  const navigate = useNavigate();
  return <StatusLayout label="Page not found" mark="404"><Helmet><title>Page Not Found | ProxySock</title><meta name="robots" content="noindex" /></Helmet><p className="proxy-eyebrow">A missing connection</p><h1>This page is<br />out of reach.</h1><p>The link may have changed, or the address may be incorrect. Head back to the website to find your next connection.</p><div className="status-actions"><Link to="/" className="proxy-button proxy-button-dark">Back to home <ArrowUpRight size={16} aria-hidden="true" /></Link><button className="proxy-button" onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate('/')}><ArrowLeft size={16} aria-hidden="true" />Go back</button></div><Link to="/contact" className="status-support">Need a hand? Contact support</Link></StatusLayout>;
}
