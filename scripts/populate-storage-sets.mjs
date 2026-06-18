// One-off populator: replaces the 12 old built-in storage products with new
// admin-managed set products that have color variants.
//
// What it does (idempotent — safe to re-run):
//   1. Resizes/copies photos from C:/Users/Aykut/Desktop/zest foto/M-ESK-* into
//      public/products/<id>/<color>/N.jpg
//   2. Upserts custom_products rows (Bonny 3/6/12'lü, Kare 3'lü, Luxe, Tall)
//   3. Replaces product_variants for each (DELETE then INSERT — clean state)
//   4. Marks the 12 retired skl-esk* ids as is_active=false on product_overrides
//
// Photo strategy: filenames may contain a color hint (bej/siyah/kirmizi for
// Bonny lines, gold/gumus/roze for Luxe). Photos with a matching tag go to that
// color. Unlabeled production shots are SHARED across every color so each
// variant has a healthy gallery.
//
// Run after `npm run migrate` and once Phase 1 backend is deployed:
//   node scripts/populate-storage-sets.mjs

import { readFileSync, readdirSync, mkdirSync, rmSync, existsSync, statSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// --- Load DB connection from server/.env -----------------------------------
const envText = readFileSync(join(ROOT, "server", ".env"), "utf8");
const DATABASE_URL =
  envText.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? "";
if (!DATABASE_URL) throw new Error("DATABASE_URL not found in server/.env");
const PG_SSL = /^PG_SSL=true$/mi.test(envText);

const SRC = "C:/Users/Aykut/Desktop/zest foto";
const OUT_PRODUCTS = join(ROOT, "public", "products");
const MAX_DIM = 1200;
const QUALITY = 78;
const MAX_IMAGES_PER_COLOR = 10;

// --- Product matrix --------------------------------------------------------
const BONNY_COLORS = [
  { key: "bej", label: "Bej", hex: "#D6C7A7" },
  { key: "siyah", label: "Siyah", hex: "#1A1A1A" },
  { key: "kirmizi", label: "Kırmızı", hex: "#C04A3D" },
];
const LUXE_COLORS = [
  { key: "gold", label: "Gold", hex: "#C9A961" },
  { key: "gumus", label: "Gümüş", hex: "#B5B5B5" },
  { key: "roze", label: "Roze", hex: "#B97C7C" },
];
const KARE_COLORS = [{ key: "bej", label: "Bej", hex: "#D6C7A7" }];

const PRODUCTS = [
  {
    id: "c-bonny-3lu",
    folder: "M-ESK-0001",
    name: "Bonny Erzak Saklama Kabı 1,8 LT - 1 LT - 600 ML 3'lü Set",
    shortDescription:
      "1,8 LT, 1 LT ve 600 ML üç farklı hacimde vakumlu saklama kabı — tek sette.",
    description:
      "Bonny vakumlu saklama kabı setiyle mutfağınızı düzenleyin. Set 1,8 LT, 1 LT ve 600 ML olmak üzere üç farklı hacimde kaptan oluşur. Hava sızdırmaz tasarımıyla kuru gıdalarınızı uzun süre taze tutar; canlı renkleri tezgâhınıza karakter katar.",
    priceCents: 39999,
    volumeLabel: "1,8 LT + 1 LT + 600 ML",
    setSize: 3,
    initialStockPerColor: 20,
    colors: BONNY_COLORS,
    badges: { isNew: true, isFeatured: true },
  },
  {
    id: "c-bonny-6li",
    folder: "M-ESK-0002",
    name: "Bonny Erzak Saklama Kabı 2x1,8 LT + 2x1 LT + 2x600 ML 6'lı Set",
    shortDescription:
      "Her hacimden ikişer adet — kalabalık mutfaklar için pratik 6'lı set.",
    description:
      "İkişer adet 1,8 LT, 1 LT ve 600 ML kaplardan oluşan 6'lı Bonny set. Sebze, baharat, makarna, kahve ve çay gibi farklı erzaklar için yeterli boy çeşitliliği sunar. Vakumlu kapakları sayesinde içerikler taze, tezgâh düzenli kalır.",
    priceCents: 79999,
    volumeLabel: "2x1,8 LT + 2x1 LT + 2x600 ML",
    setSize: 6,
    initialStockPerColor: 20,
    colors: BONNY_COLORS,
    badges: { isNew: true, isBestSeller: true },
  },
  {
    id: "c-bonny-12li",
    folder: "M-ESK-0003",
    name: "Bonny Erzak Saklama Kabı 4x1,8 LT + 4x1 LT + 4x600 ML 12'li Set",
    shortDescription: "Her hacimden dörder adet — tüm mutfağı tek sette düzenleyin.",
    description:
      "Dörder adet 1,8 LT, 1 LT ve 600 ML — toplam 12 parçadan oluşan en geniş Bonny set. Erzak dolabınızdaki tüm pirinçlerden bakliyatlara, kuruyemişlerden çaylara her şeye yer var. Bütünleşik tasarımı sayesinde göz alıcı, hava sızdırmaz yapısıyla uzun ömürlü saklama imkânı.",
    priceCents: 159999,
    volumeLabel: "4x1,8 LT + 4x1 LT + 4x600 ML",
    setSize: 12,
    initialStockPerColor: 20,
    colors: BONNY_COLORS,
    badges: { isNew: true, isFeatured: true },
  },
  {
    id: "c-cam-saklama-3lu",
    folder: "M-ESK-1001 (cam)",
    name: "Cam Saklama Kabı Seti 3'lü",
    shortDescription:
      "Cam gövdeli vakumlu saklama kabı seti — şık ve dayanıklı.",
    description:
      "Cam gövdesi sayesinde içeriği bir bakışta görebileceğiniz vakumlu saklama seti. Hava sızdırmaz kapağıyla erzaklarınızı taze tutar; üç farklı hacimde kapla mutfak dolabınızı düzene sokar.",
    priceCents: 0, // admin will set
    volumeLabel: null,
    setSize: 3,
    initialStockPerColor: 20,
    colors: KARE_COLORS,
    badges: { isNew: true },
  },
  {
    id: "c-luxe-premium",
    folder: "M-ESK-1101 (metalik)",
    name: "Luxe Premium Vakumlu Kavanoz",
    shortDescription:
      "Premium metalik bitişli vakumlu kavanoz — Gold, Gümüş ve Roze seçenekleriyle.",
    description:
      "Şık metalik kapağı ve cam görünümlü gövdesiyle dekoratif bir saklama çözümü. Gold, Gümüş ve Roze finiş seçenekleri sayesinde mutfağınızın atmosferine eşlik eder.",
    priceCents: 0,
    volumeLabel: null,
    setSize: null,
    initialStockPerColor: 20,
    colors: LUXE_COLORS,
    badges: { isNew: true, isFeatured: true },
  },
  {
    id: "c-woody-3lu",
    folder: "M-ESK-1211 (ahşap)",
    name: "Woody Ahşap Kapaklı Kavanoz Seti 3'lü",
    shortDescription:
      "Doğal ahşap kapaklı, cam gövdeli vakumlu kavanoz seti — sıcak bir mutfak dokunuşu.",
    description:
      "Doğal ahşap kapağı ve cam gövdesiyle modern mutfaklara nostaljik bir hava katan Woody serisi. Hava sızdırmaz kapağı tazeliği korurken, ahşap dokusu tezgâhınıza karakter katar.",
    priceCents: 0,
    volumeLabel: null,
    setSize: 3,
    initialStockPerColor: 20,
    colors: [{ key: "ahsap", label: "Doğal Ahşap", hex: "#A67B5B" }],
    badges: { isNew: true, isFeatured: true },
  },
];

// IDs of the 12 old products being replaced (skl-m5/6/7/8 stay live).
const RETIRED_IDS = [
  "skl-esk0001",
  "skl-esk0002",
  "skl-esk0003",
  "skl-esk0101",
  "skl-esk0102",
  "skl-esk0103",
  "skl-esk0211",
  "skl-esk0212",
  "skl-esk0213",
  "skl-esk1001",
  "skl-esk1101",
  "skl-esk1211",
];

// --- Photo selection -------------------------------------------------------
const RASTER_EXTS = [".jpg", ".jpeg", ".png"];

const lcAscii = (s) =>
  s
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");

/** Map color key → search aliases that may appear in filenames. */
const colorAliases = (key) => {
  if (key === "kirmizi") return ["kirmizi", "krmz", "kırmızı"];
  if (key === "gumus") return ["gumus", "gümüş"];
  return [key];
};

const isImage = (f) => RASTER_EXTS.includes(extname(f).toLowerCase());

const listFolder = (folderName) => {
  const dir = join(SRC, folderName);
  if (!existsSync(dir)) {
    console.warn(`  ! missing source folder: ${dir}`);
    return [];
  }
  return readdirSync(dir)
    .filter((f) => isImage(f))
    .map((f) => join(dir, f));
};

/**
 * Pick a gallery for one variant. Strategy:
 *  - All files in the folder are split into "color-tagged" (filename mentions
 *    a color keyword for any of THIS product's colors) and "untagged".
 *  - The variant gets every file tagged with its own color, plus a share of
 *    the untagged production shots (used across all colors so every variant
 *    has at least 3-4 images).
 *  - Capped at MAX_IMAGES_PER_COLOR.
 */
function pickGalleries(files, colors) {
  const tagged = new Map(colors.map((c) => [c.key, []]));
  const untagged = [];
  for (const f of files) {
    const lc = lcAscii(basename(f));
    let assigned = false;
    for (const c of colors) {
      if (colorAliases(c.key).some((a) => lc.includes(a))) {
        tagged.get(c.key).push(f);
        assigned = true;
        break;
      }
    }
    if (!assigned) untagged.push(f);
  }
  const result = new Map();
  // Sort untagged for stable selection (skip noisy "calisma"/copy files later).
  untagged.sort();
  // Reserve all untagged shots across colors — same gallery, different cover.
  for (const c of colors) {
    const own = tagged.get(c.key).slice(0, MAX_IMAGES_PER_COLOR);
    const share = untagged.slice(0, MAX_IMAGES_PER_COLOR - own.length);
    result.set(c.key, [...own, ...share]);
  }
  return result;
}

// --- Image writing ---------------------------------------------------------
async function writeImage(src, outPath) {
  const ext = extname(src).toLowerCase();
  const opts = { limitInputPixels: 5_000_000_000, sequentialRead: true, failOn: "none" };
  await sharp(src, opts)
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
    .toFile(outPath);
}

async function processProduct(p) {
  console.log(`▸ ${p.id} (${p.folder})`);
  const sources = listFolder(p.folder);
  console.log(`  source files: ${sources.length}`);

  const variantImageUrls = new Map(); // colorKey → web paths

  if (p.colors) {
    const galleries = pickGalleries(sources, p.colors);
    for (const color of p.colors) {
      const dest = join(OUT_PRODUCTS, p.id, color.key);
      if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
      mkdirSync(dest, { recursive: true });
      const files = galleries.get(color.key);
      const webPaths = [];
      let n = 0;
      for (const src of files) {
        const out = join(dest, `${n}.jpg`);
        try {
          await writeImage(src, out);
          webPaths.push(`/products/${p.id}/${color.key}/${n}.jpg`);
          n++;
        } catch (err) {
          console.warn(`    ! ${basename(src)}: ${err.message}`);
        }
      }
      console.log(`    ${color.label.padEnd(10)} → ${webPaths.length} images`);
      variantImageUrls.set(color.key, webPaths);
    }
  } else {
    // No variants — write directly to public/products/<id>/N.jpg
    const dest = join(OUT_PRODUCTS, p.id);
    if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
    mkdirSync(dest, { recursive: true });
    const picks = sources.slice(0, MAX_IMAGES_PER_COLOR);
    const webPaths = [];
    let n = 0;
    for (const src of picks) {
      const out = join(dest, `${n}.jpg`);
      try {
        await writeImage(src, out);
        webPaths.push(`/products/${p.id}/${n}.jpg`);
        n++;
      } catch (err) {
        console.warn(`    ! ${basename(src)}: ${err.message}`);
      }
    }
    console.log(`    (no variants) → ${webPaths.length} images`);
    variantImageUrls.set("_no_variants_", webPaths);
  }
  return variantImageUrls;
}

// --- DB layer --------------------------------------------------------------
const { Pool } = pg;
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: PG_SSL ? { rejectUnauthorized: false } : false,
});

async function upsertProduct(p, variantImageUrls) {
  // Cover image: first variant's first image, else first plain image.
  const firstVariant = p.colors?.[0];
  const cover =
    (firstVariant && variantImageUrls.get(firstVariant.key)?.[0]) ||
    variantImageUrls.get("_no_variants_")?.[0] ||
    null;
  const imageUrls = cover ? [cover] : [];

  await pool.query(
    `INSERT INTO custom_products
       (id, name, category_slug, price_cents, short_description, description,
        image_urls, badges, is_active, volume_label, set_size)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9, $10)
     ON CONFLICT (id) DO UPDATE
       SET name = EXCLUDED.name,
           category_slug = EXCLUDED.category_slug,
           price_cents = CASE
             WHEN custom_products.price_cents = 0 THEN EXCLUDED.price_cents
             ELSE custom_products.price_cents  -- preserve admin-edited price
           END,
           short_description = EXCLUDED.short_description,
           description = EXCLUDED.description,
           image_urls = EXCLUDED.image_urls,
           badges = EXCLUDED.badges,
           is_active = TRUE,
           volume_label = EXCLUDED.volume_label,
           set_size = EXCLUDED.set_size`,
    [
      p.id,
      p.name,
      "saklama-kaplari",
      p.priceCents,
      p.shortDescription,
      p.description,
      imageUrls,
      JSON.stringify(p.badges ?? {}),
      p.volumeLabel,
      p.setSize,
    ],
  );

  // Variant rows: wipe + reinsert (admin can fine-tune stock + uploads later).
  await pool.query(`DELETE FROM product_variants WHERE product_id = $1`, [p.id]);
  if (p.colors) {
    let pos = 0;
    for (const color of p.colors) {
      const imgs = variantImageUrls.get(color.key) ?? [];
      await pool.query(
        `INSERT INTO product_variants
           (product_id, color_key, color_label, color_hex, stock, image_urls, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [p.id, color.key, color.label, color.hex, p.initialStockPerColor, imgs, pos++],
      );
    }
  }
}

async function retireOldProducts() {
  for (const id of RETIRED_IDS) {
    await pool.query(
      `INSERT INTO product_overrides (product_id, is_active) VALUES ($1, FALSE)
         ON CONFLICT (product_id) DO UPDATE SET is_active = FALSE`,
      [id],
    );
  }
  console.log(`▸ retired ${RETIRED_IDS.length} old skl-esk* built-ins`);
}

// --- Main ------------------------------------------------------------------
(async () => {
  if (!existsSync(SRC)) {
    console.error(`Source folder not found: ${SRC}`);
    process.exit(1);
  }
  for (const p of PRODUCTS) {
    const galleries = await processProduct(p);
    await upsertProduct(p, galleries);
  }
  await retireOldProducts();
  await pool.end();
  console.log("\n✓ Done. New products live; old built-ins retired.");
  console.log("  Don't forget to adjust prices in /admin/products for the products marked priceCents:0.");
  process.exit(0);
})().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
