// src/layouts/PublicLayout.tsx
import { Outlet } from "react-router-dom";

import { useThemeStore } from "@/store/themeStore";
import { Footer } from "@/components/landing/layout/Footer";
import Navbar from "./Navbar";

export default function PublicLayout() {
  const dark = useThemeStore((state) => state.dark);

  return (
    <div
      className={`landing-theme min-h-screen bg-background text-foreground relative ${dark ? "dark" : ""
        }`}
    >

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
