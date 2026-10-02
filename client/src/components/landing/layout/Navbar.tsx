import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, BookOpen, ChevronDown, CircleHelp, FileText, Globe, Mail, MapPin, Menu, Monitor, Moon, Search, Server, Shield, Smartphone, Sun, X, type LucideIcon } from "lucide-react";
import logo from "@/assets/images/proxysock-wordmark.svg";
import { useAuth } from "@/context/AuthContext";
import { useRedditTracking } from "@/utils/redditPixel";
import { useThemeStore } from "@/store/themeStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavigationItem = { name: string; href: string; description: string; icon?: LucideIcon };
const primaryLinks = [
  { name: "Resellers", href: "/reseller-program" },
];

const navigationGroups: { label: string; items: NavigationItem[] }[] = [
  {
    label: "Services",
    items: [
      { icon: Globe, name: "Proxies", href: "/proxies", description: "Datacenter, ISP and residential IPs" },
      { icon: Server, name: "VPS", href: "/vps", description: "Virtual servers with full root access" },
      { icon: Monitor, name: "RDP", href: "/rdp", description: "Your remote desktop, anywhere" },
      { icon: Shield, name: "VPN", href: "/vpn", description: "Connect through residential IPs" },
      { icon: Smartphone, name: "eSIM", href: "/esim", description: "Mobile connectivity across borders" },
    ],
  },
  {
    label: "Resources",
    items: [
      { icon: BookOpen, name: "Tutorials", href: "/HowToConnect", description: "Setup guides for every service" },
      { icon: Search, name: "IP checker", href: "/ip-checker", description: "Explore your connection details" },
      { icon: MapPin, name: "Locations", href: "/locations", description: "Find your next connection" },
      { icon: FileText, name: "Blog", href: "/blog", description: "Guides, insights and updates" },
      { icon: CircleHelp, name: "FAQs", href: "/faq", description: "Answers to common questions" },
      { icon: Mail, name: "Contact", href: "/contact", description: "Talk with our team" },
    ],
  },
  {
    label: "Company",
    items: [
      { name: "About us", href: "/about", description: "Get to know ProxySock" },
      { name: "Affiliate program", href: "/affiliate-program", description: "Earn by sharing ProxySock" },
    ],
  },
];

const focusStyle = "outline-none focus-visible:bg-white/10 focus-visible:text-white";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedByHover = useRef(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { dark, toggleDark } = useThemeStore();
  const { trackViewContent } = useRedditTracking();
  const accountHref = isAuthenticated ? "/dashboard" : "/register";
  const accountLabel = isAuthenticated ? "Dashboard" : "Get started";

  useEffect(() => {
    setIsMenuOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  const cancelDropdownClose = () => {
    if (dropdownCloseTimer.current) clearTimeout(dropdownCloseTimer.current);
    dropdownCloseTimer.current = null;
  };

  const scheduleDropdownClose = () => {
    cancelDropdownClose();
    dropdownCloseTimer.current = setTimeout(() => setOpenDropdown(null), 180);
  };

  useEffect(() => () => {
    if (dropdownCloseTimer.current) clearTimeout(dropdownCloseTimer.current);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setIsMenuOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setIsMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [isMenuOpen]);

  const handleLinkClick = async (name: string, href: string) => {
    setIsMenuOpen(false);
    try {
      await trackViewContent({
        productId: `nav_${href === "/" ? "home" : href.slice(1).replace(/\//g, "_")}`,
        productName: name,
        category: "navigation",
        value: 0,
        currency: "USD",
      });
    } catch (error) {
      console.error("Navigation tracking failed:", error);
    }
  };

  return (
    <header ref={headerRef} className="public-header fixed z-50 rounded-[4px] bg-[#101010] text-white">
      <nav aria-label="Main navigation" className="public-navigation flex h-16 items-center justify-between gap-2 sm:gap-4">
        <Link to="/" aria-label="ProxySock home" onClick={() => handleLinkClick("Home", "/")} className={`flex shrink-0 items-center gap-2 ${focusStyle}`}>
          <img src={logo} alt="" className="h-9 w-[115px] object-contain min-[360px]:w-[140px] sm:h-10 sm:w-[152px]" />
        </Link>

        <div className="hidden items-center gap-3 lg:flex xl:gap-5">
          {navigationGroups.map((group) => (
            <DropdownMenu key={group.label} modal={false} open={openDropdown === group.label} onOpenChange={(open) => { cancelDropdownClose(); setOpenDropdown(open ? group.label : null); }}>
              <DropdownMenuTrigger
                onPointerEnter={(event) => {
                  if (event.pointerType !== "mouse") return;
                  cancelDropdownClose();
                  openedByHover.current = true;
                  setOpenDropdown(group.label);
                }}
                onPointerLeave={scheduleDropdownClose}
                onPointerDown={() => { openedByHover.current = false; }}
                onKeyDown={() => { openedByHover.current = false; }}
                className={`group inline-flex h-10 items-center gap-2 rounded px-2 text-[13px] font-medium text-white/80 transition-colors hover:text-white data-[state=open]:text-white ${focusStyle}`}>
                {group.label}
                <ChevronDown aria-hidden="true" className="h-3 w-3 text-white/50 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={12}
                onPointerEnter={cancelDropdownClose}
                onPointerLeave={scheduleDropdownClose}
                onCloseAutoFocus={(event) => { if (openedByHover.current) event.preventDefault(); }}
                className="w-[340px] max-w-[calc(100vw-32px)] rounded-[4px] border-white/10 bg-[#171717] p-2 text-white shadow-2xl">
                <div className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">{group.label}</div>
                {group.items.map((item) => (
                  <DropdownMenuItem key={item.href} asChild className="group w-full cursor-pointer gap-3 rounded-[3px] px-3 py-3 text-left focus:bg-white/[0.06] focus:text-white">
                    <Link to={item.href} aria-current={location.pathname === item.href ? "page" : undefined} onClick={() => handleLinkClick(item.name, item.href)}>
                      {item.icon && (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-white/[0.03] text-red-400">
                          <item.icon aria-hidden="true" className="h-[18px] w-[18px]" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 text-left">
                        <span className={`block text-[13px] font-semibold ${location.pathname === item.href ? "text-red-400" : "text-white"}`}>{item.name}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-white/55">{item.description}</span>
                      </span>
                      {item.icon && <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-white/25 group-focus:text-white/70" />}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
          {primaryLinks.map((item) => (
            <Link key={item.href} to={item.href} aria-current={location.pathname === item.href ? "page" : undefined} onClick={() => handleLinkClick(item.name, item.href)} className={`inline-flex h-10 items-center rounded px-2 text-[13px] font-medium transition-colors hover:text-white ${location.pathname === item.href ? "text-white" : "text-white/80"} ${focusStyle}`}>{item.name}</Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={toggleDark} aria-label={`Switch to ${dark ? "light" : "dark"} mode`} className={`hidden h-10 w-10 items-center justify-center rounded text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:inline-flex ${focusStyle}`}>
            {dark ? <Sun aria-hidden="true" className="h-4 w-4" /> : <Moon aria-hidden="true" className="h-4 w-4" />}
          </button>
          {!isAuthenticated && (
            <Link to="/login" onClick={() => handleLinkClick("Login", "/login")} className={`hidden h-10 min-w-[90px] items-center justify-center rounded-[3px] bg-white/[0.08] px-4 text-[13px] font-medium transition-colors hover:bg-white/15 lg:inline-flex ${focusStyle}`}>Login</Link>
          )}
          <Link to={accountHref} onClick={() => handleLinkClick(accountLabel, accountHref)} className={`inline-flex h-11 items-center justify-center rounded-[3px] bg-red-600 px-4 text-xs sm:h-10 sm:min-w-[108px] sm:text-[13px] font-semibold text-white transition-colors hover:bg-red-700 ${focusStyle}`}>{accountLabel}</Link>
          <button ref={menuButtonRef} type="button" aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={isMenuOpen} aria-controls="public-mobile-navigation" onClick={() => setIsMenuOpen((open) => !open)} className={`inline-flex h-11 w-11 items-center justify-center rounded text-white transition-colors hover:bg-white/10 lg:hidden ${focusStyle}`}>
            {isMenuOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <nav id="public-mobile-navigation" aria-label="Mobile navigation" className="max-h-[calc(100dvh-88px)] overflow-y-auto border-t border-white/10 bg-[#101010] px-5 py-6 lg:hidden">
          <div className="grid gap-7 sm:grid-cols-2">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">{group.label}</h2>
                {group.items.map((item) => (
                  <Link key={item.href} to={item.href} aria-current={location.pathname === item.href ? "page" : undefined} onClick={() => handleLinkClick(item.name, item.href)} className={`block rounded px-2 py-3 text-sm transition-colors hover:bg-white/5 ${location.pathname === item.href ? "text-red-400" : "text-white/85"} ${focusStyle}`}>{item.name}</Link>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {primaryLinks.map((item) => (
              <Link key={item.href} to={item.href} onClick={() => handleLinkClick(item.name, item.href)} className={`rounded px-3 py-3 text-sm text-white/85 hover:bg-white/5 ${focusStyle}`}>{item.name}</Link>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
            <div className="flex items-center gap-5">
              {!isAuthenticated && <Link to="/login" onClick={() => handleLinkClick("Login", "/login")} className={`py-3 text-sm ${focusStyle}`}>Login</Link>}
              <Link to="/contact" onClick={() => handleLinkClick("Talk to sales", "/contact")} className={`py-3 text-sm text-white/75 ${focusStyle}`}>Talk to sales</Link>
            </div>
            <button type="button" onClick={toggleDark} aria-label={`Switch to ${dark ? "light" : "dark"} mode`} className={`inline-flex h-11 w-11 items-center justify-center rounded hover:bg-white/10 ${focusStyle}`}>
              {dark ? <Sun aria-hidden="true" className="h-4 w-4" /> : <Moon aria-hidden="true" className="h-4 w-4" />}
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
