/**
 * Extracts up to 5 unique product images per item from `zest foto/<folder>`,
 * preferring JPG > PNG > TIFF, resizes to 1200px max, writes JPEG files to
 * public/products/{productId}/0.jpg ... 4.jpg.
 *
 * Run: node scripts/build-product-images.js
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Allow loading huge TIFFs into memory (some product shots are 60–90 MB).
sharp.cache(false);
sharp.concurrency(1);

const SRC = "C:/Users/Aykut/Desktop/zest foto";
const OUT = path.join(__dirname, "..", "public", "products");
const MAX_PER_PRODUCT = 5;
const MAX_DIM = 1200;
const QUALITY = 78;

// Each value is the folder name under SRC.
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
  "skl-esk0101": "M-ESK-0101",
  "skl-esk0102": "M-ESK-0102",
  "skl-esk0103": "M-ESK-0103",
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

const EXT_PRIORITY = [".jpg", ".jpeg", ".png", ".tif", ".tiff"];
// Skip "_copy" or "P11"-style flat layout markers when a base shot exists
const SKIP_PSD = (name) => /\.psd$/i.test(name);

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
      else if (!SKIP_PSD(it.name)) out.push(full);
    }
  }
  return out;
}

function pick(files) {
  // Group by stem (filename without ext), keep highest priority extension
  const byStem = new Map();
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (!EXT_PRIORITY.includes(ext)) continue;
    const stem = path.basename(f, ext).toLowerCase();
    const score = EXT_PRIORITY.indexOf(ext);
    const existing = byStem.get(stem);
    if (!existing || existing.score > score) {
      byStem.set(stem, { file: f, score });
    }
  }

  const chosen = Array.from(byStem.values()).sort((a, b) => {
    // Prefer JPG-priority files first, then alphabetical for stability
    if (a.score !== b.score) return a.score - b.score;
    return a.file.localeCompare(b.file, "en");
  });

  // Avoid near-duplicates: filter out files that look like color variants
  // (e.g. "_copy", roze/gold/gumus same shot). Take by deduped stem alone.
  return chosen.slice(0, MAX_PER_PRODUCT).map((c) => c.file);
}

async function processOne(id, folderName) {
  const folder = path.join(SRC, folderName);
  if (!fs.existsSync(folder)) {
    console.warn(`  ! missing folder: ${folder}`);
    return 0;
  }
  const all = walkFiles(folder);
  const picks = pick(all);
  if (picks.length === 0) {
    console.warn(`  ! no usable images in ${folderName}`);
    return 0;
  }

  const outDir = path.join(OUT, id);
  if (fs.existsSync(outDir)) {
    for (const f of fs.readdirSync(outDir)) fs.unlinkSync(path.join(outDir, f));
  } else {
    fs.mkdirSync(outDir, { recursive: true });
  }

  let n = 0;
  for (const file of picks) {
    const outPath = path.join(outDir, `${n}.jpg`);
    try {
      // Force RGB for TIFF, flatten any alpha against white
      const ext = path.extname(file).toLowerCase();
      const opts = {
        limitInputPixels: 5_000_000_000,
        sequentialRead: true,
        failOn: "none",
      };
      if (ext === ".tif" || ext === ".tiff") {
        opts.unlimited = true;
      }
      await sharp(file, opts)
        .rotate()
        .flatten({ background: "#ffffff" })
        .resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
        .toFile(outPath);
      n++;
    } catch (err) {
      console.warn(`    ! ${path.basename(file)} skipped: ${err.message}`);
    }
  }
  console.log(`  ✓ ${id}: ${n} images (from ${folderName}/${picks.length} candidates)`);
  return n;
}

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const entries = Object.entries(PRODUCT_SOURCES);
  console.log(`Processing ${entries.length} products...`);
  let ok = 0,
    missing = [];
  for (const [id, folder] of entries) {
    const n = await processOne(id, folder);
    if (n > 0) ok++;
    else missing.push(id);
  }
  console.log(`\nDone. ${ok}/${entries.length} processed.`);
  if (missing.length) console.log(`Missing/empty: ${missing.join(", ")}`);
})();
