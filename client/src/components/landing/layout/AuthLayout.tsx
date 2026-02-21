import { Outlet } from "react-router-dom";
import { useThemeStore } from "@/store/themeStore";
<<<<<<< HEAD
=======
import ChatWidget from "@/components/ChatWidget";
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)

export default function AuthLayout() {
  const dark = useThemeStore((state) => state.dark);

  return (
    <div
<<<<<<< HEAD
      className={`landing-theme min-h-screen bg-background text-foreground ${
        dark ? "dark" : ""
      }`}
    >
      <Outlet />
=======
      className={`landing-theme min-h-screen bg-background text-foreground ${dark ? "dark" : ""
        }`}
    >
      <Outlet />
      <ChatWidget />
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
    </div>
  );
}
