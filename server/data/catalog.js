// Server-authoritative product catalog + pricing policy.
//
// catalog.json is GENERATED from the storefront catalog (lib/products.ts) by
// scripts/build-server-catalog.mjs — never hand-edit it, and re-run the
// generator when products change. Orders are priced ONLY from this data so a
// client can never dictate what it pays (see orderController.createOrder).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(readFileSync(join(here, "catalog.json"), "utf8"));

export const CURRENCY = "TRY";

/** Authoritative product `{ name, priceCents }`, or null if the id is unknown. */
export const getCatalogProduct = (productId) => catalog[productId] ?? null;

// Shipping policy — mirrors the storefront (lib/utils.ts): free over ₺750,
// otherwise a flat ₺49.90 standard rate. Amounts are integer kuruş.
export const FREE_SHIPPING_THRESHOLD_CENTS = 75_000;
export const STANDARD_SHIPPING_CENTS = 4_990;

export const computeShippingCents = (subtotalCents) =>
  subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : STANDARD_SHIPPING_CENTS;
