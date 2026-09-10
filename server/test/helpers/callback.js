// Build and deliver a signed PayTR callback straight to the handler.
//
// The handler is invoked directly rather than through the Express app: the
// behaviour under test is the handler + the real SQL, and calling it directly
// avoids booting a server, binding a port and adding an HTTP client
// dependency. What this therefore does NOT cover is the Express wiring
// (urlencoded parsing, the CSRF exemption, route mounting) — those are
// asserted by app.js's mount order, not by these tests.

import "./env.js";

import crypto from "node:crypto";
import { paytrCallback } from "../../controllers/webhookController.js";
import { buildMerchantOid } from "../../services/paymentService.js";

export { buildMerchantOid };

/** The legacy per-order merchant_oid the old implementation produced. */
export const legacyMerchantOid = (orderId) => `PAYTR-${orderId}`;

/**
 * Reproduce PayTR's callback signature exactly as verifyPaytrHash checks it:
 *   base64( HMAC-SHA256( merchant_oid + merchant_salt + status + total_amount,
 *                        key = merchant_key ) )
 * Keys come from env.js, which is also what config.js loads.
 */
export const signCallback = ({ merchantOid, status, totalAmount }) =>
  crypto
    .createHmac("sha256", process.env.PAYTR_MERCHANT_KEY)
    .update(
      String(merchantOid) +
        process.env.PAYTR_MERCHANT_SALT +
        String(status) +
        String(totalAmount),
    )
    .digest("base64");

/** Minimal Express req/res doubles — enough for this handler. */
const makeReqRes = (body) => {
  const req = { body, ip: "127.0.0.1", headers: {}, log: { error() {} } };
  const res = {
    statusCode: null,
    contentType: null,
    body: null,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    type(t) {
      this.contentType = t;
      return this;
    },
    send(payload) {
      this.body = payload;
      this.headersSent = true;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.headersSent = true;
      return this;
    },
  };
  return { req, res };
};

/**
 * Deliver one callback. Returns { status, body }.
 *
 * `paytrCallback` is wrapped in asyncHandler, so a rejection is handed to
 * `next` rather than thrown — we surface it so a test can assert on it, but
 * note the handler is designed never to reach `next`: every failure path
 * responds 500 RETRY itself.
 */
export const deliverCallback = async ({
  merchantOid,
  status = "success",
  totalAmount,
  paymentType = "card",
  failedReasonCode = null,
  failedReasonMsg = null,
  currency = "TL",
  testMode = "1",
  hash, // override to forge an invalid signature
}) => {
  const body = {
    merchant_oid: merchantOid,
    status,
    total_amount: String(totalAmount),
    hash: hash ?? signCallback({ merchantOid, status, totalAmount }),
    payment_type: paymentType,
    failed_reason_code: failedReasonCode,
    failed_reason_msg: failedReasonMsg,
    currency,
    test_mode: testMode,
  };

  const { req, res } = makeReqRes(body);
  let nextErr = null;
  await paytrCallback(req, res, (err) => {
    nextErr = err;
  });

  return { status: res.statusCode, body: res.body, nextErr };
};
