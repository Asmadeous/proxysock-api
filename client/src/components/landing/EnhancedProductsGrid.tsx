import { useEffect, useRef, useState } from "react";
import { ArrowRight, Globe2, Monitor, Server, ShieldCheck, Smartphone } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { InfrastructureVisual } from "./InfrastructureVisual";
import "./infrastructure.css";

interface EnhancedProductsGridProps {
  trackConversion: (eventName: string, eventType: string, pagePath: string) => void;
  trackViewContent?: (data: { productId: string; productName: string; category: string; value: number }) => void;
}

const services = [
  {
    id: "proxies", name: "Proxy services", icon: Globe2,
    title: "The right IP.", accent: "A world of access.",
    description: "Datacenter, residential, and ISP proxies for your browsing, research, and automation. Choose the connection that fits your workflow.",
    steps: [
      { title: "Choose your connection", description: "Find the proxy type and location you need for your project." },
      { title: "Put your proxies to work", description: "Get your connection details and use them with your browser, tools, or scripts." },
    ],
    href: "/proxies", cta: "Explore proxies", productId: "proxy-services", category: "proxy", value: 1,
  },
  {
    id: "vps", name: "VPS hosting", icon: Server,
    title: "Your server.", accent: "Your rules.",
    description: "Virtual servers for the applications and workloads you want to run. Pick your operating system, configure your environment, and take control.",
    steps: [
      { title: "Build your environment", description: "Choose your plan and a supported Linux or Windows operating system." },
      { title: "Take full control", description: "Access your server and manage its power state from your account." },
    ],
    href: "/vps", cta: "Explore virtual servers", productId: "vps-hosting", category: "vps", value: 6.99,
  },
  {
    id: "rdp", name: "Remote desktops", icon: Monitor,
    title: "Your workspace.", accent: "Wherever you are.",
    description: "Connect to a hosted desktop and work with your apps in a remote environment. Your desktop runs on a server, ready when you need it.",
    steps: [
      { title: "Choose your desktop", description: "Select a Windows or supported Linux desktop for your workflow." },
      { title: "Connect and get to work", description: "Use your remote desktop client to sign in, install apps, and manage your workspace." },
    ],
    href: "/rdp", cta: "Explore remote desktops", productId: "rdp-hosting", category: "rdp", value: 22.99,
  },
  {
    id: "vpn", name: "Residential VPN", icon: ShieldCheck,
    title: "A private connection.", accent: "A residential IP.",
    description: "Connect through a residential IP with a VPN. Bring a secure tunnel to your everyday browsing using a compatible VPN client.",
    steps: [
      { title: "Set up your connection", description: "Download your VPN configuration from your account and import it into your client." },
      { title: "Browse through your VPN", description: "Encrypt traffic between your device and the VPN server while using a residential IP." },
    ],
    href: "/vpn", cta: "Explore residential VPN", productId: "vpn-residential", category: "vpn", value: 2.6,
  },
  {
    id: "esim", name: "Travel eSIMs", icon: Smartphone,
    title: "A new destination.", accent: "Already connected.",
    description: "Find a mobile data plan for your next trip. Add an eSIM to your compatible phone and get online without swapping a physical SIM.",
    steps: [
      { title: "Find your travel plan", description: "Choose your destination, data allowance, and plan duration." },
      { title: "Scan, install, connect", description: "Install your eSIM using the activation details provided with your order." },
    ],
    href: "/esim", cta: "Explore eSIM plans", productId: "esim-cards", category: "esim", value: 1.99,
  },
] as const;

export const EnhancedProductsGrid = ({ trackConversion, trackViewContent }: EnhancedProductsGridProps) => {
  const articles = useRef<(HTMLElement | null)[]>([]);
  const visual = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [steps, setSteps] = useState<number[]>(services.map(() => 0));
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!desktop.matches) return;
      const focus = window.innerHeight * 0.48;
      let next = 0;
      articles.current.forEach((article, index) => {
        if (!article) return;
        if (article.getBoundingClientRect().top <= focus) next = index;
      });
      const rect = articles.current[next]?.getBoundingClientRect();
      const step = rect && (focus - rect.top) / rect.height > 0.55 ? 1 : 0;
      const offset = rect && !reducedMotion ? Math.max(-1, Math.min(1, (focus - rect.top) / rect.height - 0.5)) * -24 : 0;
      visual.current?.style.setProperty("--infra-parallax", `${offset}px`);
      setActive(next);
      setSteps((previous) => previous[next] === step ? previous : previous.map((value, index) => index === next ? step : value));
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(schedule, {
      rootMargin: "-30% 0px -30% 0px",
    });
    articles.current.forEach((article) => { if (article) observer?.observe(article); });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [reducedMotion]);

  return (
    <section className="infrastructure" aria-labelledby="services-heading">
      <header className="infrastructure-heading">
        <h2 id="services-heading">Digital infrastructure, connected.</h2>
        <span>02 / Explore our services</span>
      </header>
      <nav className="infrastructure-nav" aria-label="Explore services">
        {services.map((service, index) => (
          <a key={service.id} href={`#infrastructure-${service.id}`} aria-current={active === index ? "location" : undefined}
            onClick={(event) => {
              event.preventDefault();
              articles.current[index]?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
              setActive(index);
            }}>
            <span>0{index + 1}</span>{service.name}
          </a>
        ))}
      </nav>
      <div className="infrastructure-grid">
        <div className="infrastructure-stories">
          {services.map((service, index) => (
            <article key={service.id} id={`infrastructure-${service.id}`} className="infrastructure-story"
              ref={(element) => { articles.current[index] = element; }} aria-labelledby={`title-${service.id}`}>
              <div className="infrastructure-eyebrow"><service.icon size={16} aria-hidden="true" />{service.name}<span>0{index + 1} / 05</span></div>
              <h3 id={`title-${service.id}`}>{service.title}<br /><em>{service.accent}</em></h3>
              <p className="infrastructure-description">{service.description}</p>
              <div className="infrastructure-steps" aria-label={`${service.name} preview steps`}>
                {service.steps.map((step, stepIndex) => (
                  <button key={step.title} type="button" aria-pressed={steps[index] === stepIndex}
                    onClick={() => {
                      setActive(index);
                      setSteps((previous) => previous.map((value, i) => i === index ? stepIndex : value));
                    }}>
                    <span className="infrastructure-step-number">0{stepIndex + 1}</span>
                    <span><strong>{step.title}</strong><span>{step.description}</span></span>
                  </button>
                ))}
              </div>
              <Link className="infrastructure-link" to={service.href} onClick={() => {
                trackConversion(`${service.category}_plans_navigation`, "product_interest", service.href);
                trackViewContent?.({ productId: service.productId, productName: service.name, category: service.category, value: service.value });
              }}>{service.cta}<ArrowRight size={17} aria-hidden="true" /></Link>
              <div className="infrastructure-mobile-visual"><InfrastructureVisual service={service.id} step={steps[index]} /></div>
            </article>
          ))}
        </div>
        <div className="infrastructure-visual-column">
          <div className="infrastructure-sticky" ref={visual}>
            <InfrastructureVisual service={services[active].id} step={steps[active]} />
            <div className="infrastructure-caption"><span>One account. Every connection.</span><span>Scroll to explore ↓</span></div>
          </div>
        </div>
      </div>
    </section>
  );
};
