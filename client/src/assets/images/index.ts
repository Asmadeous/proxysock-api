/**
 * Optimized Image Assets
 * Uses WebP format for better performance with PNG fallback for older browsers
 */

// Background images (WebP optimized)
export { default as backgroundNode } from './backgroundNode.webp';
export { default as backgroundNodeRed } from './backgroundNodeRed.webp';

// Logo images (WebP optimized)
export { default as proxyPng } from './PROXY PNG.webp';
export { default as proxySocksDarkFont } from './PROXY SOCKS DARK FONT.webp';

// Original PNGs as fallback (for browsers that don't support WebP)
export { default as backgroundNodePng } from './backgroundNode.png';
export { default as backgroundNodeRedPng } from './backgroundNodeRed.png';
