import React, { useState, useEffect } from "react";
import { X, ArrowRight } from "lucide-react";

const PopAd: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);

  // PLACEHOLDERS: Fill in your values here
  // IMPORTANT: Make sure to include "https://" at the beginning, otherwise it will redirect to your own domain!
  // Example: "https://heleket.com/?ref=YOUR_CODE"
  const PROMO_LINK = "https://heleket.com/?ref=YOUR_CODE";

  useEffect(() => {
    // Small delay before showing the ad
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isVisible) {
      // Show close button after 3 seconds
      const closeTimer = setTimeout(() => {
        setShowCloseButton(true);
      }, 3000);

      return () => clearTimeout(closeTimer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[9999] w-72 sm:w-80 shadow-2xl rounded-xl overflow-hidden bg-card border border-border animate-in slide-in-from-bottom-5 fade-in duration-500">
      <a
        href={PROMO_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative group w-full cursor-pointer bg-card flex flex-col h-full"
      >
        {/* Top Half: Image */}
        <div className="relative overflow-hidden w-full h-32 sm:h-36 bg-muted/50">
          <img 
            src="/heleket-ad.webp" 
            alt="Heleket Virtual Card" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-0"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-primary/5');
            }}
          />
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"></div>
        </div>
        
        {/* Bottom Half: Context and CTA */}
        <div className="p-4 relative z-20 bg-card border-t border-border">
          <h3 className="font-bold text-[15px] text-foreground mb-1 group-hover:text-primary transition-colors">
            Get a Heleket Virtual Card
          </h3>
          <p className="text-[13px] text-muted-foreground leading-snug mb-3">
            Secure your online payments instantly. Create virtual cards with ease and protect your privacy.
          </p>
          <div className="flex items-center text-[13px] font-semibold text-primary">
            Sign up now <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </a>
      
      {showCloseButton && (
        <button
          onClick={(e) => {
            e.preventDefault(); 
            e.stopPropagation();
            setIsVisible(false);
          }}
          className="absolute top-2 right-2 p-1.5 bg-background/90 backdrop-blur hover:bg-primary hover:text-primary-foreground text-foreground rounded-full transition-colors z-[50] border border-border shadow-sm"
          aria-label="Close Ad"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default PopAd;
