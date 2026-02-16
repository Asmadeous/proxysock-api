import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheckIcon, CheckCircleIcon, ChartBarIcon, MegaphoneIcon } from "@heroicons/react/24/outline";

interface CookiePreferences {
  essential: boolean; // Always true, required
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsentBanner() {
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Cannot be changed
    analytics: true,
    marketing: true,
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent || consent !== "accepted") {
      setShowModal(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("cookieConsent", "accepted");
    localStorage.setItem("cookiePreferences", JSON.stringify(consentData));
    setShowModal(false);
    globalThis.location.reload();
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === "essential") return; // Cannot toggle essential
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!showModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Cookie Preferences</h2>
                <p className="text-muted-foreground text-xs">
                  Manage your cookie settings
                </p>
              </div>
            </div>
          </div>

          {/* Cookie Options */}
          <div className="px-5 py-4 space-y-3">
            {/* Essential - Required */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-green-500/20 rounded">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Essential</p>
                  <p className="text-xs text-muted-foreground">Required for site to work</p>
                </div>
              </div>
              <div
                className="w-10 h-6 bg-green-500 rounded-full flex items-center justify-end px-1 cursor-not-allowed opacity-70"
                aria-hidden="true"
              >
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
            </div>

            {/* Analytics - Optional */}
            <button
              onClick={() => togglePreference("analytics")}
              className="flex w-full items-center justify-between p-3 bg-muted/30 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
              aria-pressed={preferences.analytics}
              aria-label="Toggle analytics cookies"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-500/20 rounded">
                  <ChartBarIcon className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Analytics</p>
                  <p className="text-xs text-muted-foreground">Datadog performance tracking</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${preferences.analytics ? 'bg-blue-500 justify-end' : 'bg-muted justify-start'}`}>
                <div className="w-4 h-4 bg-white rounded-full shadow" />
              </div>
            </button>

            {/* Marketing - Optional */}
            <button
              onClick={() => togglePreference("marketing")}
              className="flex w-full items-center justify-between p-3 bg-muted/30 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
              aria-pressed={preferences.marketing}
              aria-label="Toggle marketing cookies"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-purple-500/20 rounded">
                  <MegaphoneIcon className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Marketing</p>
                  <p className="text-xs text-muted-foreground">Reddit Pixel ads tracking</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${preferences.marketing ? 'bg-purple-500 justify-end' : 'bg-muted justify-start'}`}>
                <div className="w-4 h-4 bg-white rounded-full shadow" />
              </div>
            </button>

            {/* Legal Links */}
            <p className="text-xs text-muted-foreground pt-2">
              By continuing, you agree to our{" "}
              <a href="/terms" className="text-primary hover:underline">Terms</a>,{" "}
              <a href="/privacy" className="text-primary hover:underline">Privacy</a>, and{" "}
              <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a>.
            </p>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 bg-muted/20 border-t border-border">
            <button
              onClick={handleAcceptAll}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Save & Continue
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
