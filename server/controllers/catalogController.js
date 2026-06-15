// Public, read-only catalog endpoints (no auth, no CSRF).

import { asyncHandler } from "../utils/asyncHandler.js";
import * as InventoryModel from "../models/InventoryModel.js";

/** Live stock as { productId: stock } so the storefront can reflect real levels. */
export const getStock = asyncHandler(async (_req, res) => {
  const stock = await InventoryModel.stockMap();
  res.set("Cache-Control", "public, max-age=30");
  res.json({ stock });
});
