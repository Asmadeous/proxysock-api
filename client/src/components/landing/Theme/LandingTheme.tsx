// src/components/LandingTheme.tsx
import { useState } from "react";
import "@/styles/landing-theme.css";

export function LandingTheme({ children }: { children: React.ReactNode }) {
  const [dark] = useState(false);

  return (
    <div className={`landing-theme ${dark ? "dark" : ""}`}>{children}</div>
  );
}
