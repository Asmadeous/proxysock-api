import { useReducedMotion } from "framer-motion";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import "./trust-sections.css";

const metrics = [
  { value: 15000, suffix: "+", decimals: 0, display: "15,000+", label: "Active customers", detail: "People building with ProxySock" },
  { value: 50000, suffix: "+", decimals: 0, display: "50,000+", label: "IPs in our network", detail: "Connections at a global scale" },
  { value: 99.9, suffix: "%", decimals: 1, display: "99.9%", label: "Uptime SLA", detail: "Reliability you can plan around" },
  { value: null, suffix: "", decimals: 0, display: "24/7", label: "Expert support", detail: "Help when you need a hand" },
];

export const EnhancedStatsSection = () => {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  const reducedMotion = useReducedMotion();

  return (
    <section ref={ref} className="trust-section trust-scale" aria-labelledby="stats-heading">
      <div className="trust-section-rail"><span>Our network, in numbers</span><span>03 / The scale</span></div>
      <div className="trust-section-intro">
        <h2 id="stats-heading">Built for scale.<br /><span>Ready for you.</span></h2>
        <div className="trust-section-summary">
          <p>From your first connection to your next big project, put an established network behind your work.</p>
          <div className="trust-network-label"><MapPin size={14} aria-hidden="true" /> Optimized Canadian network</div>
          <Link to="/locations" className="trust-text-link">Explore our locations <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
      </div>
      <dl className="trust-metrics">
        {metrics.map((metric, index) => (
          <div className="trust-metric" key={metric.label}>
            <dt><span className="trust-metric-index" aria-hidden="true">0{index + 1}</span>{metric.label}</dt>
            <dd className="trust-metric-value">
              <span className="sr-only">{metric.display}</span>
              <span aria-hidden="true">{inView && !reducedMotion && metric.value !== null
                ? <CountUp end={metric.value} suffix={metric.suffix} decimals={metric.decimals} separator="," duration={1.6} />
                : metric.display}</span>
            </dd>
            <dd className="trust-metric-detail">{metric.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
