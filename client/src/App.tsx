// app/src/App.tsx - Updated with Reddit Ads tracking

import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext";
import AutoSEO from "./components/AutoSEO";
// import Home from "./pages/Home";
// import Dashboard from "./pages/Dashboard";
// import DashboardHome from "./pages/DashboardHome";
// import BuyProxies from "./pages/BuyProxies";
// import Cart from "./pages/Cart";
// import Profile from "./pages/Profile";
// import ChangePassword from "./pages/ChangePassword";
// import ProxyOrders from "./pages/ProxyOrders";
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import ProxyPage from "./pages/ProxyPage";
// import Locations from "./pages/Locations";
// import About from "./pages/About";
// import Faq from "./pages/FAQ";
// import ProxyPurpose from "./pages/ProxyPurpose";
// import Contact from "./pages/Contact";
// import HowToConnect from "./pages/HowToConnect";
// import SuperAdminDashboard from "./pages/SuperAdmin/SuperAdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
// import ForgotPassword from "./pages/ForgotPassword";
// import WaitForVerification from "./pages/WaitForVerification";
// import DepositSuccess from "./pages/DepositSuccess";
// import DepositFailed from "./pages/DepositFailed";
import CookieConsentBanner from "./components/CookieConsentBanner";
// import CookiePolicy from "./pages/CookiePolicy";
// import IPChecker from "./pages/IPChecker";
// import ESIMPackages from "./pages/EsimPackages";
// import VPSTypes from "./pages/VPSTypes";
// import VPSPlans from "./pages/VPSPlans";
// import RDPTypes from "./pages/RDPTypes";
// import RDPPlans from "./pages/RDPPlans";
// import ProductManagement from "./pages/ProductsManagement";
// import ProxyManagement from "./pages/ProxyManagement";
// import VPSManagement from "./pages/VPSManagement";
// import RDPPManagement from "./pages/RDPManagement";
// import ESIMManagement from "./pages/ESIMManagement";
// import Orders from "./pages/Orders";
// import EsimOrders from "./pages/EsimOrders";
// import VPSOrders from "./pages/VPSOrders";
// import RDPOrders from "./pages/RDPOrders";
// import RDPPage from "./pages/RDPPage";
// import VPSPage from "./pages/VPSPage";
// import ESIMPage from "./pages/ESIMPage";
// import VPNPage from "./pages/VPNpage";
// import Transactions from "./pages/TransactionsPage";
// import NotFound from "./pages/NotFound";
import ReactGA from "react-ga";
// import PaymentSuccess from "./pages/PaymentSuccess";
// import PaymentFailed from "./pages/PaymentFailed";
// import BlogPage from "./pages/BlogPage";
// import BlogPostPage from "./pages/BlogPostPage";
import AuthCallback from "./pages/auth/callback"; // Keep this static for faster auth flow
// import Privacy from "./pages/Privacy";
// import Terms from "./pages/Terms";
// import VPNBuy from "./pages/VPNPlans";
// import VPNOrders from "./pages/VPNOrders";
// import VPNManagement from "./pages/VPNManagement";
// import Checkout from "./pages/Checkout";
// import ResellerProgram from "./pages/ResellerProgram";

// ✅ ADD: Import Reddit tracking
import { useRedditPixel, conversionTracker } from "./utils/redditPixel";
// import ESIMTypes from "./pages/ESIMTypes";
// import USAESIMPlans from "./pages/USAESIMPlansPage";
import PublicLayout from "./components/landing/layout/PublicLayout";
import ScrollToTop from "./components/ScrollToTop";
import AuthLayout from "./components/landing/layout/AuthLayout";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";

// Lazy imports
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const BuyProxies = lazy(() => import("./pages/BuyProxies"));
const Cart = lazy(() => import("./pages/Cart"));
const Profile = lazy(() => import("./pages/Profile"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const ProxyOrders = lazy(() => import("./pages/ProxyOrders"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ProxyPage = lazy(() => import("./pages/ProxyPage"));
const Locations = lazy(() => import("./pages/Locations"));
const About = lazy(() => import("./pages/About"));
const Faq = lazy(() => import("./pages/FAQ"));
const ProxyPurpose = lazy(() => import("./pages/ProxyPurpose"));
const Contact = lazy(() => import("./pages/Contact"));
const HowToConnect = lazy(() => import("./pages/HowToConnect"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdmin/SuperAdminDashboard"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const WaitForVerification = lazy(() => import("./pages/WaitForVerification"));
const DepositSuccess = lazy(() => import("./pages/DepositSuccess"));
const DepositFailed = lazy(() => import("./pages/DepositFailed"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const IPChecker = lazy(() => import("./pages/IPChecker"));
const ESIMPackages = lazy(() => import("./pages/EsimPackages"));
const VPSTypes = lazy(() => import("./pages/VPSTypes"));
const VPSPlans = lazy(() => import("./pages/VPSPlans"));
const RDPTypes = lazy(() => import("./pages/RDPTypes"));
const RDPPlans = lazy(() => import("./pages/RDPPlans"));
const ProductManagement = lazy(() => import("./pages/ProductsManagement"));
const ProxyManagement = lazy(() => import("./pages/ProxyManagement"));
const VPSManagement = lazy(() => import("./pages/VPSManagement"));
const RDPPManagement = lazy(() => import("./pages/RDPManagement"));
const ESIMManagement = lazy(() => import("./pages/ESIMManagement"));
const Orders = lazy(() => import("./pages/Orders"));
const EsimOrders = lazy(() => import("./pages/EsimOrders"));
const VPSOrders = lazy(() => import("./pages/VPSOrders"));
const RDPOrders = lazy(() => import("./pages/RDPOrders"));
const RDPPage = lazy(() => import("./pages/RDPPage"));
const VPSPage = lazy(() => import("./pages/VPSPage"));
const ESIMPage = lazy(() => import("./pages/ESIMPage"));
const VPNPage = lazy(() => import("./pages/VPNpage"));
const Transactions = lazy(() => import("./pages/TransactionsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailed = lazy(() => import("./pages/PaymentFailed"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const VPNBuy = lazy(() => import("./pages/VPNPlans"));
const VPNOrders = lazy(() => import("./pages/VPNOrders"));
const VPNManagement = lazy(() => import("./pages/VPNManagement"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ResellerProgram = lazy(() => import("./pages/ResellerProgram"));
const ESIMTypes = lazy(() => import("./pages/ESIMTypes"));
const USAESIMPlans = lazy(() => import("./pages/USAESIMPlansPage"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const Tickets = lazy(() => import("./pages/UserDashboard/Tickets"));
const SupportChat = lazy(() => import("./pages/UserDashboard/SupportChat"));
const ResellerDashboard = lazy(() => import("./pages/Reseller/ResellerDashboard"));
const ResellerLoginPage = lazy(() => import("./pages/Reseller/ResellerLoginPage"));
const EmployeeDashboard = lazy(() => import("./pages/Employee/EmployeeDashboard"));
const AdminLoginPage = lazy(() => import("./pages/SuperAdmin/AdminLoginPage"));

// Initialize Google Analytics (your existing code)
ReactGA.initialize("UA-XXXXXXXXX-X");

// ✅ ADD: Reddit Pixel ID from environment
const REDDIT_PIXEL_ID = "66fa7c91-95cd-46ad-a920-d8db513caf94";

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
  </div>
);

export default function App() {
  const location = useLocation(); // Hook to track route changes

  // ✅ ADD: Initialize Reddit pixel tracking (one line!)
  useRedditPixel(REDDIT_PIXEL_ID);

  useEffect(() => {
    // Track page views on route changes (your existing GA tracking)
    ReactGA.pageview(location.pathname + location.search);

    // ✅ ADD: Track Reddit Ads navigation
    conversionTracker.trackNavigation(document.title || 'Page View', location.pathname);
  }, [location]); // Re-run effect when location changes

  return (
    <AuthProvider>
      <HelmetProvider>
        <ScrollToTop />
        <Toaster position="top-right" richColors={true} />
        <AutoSEO
          siteName="ProxySock"
          defaultTitle="ProxySock - Buy Premium Proxies, RDP, VPS & eSIM Online"
          defaultDescription="Buy premium proxies, RDP, VPS & eSIM. Datacenter, residential, ISP proxies. Windows/Linux hosting. Global eSIM cards. 24/7 support."
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

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />}>
                  {/* Main Dashboard */}
                  <Route index element={<DashboardHome />} />

                  {/* Products & Services */}
                  {/* proxies routes*/}
                  <Route path="proxies" element={<BuyProxies />} />

                  {/* ESIM routes */}
                  <Route path="global-esim" element={<ESIMPackages />} />
                  <Route path="esim" element={<ESIMTypes />} />
                  <Route path="usa-esim" element={<USAESIMPlans />} />

                  {/* VPS Routes */}
                  <Route path="vps" element={<VPSTypes />} />
                  <Route path="vps-plans" element={<VPSPlans />} />
                  <Route path="vps-plans/:type" element={<VPSPlans />} />

                  {/* RDP Routes */}
                  <Route path="rdp" element={<RDPTypes />} />
                  <Route path="rdp-plans" element={<RDPPlans />} />
                  <Route path="rdp-plans/:type" element={<RDPPlans />} />
                  {/* VPN routes */}
                  <Route path="vpn" element={<VPNBuy />} />

                  {/* Orders */}
                  <Route path="orders" element={<Orders />} />
                  <Route path="proxy-orders" element={<ProxyOrders />} />
                  <Route path="esim-orders" element={<EsimOrders />} />
                  <Route path="rdp-orders" element={<RDPOrders />} />
                  <Route path="rdp-orders" element={<RDPOrders />} />
                  <Route path="vps-orders" element={<VPSOrders />} />
                  <Route path="vpn-orders" element={<VPNOrders />} />

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
                  <Route path="notifications" element={<NotificationsPage />} />

                  {/* Support */}
                  <Route path="tickets" element={<Tickets />} />
                  <Route path="support-chat" element={<SupportChat />} />
                </Route>
              </Route>

              {/* Reseller Routes */}
              <Route path="/reseller/login" element={<ResellerLoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/reseller" element={<ResellerDashboard />} />
              </Route>

              {/* Employee Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/employee" element={<EmployeeDashboard />} />
              </Route>

              {/* SuperAdmin Routes */}
              <Route path="/sadmin/login" element={<AdminLoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/sadmin" element={<SuperAdminDashboard />} />
              </Route>

              {/* Admin / Employee Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<SuperAdminDashboard />} />


              {/* Payment Result Routes */}
              <Route path="/deposit/success" element={<DepositSuccess />} />
              <Route path="/deposit/failed" element={<DepositFailed />} />
              <Route
                path="/payments/success"
                element={<PaymentSuccess clearCart={() => { }} />}
              />
              <Route path="/payments/failed" element={<PaymentFailed />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <CookieConsentBanner />
        </AutoSEO>
      </HelmetProvider>
    </AuthProvider >
  );
}
