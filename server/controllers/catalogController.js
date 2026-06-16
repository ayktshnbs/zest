// Public, read-only catalog endpoints (no auth, no CSRF).

import { asyncHandler } from "../utils/asyncHandler.js";
import * as InventoryModel from "../models/InventoryModel.js";
import * as ProductOverrideModel from "../models/ProductOverrideModel.js";

/**
 * Live, admin-managed catalog data the storefront overlays onto its static
 * products: stock levels + name/price overrides.
 *   { stock: { id: n }, overrides: { id: { name, priceCents } } }
 */
export const getStock = asyncHandler(async (_req, res) => {
  const [stock, overrides] = await Promise.all([
    InventoryModel.stockMap(),
    ProductOverrideModel.getMap(),
  ]);
  res.set("Cache-Control", "public, max-age=30");
  res.json({ stock, overrides });
});
