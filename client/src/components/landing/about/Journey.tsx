import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

const timeline = [
  {
    year: "2019",
    title: "Company Founded",
    description:
      "Started with a vision to provide reliable and secure proxy services to businesses worldwide.",
  },
  {
    year: "2020",
    title: "Global Expansion",
    description:
      "Expanded our network to 50+ countries, serving over 1,000 customers globally.",
  },
  {
    year: "2021",
    title: "Infrastructure Growth",
    description:
      "Invested heavily in infrastructure, reaching 25,000+ available IPs and 99.9% uptime.",
  },
  {
    year: "2022",
    title: "Product Diversification",
    description:
      "Launched RDP and VPS hosting services, becoming a comprehensive digital infrastructure provider.",
  },
  {
    year: "2023",
    title: "Technology Innovation",
    description:
      "Introduced advanced authentication methods and enhanced security protocols across all services.",
  },
  {
    year: "2024",
    title: "Market Leadership",
    description:
      "Reached 15,000+ customers and 50,000+ IPs, establishing ourselves as an industry leader.",
  },
];

export const Journey = () => {
  const track = useRef<HTMLOListElement>(null);
  const [route, setRoute] = useState({ path: "", arrivals: [] as number[] });
  const routePath = useRef<SVGPathElement>(null);
  const reducedMotion = useReducedMotion();
  const inView = useInView(track, { margin: "100px" });

  useLayoutEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => {
      const bounds = element.getBoundingClientRect();
      const points = Array.from(element.querySelectorAll<HTMLElement>(".about-milestone-node")).map(node => {
        const rect = node.getBoundingClientRect();
        return { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2 };
      });
      let distance = 0;
      const arrivals = [0];
      const path = points.map((point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        const previous = points[index - 1];
        // At the desktop row break, travel around the cards through the gutter.
        if (point.x < previous.x - 1) {
          const right = bounds.width - 8;
          const bridge = point.y - 24;
          distance += Math.abs(right - previous.x) + Math.abs(bridge - previous.y) + Math.abs(right - point.x) + Math.abs(point.y - bridge);
          arrivals.push(distance);
          return `H ${right} V ${bridge} H ${point.x} V ${point.y}`;
        }
        distance += Math.hypot(point.x - previous.x, point.y - previous.y);
        arrivals.push(distance);
        return `L ${point.x} ${point.y}`;
      }).join(" ");
      setRoute({ path, arrivals: arrivals.map(value => distance ? value / distance : 0) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  useEffect(() => {
    const element = track.current;
    const path = routePath.current;
    if (!element || !path || !route.path || !inView || reducedMotion) return;
    const traveler = element.querySelector<SVGGElement>(".about-timeline-traveler");
    if (!traveler) return;
    const milestones = Array.from(element.querySelectorAll<HTMLElement>(".about-milestone"));
    const length = path.getTotalLength();
    const travelTime = 26000;
    const cycleTime = 28000; // Leave time for the final milestone's glow before looping.
    let start: number | undefined;
    let frame = 0;
    const animate = (now: number) => {
      start ??= now;
      const phase = (now - start) % cycleTime;
      const point = path.getPointAtLength(Math.min(phase / travelTime, 1) * length);
      traveler.setAttribute("transform", `translate(${point.x} ${point.y})`);
      traveler.style.opacity = String(phase > travelTime + 1000 ? Math.max(0, 1 - (phase - travelTime - 1000) / 1000) : 1);
      milestones.forEach((milestone, index) => {
        const sinceArrival = phase - route.arrivals[index] * travelTime;
        const glow = sinceArrival >= 0 && sinceArrival < 1000 ? 1 - sinceArrival / 1000 : 0;
        milestone.style.setProperty("--milestone-glow", String(glow));
        milestone.dataset.active = String(glow > 0);
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      milestones.forEach(milestone => {
        milestone.style.removeProperty("--milestone-glow");
        delete milestone.dataset.active;
      });
    };
  }, [route, inView, reducedMotion]);

  return (
  <section id="our-journey" className="about-section about-journey" aria-labelledby="about-journey-title">
    <div className="about-section-heading">
      <div><p className="proxy-eyebrow">Our timeline</p><h2 id="about-journey-title">Our journey.<br /><em>Connection by connection.</em></h2></div>
      <p>From our first proxy services to a broader digital infrastructure platform. The milestones that brought us here.</p>
    </div>
    <ol ref={track} className="about-timeline">
      {route.path && <li className="about-timeline-art" aria-hidden="true">
        <svg width="100%" height="100%" fill="none">
          <path ref={routePath} d={route.path} className="about-timeline-route" />
          {inView && !reducedMotion && <g style={{ opacity: 0 }} className="about-timeline-traveler">
            <circle r="12" fill="currentColor" opacity=".1" />
            <circle r="6" fill="currentColor" opacity=".25" />
            <circle r="3" fill="currentColor" />
          </g>}
        </svg>
      </li>}
      {timeline.map((milestone) => (
        <li key={milestone.year} className="about-milestone">
          <span className="about-milestone-node" aria-hidden="true" />
          <time dateTime={milestone.year}>{milestone.year}</time>
          <div><h3>{milestone.title}</h3><p>{milestone.description}</p></div>
        </li>
      ))}
    </ol>
  </section>
  );
};
