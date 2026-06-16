// Public, read-only catalog endpoints (no auth, no CSRF).

import { asyncHandler } from "../utils/asyncHandler.js";
import * as InventoryModel from "../models/InventoryModel.js";
import * as ProductOverrideModel from "../models/ProductOverrideModel.js";
import * as CategoryModel from "../models/CategoryModel.js";
import * as CustomProductModel from "../models/CustomProductModel.js";

/**
 * Live admin-managed data the storefront overlays onto its static catalog:
 *   - stock         : live stock per product id
 *   - overrides     : admin name/price edits per built-in product id
 *   - categories    : extra categories created from /admin/categories
 *   - customProducts: brand-new admin-added products (active only)
 */
export const getStock = asyncHandler(async (_req, res) => {
  const [stock, overrides, categoryRows, productRows] = await Promise.all([
    InventoryModel.stockMap(),
    ProductOverrideModel.getMap(),
    CategoryModel.listAll(),
    CustomProductModel.listAll({ activeOnly: true }),
  ]);
  res.set("Cache-Control", "public, max-age=30");
  res.json({
    stock,
    overrides,
    categories: categoryRows.map(CategoryModel.toPublic),
    customProducts: productRows.map(CustomProductModel.toPublic),
  });
});
