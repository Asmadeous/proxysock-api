import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext";
import AutoSEO from "./components/AutoSEO";
import ProtectedRoute from "./components/ProtectedRoute";
import CookieConsentBanner from "./components/CookieConsentBanner";
import ReactGA from "react-ga";
import AuthCallback from "./pages/auth/callback";
import { useRedditPixel, conversionTracker } from "./utils/redditPixel";
import PublicLayout from "./components/landing/layout/PublicLayout";
import ScrollToTop from "./components/ScrollToTop";
import AuthLayout from "./components/landing/layout/AuthLayout";
import { Toaster } from "sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import ChatWidget from "./components/ChatWidget";

// ─── Public pages ──────────────────────────────────────────
const Home = lazy(() => import("./pages/public/Home"));
const ProxyPage = lazy(() => import("./pages/public/ProxyPage"));
const RDPPage = lazy(() => import("./pages/public/RDPPage"));
const VPSPage = lazy(() => import("./pages/public/VPSPage"));
const ESIMPage = lazy(() => import("./pages/public/ESIMPage"));
const VPNPage = lazy(() => import("./pages/public/VPNpage"));
const ResellerProgram = lazy(() => import("./pages/public/ResellerProgram"));
const Locations = lazy(() => import("./pages/public/Locations"));
const About = lazy(() => import("./pages/public/About"));
const Faq = lazy(() => import("./pages/public/FAQ"));
const ProxyPurpose = lazy(() => import("./pages/public/ProxyPurpose"));
const Contact = lazy(() => import("./pages/public/Contact"));
const HowToConnect = lazy(() => import("./pages/public/HowToConnect"));
const CookiePolicy = lazy(() => import("./pages/public/CookiePolicy"));
const IPChecker = lazy(() => import("./pages/public/IPChecker"));
const BlogPage = lazy(() => import("./pages/public/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/public/BlogPostPage"));
const Privacy = lazy(() => import("./pages/public/Privacy"));
const Terms = lazy(() => import("./pages/public/Terms"));

// ─── Auth pages ─────────────────────────────────────────────
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const WaitForVerification = lazy(() => import("./pages/auth/WaitForVerification"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));

// ─── Payment result pages ────────────────────────────────────
const PaymentSuccess = lazy(() => import("./pages/payments/PaymentSuccess"));
const PaymentFailed = lazy(() => import("./pages/payments/PaymentFailed"));

// ─── Product browse pages ────────────────────────────────────
const VPSTypes = lazy(() => import("./pages/products/VPSTypes"));
const VPSPlans = lazy(() => import("./pages/products/VPSPlans"));
const RDPTypes = lazy(() => import("./pages/products/RDPTypes"));
const RDPPlans = lazy(() => import("./pages/products/RDPPlans"));
const ESIMPackages = lazy(() => import("./pages/products/EsimPackages"));
const ESIMTypes = lazy(() => import("./pages/products/ESIMTypes"));
const USAESIMPlans = lazy(() => import("./pages/products/USAESIMPlansPage"));
const VPNBuy = lazy(() => import("./pages/products/VPNPlans"));

// ─── Misc pages ──────────────────────────────────────────────
const NotFound = lazy(() => import("./pages/misc/NotFound"));
const NotificationsPage = lazy(() => import("./pages/misc/NotificationsPage"));

// ─── User Dashboard ──────────────────────────────────────────
const Dashboard = lazy(() => import("./pages/UserDashboard/Dashboard"));
const DashboardHome = lazy(() => import("./pages/UserDashboard/DashboardHome"));
const BuyProxies = lazy(() => import("./pages/UserDashboard/BuyProxies"));
const Cart = lazy(() => import("./pages/UserDashboard/Cart"));
const Checkout = lazy(() => import("./pages/UserDashboard/Checkout"));
const Profile = lazy(() => import("./pages/UserDashboard/Profile"));
const ChangePassword = lazy(() => import("./pages/UserDashboard/ChangePassword"));
const ProxyOrders = lazy(() => import("./pages/UserDashboard/ProxyOrders"));
const Orders = lazy(() => import("./pages/UserDashboard/Orders"));
const EsimOrders = lazy(() => import("./pages/UserDashboard/EsimOrders"));
const VPSOrders = lazy(() => import("./pages/UserDashboard/VPSOrders"));
const RDPOrders = lazy(() => import("./pages/UserDashboard/RDPOrders"));
const VPNOrders = lazy(() => import("./pages/UserDashboard/VPNOrders"));
const Tickets = lazy(() => import("./pages/UserDashboard/Tickets"));
const SupportChat = lazy(() => import("./pages/UserDashboard/SupportChat"));
const ProductManagement = lazy(() => import("./pages/UserDashboard/ProductsManagement"));
const ProxyManagement = lazy(() => import("./pages/UserDashboard/ProxyManagement"));
const VPSManagement = lazy(() => import("./pages/UserDashboard/VPSManagement"));
const RDPPManagement = lazy(() => import("./pages/UserDashboard/RDPManagement"));
const ESIMManagement = lazy(() => import("./pages/UserDashboard/ESIMManagement"));
const VPNManagement = lazy(() => import("./pages/UserDashboard/VPNManagement"));
const Transactions = lazy(() => import("./pages/UserDashboard/TransactionsPage"));

// ─── Admin / Employee / Reseller / Affiliate ─────────────────
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdmin/SuperAdminDashboard"));
const AdminLoginPage = lazy(() => import("./pages/SuperAdmin/AdminLoginPage"));
const EmployeeDashboard = lazy(() => import("./pages/Employee/EmployeeDashboard"));
const ResellerDashboard = lazy(() => import("./pages/Reseller/ResellerDashboard"));
const ResellerLoginPage = lazy(() => import("./pages/Reseller/ResellerLoginPage"));
const AffiliateDashboard = lazy(() => import("./pages/Affiliate/AffiliateDashboard"));

// ─── Initialize analytics ────────────────────────────────────
ReactGA.initialize("UA-XXXXXXXXX-X");
const REDDIT_PIXEL_ID = "66fa7c91-95cd-46ad-a920-d8db513caf94";

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
  </div>
);

export default function App() {
  const location = useLocation();

  useRedditPixel(REDDIT_PIXEL_ID);

  useEffect(() => {
    ReactGA.pageview(location.pathname + location.search);
    conversionTracker.trackNavigation(document.title || "Page View", location.pathname);
  }, [location]);

  return (
    <AuthProvider>
      <HelmetProvider>
        <ScrollToTop />
        <Toaster position="top-right" richColors={true} />
        <HotToaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
            },
            success: {
              iconTheme: { primary: "#22c55e", secondary: "white" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "white" },
              duration: 5000,
            },
          }}
        />
        <AutoSEO
          siteName="ProxySock"
          defaultTitle="ProxySock - Buy Premium Proxies, VPN, RDP, VPS & eSIM Online"
          defaultDescription="Buy premium proxies, VPN, RDP, VPS & eSIM. Datacenter, residential, ISP proxies. Windows/Linux hosting. Global eSIM cards. 24/7 support."
        >
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/proxies" element={<ProxyPage />} />
                <Route path="/rdp" element={<RDPPage />} />
                <Route path="/vps" element={<VPSPage />} />
                <Route path="/esim" element={<ESIMPage />} />
                <Route path="/vpn" element={<VPNPage />} />
                <Route path="/reseller-program" element={<ResellerProgram />} />
                <Route path="/locations" element={<Locations />} />
                <Route path="/about" element={<About />} />
                <Route path="/faq" element={<Faq />} />
                <Route path="/proxy-purpose" element={<ProxyPurpose />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/HowToConnect" element={<HowToConnect />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/ip-checker" element={<IPChecker />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogPostPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
              </Route>

              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/wait-for-verification" element={<WaitForVerification />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
              </Route>

              {/* Protected User Dashboard */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route index element={<DashboardHome />} />

                  {/* Products & Services */}
                  <Route path="proxies" element={<BuyProxies />} />
                  <Route path="global-esim" element={<ESIMPackages />} />
                  <Route path="esim" element={<ESIMTypes />} />
                  <Route path="usa-esim" element={<USAESIMPlans />} />
                  <Route path="vps" element={<VPSTypes />} />
                  <Route path="vps-plans" element={<VPSPlans />} />
                  <Route path="vps-plans/:type" element={<VPSPlans />} />
                  <Route path="rdp" element={<RDPTypes />} />
                  <Route path="rdp-plans" element={<RDPPlans />} />
                  <Route path="rdp-plans/:type" element={<RDPPlans />} />
                  <Route path="vpn" element={<VPNBuy />} />

                  {/* Orders */}
                  <Route path="orders" element={<Orders />} />
                  <Route path="proxy-orders" element={<ProxyOrders />} />
                  <Route path="esim-orders" element={<EsimOrders />} />
                  <Route path="rdp-orders" element={<RDPOrders />} />
                  <Route path="rdp-orders" element={<RDPOrders />} />
                  <Route path="vps-orders" element={<VPSOrders />} />
                  <Route path="vpn-orders" element={<VPNOrders />} />

                  {/* Support */}
                  <Route path="tickets" element={<Tickets />} />
                  <Route path="support" element={<SupportChat />} />

                  {/* Management */}
                  <Route path="products" element={<ProductManagement />} />
                  <Route path="proxy-management" element={<ProxyManagement />} />
                  <Route path="Esim-management" element={<ESIMManagement />} />
                  <Route path="VPS-management" element={<VPSManagement />} />
                  <Route path="VPS-management" element={<VPSManagement />} />
                  <Route path="RDP-management" element={<RDPPManagement />} />
                  <Route path="vpn-management" element={<VPNManagement />} />
                  <Route path="transactions" element={<Transactions />} />

                  {/* Cart & Payments */}
                  <Route path="cart" element={<Cart />} />
                  <Route path="checkout" element={<Checkout />} />

                  {/* Account */}
                  <Route path="profile" element={<Profile />} />
                  <Route path="change-password" element={<ChangePassword />} />
                  <Route path="affiliate" element={<AffiliateDashboard />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                </Route>
              </Route>

              {/* Admin / Employee */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<SuperAdminDashboard />} />
              <Route path="/sadmin" element={<SuperAdminDashboard />} />
              <Route path="/employee" element={<EmployeeDashboard />} />

              {/* Reseller */}
              <Route path="/reseller/login" element={<ResellerLoginPage />} />
              <Route path="/reseller/*" element={<ResellerDashboard />} />

              {/* Payment Results */}
              <Route
                path="/payments/success"
                element={
                  <PaymentSuccess
                    clearCart={() => {
                      localStorage.removeItem("cartItems");
                      globalThis.dispatchEvent(
                        new CustomEvent("cart-updated", { detail: { count: 0 } })
                      );
                    }}
                  />
                }
              />
              <Route path="/payments/failed" element={<PaymentFailed />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <CookieConsentBanner />
          <ChatWidget />
        </AutoSEO>
      </HelmetProvider>
    </AuthProvider>
  );
}
