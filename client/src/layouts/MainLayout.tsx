// src/layouts/MainLayout.tsx
import { Link } from "react-router-dom";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-white font-bold text-xl">
                ProxyStore
              </Link>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <Link
                    to="/dashboard"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link
                    to="/proxies"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    My Proxies
                  </Link>
                  <Link
                    to="/fund-account"
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Fund Account
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Link
                to="/my-account"
                className="ml-4 text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                My Account
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
