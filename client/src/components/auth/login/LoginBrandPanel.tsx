import { Link } from "react-router-dom";
import { ArrowLeft, Globe, KeyRound, Mail, Monitor, Server, Shield, Smartphone } from "lucide-react";

const services = [
  { name: "Proxies", icon: Globe, x: 92, y: 108 },
  { name: "VPS", icon: Server, x: 448, y: 108 },
  { name: "RDP", icon: Monitor, x: 65, y: 283 },
  { name: "VPN", icon: Shield, x: 475, y: 283 },
  { name: "eSIM", icon: Smartphone, x: 270, y: 390 },
];

export type AuthVariant = "login" | "register" | "recovery" | "reset" | "verification";

const panels = {
  login: { title: "Every connection.", accent: "One place.", description: "From your first proxy to your next server. Pick up where you left off, all in one account." },
  register: { title: "Your next idea.", accent: "Starts here.", description: "Proxies, servers, VPNs and eSIMs. Create your account and choose the connections that work for you." },
  recovery: { title: "A way back.", accent: "Always within reach.", description: "A forgotten password doesn't have to slow you down. We'll help you get back to your account." },
  reset: { title: "A fresh start.", accent: "Same possibilities.", description: "Choose a new password, then reconnect with your services, projects and next big idea." },
  verification: { title: "One last step.", accent: "A world ahead.", description: "Confirm your email to complete your account setup. Your next connection starts with you." },
};

export default function LoginBrandPanel({ variant = "login" }: { variant?: AuthVariant }) {
  const panel = panels[variant];
  const isNetwork = variant === "login" || variant === "register";
  const StatusIcon = variant === "verification" ? Mail : KeyRound;
  return (
    <aside className="login-brand" aria-label="Your ProxySock services">
      <Link to="/" className="login-back"><ArrowLeft size={15} aria-hidden="true" /> Back to website</Link>
      <div className="login-brand-copy">
        <h2>{panel.title}<br /><span>{panel.accent}</span></h2>
        <p>{panel.description}</p>
      </div>
      <div className="login-network" aria-hidden="true">
        {isNetwork ? <svg viewBox="0 0 540 440" fill="none">
          <circle cx="270" cy="220" r="172" stroke="white" strokeOpacity=".1" />
          <circle cx="270" cy="220" r="115" stroke="white" strokeOpacity=".08" strokeDasharray="2 8" />
          <path d="M0 220H540M270 0V440" stroke="white" strokeOpacity=".07" />
          {services.map((service, index) => (
            <g key={service.name}>
              <path d={`M270 220 Q${service.x} 220 ${service.x} ${service.y}`} stroke="white" strokeOpacity=".22" />
              <path className="login-network-packet" d={`M270 220 Q${service.x} 220 ${service.x} ${service.y}`} pathLength="100" stroke="#ffe5df" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 97" style={{ animationDelay: `${index * -.9}s` }} />
              <rect x={service.x - 27} y={service.y - 27} width="54" height="54" rx="4" fill="#871d25" stroke="#ffffff45" />
              <service.icon x={service.x - 10} y={service.y - 10} width="20" height="20" stroke="white" strokeWidth="1.4" />
              <text x={service.x} y={service.y + 46} textAnchor="middle" fill="#ffe4e4" fontSize="11" fontFamily="inherit">{service.name}</text>
            </g>
          ))}
          <circle cx="270" cy="220" r="64" fill="#b61c28" stroke="#ffffff30" />
          <circle cx="270" cy="220" r="53" stroke="#ffffff20" />
          <g stroke="white" strokeWidth="5" strokeLinecap="round">
            <circle cx="270" cy="220" r="21" />
            <path d="m254 204-15-18m47 18 15-18m-16 50 15 16" />
            <circle cx="235" cy="181" r="6" strokeWidth="3" />
            <circle cx="304" cy="257" r="5" strokeWidth="3" />
          </g>
          <circle cx="305" cy="181" r="6" fill="white" />
        </svg> : <svg viewBox="0 0 540 440" fill="none">
          <circle cx="270" cy="220" r="170" stroke="#ffffff18" />
          <circle cx="270" cy="220" r="125" stroke="#ffffff30" strokeDasharray="2 9" />
          <path d="M0 220H175M365 220H540M270 0V125M270 315V440" stroke="#ffffff30" />
          <path className="login-network-packet" d="M0 220H175M365 220H540" pathLength="100" stroke="#ffe5df" strokeWidth="2" strokeDasharray="3 97" />
          <rect x="180" y="130" width="180" height="180" rx="4" fill="#a21b2a" stroke="#ffffff50" />
          <rect x="193" y="143" width="154" height="154" rx="2" stroke="#ffffff18" />
          <StatusIcon x="237" y="187" width="66" height="66" stroke="white" strokeWidth="1.1" />
          <circle cx="100" cy="220" r="5" fill="#ffd5d5" />
          <circle cx="440" cy="220" r="5" fill="#ffd5d5" />
          <circle cx="270" cy="50" r="4" fill="#ffd5d5" />
          <circle cx="270" cy="390" r="4" fill="#ffd5d5" />
        </svg>}
        <span className="login-network-caption">{isNetwork ? "Your infrastructure. Within reach." : variant === "verification" ? "Your email. Your account. Your connection." : "Reconnect with your possibilities."}</span>
      </div>
    </aside>
  );
}
