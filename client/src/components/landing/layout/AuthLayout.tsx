import { Outlet } from "react-router-dom";
import { useThemeStore } from "@/store/themeStore";
import ChatWidget from "@/components/ChatWidget";

export default function AuthLayout() {
  const dark = useThemeStore((state) => state.dark);

  return (
    <div
      className={`landing-theme min-h-screen bg-background text-foreground ${dark ? "dark" : ""
        }`}
    >
      <Outlet />
      <ChatWidget />
    </div>
  );
}
