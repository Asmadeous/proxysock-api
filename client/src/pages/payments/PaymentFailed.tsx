import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import StatusLayout from "@/components/public/StatusLayout";
export default function PaymentFailed() {
  const { search } = useLocation();
  const isDeposit = new URLSearchParams(search).get('type') === 'deposit';
  return <StatusLayout label="Payment update" mark="!"><Helmet><title>{isDeposit ? 'Deposit Failed' : 'Payment Failed'} | ProxySock</title><meta name="robots" content="noindex" /></Helmet><p className="proxy-eyebrow">Let’s get you back on track</p><h1>{isDeposit ? 'Deposit unsuccessful.' : 'Payment unsuccessful.'}</h1><p>We couldn’t complete this {isDeposit ? 'deposit' : 'payment'}. Check your account status before trying again. If you need help, our support team can look into it with you.</p><div className="status-actions"><Link to={isDeposit ? '/dashboard' : '/dashboard/cart'} className="proxy-button proxy-button-dark">{isDeposit ? 'Back to dashboard' : 'Back to cart'}<ArrowUpRight size={16} aria-hidden="true" /></Link><Link to="/contact" className="proxy-button">Contact support</Link></div></StatusLayout>;
}
