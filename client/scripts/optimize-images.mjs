#!/usr/bin/env node
/**
 * Image Optimization Script
 * Converts large PNG images to optimized WebP format
 */

import sharp from 'sharp';
import { readdir, stat, mkdir } from 'fs/promises';
import { join, parse } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMAGES_DIR = join(__dirname, '../src/assets/images');

// Images to optimize (large PNGs)
const IMAGES_TO_OPTIMIZE = [
    'backgroundNode.png',
    'backgroundNodeRed.png',
    'PROXY PNG.png',
    'PROXY SOCKS DARK FONT.png'
];

async function optimizeImage(filename) {
    const inputPath = join(IMAGES_DIR, filename);
    const { name } = parse(filename);
    const outputPath = join(IMAGES_DIR, `${name}.webp`);

    try {
        const inputStats = await stat(inputPath);
        console.log(`\n📷 Processing: ${filename}`);
        console.log(`   Input size: ${(inputStats.size / 1024).toFixed(1)} KB`);

        await sharp(inputPath)
            .webp({
                quality: 80,     // Good balance of quality vs size
                effort: 6,       // Higher compression effort
                nearLossless: false
            })
            .toFile(outputPath);

        const outputStats = await stat(outputPath);
        const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

        console.log(`   Output size: ${(outputStats.size / 1024).toFixed(1)} KB`);
        console.log(`   ✅ Saved ${savings}%`);

        return {
            input: filename,
            output: `${name}.webp`,
            inputSize: inputStats.size,
            outputSize: outputStats.size,
            savings: parseFloat(savings)
        };
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('🚀 Starting image optimization...\n');
    console.log(`📁 Images directory: ${IMAGES_DIR}`);

    const results = [];

    for (const image of IMAGES_TO_OPTIMIZE) {
        const result = await optimizeImage(image);
        if (result) results.push(result);
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 OPTIMIZATION SUMMARY');
    console.log('='.repeat(50));

    let totalInputSize = 0;
    let totalOutputSize = 0;

    for (const r of results) {
        totalInputSize += r.inputSize;
        totalOutputSize += r.outputSize;
        console.log(`${r.input} → ${r.output}: -${r.savings}%`);
    }

    const totalSavings = ((1 - totalOutputSize / totalInputSize) * 100).toFixed(1);
    console.log('-'.repeat(50));
    console.log(`Total: ${(totalInputSize / 1024 / 1024).toFixed(2)} MB → ${(totalOutputSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🎉 Overall savings: ${totalSavings}%`);
}

main().catch(console.error);
