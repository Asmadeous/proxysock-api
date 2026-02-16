// src/components/Navbar.tsx - Updated with extreme layout and no notifications

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
  ChevronDownIcon,
  MapPinIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../../../assets/images/favicon.svg";
import { useAuth } from "../../../context/AuthContext";
import { useRedditTracking } from "../../../utils/redditPixel";

const Navbar = () => {
  // State management
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const [isFaqTutorialDropdownOpen, setIsFaqTutorialDropdownOpen] =
    useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Hooks
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { trackViewContent } = useRedditTracking();

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
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsServicesDropdownOpen(false);
    setIsToolsDropdownOpen(false);
    setIsFaqTutorialDropdownOpen(false);
  }, [location]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsServicesDropdownOpen(false);
      setIsToolsDropdownOpen(false);
      setIsFaqTutorialDropdownOpen(false);
    };
    if (
      isServicesDropdownOpen ||
      isToolsDropdownOpen ||
      isFaqTutorialDropdownOpen
    ) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isServicesDropdownOpen, isToolsDropdownOpen, isFaqTutorialDropdownOpen]);

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle link clicks
  const handleLinkClick = (name: string, href: string) => {
    trackNavigation(name, href);
    setIsMenuOpen(false);
    setIsServicesDropdownOpen(false);
    setIsToolsDropdownOpen(false);
    setIsFaqTutorialDropdownOpen(false);
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
      {/* Fixed Navbar with extreme layout */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${scrolled
            ? "bg-gray-900/95 backdrop-blur-md border-b border-gray-800/50 shadow-lg"
            : "bg-gray-900 border-b border-gray-800"
          }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Extreme Left */}
            <motion.div
              className="flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/"
                className="flex items-center"
                onClick={() => handleLinkClick("Logo", "/")}
              >
                <div className="bg-white rounded-lg p-2 shadow-lg mr-2">
                  <img src={logo} alt="ProxySock Logo" className="h-8 w-auto" />
                </div>
                <span className="text-white font-bold text-lg hidden sm:block">
                  ProxySock
                </span>
              </Link>
            </motion.div>

            {/* Navigation Items - Center */}
            <div className="hidden lg:flex items-center justify-center flex-1 mx-8">
              <div className="flex items-center space-x-6">
                {/* Services Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsServicesDropdownOpen(!isServicesDropdownOpen);
                      setIsToolsDropdownOpen(false);
                      setIsFaqTutorialDropdownOpen(false);
                      trackNavigation("Services Dropdown", "/services");
                    }}
                    className="flex items-center text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium group"
                  >
                    <ServerIcon className="h-4 w-4 mr-2 group-hover:text-red-500 transition-colors duration-200" />
                    <span>Services</span>
                    <ChevronDownIcon
                      className={`h-4 w-4 ml-1 transition-transform duration-200 ${isServicesDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isServicesDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 w-80 bg-gray-800/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-xl overflow-hidden"
                      >
                        <div className="p-2">
                          {serviceItems.map((item) => (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() =>
                                handleLinkClick(item.name, item.href)
                              }
                              className="flex items-center p-3 rounded-lg hover:bg-gray-700/50 transition-colors duration-200 group"
                            >
                              <item.icon
                                className={`h-6 w-6 mr-3 ${item.color} group-hover:scale-110 transition-transform duration-200`}
                              />
                              <div>
                                <div className="text-white font-medium">
                                  {item.name}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {item.description}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <div className="bg-gray-700/30 p-3 border-t border-gray-700/50">
                          <p className="text-gray-400 text-xs text-center">
                            Premium digital infrastructure solutions
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tools Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsToolsDropdownOpen(!isToolsDropdownOpen);
                      setIsServicesDropdownOpen(false);
                      setIsFaqTutorialDropdownOpen(false);
                      trackNavigation("Tools Dropdown", "/tools");
                    }}
                    className="flex items-center text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium group"
                  >
                    <WrenchScrewdriverIcon className="h-4 w-4 mr-2 group-hover:text-red-500 transition-colors duration-200" />
                    <span>Tools</span>
                    <ChevronDownIcon
                      className={`h-4 w-4 ml-1 transition-transform duration-200 ${isToolsDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isToolsDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 w-72 bg-gray-800/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-xl overflow-hidden"
                      >
                        <div className="p-2">
                          {toolItems.map((item) => (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() =>
                                handleLinkClick(item.name, item.href)
                              }
                              className="flex items-center p-3 rounded-lg hover:bg-gray-700/50 transition-colors duration-200 group"
                            >
                              <item.icon
                                className={`h-6 w-6 mr-3 ${item.color} group-hover:scale-110 transition-transform duration-200`}
                              />
                              <div>
                                <div className="text-white font-medium">
                                  {item.name}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {item.description}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <div className="bg-gray-700/30 p-3 border-t border-gray-700/50">
                          <p className="text-gray-400 text-xs text-center">
                            Helpful utilities and tools
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Help Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFaqTutorialDropdownOpen(!isFaqTutorialDropdownOpen);
                      setIsServicesDropdownOpen(false);
                      setIsToolsDropdownOpen(false);
                      trackNavigation("Help Dropdown", "/help");
                    }}
                    className="flex items-center text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium group"
                  >
                    <QuestionMarkCircleIcon className="h-4 w-4 mr-2 group-hover:text-red-500 transition-colors duration-200" />
                    <span>Help</span>
                    <ChevronDownIcon
                      className={`h-4 w-4 ml-1 transition-transform duration-200 ${isFaqTutorialDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isFaqTutorialDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 w-72 bg-gray-800/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-xl overflow-hidden"
                      >
                        <div className="p-2">
                          {faqTutorialItems.map((item) => (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() =>
                                handleLinkClick(item.name, item.href)
                              }
                              className="flex items-center p-3 rounded-lg hover:bg-gray-700/50 transition-colors duration-200 group"
                            >
                              <item.icon
                                className={`h-6 w-6 mr-3 ${item.color} group-hover:scale-110 transition-transform duration-200`}
                              />
                              <div>
                                <div className="text-white font-medium">
                                  {item.name}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {item.description}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <div className="bg-gray-700/30 p-3 border-t border-gray-700/50">
                          <p className="text-gray-400 text-xs text-center">
                            Get help and learn how to use our services
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Regular Navigation Items */}
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => handleLinkClick(item.name, item.href)}
                    className={`flex items-center transition-colors duration-200 text-sm font-medium group relative ${location.pathname === item.href
                        ? "text-red-400"
                        : "text-gray-300 hover:text-white"
                      }`}
                  >
                    <item.icon className="h-4 w-4 mr-2 group-hover:text-red-500 transition-colors duration-200" />
                    <span>{item.name}</span>
                    {location.pathname === item.href && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute -bottom-4 left-0 right-0 h-0.5 bg-red-500 rounded-full"
                      />
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Auth Section - Extreme Right */}
            <div className="hidden lg:flex items-center flex-shrink-0">
              {isAuthenticated ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-shrink-0"
                >
                  <Link
                    to="/dashboard"
                    onClick={() => handleLinkClick("Dashboard", "/dashboard")}
                    className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 text-sm font-medium shadow-lg whitespace-nowrap"
                  >
                    Dashboard
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to="/login"
                    onClick={() => handleLinkClick("Login/Register", "/login")}
                    className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 text-sm font-medium shadow-lg whitespace-nowrap"
                  >
                    Login/Register
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center flex-shrink-0">
              <motion.button
                onClick={toggleMenu}
                className="text-gray-300 hover:text-white focus:outline-none transition-colors duration-200 p-2"
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
                className="lg:hidden bg-gray-900/95 backdrop-blur-md border-t border-gray-800/50 overflow-hidden"
                style={{ maxHeight: "calc(100vh - 4rem)" }}
              >
                <div className="px-4 py-6 space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
                  {/* Services Section */}
                  <div className="space-y-3">
                    <h3 className="text-red-400 font-semibold text-sm uppercase tracking-wide">
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
                            onClick={() =>
                              handleLinkClick(item.name, item.href)
                            }
                            className="flex flex-col items-center p-4 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors duration-200 group min-h-[100px] justify-center"
                          >
                            <item.icon
                              className={`h-6 w-6 mb-2 ${item.color} group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}
                            />
                            <span className="text-white font-medium text-sm text-center">
                              {item.name}
                            </span>
                            <span className="text-gray-400 text-xs text-center mt-1 leading-tight">
                              {item.description}
                            </span>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Tools Section */}
                  <div className="space-y-3">
                    <h3 className="text-red-400 font-semibold text-sm uppercase tracking-wide">
                      Tools
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {toolItems.map((item) => (
                        <motion.div
                          key={item.name}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.15 }}
                        >
                          <Link
                            to={item.href}
                            onClick={() =>
                              handleLinkClick(item.name, item.href)
                            }
                            className="flex items-center p-3 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors duration-200 group"
                          >
                            <item.icon
                              className={`h-5 w-5 mr-3 ${item.color} group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}
                            />
                            <div>
                              <span className="text-white font-medium text-sm">
                                {item.name}
                              </span>
                              <p className="text-gray-400 text-xs">
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
                    <h3 className="text-red-400 font-semibold text-sm uppercase tracking-wide">
                      Help
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {faqTutorialItems.map((item) => (
                        <motion.div
                          key={item.name}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Link
                            to={item.href}
                            onClick={() =>
                              handleLinkClick(item.name, item.href)
                            }
                            className="flex items-center p-3 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors duration-200 group"
                          >
                            <item.icon
                              className={`h-5 w-5 mr-3 ${item.color} group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}
                            />
                            <div>
                              <span className="text-white font-medium text-sm">
                                {item.name}
                              </span>
                              <p className="text-gray-400 text-xs">
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-800/50"></div>

                  {/* Navigation Items */}
                  <div className="space-y-2">
                    <h3 className="text-red-400 font-semibold text-sm uppercase tracking-wide">
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
                          onClick={() => handleLinkClick(item.name, item.href)}
                          className={`flex items-center text-base font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${location.pathname === item.href
                              ? "bg-red-600/20 text-red-400 border border-red-500/30"
                              : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                            }`}
                        >
                          <item.icon className="h-5 w-5 mr-3 text-red-500 flex-shrink-0" />
                          <span>{item.name}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-800/50"></div>

                  {/* Support & Auth Section */}
                  <div className="space-y-4">
                    {/* Support Email */}
                    <motion.a
                      href="mailto:support@proxysock.com"
                      onClick={() =>
                        trackNavigation(
                          "Support Email Mobile",
                          "mailto:support@proxysock.com"
                        )
                      }
                      className="flex items-center text-gray-400 hover:text-white transition-colors duration-200 text-sm bg-gray-800/50 p-3 rounded-lg hover:bg-gray-700/50"
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
                          onClick={() =>
                            handleLinkClick("Dashboard Mobile", "/dashboard")
                          }
                          className="block w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 text-center font-medium shadow-lg"
                        >
                          Go to Dashboard
                        </Link>
                      ) : (
                        <Link
                          to="/login"
                          onClick={() =>
                            handleLinkClick("Login/Register Mobile", "/login")
                          }
                          className="block w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 text-center font-medium shadow-lg"
                        >
                          Login/Register
                        </Link>
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
