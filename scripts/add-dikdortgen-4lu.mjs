// Adds the new "4'lü Dikdörtgen Saklama Kabı Seti" custom product with 3
// color variants (Siyah, Krem, Yeşil), and resets every Bonny variant stock
// to 10 so the "Tükendi" overlay on product cards goes away.
//
// Photo strategy: the script doesn't have the 3 hero shots on disk yet — it
// just sets up the folders. The user drops one JPG into each:
//   public/products/c-dikdortgen-4lu/siyah/0.jpg
//   public/products/c-dikdortgen-4lu/krem/0.jpg
//   public/products/c-dikdortgen-4lu/yesil/0.jpg
// Once dropped, run `node scripts/sync-bonny-curated.mjs` to repoint the DB
// (that script also scans this product's folders).

import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
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

const NEW_ID = "c-dikdortgen-4lu";

const VARIANTS = [
  { key: "siyah", label: "Siyah", hex: "#3F3F3F", position: 0 },
  { key: "krem",  label: "Krem",  hex: "#EFE8D6", position: 1 },
  { key: "yesil", label: "Yeşil", hex: "#B0B43A", position: 2 },
];

const OUT_PRODUCTS = join(ROOT, "public", "products");

const { Pool } = pg;
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: PG_SSL ? { rejectUnauthorized: false } : false,
});

async function ensureFolders() {
  const productDir = join(OUT_PRODUCTS, NEW_ID);
  if (!existsSync(productDir)) mkdirSync(productDir, { recursive: true });
  for (const v of VARIANTS) {
    const d = join(productDir, v.key);
    if (!existsSync(d)) {
      mkdirSync(d, { recursive: true });
      console.log(`  created: public/products/${NEW_ID}/${v.key}`);
    }
  }
}

async function upsertProduct() {
  // Cover defaults to the first variant's first image (whether or not the
  // file is on disk yet — once the user drops 0.jpg into siyah/, this path
  // resolves correctly).
  const cover = `/products/${NEW_ID}/siyah/0.jpg`;
  const placeholderUrls = VARIANTS.map((v) => `/products/${NEW_ID}/${v.key}/0.jpg`);

  await pool.query(
    `INSERT INTO custom_products
       (id, name, category_slug, price_cents, short_description, description,
        image_urls, badges, is_active, volume_label, set_size)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9, $10)
     ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name,
           category_slug = EXCLUDED.category_slug,
           short_description = EXCLUDED.short_description,
           description = EXCLUDED.description,
           image_urls = EXCLUDED.image_urls,
           badges = EXCLUDED.badges,
           is_active = TRUE,
           volume_label = EXCLUDED.volume_label,
           set_size = EXCLUDED.set_size`,
    [
      NEW_ID,
      "4'lü Dikdörtgen Saklama Kabı Seti",
      "saklama-kaplari",
      0, // admin will set price
      "Dört parça dikdörtgen saklama kabı — bir büyük tabaka + üç küçük kap.",
      "İç içe geçen dört parçalı dikdörtgen saklama seti. Üst üste düzgün yerleşen kapaklı kaplar buzdolabı ve dolaplarınızda yer kazandırır. Renk seçenekleriyle mutfağınızın stiline uyum sağlar.",
      [cover],
      JSON.stringify({ isNew: true }),
      null,
      4,
    ],
  );
  console.log(`▸ upserted product ${NEW_ID}`);

  // Replace variants clean each run
  await pool.query(`DELETE FROM product_variants WHERE product_id = $1`, [NEW_ID]);
  for (const v of VARIANTS) {
    const imgUrl = `/products/${NEW_ID}/${v.key}/0.jpg`;
    await pool.query(
      `INSERT INTO product_variants
         (product_id, color_key, color_label, color_hex, stock, image_urls, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [NEW_ID, v.key, v.label, v.hex, 10, [imgUrl], v.position],
    );
    console.log(`  variant: ${v.label.padEnd(8)} stock=10 → ${imgUrl}`);
  }
}

async function resetBonnyStocks() {
  const r = await pool.query(
    `UPDATE product_variants SET stock = 10
       WHERE product_id IN ('c-bonny-3lu','c-bonny-6li','c-bonny-12li')
     RETURNING product_id, color_key, stock`,
  );
  console.log(`▸ reset ${r.rowCount} Bonny variants → 10 stock each`);
}

(async () => {
  await ensureFolders();
  await upsertProduct();
  await resetBonnyStocks();
  await pool.end();
  console.log("\n✓ Done. Drop a single .jpg into each color folder above and refresh.");
})().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
