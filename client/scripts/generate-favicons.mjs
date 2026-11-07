import { copyFile, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const source = new URL('../src/assets/images/favicon.svg', import.meta.url);
const publicDir = new URL('../public/', import.meta.url);
const assetsDir = new URL('../src/assets/images/', import.meta.url);
const svg = await readFile(source);

await copyFile(source, new URL('favicon.svg', publicDir));
for (const [name, size] of [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['favicon-96x96.png', 96],
  ['apple-touch-icon.png', 180],
  ['web-app-manifest-192x192.png', 192],
  ['web-app-manifest-512x512.png', 512],
]) {
  const png = await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
  await writeFile(new URL(name, publicDir), png);
  if (size > 32) await writeFile(new URL(name, assetsDir), png);
}

// ICO supports embedded PNG frames; include each common browser size.
const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map(size =>
  sharp(svg, { density: 384 }).resize(size, size).png().toBuffer(),
));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
frames.forEach((frame, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(frame.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
});
const ico = Buffer.concat([header, ...frames]);
await writeFile(new URL('favicon.ico', publicDir), ico);
await writeFile(new URL('favicon.ico', assetsDir), ico);
