// One-off: take the hand-curated Bonny image folders the user dropped into
// public/products/c-bonny-3lu/<color>/, c-bonny-6li/<color>/, c-bonny-12li/<color>/
// and make the storefront reflect them exactly.
//
// What it does (idempotent):
//   1. Rebuilds product_variants rows for the 3 Bonny products from real disk
//      contents — every file name in each color folder becomes an image URL.
//      Adds the two NEW colors (ahsap, woody) for c-bonny-3lu.
//   2. Updates each parent product's image_urls to point at the first variant's
//      first photo (cover thumbnail).
//   3. Retires the other custom storage products (Cam, Luxe, Woody-3lu) so the
//      Saklama Kapları section shows ONLY Bonny.
//   4. Retires built-in skl-m5/6/7/8 via product_overrides.is_active = false
//      so they're hidden from the storefront too. They stay in code; the user
//      will turn them back on later.

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

// Bonny products + their color variants. Position is the order shown in the
// color picker.  hex is the swatch background.
const BONNY = [
  {
    id: "c-bonny-3lu",
    colors: [
      { key: "bej", label: "Bej", hex: "#D6C7A7", position: 0 },
      { key: "siyah", label: "Siyah", hex: "#1A1A1A", position: 1 },
      { key: "kirmizi", label: "Kırmızı", hex: "#C04A3D", position: 2 },
      // New colors the user added in this round:
      { key: "ahsap", label: "Ahşap", hex: "#8B5A2B", position: 3 },
      { key: "woody", label: "Woody", hex: "#D4B896", position: 4 },
    ],
  },
  {
    id: "c-bonny-6li",
    colors: [
      { key: "bej", label: "Bej", hex: "#D6C7A7", position: 0 },
      { key: "siyah", label: "Siyah", hex: "#1A1A1A", position: 1 },
      { key: "kirmizi", label: "Kırmızı", hex: "#C04A3D", position: 2 },
    ],
  },
  {
    id: "c-bonny-12li",
    colors: [
      { key: "bej", label: "Bej", hex: "#D6C7A7", position: 0 },
      { key: "siyah", label: "Siyah", hex: "#1A1A1A", position: 1 },
      { key: "kirmizi", label: "Kırmızı", hex: "#C04A3D", position: 2 },
    ],
  },
];

// Other custom storage products to hide. The user wants only Bonny visible.
const RETIRE_CUSTOM = ["c-cam-saklama-3lu", "c-luxe-premium", "c-woody-3lu"];

// Built-in storage products to hide for now (user will re-enable later when
// they re-upload photos).
const RETIRE_BUILTIN = ["skl-m5", "skl-m6", "skl-m7", "skl-m8"];

const IMG_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// Numeric-safe sort: 2.jpg before 10.jpg.
function sortByNumericName(a, b) {
  const ax = a.match(/(\d+)/);
  const bx = b.match(/(\d+)/);
  if (ax && bx) return Number(ax[1]) - Number(bx[1]);
  return a.localeCompare(b);
}

function listGallery(productId, colorKey) {
  const dir = join(OUT_PRODUCTS, productId, colorKey);
  if (!existsSync(dir)) {
    console.warn(`  ! missing folder: public/products/${productId}/${colorKey}`);
    return [];
  }
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

async function rebuildProduct(p) {
  console.log(`▸ ${p.id}`);
  // 1. Drop existing variant rows for this product (fresh state every run).
  await pool.query(`DELETE FROM product_variants WHERE product_id = $1`, [p.id]);

  // 2. Insert fresh variants from disk + remember the first cover.
  let cover = null;
  for (const c of p.colors) {
    const gallery = listGallery(p.id, c.key);
    if (!cover && gallery.length > 0) cover = gallery[0];
    console.log(`    ${c.label.padEnd(8)} → ${gallery.length} images`);
    await pool.query(
      `INSERT INTO product_variants
         (product_id, color_key, color_label, color_hex, stock, image_urls, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [p.id, c.key, c.label, c.hex, 20, gallery, c.position],
    );
  }

  // 3. Refresh the parent product's cover image so it shows in lists.
  if (cover) {
    await pool.query(
      `UPDATE custom_products SET image_urls = $2, is_active = TRUE WHERE id = $1`,
      [p.id, [cover]],
    );
  } else {
    await pool.query(`UPDATE custom_products SET is_active = TRUE WHERE id = $1`, [p.id]);
  }
}

async function retireCustom(ids) {
  if (ids.length === 0) return;
  await pool.query(
    `UPDATE custom_products SET is_active = FALSE WHERE id = ANY($1::text[])`,
    [ids],
  );
  console.log(`▸ retired ${ids.length} custom products: ${ids.join(", ")}`);
}

async function retireBuiltin(ids) {
  for (const id of ids) {
    await pool.query(
      `INSERT INTO product_overrides (product_id, is_active) VALUES ($1, FALSE)
         ON CONFLICT (product_id) DO UPDATE SET is_active = FALSE`,
      [id],
    );
  }
  console.log(`▸ retired ${ids.length} built-ins: ${ids.join(", ")}`);
}

(async () => {
  for (const p of BONNY) await rebuildProduct(p);
  await retireCustom(RETIRE_CUSTOM);
  await retireBuiltin(RETIRE_BUILTIN);
  await pool.end();
  console.log("\n✓ Bonny variants in sync with disk. Saklama Kapları now Bonny-only.");
})().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
