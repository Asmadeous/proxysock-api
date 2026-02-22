import { Link } from "react-router-dom";

export function BlogRelatedProducts() {
  return (
    <div className="bg-gray-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Ready to Get Started?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Proxies", href: "/proxies", icon: "🌐" },
            { name: "RDP Hosting", href: "/rdp", icon: "🖥️" },
            { name: "VPS Servers", href: "/vps", icon: "⚡" },
            { name: "eSIM Cards", href: "/esim", icon: "📱" },
          ].map((product, index) => (
            <Link
              key={index}
              to={product.href}
              className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 text-center transition-all duration-200 border border-gray-700 hover:border-red-500/50"
            >
              <div className="text-3xl mb-2">{product.icon}</div>
              <h3 className="text-white font-semibold">{product.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
