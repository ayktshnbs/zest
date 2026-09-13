// Saved address CRUD ("Adreslerim"). Every handler derives the owner from
// req.user.id (set by requireAuth from the verified session) — a userId is
// never read from the request body or params, so a client cannot act on
// another user's addresses no matter what it sends.

import { asyncHandler } from "../utils/asyncHandler.js";
import * as AddressModel from "../models/AddressModel.js";
import { NotFoundError } from "../utils/errors.js";
import { audit } from "../middleware/audit.js";

export const list = asyncHandler(async (req, res) => {
  const rows = await AddressModel.listForUser(req.user.id);
  res.json({ addresses: rows.map(AddressModel.toPublic) });
});

export const create = asyncHandler(async (req, res) => {
  const row = await AddressModel.create(req.user.id, req.validated.body);
  await audit(req, "address.created", { addressId: row.id });
  res.status(201).json({ address: AddressModel.toPublic(row) });
});

export const update = asyncHandler(async (req, res) => {
  const row = await AddressModel.updateForUser(
    req.params.id,
    req.user.id,
    req.validated.body,
  );
  // Same response whether the id doesn't exist or belongs to someone else —
  // never confirm another user's address id is real.
  if (!row) throw new NotFoundError("Address not found");
  await audit(req, "address.updated", { addressId: row.id });
  res.json({ address: AddressModel.toPublic(row) });
});

export const remove = asyncHandler(async (req, res) => {
  const ok = await AddressModel.removeForUser(req.params.id, req.user.id);
  if (!ok) throw new NotFoundError("Address not found");
  await audit(req, "address.deleted", { addressId: req.params.id });
  res.json({ ok: true });
});

export const setDefault = asyncHandler(async (req, res) => {
  const row = await AddressModel.updateForUser(req.params.id, req.user.id, {
    isDefault: true,
  });
  if (!row) throw new NotFoundError("Address not found");
  await audit(req, "address.set_default", { addressId: row.id });
  res.json({ address: AddressModel.toPublic(row) });
});
