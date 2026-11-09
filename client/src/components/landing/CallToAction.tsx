import { useId } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./call-to-action.css";

interface CallToActionProps {
  isAuthenticated: boolean;
  trackConversion: (eventName: string, eventType: string, pagePath: string) => void;
}

export const CallToAction = ({ isAuthenticated, trackConversion }: CallToActionProps) => {
  const gradientId = useId();
  const accountHref = isAuthenticated ? "/dashboard" : "/register";

  return (
    <section className="join-section" aria-labelledby="join-heading">
      <div className="join-main">
        <div className="join-copy">
          <h2 id="join-heading">Your next move.<br /><span>Starts here.</span></h2>
          <p>Bring your ideas online with proxies, servers, VPNs, and eSIMs. One account opens up a world of possibilities.</p>
          <div className="join-actions">
            <Link className="join-primary" to={accountHref} onClick={() => trackConversion(
              isAuthenticated ? "dashboard_navigation" : "final_cta_lead",
              isAuthenticated ? "navigation" : "conversion",
              accountHref,
            )}>
              {isAuthenticated ? "Open your dashboard" : "Start Now From $2.99/proxy"}
              <span><ArrowUpRight size={23} aria-hidden="true" /></span>
            </Link>
            <Link className="join-secondary" to="/contact" onClick={() => trackConversion("contact_sales_lead", "sales", "/contact")}>Contact Sales</Link>
          </div>
        </div>
        <div className="join-art" aria-hidden="true">
          <svg viewBox="0 0 700 660" fill="none">
            <defs>
              <linearGradient id={`${gradientId}-ring`} x1="220" y1="160" x2="550" y2="540" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fff" /><stop offset=".5" stopColor="#ffc3c3" /><stop offset="1" stopColor="#ef6464" />
              </linearGradient>
              <linearGradient id={`${gradientId}-edge`} x1="220" y1="140" x2="530" y2="550" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity=".05" />
              </linearGradient>
              <radialGradient id={`${gradientId}-glow`}>
                <stop stopColor="#ff9797" stopOpacity=".35" /><stop offset="1" stopColor="#ff9797" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="370" cy="330" r="310" fill={`url(#${gradientId}-glow)`} />
            <circle cx="370" cy="330" r="264" stroke="#fff" strokeOpacity=".1" />
            <circle cx="370" cy="330" r="305" stroke="#fff" strokeOpacity=".05" />
            <path d="M265 220 168 111M484 222 564 134M487 443 572 537" stroke="#810e19" strokeOpacity=".3" strokeWidth="20" />
            <path d="m261 213-99-110m313 110 84-94m-80 314 84 94" stroke={`url(#${gradientId}-ring)`} strokeWidth="14" />
            <circle cx="378" cy="340" r="148" stroke="#850f1c" strokeOpacity=".35" strokeWidth="54" />
            <circle cx="370" cy="330" r="148" stroke={`url(#${gradientId}-ring)`} strokeWidth="54" />
            <circle cx="370" cy="330" r="175" stroke={`url(#${gradientId}-edge)`} strokeWidth="2" />
            <circle cx="370" cy="330" r="121" stroke="#6f091a" strokeOpacity=".2" strokeWidth="2" />
            <circle cx="139" cy="78" r="34" stroke="#fff0f0" strokeWidth="9" />
            <circle cx="582" cy="93" r="29" fill="#ffe5e5" />
            <circle cx="586" cy="553" r="23" stroke="#ffb2b2" strokeWidth="8" />
            <path d="M75 328h14m-7-7v14m478-98h14m-7-7v14M272 592h12m-6-6v12" stroke="#fff" strokeOpacity=".35" />
            <circle cx="641" cy="400" r="3" fill="#fff" fillOpacity=".5" />
          </svg>
        </div>
      </div>
    </section>
  );
};
