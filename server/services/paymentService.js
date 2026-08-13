// PayTR iFrame API integration.
//
// PayTR follows the "request an iframe token, show the hosted payment page,
// listen for server-to-server callbacks" pattern. Credentials live in env
// and are NEVER exposed to the frontend.
//
// Endpoints used here:
//   POST https://www.paytr.com/odeme/api/get-token
//
// Callback verification: HMAC-SHA256 of (merchant_oid + merchant_salt +
// status + total_amount) keyed by merchant_key, base64-encoded.

import crypto from "node:crypto";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/errors.js";

const PAYTR_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";

/**
 * Build the user_basket parameter PayTR expects.
 * Each item is [name, unitPriceTL, quantity]. The result is
 * JSON-encoded then base64-encoded.
 */
const encodeBasket = (items) => {
  const basket = items.map((item) => [
    // PayTR doesn't like very long names — trim to 100 chars.
    String(item.name ?? "Ürün").slice(0, 100),
    // Unit price as a TL string with 2 decimals (NOT kuruş).
    (Number(item.unitPriceCents) / 100).toFixed(2),
    Number(item.quantity),
  ]);
  return Buffer.from(JSON.stringify(basket)).toString("base64");
};

/**
 * Request a PayTR iframe token for an order. The token is shown inside
 * an <iframe src="https://www.paytr.com/odeme/guvenli/{TOKEN}"> on the
 * frontend — we never touch card data.
 *
 * @param {{ order, user, userIp }} params
 * @returns {{ token: string }} The iframe token.
 */
export const createPaytrToken = async ({ order, user, userIp }) => {
  const merchantId = config.paytr.merchantId;
  const merchantKey = config.paytr.merchantKey;
  const merchantSalt = config.paytr.merchantSalt;

  // merchant_oid must be unique per payment attempt. Use order id directly —
  // the webhook_events idempotency layer handles duplicates.
  const merchantOid = `PAYTR-${order.id}`;
  const email = user.email;
  const paymentAmount = String(Number(order.total_cents ?? order.totalCents));
  const userBasket = encodeBasket(order.items ?? []);
  const noInstallment = "1"; // tek çekim
  const maxInstallment = "0";
  const currency = "TL";
  const testMode = config.paytr.testMode;

  // Build the hash string per PayTR docs:
  // merchant_id + user_ip + merchant_oid + email + payment_amount +
  // user_basket + no_installment + max_installment + currency + test_mode
  const hashStr =
    merchantId +
    userIp +
    merchantOid +
    email +
    paymentAmount +
    userBasket +
    noInstallment +
    maxInstallment +
    currency +
    testMode;

  // HMAC-SHA256 keyed by merchant_key, hashing (hashStr + merchant_salt)
  const paytrToken = crypto
    .createHmac("sha256", merchantKey)
    .update(hashStr + merchantSalt)
    .digest("base64");

  // Resolve user details from the order's shipping address snapshot.
  const shippingAddr = order.shipping_address ?? order.shippingAddress ?? {};
  const userName =
    shippingAddr.fullName || user.name || user.email.split("@")[0];
  const userAddress =
    shippingAddr.line1 ||
    [shippingAddr.city, shippingAddr.state].filter(Boolean).join(", ") ||
    "Türkiye";
  const userPhone = shippingAddr.phone || "05000000000";

  const params = new URLSearchParams({
    merchant_id: merchantId,
    user_ip: userIp,
    merchant_oid: merchantOid,
    email,
    payment_amount: paymentAmount,
    paytr_token: paytrToken,
    user_basket: userBasket,
    debug_on: config.paytr.testMode === "1" ? "1" : "0",
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: userName,
    user_address: userAddress,
    user_phone: userPhone,
    merchant_ok_url: config.paytr.successUrl,
    merchant_fail_url: config.paytr.failUrl,
    timeout_limit: "30",
    currency,
    test_mode: testMode,
    lang: "tr",
  });

  const res = await fetch(PAYTR_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    logger.error(
      { status: res.status, body: errText },
      "PayTR token request HTTP error",
    );
    throw new AppError(
      "Could not create payment session",
      502,
      "payment_provider_error",
    );
  }

  const data = await res.json();

  if (data.status !== "success" || !data.token) {
    // Do NOT log the full request body (it contains merchant_key hash).
    logger.error(
      { paytrStatus: data.status, reason: data.reason },
      "PayTR token creation failed",
    );
    throw new AppError(
      "Could not create payment session",
      502,
      "payment_provider_error",
    );
  }

  return { token: data.token, merchantOid };
};

/**
 * Verify the hash PayTR sends with each callback POST.
 *
 * hash_str = merchant_oid + merchant_salt + status + total_amount
 * expected = Base64( HMAC-SHA256( hash_str, merchant_key ) )
 *
 * Returns true only when the computed hash matches.
 */
export const verifyPaytrHash = ({
  merchantOid,
  status,
  totalAmount,
  hash,
}) => {
  if (!merchantOid || !status || totalAmount == null || !hash) return false;

  const merchantKey = config.paytr.merchantKey;
  const merchantSalt = config.paytr.merchantSalt;

  const hashStr =
    String(merchantOid) +
    merchantSalt +
    String(status) +
    String(totalAmount);

  const expected = crypto
    .createHmac("sha256", merchantKey)
    .update(hashStr)
    .digest("base64");

  // Constant-time comparison to avoid timing attacks.
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(String(hash)),
    );
  } catch {
    // Buffers of different length → not equal.
    return false;
  }
};
