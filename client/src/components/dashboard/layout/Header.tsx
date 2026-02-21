import { Link } from "react-router-dom";
<<<<<<< HEAD
import { AnimatePresence, motion } from "framer-motion";
=======
import { motion } from "framer-motion";
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
import {
  ShoppingCart,
  X,
  Menu as MenuIcon,
<<<<<<< HEAD
  Sun,
  Moon,
=======
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
} from "lucide-react";
import logoDark from "@/assets/images/PROXY PNG.webp";
import logoLight from "@/assets/images/PROXY SOCKS DARK FONT.webp";
import UserBalance from "@/components/UserBalance";
<<<<<<< HEAD
=======
import NotificationBell from "@/components/NotificationBell";
import { fetchNotifications, markNotificationsAsRead } from "@/services/api";
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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
<<<<<<< HEAD
  const { dark, toggleDark } = useThemeStore();
=======
  const { dark } = useThemeStore();
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)

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

<<<<<<< HEAD
            {/* Theme Toggle */}
            <motion.button
              onClick={toggleDark}
              className="p-2 rounded-full hover:bg-gray-200/50 transition-colors duration-200 border border-border"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                {dark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-4 w-4 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-4 w-4 text-black" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
=======
            {/* Notifications */}
            <NotificationBell fetchNotifications={fetchNotifications} markAsRead={markNotificationsAsRead} />

>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)

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

