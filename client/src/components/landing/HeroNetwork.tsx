import { useReducedMotion } from "framer-motion";

const strands = [
  { path: 'M-160 1090 C150 900 280 680 450 420 S780 40 940 -100', duration: 26, delay: -12, opacity: 0.45 },
  { path: 'M-100 1110 C180 970 380 700 570 470 S850 110 1060 -70', duration: 22, delay: -5, opacity: 0.95 },
  { path: 'M-180 990 C160 870 440 780 650 520 S890 250 1100 80', duration: 30, delay: -18, opacity: 0.7 },
  { path: 'M-100 1180 C170 900 260 820 540 680 S800 510 1080 320', duration: 32, delay: -9, opacity: 0.4 },
  { path: 'M30 1130 C250 900 410 520 650 290 S900 90 1070 -40', duration: 24, delay: -16, opacity: 0.85 },
];

export function HeroNetwork() {
  const reducedMotion = useReducedMotion();

  return (
    <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true" className="hero-network">
      <defs>
        <filter id="hero-filament-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <radialGradient id="hero-point-glow">
          <stop stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.2" stopColor="#fff3eb" stopOpacity="0.8" />
          <stop offset="0.5" stopColor="#ffb6a4" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffb6a4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-filament" x1="100" y1="1000" x2="850" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffb5a3" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="#fff5ee" />
          <stop offset="1" stopColor="#ffdfd0" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      {strands.map((strand, index) => (
        <g key={strand.path} opacity={strand.opacity}>
          <path d={strand.path} stroke="#ffc4ad" strokeWidth="4" opacity="0.35" filter="url(#hero-filament-glow)" />
          <path d={strand.path} stroke="url(#hero-filament)" strokeWidth={index === 1 ? 1.6 : 1} />
          {Array.from({ length: 6 }, (_, point) => (
            <g key={point}>
              {!reducedMotion && (
                <animateMotion path={strand.path} dur={`${strand.duration}s`} begin={`${strand.delay - point * strand.duration / 6}s`} repeatCount="indefinite" calcMode="paced" />
              )}
              <g transform={reducedMotion ? `translate(${130 + point * 145} ${900 - point * 150 + index * 22})` : undefined}>
                <circle r={point % 3 === 0 ? 21 : 13} fill="url(#hero-point-glow)" />
                <circle r={point % 3 === 0 ? 4.5 : 2.5} fill="#fff5ee" opacity="0.95" />
              </g>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}
