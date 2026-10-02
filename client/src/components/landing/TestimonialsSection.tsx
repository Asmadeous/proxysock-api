import { useEffect, useId, useRef, useState } from "react";
import { Quote, Star } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { GlobeLand } from "./GlobeLand";
import "./testimonials.css";

const testimonials: { name: string; role: string; service: string; lat: number; lon: number; content: string; demo?: boolean }[] = [
  { name: "Alex Chen", role: "Data Scientist at TechCorp", service: "Proxy services", lat: 40, lon: -74, content: "ProxySock's proxy service has been a game-changer for our data collection. 99.9% uptime and lightning-fast speeds. Absolutely recommend!" },
  { name: "Sarah Johnson", role: "Digital Marketing Director", service: "Remote desktops", lat: 48, lon: 10, content: "The RDP hosting is perfect for running our marketing automation 24/7. Professional service with excellent support team." },
  { name: "Mike Williams", role: "Senior Developer", service: "Virtual servers", lat: 12, lon: 78, content: "VPS performance exceeds expectations. Great value for money and the technical support is top-notch. Been with them for 2 years now." },
  { name: "Travel demo", role: "Illustrative travel scenario", service: "Travel eSIMs", lat: -34, lon: 151, demo: true, content: "I want to choose a data plan before my trip and have the activation details ready when I arrive." },
  { name: "Privacy demo", role: "Illustrative VPN scenario", service: "Residential VPN", lat: -34, lon: 18, demo: true, content: "Having my VPN configuration in the same account as my other services would make setup easier to keep track of." },
  { name: "Research demo", role: "Illustrative research scenario", service: "Proxy services", lat: -23, lon: -46, demo: true, content: "For a research project, I would like to choose the proxy type I need and find the connection details in one place." },

];

// Decorative network locations are not additional customer endorsements.
const connections = [
  ...testimonials,
  { lat: -23, lon: -46 }, { lat: -34, lon: 18 },
  { lat: 1, lon: 104 }, { lat: 35, lon: 139 },
  { lat: -34, lon: 151 }, { lat: 51, lon: -123 },
];
// Review nodes are illustrative, not customer locations.
const radians = Math.PI / 180;
function project(lat: number, lon: number, rotation: number, lift = 1) {
  const phi = (lon - rotation) * radians;
  const cos = Math.cos(lat * radians);
  return { x: 320 + 235 * lift * cos * Math.sin(phi), y: 300 - 235 * lift * Math.sin(lat * radians), z: cos * Math.cos(phi) };
}
function route(from: { lat: number; lon: number }, to: { lat: number; lon: number }, rotation: number) {
  const a = [Math.cos(from.lat * radians) * Math.sin(from.lon * radians), Math.sin(from.lat * radians), Math.cos(from.lat * radians) * Math.cos(from.lon * radians)];
  const b = [Math.cos(to.lat * radians) * Math.sin(to.lon * radians), Math.sin(to.lat * radians), Math.cos(to.lat * radians) * Math.cos(to.lon * radians)];
  let path = "";
  let penDown = false;
  for (let i = 0; i <= 50; i++) {
    const t = i / 50;
    const v = a.map((value, j) => value * (1 - t) + b[j] * t);
    const length = Math.hypot(...v);
    const p = project(Math.asin(v[1] / length) / radians, Math.atan2(v[0], v[2]) / radians, rotation, 1 + Math.sin(t * Math.PI) * .2);
    if (p.z < 0) { penDown = false; continue; }
    path += `${penDown ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)} `;
    penDown = true;
  }
  return path;
}

export const TestimonialsSection = () => {
  const id = useId();
  const [rotation, setRotation] = useState(-24);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const section = useRef<HTMLElement>(null);
  const currentRotation = useRef(rotation);
  const reducedMotion = useReducedMotion();
  const held = hovered || focused;
  const pointerInput = useRef(false);
  useEffect(() => {
    const keyboard = () => { pointerInput.current = false; };
    const pointer = () => { pointerInput.current = true; setFocused(false); };
    window.addEventListener("keydown", keyboard, true);
    window.addEventListener("pointerdown", pointer, true);
    return () => {
      window.removeEventListener("keydown", keyboard, true);
      window.removeEventListener("pointerdown", pointer, true);
    };
  }, []);

  useEffect(() => {
    if (!section.current || typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(section.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (held || reducedMotion || !visible) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % testimonials.length), 7000);
    return () => window.clearInterval(timer);
  }, [held, reducedMotion, visible]);

  useEffect(() => {
    if (hovered) return;
    const start = currentRotation.current;
    const difference = ((testimonials[active].lon - start + 540) % 360) - 180;
    if (reducedMotion) { currentRotation.current = testimonials[active].lon; setRotation(testimonials[active].lon); return; }
    let frame = 0;
    let started: number | null = null;
    const rotate = (time: number) => {
      if (started === null) started = time;
      const progress = Math.min(1, (time - started) / 2200);
      const eased = progress * progress * progress * (progress * (progress * 6 - 15) + 10);
      currentRotation.current = start + difference * eased;
      setRotation(currentRotation.current);
      if (progress < 1) frame = requestAnimationFrame(rotate);
    };
    frame = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(frame);
  }, [active, reducedMotion, hovered]);
  const drag = useRef<{ x: number; rotation: number } | null>(null);
  const selected = testimonials[active];


  return (
    <section ref={section} className={`world-testimonials ${held ? "is-paused" : ""}`} aria-labelledby="testimonials-heading"
      onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); setActive((index) => (index + (event.key === "ArrowRight" ? 1 : testimonials.length - 1)) % testimonials.length); } }}>
      <div className="world-rail"><span>Connected through experience</span></div>
      <header className="world-heading"><h2 id="testimonials-heading">Different ambitions.<br /><span>One connected world.</span></h2><p>Meet the people putting ProxySock to work.<br />Follow the connections. Discover their stories.</p></header>
      <div className="world-layout">
        <div className="world-explorer">
          <div className="world-globe"
            onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }} onPointerLeave={() => setHovered(false)}
            onFocusCapture={() => { if (!pointerInput.current) setFocused(true); }}
            onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}
            tabIndex={0} role="group" aria-label="Customer story globe. Use left and right arrow keys to change stories." onPointerDown={(event) => {
            if (event.button !== 0 || (event.target as Element).closest("button")) return;
            drag.current = { x: event.clientX, rotation };
            event.currentTarget.setPointerCapture(event.pointerId);
          }} onPointerMove={(event) => {
            if (!drag.current) return;
            const next = drag.current.rotation - (event.clientX - drag.current.x) * .35;
            currentRotation.current = ((next + 180) % 360 + 360) % 360 - 180;
            setRotation(currentRotation.current);
          }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
            <GlobeLand rotation={rotation} />
            <svg viewBox="0 0 640 600" aria-hidden="true">
              {connections.map((node, index) => {
                const path = route(node, connections[(index + 1) % connections.length], rotation);
                const point = project(node.lat, node.lon, rotation);
                return <g key={index}><path d={path} className="world-connection" /><path d={path} className="world-packet" style={{ animationDelay: `${index * -.8}s` }} />{index >= testimonials.length && point.z > 0 && <g opacity={Math.min(1, point.z * 6)}><circle cx={point.x} cy={point.y} r="7" className="world-network-halo" /><circle cx={point.x} cy={point.y} r="2.5" className="world-network-point" /></g>}</g>;
              })}
            </svg>
            {testimonials.map((review, index) => {
              const p = project(review.lat, review.lon, rotation);
              if (p.z < .08) return null;
              return <button key={review.name} type="button" className={`world-node ${active === index ? "is-active" : ""}`} style={{ left: `${p.x / 640 * 100}%`, top: `${p.y / 600 * 100}%` }} aria-label={`Read ${review.name}'s testimonial`} aria-pressed={active === index} aria-controls={`${id}-review`} onPointerEnter={(event) => { if (event.pointerType === "mouse" && !drag.current) setActive(index); }} onFocus={() => setActive(index)} onClick={() => setActive(index)}><span>{review.name.split(" ").map((part) => part[0]).join("")}</span></button>;
            })}
          </div>
        </div>
        <div className="world-stories">
          <div className="world-review" id={`${id}-review`}>
            <div className="world-review-top"><span>{selected.service}</span><Quote size={25} strokeWidth={1.2} aria-hidden="true" /></div>
            {!selected.demo && <div className="world-stars" aria-label="5 out of 5 stars">{[0,1,2,3,4].map((n) => <Star key={n} size={13} fill="currentColor" aria-hidden="true" />)}</div>}
            {selected.demo && <p className="world-demo-label">Demo content · Not a customer review</p>}
            <blockquote key={selected.name}>{selected.content}</blockquote>
            <div className="world-review-author"><span className="world-avatar" aria-hidden="true">{selected.name.split(" ").map((part) => part[0]).join("")}</span><div><strong>{selected.name}</strong><span>{selected.role}</span></div></div>
            <div className="world-review-bottom"><span>{selected.demo ? "Design preview" : "Customer story"}</span><span>{String(active + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}</span></div>
          </div>

        </div>
      </div>

    </section>
  );
};
