/**
 * Extracts the DISTINCT product images for each item from `zest foto/<folder>`.
 *
 * For every product it:
 *   1. collects candidate files (jpg/jpeg/png, falling back to tiff only when
 *      there aren't enough raster files), de-duped by filename stem,
 *   2. walks them in a stable order (jpg first, then alphabetical) and keeps an
 *      image only if it is visually distinct from the ones already kept, using a
 *      64-bit difference hash (dHash) with a Hamming-distance gate — this drops
 *      exact dupes, "… copy" files and near-identical / colour-variant frames,
 *   3. resizes to 1200px max and writes JPEGs to public/products/{id}/0..n.jpg,
 *   4. records the produced paths in lib/productImages.json (the catalog reads
 *      this manifest, so image counts are never hardcoded).
 *
 * The first kept image (0.jpg) is unchanged from the previous 5-image run, so
 * category hero images that point at /products/<id>/0.jpg stay stable.
 *
 * Run: node --max-old-space-size=4096 scripts/build-product-images.js
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

sharp.cache(false);
sharp.concurrency(1);

const SRC = "C:/Users/Aykut/Desktop/zest foto";
const OUT = path.join(__dirname, "..", "public", "products");
const MANIFEST = path.join(__dirname, "..", "lib", "productImages.json");

const MAX_PER_PRODUCT = 12; // upper bound on distinct shots kept per product
const MAX_CANDIDATES = 48; // cap files we bother hashing per product
const MIN_RASTER_BEFORE_TIFF = 4; // only read slow TIFFs when raster is scarce
// Two images count as "the same / similar" only when BOTH the structure
// (grayscale difference hash) AND the colour are near-identical. This drops
// exact dupes and "… copy" frames while KEEPING genuine colour/finish variants
// (gold vs silver rim, dark vs light wood lid) and different angles.
const STRUCT_THRESHOLD = 10; // max dHash Hamming distance to be "same shape"
const COLOR_THRESHOLD = 45; // max per-cell RGB delta to be "same colour"
const MAX_DIM = 1200;
const QUALITY = 78;

// Each value is either a folder name under SRC, or an object describing one or
// more folders plus an optional filename filter (used when a folder holds
// several colour variants that belong to separate products).
const PRODUCT_SOURCES = {
  // Doğrayıcılar & Rondolar
  "dor-m1":   "M-14",
  "dor-m2":   "M-2",
  "dor-m11":  "M-11",

  // Rendeler & Dilimleyiciler
  "rnd-m9":   "M-9",
  "rnd-m12":  "M-12",
  "rnd-m10":  "M-10",
  "rnd-rev":  "M-REV-0001",

  // Saklama Kapları
  "skl-esk0001": "M-ESK-0001",
  "skl-esk0002": "M-ESK-0002",
  "skl-esk0003": "M-ESK-0003",
  // The 0101/0102/0103 folders are organised by camera angle and each holds the
  // gold / gümüş / roze finishes. The three products are split by colour, so
  // pull the matching finish across all three angle folders.
  "skl-esk0101": { folders: ["M-ESK-0101", "M-ESK-0102", "M-ESK-0103"], match: /gold/i },
  "skl-esk0102": { folders: ["M-ESK-0101", "M-ESK-0102", "M-ESK-0103"], match: /gumus/i },
  "skl-esk0103": { folders: ["M-ESK-0101", "M-ESK-0102", "M-ESK-0103"], match: /roze/i },
  "skl-esk0211": "M-ESK-0211",
  "skl-esk0212": "M-ESK-0212",
  "skl-esk0213": "M-ESK-0213",
  "skl-esk1001": "M-ESK-1001",
  "skl-esk1101": "M-ESK-1101",
  "skl-esk1211": "M-ESK-1211",
  "skl-m5":      "M-5",
  "skl-m6":      "M-6",
  "skl-m7":      "M-7",
  "skl-m8":      "M-8",

  // Servis & Sofra
  "srv-kal0001": "M-KAL-0001",
  "srv-kal0002": "M-KAL-0002",
  "srv-kal0003": "M-KAL-0003",
  "srv-kal1001": "M-KAL-1001",
  "srv-kal1002": "M-KAL-1002",
  "srv-kal1003": "M-KAL-1003",
  "srv-kas0001": "M-KAS-0001",
  "srv-kas1001": "M-KAS-1001",
  "srv-kau0001": "M-KAU-0001",
  "srv-kau1001": "M-KAU-1001",
  "srv-kav0001": "M-KAV-0001",
  "srv-kav1001": "M-KAV-1001",
  "srv-sua":     "M-SUA-0001",
  "srv-suh":     "M-SUH-0001",

  // Mutfak Aletleri
  "alt-kmn":  "M-KMN-0001",
  "alt-kpg":  "M-KPG-0001",
  "alt-m3":   "M-3",
  "soy-sol1": "M-SOL-0001",
  "soy-sol2": "M-SOL-0002",

  // Mutfak Aksesuarları
  "aks-m4":   "M-4",
  "aks-kag":  "M-KAG-3001",
};

const RASTER_EXTS = [".jpg", ".jpeg", ".png"];
const TIFF_EXTS = [".tif", ".tiff"];
const EXT_PRIORITY = [...RASTER_EXTS, ...TIFF_EXTS];

const isPsd = (name) => /\.psd$/i.test(name);

function walkFiles(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    let items;
    try {
      items = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const it of items) {
      const full = path.join(d, it.name);
      if (it.isDirectory()) stack.push(full);
      else if (!isPsd(it.name)) out.push(full);
    }
  }
  return out;
}

// De-dupe by filename stem (prefer higher-priority extension), then sort
// jpg-first and alphabetically for a stable cover image. Accepts files from one
// or more folders and an optional filename filter.
function orderedCandidates(files, match) {
  const byStem = new Map();
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (!EXT_PRIORITY.includes(ext)) continue;
    if (match && !match.test(path.basename(f))) continue;
    // Stem is folder-qualified so identical names in sibling folders don't clash.
    const stem = (path.basename(path.dirname(f)) + "/" + path.basename(f, ext)).toLowerCase();
    const score = EXT_PRIORITY.indexOf(ext);
    const existing = byStem.get(stem);
    if (!existing || existing.score > score) byStem.set(stem, { file: f, score });
  }
  const all = Array.from(byStem.values()).sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return a.file.localeCompare(b.file, "en");
  });

  const raster = all.filter((c) => RASTER_EXTS.includes(path.extname(c.file).toLowerCase()));
  const list = raster.length >= MIN_RASTER_BEFORE_TIFF ? raster : all;
  return list.slice(0, MAX_CANDIDATES).map((c) => c.file);
}

// One read per file → a 9x8 RGB thumbnail, from which we derive both a
// structural difference hash (grayscale) and a per-cell colour signature.
async function signature(file) {
  const ext = path.extname(file).toLowerCase();
  const opts = { limitInputPixels: 5_000_000_000, sequentialRead: true, failOn: "none" };
  if (TIFF_EXTS.includes(ext)) opts.unlimited = true;
  const w = 9;
  const h = 8;
  const buf = await sharp(file, opts)
    .flatten({ background: "#ffffff" })
    .resize(w, h, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer(); // w*h*3 bytes
  const gray = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = (buf[i * 3] + buf[i * 3 + 1] + buf[i * 3 + 2]) / 3;
  }
  const struct = new Uint8Array(64);
  let k = 0;
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w - 1; col++) {
      struct[k++] = gray[row * w + col] < gray[row * w + col + 1] ? 1 : 0;
    }
  }
  return { struct, rgb: buf, cells: w * h };
}

function hamming(a, b) {
  let d = 0;
  for (let i = 0; i < 64; i++) if (a[i] !== b[i]) d++;
  return d;
}

// Largest per-cell RGB delta between two signatures (0–765).
function colorMaxDelta(a, b) {
  let max = 0;
  for (let i = 0; i < a.cells; i++) {
    const d =
      Math.abs(a.rgb[i * 3] - b.rgb[i * 3]) +
      Math.abs(a.rgb[i * 3 + 1] - b.rgb[i * 3 + 1]) +
      Math.abs(a.rgb[i * 3 + 2] - b.rgb[i * 3 + 2]);
    if (d > max) max = d;
  }
  return max;
}

// "Same / similar" only when shape AND colour are both near-identical.
function isDuplicate(a, b) {
  return hamming(a.struct, b.struct) < STRUCT_THRESHOLD && colorMaxDelta(a, b) < COLOR_THRESHOLD;
}

async function writeImage(file, outPath) {
  const ext = path.extname(file).toLowerCase();
  const opts = { limitInputPixels: 5_000_000_000, sequentialRead: true, failOn: "none" };
  if (TIFF_EXTS.includes(ext)) opts.unlimited = true;
  await sharp(file, opts)
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
    .toFile(outPath);
}

function resolveSource(spec) {
  if (typeof spec === "string") return { folders: [spec], match: undefined };
  return { folders: spec.folders, match: spec.match };
}

async function processOne(id, spec) {
  const { folders, match } = resolveSource(spec);
  const files = [];
  for (const folderName of folders) {
    const folder = path.join(SRC, folderName);
    if (!fs.existsSync(folder)) {
      console.warn(`  ! missing folder: ${folder}`);
      continue;
    }
    files.push(...walkFiles(folder));
  }
  const label = folders.join("+");

  const candidates = orderedCandidates(files, match);
  if (candidates.length === 0) {
    console.warn(`  ! no usable images for ${id} (${label})`);
    return [];
  }

  // Select visually-distinct files in order.
  const keptSigs = [];
  const keptFiles = [];
  let skipped = 0;
  for (const file of candidates) {
    if (keptFiles.length >= MAX_PER_PRODUCT) break;
    let sig;
    try {
      sig = await signature(file);
    } catch {
      continue; // unreadable, skip
    }
    const dup = keptSigs.some((ks) => isDuplicate(ks, sig));
    if (dup) {
      skipped++;
      continue;
    }
    keptSigs.push(sig);
    keptFiles.push(file);
  }

  // Write outputs.
  const outDir = path.join(OUT, id);
  if (fs.existsSync(outDir)) {
    for (const f of fs.readdirSync(outDir)) fs.unlinkSync(path.join(outDir, f));
  } else {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const webPaths = [];
  let n = 0;
  for (const file of keptFiles) {
    const outPath = path.join(outDir, `${n}.jpg`);
    try {
      await writeImage(file, outPath);
      webPaths.push(`/products/${id}/${n}.jpg`);
      n++;
    } catch (err) {
      console.warn(`    ! ${path.basename(file)} skipped: ${err.message}`);
    }
  }

  console.log(
    `  ✓ ${id}: ${n} distinct images (${label}, ${candidates.length} candidates, ${skipped} similar dropped)`,
  );
  return webPaths;
}

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const entries = Object.entries(PRODUCT_SOURCES);
  console.log(`Processing ${entries.length} products...`);
  const manifest = {};
  const missing = [];
  for (const [id, folder] of entries) {
    const paths = await processOne(id, folder);
    if (paths.length > 0) manifest[id] = paths;
    else missing.push(id);
  }

  const sorted = {};
  for (const key of Object.keys(manifest).sort()) sorted[key] = manifest[key];
  fs.writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + "\n");

  const total = Object.values(manifest).reduce((s, a) => s + a.length, 0);
  console.log(`\nDone. ${Object.keys(manifest).length}/${entries.length} products, ${total} images.`);
  console.log(`Manifest written to ${path.relative(process.cwd(), MANIFEST)}`);
  if (missing.length) console.log(`Missing/empty: ${missing.join(", ")}`);
})();
