// Compress product photos in-place using sharp.
//
// Walks public/products and, for any .jpg over a size threshold, resizes the
// longest edge to MAX_EDGE and re-encodes as JPEG with QUALITY. Originals are
// kept under public/products-original/ on the first run so the change is
// reversible and re-running this script is idempotent (it never re-compresses
// a photo that's already small).
//
// Why this matters: the storefront ships ~600 MB of product photos in
// public/products. Next.js' image optimizer resizes them on first request and
// caches the output, but the SOURCE files still ride along on every deploy
// and add latency to first-render image optimization. Bringing the 56
// oversized files (>800 KB) down to ~200-300 KB shrinks the static bundle
// by ~75-100 MB without any visible quality loss for product cards.

import { readdir, stat, mkdir, copyFile, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public", "products");
const BACKUP = join(ROOT, "public", "products-original");

const MIN_BYTES = 400 * 1024;   // skip anything already smaller than this
const MAX_EDGE = 1600;          // px — plenty for product cards + zoom
const QUALITY = 78;             // JPEG quality (78 is the sweet spot)

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function ensureBackup(absPath) {
  const rel = relative(SRC, absPath);
  const target = join(BACKUP, rel);
  if (existsSync(target)) return; // already backed up
  await mkdir(join(target, ".."), { recursive: true });
  await copyFile(absPath, target);
}

let touched = 0;
let savedBytes = 0;
let skipped = 0;

for await (const file of walk(SRC)) {
  const ext = extname(file).toLowerCase();
  if (ext !== ".jpg" && ext !== ".jpeg") continue;
  const stats = await stat(file);
  if (stats.size < MIN_BYTES) {
    skipped += 1;
    continue;
  }
  await ensureBackup(file);
  const before = stats.size;
  // Read whole file into memory before processing so Windows can release the
  // file handle before we write back to the same path.
  const input = await readFile(file);
  const buf = await sharp(input)
    .rotate() // honor EXIF orientation
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer();
  await writeFile(file, buf);
  const after = buf.length;
  savedBytes += before - after;
  touched += 1;
  console.log(
    `  ${(before / 1024).toFixed(0).padStart(5)} KB → ${(after / 1024).toFixed(0).padStart(4)} KB · ${relative(ROOT, file)}`,
  );
}

console.log("");
console.log(`✓ compressed ${touched} files, skipped ${skipped} (already small)`);
console.log(`✓ saved ${(savedBytes / (1024 * 1024)).toFixed(1)} MB`);
console.log(`  originals preserved at public/products-original/`);
