// Generates server/data/catalog.json — the AUTHORITATIVE price list the backend
// uses to price orders. The storefront catalog (lib/products.ts) is the single
// source of truth; re-run this whenever product ids/prices change:
//
//   node scripts/build-server-catalog.mjs   (or: npm run build:catalog)
//
// Prices in lib/products.ts are whole TRY; the backend works in integer kuruş
// (cents), so priceCents = price * 100.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "lib", "products.ts");
const OUT_DIR = join(root, "server", "data");
const OUT = join(OUT_DIR, "catalog.json");

const source = readFileSync(SRC, "utf8");

// Each product seed declares, in order: id → name → … → price. Non-greedy
// spans keep every match inside a single seed object. `\n\s+price:` matches
// only the real price line — never `originalPrice:` (different, capitalised
// token) and never a discounted display value.
const seedRe = /id:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?\n\s+price:\s*(\d+)\s*,/g;

const catalog = {};
let count = 0;
for (const [, id, name, price] of source.matchAll(seedRe)) {
  catalog[id] = { name, priceCents: Number(price) * 100 };
  count += 1;
}

if (count === 0) {
  console.error("No products parsed from lib/products.ts — aborting (regex drift?).");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(catalog, null, 2) + "\n");
console.log(`Wrote ${count} products to server/data/catalog.json`);
