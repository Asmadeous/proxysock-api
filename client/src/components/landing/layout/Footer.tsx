import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faTelegram } from "@fortawesome/free-brands-svg-icons";
import { ArrowUpRight } from "lucide-react";
import wordmark from "@/assets/images/proxysock-wordmark.svg";
import { SecurePaymentsSection } from "../PaymentMethods";
import "./footer.css";

const services = [
  ["Global Network", "/proxies"], ["Windows RDP Hosting", "/rdp"],
  ["VPS Cloud Services", "/vps"], ["Global eSIM Data Plans", "/esim"],
  ["Residential VPN", "/vpn"], ["Reseller Program", "/reseller-program"],
  ["Affiliate Program", "/affiliate-program"],
];
const support = [["Contact Support", "/contact"], ["FAQs", "/faq"], ["Documentation", "/HowToConnect"]];
const legal = [["Terms", "/terms"], ["Privacy", "/privacy"], ["Cookies", "/cookie-policy"]];

export const Footer = () => {
  const { pathname } = useLocation();
  const hasRedClosing = ["/", "/proxies", "/vps", "/rdp", "/vpn", "/esim", "/HowToConnect", "/ip-checker", "/locations", "/blog", "/faq", "/contact"].includes(pathname) || pathname.startsWith("/blog/");
  return (
    <footer className={`site-footer ${hasRedClosing ? "site-footer-home" : ""}`}>
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-intro">
            <Link to="/" aria-label="ProxySock home"><img src={wordmark} alt="" className="footer-small-logo" /></Link>
            <p>Infrastructure for your next idea.<br />Connections for wherever it takes you.</p>
            <div className="footer-socials">
              <a href="https://x.com/cybertwts" target="_blank" rel="noopener noreferrer" aria-label="ProxySock on X"><FontAwesomeIcon icon={faTwitter} /></a>
              <a href="https://t.me/Proxy_sock5" target="_blank" rel="noopener noreferrer" aria-label="ProxySock on Telegram"><FontAwesomeIcon icon={faTelegram} /></a>
            </div>
            <a className="footer-email" href="mailto:support@proxysock.com">support@proxysock.com <ArrowUpRight size={14} aria-hidden="true" /></a>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <div><h2><span>//</span> Our Services</h2><ul>{services.map(([label, href]) => <li key={href}><Link to={href}>{label}</Link></li>)}</ul></div>
            <div><h2><span>//</span> Support</h2><ul>{support.map(([label, href]) => <li key={href}><Link to={href}>{label}</Link></li>)}</ul><h2 className="footer-legal-heading"><span>//</span> Legal</h2><ul>{legal.map(([label, href]) => <li key={href}><Link to={href}>{label}</Link></li>)}</ul></div>
            <div><h2><span>//</span> Infrastructure</h2><ul className="footer-network"><li>25+ Data Centers</li><li>150+ Countries</li><li>99.9% Uptime SLA</li><li>24/7 Monitoring</li></ul></div>
          </nav>
        </div>
        <div className="footer-signature">
          <div><span className="footer-signature-label">One account. Every connection.</span><p>Proxies · VPS · RDP · VPN · eSIM</p></div>
          <Link to="/" aria-label="ProxySock home" className="footer-large-logo"><img src={wordmark} alt="" /></Link>
        </div>
        <SecurePaymentsSection variant="footer" />
        <div className="footer-bottom"><p>© {new Date().getFullYear()} ProxySock. All rights reserved.</p><span>Built for a connected world.</span></div>
      </div>
    </footer>
  );
};
