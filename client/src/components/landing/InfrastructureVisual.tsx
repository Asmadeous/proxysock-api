import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Command, Cpu, Folder, Globe2, HardDrive, LockKeyhole, Monitor, Server, ShieldCheck, Signal, Smartphone, Terminal, Wifi } from "lucide-react";

export type InfrastructureService = "proxies" | "vps" | "rdp" | "vpn" | "esim";
const labels = {
  proxies: ["Choose your route", "Your connection, ready"],
  vps: ["Configure your server", "Your environment, online"],
  rdp: ["A workspace in the cloud", "Your desktop, connected"],
  vpn: ["Set up your private tunnel", "A protected connection"],
  esim: ["Your next destination", "Mobile data, ready to go"],
};

function WindowBar({ label }: { label: string }) {
  return <div className="infra-window-bar"><span><i /><i /><i /></span><span>{label}</span><LockKeyhole size={12} /></div>;
}

function ProxyScene({ step }: { step: number }) {
  return <>
    <div className="infra-route-map">
      <svg viewBox="0 0 500 260" fill="none">
        <path d="M60 130H160Q190 130 210 100L290 50H440M60 130H440M60 130H160Q190 130 210 160L290 210H440" stroke="currentColor" strokeOpacity=".18" />
        <path className="infra-active-route" d={step ? "M60 130H440" : "M60 130H160Q190 130 210 100L290 50H440"} stroke="currentColor" strokeWidth="2" />
        {[50, 130, 210].map((y) => <g key={y}><circle cx="440" cy={y} r="7" fill="#ef4444" /><circle cx="440" cy={y} r="14" stroke="currentColor" strokeOpacity=".2" /></g>)}
        <circle cx="60" cy="130" r="24" fill="#211416" stroke="#f87171" />
        <path d="M49 130h22m-11-11v22" stroke="white" />
      </svg>
      <span className="infra-route-source">Your app</span><span className="infra-route-target">The web</span>
    </div>
    <div className="infra-window infra-proxy-window">
      <WindowBar label="PROXY CONNECTION" />
      <div className="infra-window-content">
        <div className="infra-card-heading"><Globe2 /><span>{step ? "Connection ready" : "Find your route"}</span><span className="infra-status">{step ? "Ready" : "Configure"}</span></div>
        <div className="infra-pills"><span className={!step ? "selected" : ""}>Datacenter</span><span className={step ? "selected" : ""}>Residential</span><span>ISP</span></div>
        <div className="infra-detail-row"><span>Connection</span><strong>{step ? "Residential proxy" : "Datacenter proxy"}</strong></div>
        <div className="infra-detail-row"><span>Access</span><strong>{step ? "Credentials available" : "Choose your location"}</strong></div>
      </div>
    </div>
    {step === 1 && <div className="infra-floating-note"><Check size={15} /> Ready for your workflow</div>}
  </>;
}

function ServerScene({ step }: { step: number }) {
  return <>
    <div className={`infra-server-stack ${step ? "is-online" : ""}`}>
      {[0, 1, 2].map((n) => <div key={n} className="infra-server-unit"><Server size={21} /><span /><span /><i /><i /></div>)}
    </div>
    <div className="infra-window infra-server-window">
      <WindowBar label={step ? "SERVER CONSOLE" : "VIRTUAL SERVER"} />
      <div className="infra-window-content">
        <div className="infra-card-heading"><Terminal /><span>{step ? "Your server is online" : "Make it your own"}</span></div>
        {step ? <div className="infra-terminal"><p><span>✓</span> Operating system installed</p><p><span>✓</span> Network configured</p><p><span>✓</span> Access credentials ready</p><p className="infra-terminal-prompt">root@your-server:~# <span>▍</span></p></div> : <><div className="infra-pills"><span className="selected">Linux</span><span>Windows</span></div><div className="infra-specs"><span><Cpu size={18} />Compute</span><span><HardDrive size={18} />Storage</span><span><Globe2 size={18} />Network</span></div></>}
      </div>
    </div>
    <div className="infra-floating-note"><Server size={15} />{step ? "Full control, from your account" : "An environment of your own"}</div>
  </>;
}

function DesktopScene({ step }: { step: number }) {
  return <>
    <div className="infra-desktop">
      <WindowBar label="REMOTE WORKSPACE" />
      <div className="infra-desktop-screen">
        <div className="infra-desktop-wallpaper" />
        <div className="infra-desktop-icons"><span><Folder />Files</span><span><Globe2 />Browser</span><span><Terminal />Terminal</span></div>
        <div className="infra-desktop-dialog">
          {step ? <><div className="infra-desktop-check"><Check size={25} /></div><strong>Welcome to your workspace</strong><p>Your apps. Your environment.</p><div className="infra-pills"><span className="selected">Connected</span></div></> : <><Monitor size={30} /><strong>Your remote desktop</strong><p>Choose an environment to get started.</p><div className="infra-pills"><span className="selected">Windows</span><span>Linux</span></div></>}
        </div>
        <div className="infra-desktop-taskbar"><Command size={17} /><Folder size={17} /><Globe2 size={17} /><span /><Wifi size={14} /></div>
      </div>
    </div>
    <div className="infra-device-link"><Monitor size={18} /><span /> <LockKeyhole size={15} /><span /><Server size={18} /></div>
    <div className="infra-floating-note"><ArrowUpRight size={15} />Your desktop goes with you</div>
  </>;
}

function VpnScene({ step }: { step: number }) {
  return <>
    <div className={`infra-tunnel ${step ? "is-connected" : ""}`}><div /><div /><div /><div /><ShieldCheck size={60} strokeWidth={1.25} /></div>
    <div className="infra-vpn-endpoints"><span><Smartphone />Your device</span><span><Globe2 />Residential IP</span></div>
    <div className="infra-window infra-vpn-window">
      <div className="infra-window-content"><div className="infra-card-heading"><LockKeyhole /><span>{step ? "Tunnel established" : "Your private connection"}</span></div><div className="infra-detail-row"><span>{step ? "Traffic" : "Setup"}</span><strong>{step ? "Encrypted in transit" : "Import your configuration"}</strong></div><div className="infra-detail-row"><span>Connection type</span><strong>Residential VPN</strong></div></div>
    </div>
  </>;
}

function EsimScene({ step }: { step: number }) {
  return <>
    <div className="infra-orbit infra-orbit-one" /><div className="infra-orbit infra-orbit-two" />
    <div className="infra-travel-label"><Globe2 size={16} />Explore. Land. Connect.</div>
    <div className="infra-phone">
      <div className="infra-phone-top"><span>9:41</span><i /><Signal size={14} /></div>
      <div className="infra-phone-content"><div className="infra-phone-symbol">{step ? <Wifi size={36} /> : <Globe2 size={36} />}</div><small>PROXYSOCK eSIM</small><strong>{step ? "You’re connected." : "Where to next?"}</strong><p>{step ? "Your travel data, on your phone." : "A data plan for your destination."}</p>
        <div className="infra-phone-plan"><span>{step ? "Mobile data" : "Travel plan"}</span><strong>{step ? "eSIM installed" : "Choose a destination"}</strong><div className="infra-data-line"><span style={{ width: step ? "90%" : "40%" }} /></div><span>{step ? "Ready for your journey" : "Data · Duration · Coverage"}</span></div>
      </div>
      <div className="infra-phone-home" />
    </div>
    <div className="infra-esim-chip"><Smartphone size={24} /><span>Digital SIM</span><Check size={14} /></div>
  </>;
}

export function InfrastructureVisual({ service, step }: { service: InfrastructureService; step: number }) {
  const reducedMotion = useReducedMotion();
  return <figure className={`infrastructure-visual infrastructure-visual-${service}`} aria-label={`Illustration: ${labels[service][step]}`}>
    <div className="infra-visual-topline"><span>ProxySock<span className="infra-brand-dot">.</span></span><span>Service preview</span></div>
    <div className="infra-scene" aria-hidden="true">
      <AnimatePresence initial={false}>
        <motion.div className="infra-scene-content" key={`${service}-${step}`} initial={{ opacity: 0, y: reducedMotion ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -18 }} transition={{ duration: reducedMotion ? 0 : 0.45, ease: "easeInOut" }}>
          {service === "proxies" && <ProxyScene step={step} />}
          {service === "vps" && <ServerScene step={step} />}
          {service === "rdp" && <DesktopScene step={step} />}
          {service === "vpn" && <VpnScene step={step} />}
          {service === "esim" && <EsimScene step={step} />}
        </motion.div>
      </AnimatePresence>
    </div>
    <figcaption><span className="infra-step-dots"><i className={step === 0 ? "selected" : ""} /><i className={step === 1 ? "selected" : ""} /></span><AnimatePresence mode="wait" initial={false}><motion.span key={`${service}-${step}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>{labels[service][step]}</motion.span></AnimatePresence></figcaption>
  </figure>;
}
