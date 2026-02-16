import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faTelegram } from "@fortawesome/free-brands-svg-icons";
import logo from "../../../assets/images/favicon.svg";

export default function LoginFooter() {
  return (
    <div className="space-y-8">
      {/* Sign Up Link */}
      <div className="text-center">
        <p className="text-gray-400 text-sm">
          New to ProxySock?{" "}
          <Link
            to="/register"
            className="font-semibold text-red-400 hover:text-red-300 transition-colors underline decoration-red-400/50 hover:decoration-red-300"
          >
            Create your free account
          </Link>
        </p>
      </div>

      {/* Quick Access Links */}
      <div className="border-t border-white/10 pt-8">
        <p className="text-xs text-gray-500 text-center mb-6 font-medium">
          Quick Access to Services
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/proxies"
            className="group flex items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/30 transition-all duration-300"
          >
            <span className="text-sm text-gray-300 group-hover:text-white font-medium">
              Proxy Plans
            </span>
            <svg className="w-4 h-4 ml-2 text-gray-400 group-hover:text-red-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            to="/rdp"
            className="group flex items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/30 transition-all duration-300"
          >
            <span className="text-sm text-gray-300 group-hover:text-white font-medium">
              RDP Plans
            </span>
            <svg className="w-4 h-4 ml-2 text-gray-400 group-hover:text-red-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            to="/vps"
            className="group flex items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/30 transition-all duration-300"
          >
            <span className="text-sm text-gray-300 group-hover:text-white font-medium">
              VPS Plans
            </span>
            <svg className="w-4 h-4 ml-2 text-gray-400 group-hover:text-red-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            to="/esim"
            className="group flex items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/30 transition-all duration-300"
          >
            <span className="text-sm text-gray-300 group-hover:text-white font-medium">
              eSIM Plans
            </span>
            <svg className="w-4 h-4 ml-2 text-gray-400 group-hover:text-red-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900/50 backdrop-blur-xl border-t border-white/10 rounded-t-2xl -mx-8 -mb-8 px-8 py-6 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center mb-4 sm:mb-0">
            <img src={logo} alt="ProxySock" className="h-8 w-8 mr-3" />
            <span className="text-gray-400 text-sm font-medium">
              © {new Date().getFullYear()} ProxySock. All rights reserved.
            </span>
          </div>
          <div className="flex space-x-4">
            <a
              href="https://x.com/cybertwts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            >
              <FontAwesomeIcon icon={faTwitter} className="h-5 w-5" />
            </a>
            <a
              href="https://t.me/Proxy_sock5"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            >
              <FontAwesomeIcon icon={faTelegram} className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
