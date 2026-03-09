import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path"


export default defineConfig({
  plugins: [react()],
  root: ".",
  publicDir: "public",

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },

  build: {
    outDir: "dist",
    minify: "esbuild",
    cssMinify: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: "./index.html"
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom") ||
              id.includes("@headlessui") ||
              id.includes("@radix-ui") ||
              id.includes("framer-motion") ||
              id.includes("use-sidecar") ||
              id.includes("use-callback-ref") ||
              id.includes("aria-hidden") ||
              id.includes("react-remove-scroll") ||
              id.includes("detect-node-es") ||
              id.includes("get-nonce")
            ) {
              return "vendor-core";
            }
            if (id.includes("lucide-react") || id.includes("@heroicons")) {
              return "icons-vendor";
            }
            return id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0]
              .replace("@", "");
          }
        },
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },

  server: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: ["literally-immortal-sunbird.ngrok-free.app"],
  },

  esbuild: {
    drop: ["console", "debugger"],
  },

  define: {
    __DEV__: false,
    __PROD__: true,
  },

  preview: {
    port: 5173,
    host: "0.0.0.0",
    allowedHosts: ["literally-immortal-sunbird.ngrok-free.app"], // ✅ allow ngrok host
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://js.paystack.co https://www.googletagmanager.com https://embed.tawk.to https://*.tawk.to https://js.stripe.com https://www.google-analytics.com https://www.redditstatic.com https://cdn.jsdelivr.net",
        "connect-src 'self' https://www.google-analytics.com https://va.tawk.to https://*.tawk.to wss://*.tawk.to https://v6.exchangerate-api.com https://api.stripe.com https://*.datadoghq.com https://r.stripe.com https://www.redditstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://paystack.com https://embed.tawk.to https://*.tawk.to https://js.stripe.com https://cdn.jsdelivr.net",
        "font-src 'self' https://fonts.gstatic.com https://embed.tawk.to https://*.tawk.to data:",
        "img-src 'self' data: blob: https://www.proxysock.com https://www.proxystore.net https://upload.wikimedia.org https://flagcdn.com https://embed.tawk.to https://*.tawk.to https://www.google-analytics.com https://www.googletagmanager.com https://stats.g.doubleclick.net",
        "frame-src 'self' https://checkout.paystack.com https://js.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests"
      ].join('; ')
    }
  },

  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
