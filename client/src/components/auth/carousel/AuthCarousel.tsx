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

export default function AuthCarousel({ features, carouselId }: AuthCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate features
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [features.length]);

  const currentFeature = features[currentIndex];

  return (
    <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none z-20">
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="text-left"
          >
            <motion.div
              className="flex items-center gap-3 mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <currentFeature.icon className="h-6 w-6 text-red-400" />
              </div>
              <motion.h2
                className="text-2xl font-bold text-white"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {currentFeature.title}
              </motion.h2>
            </motion.div>
            <motion.p
              className="text-lg text-white/80 leading-relaxed font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {currentFeature.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Carousel indicators */}
        <div className="flex gap-2 mt-8">
          {features.map((_, idx) => (
            <motion.div
              key={idx}
              className={`h-1 rounded-full transition-all duration-500 ${idx === currentIndex ? "w-8 bg-red-400" : "w-2 bg-white/30"
                }`}
              layoutId={`${carouselId}-${idx}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
