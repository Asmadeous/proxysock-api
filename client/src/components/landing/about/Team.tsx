import backgroundNode from "@/assets/images/backgroundNode.webp";
import backgroundNodeRed from "@/assets/images/backgroundNodeRed.webp";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useThemeStore } from "../../../store/themeStore";

const teamMembers = [
  {
    name: "Engineering Team",
    role: "Infrastructure & Development",
    description:
      "Our skilled engineers ensure robust, scalable infrastructure and cutting-edge solutions.",
    initials: "ET",
  },
  {
    name: "Security Team",
    role: "Cybersecurity & Privacy",
    description:
      "Dedicated professionals focused on maintaining the highest security standards.",
    initials: "ST",
  },
  {
    name: "Support Team",
    role: "Customer Success",
    description:
      "24/7 support specialists committed to providing exceptional customer service.",
    initials: "ST",
  },
  {
    name: "Operations Team",
    role: "Network Management",
    description:
      "Experts managing our global network infrastructure for optimal performance.",
    initials: "OT",
  },
];

export const Team = () => {
  const { dark } = useThemeStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const CARDS_PER_VIEW = 3;
  const CARD_WIDTH = 288;
  const CARD_GAP = 16;
  const AUTOPLAY_INTERVAL = 5000;
  const TRANSITION_TIMEOUT = 1500;

  useEffect(() => {
    if (!isAutoPlaying || isTransitioning) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex(
        (prev) => (prev + 1) % (teamMembers.length - CARDS_PER_VIEW + 1)
      );
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(interval);
  }, [teamMembers.length, isAutoPlaying, isTransitioning]);

  const nextSlide = () => {
    if (isTransitioning) return;
    const maxIndex = teamMembers.length - CARDS_PER_VIEW;
    if (currentIndex >= maxIndex) return;

    setIsTransitioning(true);
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
    setIsAutoPlaying(false);

    setTimeout(() => {
      setIsTransitioning(false);
      setIsAutoPlaying(true);
    }, TRANSITION_TIMEOUT);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    if (currentIndex <= 0) return;

    setIsTransitioning(true);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
    setIsAutoPlaying(false);

    setTimeout(() => {
      setIsTransitioning(false);
      setIsAutoPlaying(true);
    }, TRANSITION_TIMEOUT);
  };

  return (
    <section className=" relative overflow-hidden py-32 bg-background">
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <div className="relative z-10 mx-auto max-w-5xl px-8 lg:px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-manrope-bold font-bold text-5xl md:text-6xl text-foreground">
            Tech Pioneers <br />
            <span className="text-muted-foreground">building the future</span>
          </h2>
          <p className="mt-6 max-w-md font-inter-regular text-muted-foreground">
            We bring together brilliant developers, engineers, and tech
            innovators to create groundbreaking digital solutions.
          </p>
        </motion.div>

        <div className="relative">
          {/* Navigation Buttons */}
          <div className="mt-4 hidden items-center justify-end gap-4 md:flex">
            <motion.button
              className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card hover:bg-secondary text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
              disabled={currentIndex === 0 || isTransitioning}
              onClick={prevSlide}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            </motion.button>
            <motion.button
              className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card hover:bg-secondary text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
              disabled={
                currentIndex >= teamMembers.length - CARDS_PER_VIEW ||
                isTransitioning
              }
              onClick={nextSlide}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </motion.button>
          </div>

          {/* Carousel Content */}
          <div className="mt-16">
            <div className="overflow-hidden">
              <motion.div
                animate={{
                  x: `-${currentIndex * (CARD_WIDTH + CARD_GAP)}px`,
                }}
                className="-ml-4 flex max-w-[min(calc(100vw-4rem),24rem)] select-none"
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                {teamMembers.map((member, index) => (
                  <div
                    className="min-w-0 max-w-72 shrink-0 grow-0 basis-full pl-4"
                    key={member.name}
                  >
                    <motion.div
                      className="rounded-2xl border border-border bg-card p-7 text-center"
                      initial={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileInView={{ opacity: 1, y: 0 }}
                    >
                      <div className="mx-auto size-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
                        {member.initials}
                      </div>
                      <div className="mt-6 flex flex-col justify-center">
                        <p className="font-manrope-semibold font-semibold text-card-foreground text-lg">
                          {member.name}
                        </p>
                        <p className="font-inter-regular text-muted-foreground text-sm">
                          {member.role}
                        </p>
                      </div>
                      <div className="my-6 h-px bg-border" />
                      <p className="font-inter-regular text-muted-foreground text-sm">
                        {member.description}
                      </p>
                    </motion.div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
