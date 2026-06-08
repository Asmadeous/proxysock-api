import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CarouselFeature {
  icon: any;
  title: string;
  description: string;
}

interface AuthCarouselProps {
  features: CarouselFeature[];
  carouselId: string;
}

export default function AuthCarousel({ features, carouselId: _carouselId }: AuthCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Auto-rotate features with smooth progress
  useEffect(() => {
    const duration = 5000;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);

      if (elapsed >= duration) {
        setCurrentIndex((prev) => (prev + 1) % features.length);
        elapsed = 0;
        setProgress(0);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [features.length, currentIndex]);

  const currentFeature = features[currentIndex];

  return (
    <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none z-20">
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-left"
          >
            {/* Feature icon with glowing ring */}
            <motion.div
              className="flex items-center gap-4 mb-5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="relative">
                <div className="w-14 h-14 bg-white/[0.08] rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg shadow-red-500/10">
                  <currentFeature.icon className="h-7 w-7 text-red-400" />
                </div>
                {/* Subtle glow behind icon */}
                <div className="absolute inset-0 w-14 h-14 bg-red-500/20 rounded-2xl blur-xl -z-10" />
              </div>
              <motion.h2
                className="text-2xl font-bold text-white font-manrope tracking-tight"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {currentFeature.title}
              </motion.h2>
            </motion.div>

            <motion.p
              className="text-lg text-white/70 leading-relaxed font-inter font-normal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {currentFeature.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Progress indicators */}
        <div className="flex gap-2 mt-10">
          {features.map((_, idx) => (
            <button
              key={idx}
              className="relative h-1 rounded-full overflow-hidden transition-all duration-500 pointer-events-auto cursor-pointer"
              style={{ width: idx === currentIndex ? 40 : 12 }}
              onClick={() => {
                setCurrentIndex(idx);
                setProgress(0);
              }}
            >
              {/* Background track */}
              <div className="absolute inset-0 bg-white/15 rounded-full" />

              {/* Active fill with progress */}
              {idx === currentIndex && (
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-400 to-red-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              )}

              {/* Completed indicator */}
              {idx < currentIndex && (
                <div className="absolute inset-0 bg-red-400/60 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
