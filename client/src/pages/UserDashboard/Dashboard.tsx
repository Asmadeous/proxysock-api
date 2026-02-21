import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { Sidebar } from "@/components/dashboard/layout/SideBar";
import { useThemeStore } from "@/store/themeStore";

export default function Dashboard() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  // const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Collapsed state removed for sidebar-only layout

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
          className={`hidden lg:block lg:flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? "w-[80px]" : "w-64"
            }`}
        >
          <Sidebar
            isMobile={isMobile}
            setSidebarOpen={setSidebarOpen}
            handleLogout={handleLogout}
            cartCount={cartCount}
            userName={userName}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence mode="wait">
          {isMobile && isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden"
              >
                <div className="h-full relative">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-background/80 rounded-full z-[60]"
                  >
                    <X className="w-5 h-5 text-foreground" />
                  </button>
                  <Sidebar
                    isMobile={isMobile}
                    setSidebarOpen={setSidebarOpen}
                    handleLogout={handleLogout}
                    cartCount={cartCount}
                    userName={userName}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    onLinkClick={() => setSidebarOpen(false)}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div
          className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10"
        >
          <main
            className={`flex-1 overflow-y-auto landing-theme h-full bg-background text-foreground pb-8 ${dark ? "dark" : ""
              }`}
          >
            {/* Mobile Menu Toggle - Floating or Top Bar */}
            {isMobile && (
              <div className="sticky top-0 z-30 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between lg:hidden">
                <button
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
