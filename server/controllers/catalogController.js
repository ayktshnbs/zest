// Public, read-only catalog endpoints (no auth, no CSRF).

import { asyncHandler } from "../utils/asyncHandler.js";
import * as InventoryModel from "../models/InventoryModel.js";
import * as ProductOverrideModel from "../models/ProductOverrideModel.js";
import * as CategoryModel from "../models/CategoryModel.js";
import * as CustomProductModel from "../models/CustomProductModel.js";
import * as ProductVariantModel from "../models/ProductVariantModel.js";

/**
 * Live admin-managed data the storefront overlays onto its static catalog:
 *   - stock         : live stock per built-in product id (single-stock items)
 *   - overrides     : admin name/price/desc edits + isActive per built-in id
 *   - retiredIds    : built-in ids the storefront should hide entirely
 *   - categories    : extra categories created from /admin/categories
 *   - customProducts: admin-added products (active only). When a product has
 *                     variants, customer must pick a color; per-variant stock
 *                     and per-variant image gallery live on `variants`.
 *   - variants      : { customProductId: [{colorKey, colorLabel, colorHex,
 *                     stock, imageUrls, position}, ...] }
 */
export const getStock = asyncHandler(async (_req, res) => {
  const [stock, overridesRaw, categoryRows, productRows, variantRows] =
    await Promise.all([
      InventoryModel.stockMap(),
      ProductOverrideModel.getMap(),
      CategoryModel.listAll(),
      CustomProductModel.listAll({ activeOnly: true }),
      ProductVariantModel.listAll(),
    ]);

  // Strip the internal isActive flag from the override map (it's surfaced via
  // retiredIds instead, so clients don't have to filter).
  const overrides = {};
  const retiredIds = [];
  for (const [productId, ovr] of Object.entries(overridesRaw)) {
    if (ovr.isActive === false) retiredIds.push(productId);
    overrides[productId] = {
      name: ovr.name,
      priceCents: ovr.priceCents,
      shortDescription: ovr.shortDescription,
      description: ovr.description,
      imageUrls: ovr.imageUrls ?? null,
      volumeLabel: ovr.volumeLabel ?? null,
      setSize: ovr.setSize ?? null,
      badges: ovr.badges ?? null,
    };
  }

  // Group variants by their parent product id.
  const variantsByProduct = {};
  for (const v of variantRows) {
    const pub = ProductVariantModel.toPublic(v);
    (variantsByProduct[pub.productId] ??= []).push(pub);
  }

  res.set("Cache-Control", "public, max-age=30");
  res.json({
    stock,
    overrides,
    retiredIds,
    categories: categoryRows.map(CategoryModel.toPublic),
    customProducts: productRows.map(CustomProductModel.toPublic),
    variants: variantsByProduct,
  });
});
