import pkg from 'sitemap';
import fs from 'fs';
import path from 'path';

const { SitemapStream, streamToPromise } = pkg; // use the correct exports
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// all your routes exactly as in App.tsx
const routes = [
  '/', '/login', '/register', '/forgot-password', '/wait-for-verification',
  '/proxies', '/rdp', '/vps', '/esim', '/locations', '/about', '/faq',
  '/proxy-purpose', '/contact', '/HowToConnect', '/cookie-policy', '/ip-checker',
  '/dashboard', '/dashboard/buy-proxies', '/dashboard/esim-packages',
  '/dashboard/vps', '/dashboard/vps-plans', '/dashboard/rdp', '/dashboard/rdp-plans',
  '/dashboard/orders', '/dashboard/proxy-orders', '/dashboard/esim-orders',
  '/dashboard/rdp-orders', '/dashboard/vps-orders', '/dashboard/products',
  '/dashboard/proxy-management', '/dashboard/Esim-management', '/dashboard/VPS-management',
  '/dashboard/RDP-management', '/dashboard/transactions', '/dashboard/cart',
  '/dashboard/payments', '/dashboard/profile', '/dashboard/change-password',
  '/sadmin', '/deposit-success', '/deposit-failed'
];

// create sitemap
const sitemapStream = new SitemapStream({ hostname: 'https://www.proxysock.com' });

routes.forEach(route => {
  sitemapStream.write({ url: route, changefreq: 'daily', priority: 0.7 });
});

sitemapStream.end();

streamToPromise(sitemapStream).then(data => {
  fs.writeFileSync(path.resolve(__dirname, 'public', 'sitemap.xml'), data.toString());
  console.log('✅ Sitemap generated at public/sitemap.xml');
});
