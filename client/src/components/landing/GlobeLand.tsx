import { useLayoutEffect, useRef } from "react";
import { useThemeStore } from "@/store/themeStore";
import land from "@/assets/land-dots.json";

const radians = Math.PI / 180;
const points = land.map(([lat, lon]) => {
  const latitude = lat * radians;
  return [Math.cos(latitude) * Math.sin(lon * radians), Math.sin(latitude), Math.cos(latitude) * Math.cos(lon * radians)];
});

// Draw the dense land layer in one canvas instead of updating thousands of DOM nodes per frame.
export function GlobeLand({ rotation }: { rotation: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const dark = useThemeStore((state) => state.dark);
  useLayoutEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    const angle = rotation * radians;
    const sin = Math.sin(angle), cos = Math.cos(angle);
    context.setTransform(2, 0, 0, 2, 0, 0);
    context.clearRect(0, 0, 640, 600);
    context.fillStyle = dark ? "#ff737b" : "#c92332";
    for (const [x, y, z] of points) {
      const depth = x * sin + z * cos;
      if (depth <= 0) continue;
      context.globalAlpha = Math.min(1, depth * 8) * (.22 + depth * .65);
      context.beginPath();
      context.arc(320 + 235 * (x * cos - z * sin), 300 - 235 * y, .7 + depth * .7, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
  }, [rotation, dark]);
  return <canvas ref={canvas} width={1280} height={1200} className="world-land-canvas" aria-hidden="true" />;
}
