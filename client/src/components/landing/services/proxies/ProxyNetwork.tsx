import { Globe, Monitor, Server } from "lucide-react";

export function ProxyNetwork({ label = "Your proxy network", rotating = false }: { label?: string; rotating?: boolean }) {
  return (
    <div className={`proxy-network ${rotating ? "proxy-network-rotating" : ""}`} aria-hidden="true">
      <div className="proxy-network-grid" />
      <div className="proxy-network-top"><span>Connection overview</span><span>HTTP / SOCKS5</span></div>
      <svg className="proxy-network-lines" viewBox="0 0 600 480" fill="none">
        <circle cx="300" cy="240" r="178" stroke="currentColor" strokeOpacity=".08" />
        <circle cx="300" cy="240" r="115" stroke="currentColor" strokeOpacity=".08" strokeDasharray="2 8" />
        {['M70 240H300', 'M300 240C410 240 390 100 510 100', 'M300 240H510', 'M300 240C410 240 390 380 510 380'].map((d, i) => <g key={d}><path d={d} stroke="currentColor" strokeOpacity=".25" /><path className="proxy-route-packet" d={d} stroke="currentColor" strokeWidth="2" pathLength="100" strokeDasharray="4 96" style={{ animationDelay: `${i * -1.5}s` }} /></g>)}
      </svg>
      <div className="proxy-network-origin"><Monitor size={22} /><span>Your app</span></div>
      <div className="proxy-network-hub">
        <div className="proxy-network-hub-mark"><svg viewBox="0 0 100 100" fill="none"><g stroke="currentColor" strokeLinecap="round"><circle cx="50" cy="50" r="18" strokeWidth="6" /><path d="m37 36-15-17m42 17 15-17M64 64l15 17" strokeWidth="4" /><circle cx="18" cy="14" r="5" strokeWidth="2.5" /><circle cx="83" cy="86" r="4" strokeWidth="2.5" /></g><circle cx="83" cy="14" r="5" fill="currentColor" /></svg></div>
        <strong>ProxySock<span>.</span></strong><span>{label}</span>
      </div>
      <div className="proxy-network-endpoint proxy-network-endpoint-top"><Globe size={20} /><span>{rotating ? "Address A" : "Research"}</span></div>
      <div className="proxy-network-endpoint proxy-network-endpoint-middle"><Server size={20} /><span>{rotating ? "Address B" : "Applications"}</span></div>
      <div className="proxy-network-endpoint proxy-network-endpoint-bottom"><Globe size={20} /><span>{rotating ? "Address C" : "Public web"}</span></div>
      <div className="proxy-network-bottom"><span>{rotating ? "A pool of addresses. One connection point." : "Your workflow, connected through a proxy."}</span><span className="proxy-network-signal"><i /><i /><i /><i /></span></div>
    </div>
  );
}
