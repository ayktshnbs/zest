// Add color variants to 7 BUILT-IN products (rnd-rev, skl-m6, skl-m7,
// soy-sol1, soy-sol2, srv-sua, srv-suh).
//
// Mirrors sync-bonny-curated.mjs but works on static-catalog product ids.
// Requires migration 018 (drops FK on product_variants.product_id).
//
// Layout convention (the user arranges files this way before re-running):
//   public/products/<id>/<color_key>/0.jpg, 1.jpg, ...
// Any color folder that's missing or empty is reported and skipped.
//
// Side effects: also un-retires skl-m6 and skl-m7 (they were turned off
// during the Bonny sync, but now they're coming back with color variants).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

const envText = readFileSync(join(ROOT, "server", ".env"), "utf8");
const DATABASE_URL =
  envText.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? "";
if (!DATABASE_URL) throw new Error("DATABASE_URL not found in server/.env");
const PG_SSL = /^PG_SSL=true$/mi.test(envText);

const OUT_PRODUCTS = join(ROOT, "public", "products");

// Color palette — keep keys url-safe (no Turkish diacritics in slugs).
const COLORS = {
  siyah:   { label: "Siyah",   hex: "#1A1A1A" },
  beyaz:   { label: "Beyaz",   hex: "#F2F2F2" },
  krem:    { label: "Krem",    hex: "#EFE8D6" },
  bej:     { label: "Bej",     hex: "#C8B89A" },
  gri:     { label: "Gri",     hex: "#9A9A95" },
  yesil:   { label: "Yeşil",   hex: "#A8B847" },
  kirmizi: { label: "Kırmızı", hex: "#C04A3D" },
  mavi:    { label: "Mavi",    hex: "#7FB7BD" },
};

// Per-product color list, in display order. Add new colors here when the user
// drops a new folder in (then re-run).
const PRODUCTS = [
  {
    id: "rnd-rev",
    colors: ["yesil", "beyaz", "gri", "siyah"],
  },
  {
    id: "skl-m6",
    colors: ["siyah", "yesil", "krem"],
  },
  {
    id: "skl-m7",
    colors: ["yesil", "siyah", "krem"],
  },
  // These four still need photos arranged. Sample inspection saw the colors
  // listed below, but the user is going to drop the files into the right
  // <color> folders manually (like Bonny). The script skips any color whose
  // folder is missing or empty, so it's safe to re-run as folders fill in.
  {
    id: "soy-sol1",
    colors: ["yesil", "beyaz"], // expand as user adds folders
  },
  {
    id: "soy-sol2",
    colors: ["bej", "beyaz"], // expand as user adds folders
  },
  {
    id: "srv-sua",
    colors: ["bej", "kirmizi", "yesil"], // expand as user adds folders
  },
  {
    id: "srv-suh",
    colors: ["bej", "mavi", "kirmizi"], // expand as user adds folders
  },
];

// Bring these back if they got retired by an earlier sync run.
const UNRETIRE = ["skl-m6", "skl-m7"];

const IMG_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function sortByNumericName(a, b) {
  const ax = a.match(/(\d+)/);
  const bx = b.match(/(\d+)/);
  if (ax && bx) return Number(ax[1]) - Number(bx[1]);
  return a.localeCompare(b);
}

function listGallery(productId, colorKey) {
  const dir = join(OUT_PRODUCTS, productId, colorKey);
  if (!existsSync(dir)) return null; // signal "missing folder"
  const files = readdirSync(dir)
    .filter((f) => IMG_EXTS.has(extname(f).toLowerCase()))
    .sort(sortByNumericName);
  return files.map((f) => `/products/${productId}/${colorKey}/${f}`);
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: PG_SSL ? { rejectUnauthorized: false } : false,
});

async function syncProduct(p) {
  console.log(`▸ ${p.id}`);
  await pool.query(`DELETE FROM product_variants WHERE product_id = $1`, [p.id]);

  let position = 0;
  let inserted = 0;
  for (const colorKey of p.colors) {
    const palette = COLORS[colorKey];
    if (!palette) {
      console.warn(`  ! unknown color key "${colorKey}" — add it to COLORS`);
      continue;
    }
    const gallery = listGallery(p.id, colorKey);
    if (gallery == null) {
      console.warn(`  ! missing folder: public/products/${p.id}/${colorKey} (skipped)`);
      continue;
    }
    if (gallery.length === 0) {
      console.warn(`  ! empty folder: public/products/${p.id}/${colorKey} (skipped)`);
      continue;
    }
    await pool.query(
      `INSERT INTO product_variants
         (product_id, color_key, color_label, color_hex, stock, image_urls, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [p.id, colorKey, palette.label, palette.hex, 20, gallery, position],
    );
    console.log(`    ${palette.label.padEnd(8)} → ${gallery.length} images (stock=20)`);
    position += 1;
    inserted += 1;
  }
  if (inserted === 0) {
    console.warn(`  ! no variants inserted for ${p.id}`);
  }
}

async function unretire(ids) {
  if (ids.length === 0) return;
  await pool.query(
    `UPDATE product_overrides SET is_active = TRUE WHERE product_id = ANY($1::text[])`,
    [ids],
  );
  console.log(`▸ un-retired ${ids.length} built-ins: ${ids.join(", ")}`);
}

(async () => {
  for (const p of PRODUCTS) await syncProduct(p);
  await unretire(UNRETIRE);
  await pool.end();
  console.log("\n✓ Built-in variants synced. Add more colors by dropping a new <color>/ folder and re-running.");
})().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
