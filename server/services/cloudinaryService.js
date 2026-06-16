// Cloudinary signed direct uploads.
//
// The browser uploads images straight to Cloudinary, bypassing our API. We just
// hand out a signed payload (timestamp + folder + signature) that authorizes a
// single upload — the API secret never leaves the server. The frontend then
// POSTs the file + signed params to https://api.cloudinary.com/v1_1/{cloud}/image/upload
// and gets back a permanent CDN URL we store on the product.

import crypto from "node:crypto";
import { config } from "../config.js";

/** Generate a signed upload payload for a single browser upload. */
export const sign = ({ folder }) => {
  if (!config.cloudinary.enabled) {
    const err = new Error("Image upload is not configured");
    err.status = 503;
    err.code = "upload_unavailable";
    throw err;
  }
  const timestamp = Math.floor(Date.now() / 1000);
  // Cloudinary signs the sorted key=value list (excluding api_key, file, signature)
  // joined by '&', concatenated with the secret, SHA1 hex.
  const params = { folder, timestamp };
  const toSign =
    Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&") + config.cloudinary.apiSecret;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  return {
    cloudName: config.cloudinary.cloudName,
    apiKey: config.cloudinary.apiKey,
    timestamp,
    folder,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`,
  };
};
