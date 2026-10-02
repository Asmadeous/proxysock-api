import { useState } from "react";
import { Pause, Play } from "lucide-react";

const serviceMarks = [
  { name: "Proxies", path: "M4 14 15 3h14l-5 5h-7l-8 8v8l-5 5V14Zm32 12L25 37H11l5-5h7l8-8v-8l5-5v15ZM14 17l3-3h9l-3 5h-4v4l-5 3v-9Z" },
  { name: "VPS", path: "m20 3 17 9-17 9L3 12 20 3ZM3 19l5-3 12 7 12-7 5 3-17 9L3 19Zm0 8 5-3 12 7 12-7 5 3-17 9L3 27Z" },
  { name: "RDP", path: "M3 5h26v22H3V5Zm5 5v12h16V10H8Zm24 4h5v21H13v-5h19V14Z" },
  { name: "VPN", path: "M20 2 36 8v11c0 9-9 16-16 19C13 35 4 28 4 19V8L20 2Zm-9 13 9 13 11-17h-6l-5 9-4-5h-5Z" },
  { name: "eSIM", path: "M10 3h15l9 9v21a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm4 11v6h5v-6h-5Zm8 0v6h5v-6h-5Zm-8 9v6h5v-6h-5Zm8 0v6h5v-6h-5Z" },
];

export function HeroServiceCarousel() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="hero-service-carousel mt-auto pt-6" role="region" aria-label="ProxySock services">
      <ul className="sr-only">{serviceMarks.map((mark) => <li key={mark.name}>{mark.name}</li>)}</ul>
      <div className="hero-service-window" aria-hidden="true">
        <div className={`hero-service-track ${paused ? "is-paused" : ""}`}>
          {[0, 1].map((copy) => (
            <div className="hero-service-group" key={copy}>
              {serviceMarks.map((mark) => (
                <span className="hero-service-wordmark" key={mark.name}>
                  <svg viewBox="0 0 40 40" fill="currentColor" className="hero-service-symbol" focusable="false">
                    <path d={mark.path} fillRule="evenodd" clipRule="evenodd" />
                  </svg>
                  <span>{mark.name}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Play service carousel" : "Pause service carousel"} className="hero-service-control rounded p-2 text-white/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
        {paused ? <Play aria-hidden="true" className="h-3 w-3" /> : <Pause aria-hidden="true" className="h-3 w-3" />}
      </button>
    </div>
  );
}
