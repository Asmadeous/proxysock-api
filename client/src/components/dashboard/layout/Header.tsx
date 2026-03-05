import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  X,
  Menu as MenuIcon,
} from "lucide-react";
import logoDark from "@/assets/images/PROXY PNG.webp";
import logoLight from "@/assets/images/PROXY SOCKS DARK FONT.webp";
import UserBalance from "@/components/UserBalance";
import NotificationBell from "@/components/NotificationBell";
import { useThemeStore } from "@/store/themeStore";


export const Header = ({
  isMobile,
  isSidebarOpen,
  setSidebarOpen,
  cartCount,
  userName,
}: {
  isMobile: boolean;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  cartCount: number;
  userName: string;
}) => {
  const { dark } = useThemeStore();

  return (
    <div className="bg-background border-b border-border sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Title & Description */}
          <div className="flex items-center gap-4 flex-1">
            {isMobile && (
              <>
                <Link to="/" className="flex items-center">
                  <img
                    src={dark ? logoDark : logoLight}
                    alt="Logo"
                    className="h-8 w-auto object-contain"
                  />
                </Link>
                <button
                  onClick={() => setSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isSidebarOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <MenuIcon className="h-5 w-5" />
                  )}
                </button>
              </>
            )}
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-3">
            {/* User Balance */}
            <UserBalance />

            {/* Cart */}
            <Link
              to="/dashboard/cart"
              className="relative p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center"
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </motion.span>
              )}
            </Link>

            {/* Notifications */}
            <NotificationBell />


            {/* User Avatar - Restored */}
            <Link
              to="/dashboard/profile"
              className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors outline-none"
              title="Profile Settings"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                {userName.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

