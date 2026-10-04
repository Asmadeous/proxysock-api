import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { Sidebar } from "@/components/dashboard/layout/SideBar";
import { useThemeStore } from "@/store/themeStore";
import { formatImageUrl } from "../../services/api";

export default function Dashboard() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => globalThis.innerWidth < 1024);
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  const { user, logout } = useAuth();
  const userName = user?.username || user?.first_name || "User";

  const dark = useThemeStore((state) => state.dark);

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fixed mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = globalThis.innerWidth < 1024;
      setIsMobile(mobile);
      // Close sidebar when switching to desktop
      if (!mobile) setSidebarOpen(false);
    };

    // Set initial value
    checkMobile();

    // Add resize listener
    globalThis.addEventListener("resize", checkMobile);
    return () => globalThis.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const getInitialCartCount = () => {
      try {
        const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");
        return Array.isArray(cartItems) ? cartItems.length : 0;
      } catch {
        return 0;
      }
    };

    setCartCount(getInitialCartCount());

    const handleCartUpdate = (event: any) => {
      const customEvent = event;
      setCartCount(customEvent.detail.count);
    };

    globalThis.addEventListener("cart-updated", handleCartUpdate);
    return () => globalThis.removeEventListener("cart-updated", handleCartUpdate);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div
      className={`landing-theme min-h-screen bg-background text-foreground ${dark ? "dark" : ""
        }`}
    >
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar - Variable width */}
        <div
          className={`hidden lg:block lg:flex-shrink-0 transition-[width] duration-200 motion-reduce:transition-none ease-in-out ${isCollapsed ? "w-[80px]" : "w-[260px]"
            }`}
        >
          {!isMobile && <Sidebar
            isMobile={isMobile}
            setSidebarOpen={setSidebarOpen}
            handleLogout={handleLogout}
            cartCount={cartCount}
            userName={userName}
            profilePictureUrl={formatImageUrl(user?.profile_picture_url)}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />}
        </div>

        {isMobile && (
          <Dialog.Root open={isSidebarOpen} onOpenChange={setSidebarOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="workspace-mobile-overlay" />
              <Dialog.Content className="workspace-mobile-drawer" aria-describedby={undefined} onCloseAutoFocus={event => { event.preventDefault(); document.getElementById("workspace-menu-toggle")?.focus(); }}>
                <Dialog.Title className="sr-only">Workspace navigation</Dialog.Title>
                <Sidebar isMobile setSidebarOpen={setSidebarOpen} handleLogout={handleLogout} cartCount={cartCount} userName={userName} profilePictureUrl={formatImageUrl(user?.profile_picture_url)} isCollapsed={false} setIsCollapsed={setIsCollapsed} onLinkClick={() => setSidebarOpen(false)} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        {/* Main Content Area */}
        <div
          className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10"
        >
          <main
            data-page-scroll
            className={`flex-1 overflow-y-auto landing-theme h-full bg-background text-foreground pb-8 ${dark ? "dark" : ""
              }`}
          >
            {/* Mobile Menu Toggle - Floating or Top Bar */}
            {isMobile && (
              <div className="sticky top-0 z-30 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between lg:hidden">
                <button
                  id="workspace-menu-toggle"
                  aria-label="Open navigation"
                  aria-expanded={isSidebarOpen}
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 -ml-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <span className="font-semibold text-sm">Dashboard</span>
                <div className="w-8" /> {/* Spacer for centering */}
              </div>
            )}

            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
