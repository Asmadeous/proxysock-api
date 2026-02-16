import { motion } from "framer-motion";

export default function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient - ProxySock red theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-500 to-pink-600" />

      {/* Primary blue blob - top left */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full bg-gradient-to-br from-blue-500/60 to-cyan-400/50 blur-[100px]"
        animate={{
          x: [0, 80, 30, 0],
          y: [0, -30, 80, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "-25%", left: "-15%" }}
      />

      {/* Purple blob - center right */}
      <motion.div
        className="absolute w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-purple-500/50 to-indigo-500/40 blur-[90px]"
        animate={{
          x: [0, -60, 40, 0],
          y: [0, 50, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "30%", right: "-20%" }}
      />

      {/* Cyan accent blob - bottom center */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-cyan-400/40 to-blue-500/30 blur-[80px]"
        animate={{
          x: [0, 50, -40, 0],
          y: [0, -60, 30, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        style={{ bottom: "-15%", left: "20%" }}
      />

      {/* Red accent - floating */}
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full bg-gradient-to-br from-red-400/40 to-pink-500/30 blur-[70px]"
        animate={{
          x: [0, 40, -25, 0],
          y: [0, -40, 50, 0],
          scale: [1, 1.2, 0.85, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "50%", left: "40%" }}
      />

      {/* Subtle light overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10" />

      {/* Noise overlay for texture */}
      <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 256 256\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\"/%3E%3C/svg%3E')" }} />
    </div>
  );
}
