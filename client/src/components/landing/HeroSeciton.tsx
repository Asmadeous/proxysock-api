import { ArrowRight, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { HeroNetwork } from "./HeroNetwork";
import { HeroServiceCarousel } from "./HeroServiceCarousel";
import "./hero.css";

interface HeroSectionProps {
  trackConversion: (eventName: string, eventType: string, pagePath: string) => void;
}

export const HeroSection = ({ trackConversion }: HeroSectionProps) => {
  const { isAuthenticated } = useAuth();
  const accountHref = isAuthenticated ? "/dashboard" : "/register";

  return (
    <section aria-labelledby="hero-heading" className="proxysock-hero relative isolate overflow-hidden text-white">
      <div className="hero-art"><HeroNetwork /></div>
      <div className="hero-layout relative grid lg:grid-cols-2">
        <div className="hero-copy relative z-10 flex flex-col">
          <div className="my-auto pb-12">
            <div className="inline-flex w-fit items-center gap-2.5 rounded-sm border border-white/10 bg-white/[0.08] px-3 py-2">
              <Globe aria-hidden="true" className="h-3.5 w-3.5 text-white/85" />
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/90 sm:text-[10px]">Proxies. Hosting. Connectivity.</span>
            </div>
            <h1 id="hero-heading" className="mt-8 font-manrope text-[clamp(2.375rem,5.8vw,6rem)] font-medium leading-[1.06] tracking-[-0.065em] sm:mt-10">
              Proxies, servers<br />
              and global<br />
              connectivity.
            </h1>
            <p className="mt-7 max-w-[410px] font-inter text-sm leading-[1.65] text-white/80 sm:mt-8 sm:text-[15px]">
              Buy proxies, virtual servers (VPS), remote desktops (RDP), residential VPNs, and global eSIM plans. Choose your service and manage it all from one account.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 sm:mt-9">
              <Link
                to={accountHref}
                onClick={() => trackConversion(isAuthenticated ? "dashboard_navigation" : "signup_intent_lead", isAuthenticated ? "navigation" : "conversion", accountHref)}
                className="inline-flex h-12 items-center justify-center gap-3 rounded-[3px] bg-white px-5 text-[13px] font-semibold text-[#171717] transition-colors hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {isAuthenticated ? "Access Dashboard" : "Start Now From $2.99/proxy"}
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#171717] text-white"><ArrowRight aria-hidden="true" className="h-3 w-3" /></span>
              </Link>
              <Link
                to="/HowToConnect"
                onClick={() => trackConversion("documentation_navigation", "education", "/HowToConnect")}
                className="inline-flex h-12 items-center justify-center rounded-[3px] border border-white/50 px-6 text-[13px] font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >View Documentation</Link>
            </div>
          </div>
          <HeroServiceCarousel />
        </div>

      </div>
    </section>
  );
};
