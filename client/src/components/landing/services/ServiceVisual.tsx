import { useId } from "react";
import { Shield, Smartphone, Terminal, Monitor, Signal } from "lucide-react";
import type { ServiceKind } from "./service-pages-data";

export default function ServiceVisual({ kind, label, alternate = false }: { kind: ServiceKind; label: string; alternate?: boolean }) {
  const id = useId();
  return (
    <div className={`service-visual service-visual-${kind}`} aria-hidden="true">
      <div className="service-visual-dots" />
      <div className="service-visual-rail"><span>ProxySock<span className="service-brand-dot">.</span></span><span>{label}</span></div>
      <svg className="service-visual-paths" viewBox="0 0 600 480" fill="none">
        <defs><radialGradient id={id}><stop stopColor="#ffdbdb" stopOpacity=".16" /><stop offset="1" stopColor="#ffdbdb" stopOpacity="0" /></radialGradient></defs>
        <circle cx="300" cy="240" r="225" fill={`url(#${id})`} /><circle cx="300" cy="240" r="195" stroke="white" strokeOpacity=".1" /><circle cx="300" cy="240" r="145" stroke="white" strokeOpacity=".08" strokeDasharray="2 10" />
        {['M0 380 Q300 380 600 80', 'M0 420 Q180 420 300 240 T600 120', 'M80 480 Q180 320 300 240 T540 0'].map((d, i) => <g key={d}><path d={d} stroke="#ffd9d9" strokeOpacity=".2" /><path className="proxy-route-packet" d={d} stroke="#ffdddd" strokeWidth="2" pathLength="100" strokeDasharray="3 97" style={{ animationDelay: `${i * -1.8}s` }} /></g>)}
      </svg>
      {kind === "vps" && <div className="service-server-scene">
        <div className="service-resource-chips"><span>Compute</span><span>Memory</span><span>Storage</span></div>
        <div className="service-server-stack">{["Your environment", "Your resources", "Your applications"].map((text, i) => <div key={text}><span>{text}</span><div className="service-server-lights"><i /><i /><i /></div><small>{i === 0 ? (alternate ? "Windows" : "Linux") : i === 1 ? "Configured to your plan" : "Built around your work"}</small></div>)}</div>
        <div className="service-terminal"><div><Terminal size={13} /><span>Connection preview</span></div><p><span>›</span> {alternate ? "Your Windows environment" : "Your Linux environment"}<br /><span>›</span> Your next project starts here<span className="service-terminal-cursor">_</span></p></div>
      </div>}
      {kind === "rdp" && <div className="service-desktop-scene">
        <div className="service-desktop-window"><div className="service-window-bar"><span><i /><i /><i /></span><span>{alternate ? "Linux" : "Windows"} desktop</span></div><div className="service-desktop-content"><div className="service-desktop-sidebar"><span /><span /><span /><span /></div><div className="service-desktop-workspace"><Monitor size={31} strokeWidth={1.3} /><strong>Your workspace.</strong><span>Beyond your desk.</span><div className="service-desktop-apps"><i /><i /><i /></div></div></div><div className="service-desktop-taskbar"><span /><span /><span /><span /></div></div>
        <div className="service-desktop-client"><Monitor size={16} /><span>Your device</span><span className="service-connection-line" /><span>Remote workspace</span></div>
      </div>}
      {kind === "vpn" && <div className="service-vpn-scene"><div className="service-vpn-device"><Smartphone size={30} strokeWidth={1.2} /><span>Your device</span></div><div className="service-tunnel"><div className="service-tunnel-ring" /><div className="service-tunnel-ring" /><div className="service-tunnel-ring" /><div className="service-vpn-shield"><Shield size={65} strokeWidth={1.1} /></div><strong>{alternate ? "OpenVPN" : "WireGuard"}</strong><span>Configured for your connection</span></div><div className="service-vpn-destination"><Signal size={29} strokeWidth={1.3} /><span>Your network</span></div></div>}
      {kind === "esim" && <div className="service-phone-scene"><div className="service-esim-label"><span>Digital connection</span><strong>{alternate ? "Calls. Texts. Data." : "More places. More possibilities."}</strong></div><div className="service-phone"><div className="service-phone-camera" /><div className="service-phone-status"><span>ProxySock</span><Signal size={14} /></div><div className="service-phone-content"><Smartphone size={27} strokeWidth={1.2} /><span>Your eSIM</span><strong>{alternate ? "Keep in touch." : "Stay connected."}</strong><div className="service-esim-card"><span>{alternate ? "Phone-number plan" : "Travel data plan"}</span><div className="service-esim-bars"><i /><i /><i /><i /><i /></div><small>{alternate ? "Voice + SMS + data" : "Choose your destination"}</small></div></div><div className="service-phone-home" /></div><span className="service-esim-caption">One device.<br />Your next connection.</span></div>}
      <div className="service-visual-bottom"><span>{kind === "vps" ? "Your own environment, online." : kind === "rdp" ? "A familiar workspace, within reach." : kind === "vpn" ? "Your client. Your configuration. Your connection." : "Your world, connected."}</span></div>
    </div>
  );
}
