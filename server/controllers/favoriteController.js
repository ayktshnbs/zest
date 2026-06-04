// Favorites controller.
//
// All endpoints require auth. Anonymous users keep their list locally on
// the client; merging on login is what POST /merge handles.

import { asyncHandler } from "../utils/asyncHandler.js";
import * as FavoriteModel from "../models/FavoriteModel.js";

export const list = asyncHandler(async (req, res) => {
  const rows = await FavoriteModel.listForUser(req.user.id);
  res.json({
    productIds: rows.map((r) => r.product_id),
  });
});

export const add = asyncHandler(async (req, res) => {
  const { productId } = req.validated.body;
  await FavoriteModel.add(req.user.id, productId);
  res.status(201).json({ ok: true });
});

export const remove = asyncHandler(async (req, res) => {
  const { productId } = req.validated.params;
  await FavoriteModel.remove(req.user.id, productId);
  res.json({ ok: true });
});

export const merge = asyncHandler(async (req, res) => {
  const { productIds } = req.validated.body;
  await FavoriteModel.addMany(req.user.id, productIds);
  const rows = await FavoriteModel.listForUser(req.user.id);
  res.json({ productIds: rows.map((r) => r.product_id) });
});
