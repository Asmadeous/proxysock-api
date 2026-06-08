import { motion } from "framer-motion";

export default function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient - deeper, richer ProxySock theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a0e] via-[#0d0d1a] to-[#0a0e1a]" />

      {/* Primary crimson glow — top left */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-br from-red-600/40 to-rose-500/25 blur-[120px]"
        animate={{
          x: [0, 60, -30, 0],
          y: [0, -50, 40, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "-30%", left: "-20%" }}
      />

      {/* Deep purple glow — center right */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-violet-600/30 to-indigo-500/20 blur-[100px]"
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -50, 0],
          scale: [1, 0.85, 1.15, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "25%", right: "-15%" }}
      />

      {/* Warm amber accent — bottom left */}
      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/10 blur-[90px]"
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 50, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        style={{ bottom: "-10%", left: "10%" }}
      />

      {/* Small floating crimson orb */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-br from-red-500/25 to-pink-600/15 blur-[80px]"
        animate={{
          x: [0, 30, -40, 0],
          y: [0, -60, 20, 0],
          scale: [1, 1.3, 0.8, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "55%", left: "35%" }}
      />

      {/* Cyan accent — subtle pop */}
      <motion.div
        className="absolute w-[250px] h-[250px] rounded-full bg-gradient-to-br from-cyan-400/10 to-blue-500/8 blur-[70px]"
        animate={{
          x: [0, -30, 45, 0],
          y: [0, 35, -25, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "10%", right: "20%" }}
      />

      {/* Mesh grid overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* Subtle light streak */}
      <motion.div
        className="absolute w-[2px] h-[200px] bg-gradient-to-b from-transparent via-white/10 to-transparent"
        animate={{
          y: [-200, 800],
          opacity: [0, 0.6, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
        style={{ left: "30%", rotate: "15deg" }}
      />

      {/* Noise overlay for texture */}
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 256 256\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\"/%3E%3C/svg%3E')",
        }}
      />
    </div>
  );
}
