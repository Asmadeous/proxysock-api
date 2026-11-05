// src/layouts/PublicLayout.tsx
import { Outlet, useLocation } from "react-router-dom";

import { useThemeStore } from "@/store/themeStore";
import { Footer } from "@/components/landing/layout/Footer";
import Navbar from "./Navbar";
import "./public-layout.css";


export default function PublicLayout() {
  const hasInsetHero = ["/", "/proxies", "/vps", "/rdp", "/vpn", "/esim", "/HowToConnect", "/ip-checker", "/locations", "/blog", "/faq", "/contact", "/about", "/affiliate-program", "/reseller-program", "/proxy-purpose", "/privacy", "/terms", "/cookie-policy"].includes(useLocation().pathname);
  const dark = useThemeStore((state) => state.dark);

  return (
    <div
      className={`landing-theme min-h-screen bg-background text-foreground relative ${dark ? "dark" : ""
        }`}
    >

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className={`flex-grow ${hasInsetHero ? "" : "pt-20"}`}>
          <Outlet />
        </main>
        <Footer />

      </div>
    </div>
  );
}
