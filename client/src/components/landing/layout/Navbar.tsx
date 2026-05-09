// src/components/Navbar.tsx - UI Redesign matching new design

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ServerIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  WifiIcon,
  PhoneIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  MapPinIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import logoDark from "@/assets/images/PROXY PNG.webp";
import logoLight from "@/assets/images/PROXY SOCKS DARK FONT.webp";
import { useAuth } from "@/context/AuthContext";
import { useRedditTracking } from "@/utils/redditPixel";
import { useThemeStore } from "@/store/themeStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Sun, Moon } from "lucide-react";

const Navbar = () => {
  // State management
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Hooks
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { trackViewContent } = useRedditTracking();
  const { dark, toggleDark } = useThemeStore();

  // Navigation tracking function
  const trackNavigation = async (itemName: string, href: string) => {
    try {
      await trackViewContent({
        productId: `nav_${itemName.toLowerCase().replace(/\s+/g, "_")}`,
        productName: itemName,
        category: "navigation",
        value: 0,
        currency: "USD",
      });
      console.log(`✅ Navigation tracked: ${itemName} -> ${href}`);
    } catch (error) {
      console.error("❌ Failed to track navigation:", error);
    }
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(globalThis.scrollY > 20);
    };
    globalThis.addEventListener("scroll", handleScroll);
    return () => globalThis.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle link clicks
  const handleLinkClick = (name: string, href: string) => {
    trackNavigation(name, href);
    setIsMenuOpen(false);
  };

  // Navigation data
  const serviceItems = [
    {
      name: "Proxies",
      href: "/proxies",
      icon: WifiIcon,
      description: "Datacenter, ISP & Residential",
      color: "text-purple-400",
    },
    {
      name: "RDP",
      href: "/rdp",
      icon: ComputerDesktopIcon,
      description: "Remote Desktop Hosting",
      color: "text-red-400",
    },
    {
      name: "VPS",
      href: "/vps",
      icon: ServerIcon,
      description: "Virtual Private Servers",
      color: "text-blue-400",
    },
    {
      name: "eSIMs",
      href: "/esim",
      icon: DevicePhoneMobileIcon,
      description: "Global Connectivity",
      color: "text-green-400",
    },
    {
      name: "VPN",
      href: "/vpn",
      icon: DevicePhoneMobileIcon,
      description: "Global Connectivity",
      color: "text-yellow-400",
    },
  ];

  const toolItems = [
    {
      name: "IP Checker",
      href: "/ip-checker",
      icon: MagnifyingGlassIcon,
      description: "Check your IP address",
      color: "text-cyan-400",
    },
  ];

  const faqTutorialItems = [
    {
      name: "FAQ",
      href: "/faq",
      icon: QuestionMarkCircleIcon,
      description: "Frequently Asked Questions",
      color: "text-yellow-400",
    },
    {
      name: "Tutorials",
      href: "/HowToConnect",
      icon: BookOpenIcon,
      description: "Step-by-step guides",
      color: "text-orange-400",
    },
    {
      name: "Contact",
      href: "/contact",
      icon: PhoneIcon,
      description: "Get in touch with us",
      color: "text-blue-400",
    },
  ];

  const navigationItems = [
    {
      name: "Resellers",
      href: "/reseller-program",
      icon: UserGroupIcon,
    },
    {
      name: "Affiliates",
      href: "/affiliate-program",
      icon: CurrencyDollarIcon,
    },
    {
      name: "Blog",
      href: "/blog",
      icon: DocumentTextIcon,
    },
    {
      name: "Locations",
      href: "/locations",
      icon: MapPinIcon,
    },
    {
      name: "About",
      href: "/about",
      icon: InformationCircleIcon,
    },
  ];

  return (
    <>
      {/* Fixed Navbar - Updated Design */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${scrolled
          ? `${dark ? "bg-card/95" : "bg-background/95"
          } backdrop-blur-sm shadow-lg border-b border-border`
          : `${dark ? "bg-card" : "bg-background"}`
          }`}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Left */}
            <motion.div
              className="flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/"
                className="flex items-center"
                onClickCapture={() => handleLinkClick("Logo", "/")}
              >
                <div className="relative h-10 w-auto">
                  {/* Invisible spacer to reserve layout space */}
                  <img
                    src={logoDark}
                    alt="ProxySock Logo Spacer"
                    className="h-10 w-auto opacity-0 invisible"
                    aria-hidden="true"
                  />

                  {/* Dark Mode Logo */}
                  <img
                    src={logoDark}
                    alt="ProxySock Logo"
                    className={`absolute inset-0 h-10 w-auto object-contain transition-opacity duration-300 ease-in-out ${dark ? "opacity-100" : "opacity-0"
                      }`}
                  />

                  {/* Light Mode Logo */}
                  <img
                    src={logoLight}
                    alt="ProxySock Logo"
                    className={`absolute inset-0 h-10 w-auto object-contain transition-opacity duration-300 ease-in-out ${dark ? "opacity-0" : "opacity-100"
                      }`}
                  />
                </div>
              </Link>
            </motion.div>

            {/* Navigation Items - Center */}
            <div className="hidden lg:flex items-center justify-center flex-1 font-inter-medium">
              <div className="flex items-center space-x-8">
                {/* Services Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none inline-flex items-center gap-1"
                    onClick={() => trackNavigation("Services", "/proxies")}
                  >
                    Services
                    <ChevronDown className="h-4 w-4 ml-0.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 bg-card border-border">
                    <DropdownMenuLabel className="text-muted-foreground">
                      Premium digital infrastructure solutions
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    {serviceItems.map((item) => (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          to={item.href}
                          onClick={() => handleLinkClick(item.name, item.href)}
                          className="flex items-center p-3 cursor-pointer"
                        >
                          <item.icon
                            className={`h-5 w-5 mr-3 ${item.color} flex-shrink-0`}
                          />
                          <div>
                            <div className="text-foreground font-medium text-sm">
                              {item.name}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Tools Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none inline-flex items-center gap-1"
                    onClick={() => trackNavigation("Tools", "/ip-checker")}
                  >
                    Tools
                    <ChevronDown className="h-4 w-4 ml-0.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 bg-card border-border">
                    <DropdownMenuLabel className="text-muted-foreground">
                      Helpful utilities and tools
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    {toolItems.map((item) => (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          to={item.href}
                          onClick={() => handleLinkClick(item.name, item.href)}
                          className="flex items-center p-3 cursor-pointer"
                        >
                          <item.icon
                            className={`h-5 w-5 mr-3 ${item.color} flex-shrink-0`}
                          />
                          <div>
                            <div className="text-foreground font-medium text-sm">
                              {item.name}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Help Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none inline-flex items-center gap-1"
                    onClick={() => trackNavigation("Help", "/faq")}
                  >
                    Help
                    <ChevronDown className="h-4 w-4 ml-0.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 bg-card border-border">
                    <DropdownMenuLabel className="text-muted-foreground">
                      Get help and learn how to use our services
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    {faqTutorialItems.map((item) => (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          to={item.href}
                          onClick={() => handleLinkClick(item.name, item.href)}
                          className="flex items-center p-3 cursor-pointer"
                        >
                          <item.icon
                            className={`h-5 w-5 mr-3 ${item.color} flex-shrink-0`}
                          />
                          <div>
                            <div className="text-foreground font-medium text-sm">
                              {item.name}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Regular Navigation Items */}
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClickCapture={() => handleLinkClick(item.name, item.href)}
                    className={`text-sm font-medium transition-colors duration-200 ${location.pathname === item.href
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Auth Section - Right */}
            <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
              {/* Theme Toggle */}
              <motion.button
                onClick={toggleDark}
                className="p-2 rounded-full  hover:bg-gray-200/50 transition-colors duration-200 border border-gray-600/50"
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
                      <Sun
                        className={`h-4 w-4 ${dark ? "text-white" : "text-black"
                          }`}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon
                        className={`h-4 w-4 ${dark ? "text-white" : "text-black"
                          }`}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {isAuthenticated ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to="/dashboard"
                    onClick={() => handleLinkClick("Dashboard", "/dashboard")}
                    className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                </motion.div>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClickCapture={() => handleLinkClick("Login", "/login")}
                    className="text-foreground text-sm font-medium hover:text-muted-foreground transition-colors duration-200 font-manrope-medium"
                  >
                    Login
                  </Link>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to="/register"
                      onClick={() =>
                        handleLinkClick("Login/Register", "/register")
                      }
                      className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors duration-200 text-sm font-manrope-medium"
                    >
                      Signup
                    </Link>
                  </motion.div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center">
              <motion.button
                onClick={toggleMenu}
                className="text-muted-foreground hover:text-foreground focus:outline-none transition-colors duration-200 p-2"
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {isMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="open"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Bars3Icon className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:hidden bg-card border-t border-border overflow-hidden"
              >
                <div className="px-4 py-6 space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
                  {/* Services Section */}
                  <div className="space-y-3">
                    <h3 className="text-primary font-semibold text-sm uppercase tracking-wide">
                      Services
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {serviceItems.map((item) => (
                        <motion.div
                          key={item.name}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Link
                            to={item.href}
                            onClickCapture={() =>
                              handleLinkClick(item.name, item.href)
                            }
                            className="flex flex-col items-center p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors duration-200 group min-h-[100px] justify-center"
                          >
                            <item.icon
                              className={`h-6 w-6 mb-2 ${item.color} group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}
                            />
                            <span className="text-foreground font-medium text-sm text-center">
                              {item.name}
                            </span>
                            <span className="text-muted-foreground text-xs text-center mt-1 leading-tight">
                              {item.description}
                            </span>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Tools Section */}
                  <div className="space-y-3">
                    <h3 className="text-primary font-semibold text-sm uppercase tracking-wide">
                      Tools
                    </h3>
                    <div className="space-y-2">
                      {toolItems.map((item) => (
                        <motion.div
                          key={item.name}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.15 }}
                        >
                          <Link
                            to={item.href}
                            onClickCapture={() =>
                              handleLinkClick(item.name, item.href)
                            }
                            className="flex items-center p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors duration-200 group"
                          >
                            <item.icon
                              className={`h-5 w-5 mr-3 ${item.color} group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}
                            />
                            <div>
                              <span className="text-foreground font-medium text-sm">
                                {item.name}
                              </span>
                              <p className="text-muted-foreground text-xs">
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Help Section */}
                  <div className="space-y-3">
                    <h3 className="text-primary font-semibold text-sm uppercase tracking-wide">
                      Help
                    </h3>
                    <div className="space-y-2">
                      {faqTutorialItems.map((item) => (
                        <motion.div
                          key={item.name}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Link
                            to={item.href}
                            onClickCapture={() =>
                              handleLinkClick(item.name, item.href)
                            }
                            className="flex items-center p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors duration-200 group"
                          >
                            <item.icon
                              className={`h-5 w-5 mr-3 ${item.color} group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}
                            />
                            <div>
                              <span className="text-foreground font-medium text-sm">
                                {item.name}
                              </span>
                              <p className="text-muted-foreground text-xs">
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border"></div>

                  {/* Navigation Items */}
                  <div className="space-y-2">
                    <h3 className="text-primary font-semibold text-sm uppercase tracking-wide">
                      Navigation
                    </h3>
                    {navigationItems.map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * (index + 1) }}
                      >
                        <Link
                          to={item.href}
                          onClickCapture={() => handleLinkClick(item.name, item.href)}
                          className={`flex items-center text-base font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${location.pathname === item.href
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            }`}
                        >
                          <item.icon className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                          <span>{item.name}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border"></div>

                  {/* Support & Auth Section */}
                  <div className="space-y-4">
                    {/* Theme Toggle Mobile */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center justify-center"
                    >
                      <button
                        onClick={toggleDark}
                        className="flex items-center justify-center p-3 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors duration-200 w-full"
                      >
                        <AnimatePresence mode="wait">
                          {dark ? (
                            <motion.div
                              key="sun-mobile"
                              initial={{ rotate: -90, opacity: 0 }}
                              animate={{ rotate: 0, opacity: 1 }}
                              exit={{ rotate: 90, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center"
                            >
                              <Sun className="h-5 w-5 mr-3 text-yellow-400" />
                              <span className="text-white font-medium">
                                Light Mode
                              </span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="moon-mobile"
                              initial={{ rotate: 90, opacity: 0 }}
                              animate={{ rotate: 0, opacity: 1 }}
                              exit={{ rotate: -90, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center"
                            >
                              <Moon className="h-5 w-5 mr-3 text-blue-400" />
                              <span className="text-white font-medium">
                                Dark Mode
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </motion.div>

                    {/* Support Email */}
                    <motion.a
                      href="mailto:support@proxysock.com"
                      onClick={() =>
                        trackNavigation(
                          "Support Email Mobile",
                          "mailto:support@proxysock.com"
                        )
                      }
                      className="flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm bg-secondary p-3 rounded-lg hover:bg-secondary/80"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.25 }}
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                      <span className="truncate">support@proxysock.com</span>
                    </motion.a>

                    {/* Auth Buttons */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-3"
                    >
                      {isAuthenticated ? (
                        <Link
                          to="/dashboard"
                          onClickCapture={() =>
                            handleLinkClick("Dashboard Mobile", "/dashboard")
                          }
                          className="block w-full bg-red-600 text-white px-6 py-4 rounded-full hover:bg-red-700 transition-colors duration-200 text-center font-medium"
                        >
                          Go to Dashboard
                        </Link>
                      ) : (
                        <>
                          <Link
                            to="/login"
                            onClickCapture={() =>
                              handleLinkClick("Login Mobile", "/login")
                            }
                            className="block w-full text-foreground text-center px-6 py-4 rounded-full border border-border hover:bg-secondary transition-colors duration-200 font-medium"
                          >
                            Login
                          </Link>
                          <Link
                            to="/login"
                            onClickCapture={() =>
                              handleLinkClick("Login/Register Mobile", "/login")
                            }
                            className="block w-full bg-red-600 text-white px-6 py-4 rounded-full hover:bg-red-700 transition-colors duration-200 text-center font-medium"
                          >
                            Signup
                          </Link>
                        </>
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16"></div>

      {/* Development tracking indicator */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-gray-800 text-green-400 px-3 py-2 rounded-lg text-xs shadow-lg border border-green-500/20">
            🎯 Reddit Pixel: Active
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
