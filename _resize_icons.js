#!/usr/bin/env node
/**
 * Batch-resize game icons to reduce bundle size.
 * Icons: 200x200 max, quality 80
 * Images (enemy portraits): 400x400 max, quality 80
 * Weekly-trials: 300x300 max, quality 80
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const CONFIGS = [
  { dir: 'src/assets/game/icons',         maxSize: 200, quality: 80 },
  { dir: 'src/assets/game/images',        maxSize: 400, quality: 80 },
  { dir: 'src/assets/game/weekly-trials',  maxSize: 300, quality: 80 },
  // custom/ is already small, skip
];

async function resizeDir({ dir, maxSize, quality }) {
  const absDir = path.resolve(__dirname, dir);
  if (!fs.existsSync(absDir)) {
    console.log(`  Skipping ${dir} (not found)`);
    return { processed: 0, savedBytes: 0 };
  }

  const files = fs.readdirSync(absDir).filter(f =>
    /\.(webp|png|jpg|jpeg)$/i.test(f)
  );

  let processed = 0;
  let savedBytes = 0;
  const concurrency = 8;

  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    await Promise.all(batch.map(async (file) => {
      const filePath = path.join(absDir, file);
      const originalSize = fs.statSync(filePath).size;

      try {
        const ext = path.extname(file).toLowerCase();
        const buffer = await sharp(filePath)
          .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality })
          .toBuffer();

        if (buffer.length < originalSize) {
          fs.writeFileSync(filePath, buffer);
          savedBytes += (originalSize - buffer.length);
        }
        processed++;
      } catch (err) {
        console.error(`  Error processing ${file}: ${err.message}`);
      }
    }));

    // Progress
    const pct = Math.round(((i + batch.length) / files.length) * 100);
    process.stdout.write(`\r  ${dir}: ${i + batch.length}/${files.length} (${pct}%)`);
  }
  console.log();
  return { processed, savedBytes };
}

async function main() {
  console.log('Batch resizing game assets...\n');
  let totalSaved = 0;
  let totalProcessed = 0;

  for (const config of CONFIGS) {
    console.log(`Processing ${config.dir} (max ${config.maxSize}px)...`);
    const { processed, savedBytes } = await resizeDir(config);
    totalProcessed += processed;
    totalSaved += savedBytes;
    console.log(`  → ${processed} files, saved ${(savedBytes / 1024 / 1024).toFixed(1)} MB\n`);
  }

  console.log(`\nDone! ${totalProcessed} files processed, ${(totalSaved / 1024 / 1024).toFixed(1)} MB saved total.`);
}

main().catch(console.error);
