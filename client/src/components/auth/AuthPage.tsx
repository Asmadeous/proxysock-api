import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import LoginBrandPanel, { type AuthVariant } from "./login/LoginBrandPanel";
import "@/pages/auth/login.css";
import "./auth-pages.css";

export default function AuthPage({ variant, title, eyebrow, description, children, icon }: {
  variant: AuthVariant;
  title: string;
  eyebrow: string;
  description: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className={`login-page auth-page auth-page-${variant}`}>
      <Helmet><title>{title} | ProxySock</title></Helmet>
      <LoginBrandPanel variant={variant} />
      <main className="login-main">
        <header className="login-topbar"><Link to="/" className="login-back"><ArrowLeft size={15} aria-hidden="true" /> Back to website</Link></header>
        <div className="login-form-area">
          <div className="login-form-content">
            {icon && <div className="auth-status-icon" aria-hidden="true">{icon}</div>}
            <div className="login-form-heading">
              <p className="login-eyebrow">{eyebrow}</p>
              <h1>{title}{!/[.!?]$/.test(title) && <span>.</span>}</h1>
              <p>{description}</p>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
