export default function Router() {
  return [
    // Public routes
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/wait-for-verification',
    '/proxies',
    '/rdp',
    '/vps',
    '/esim',
    '/vpn',
    '/locations',
    '/about',
    '/faq',
    '/proxy-purpose',
    '/contact',
    '/HowToConnect',
    '/cookie-policy',
    '/ip-checker',
    '/vpn',

    // Dashboard routes
    '/dashboard',
    '/dashboard/buy-proxies',
    '/dashboard/esim-packages',
    '/dashboard/vps',
    '/dashboard/vps-plans',
    '/dashboard/rdp',
    '/dashboard/rdp-plans',
    '/dashboard/orders',
    '/dashboard/proxy-orders',
    '/dashboard/esim-orders',
    '/dashboard/rdp-orders',
    '/dashboard/vps-orders',
    '/dashboard/products',
    '/dashboard/proxy-management',
    '/dashboard/Esim-management',
    '/dashboard/VPS-management',
    '/dashboard/RDP-management',
    '/dashboard/transactions',
    '/dashboard/cart',
    '/dashboard/payments',
    '/dashboard/profile',
    '/dashboard/change-password',
    '/dashboard/vpn',

    // SuperAdmin
    '/sadmin',

    // Payment results
    '/deposit-success',
    '/deposit-failed'
  ];
}
