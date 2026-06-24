// Public contact form. Forwards what a visitor wrote on /contact to the
// support inbox (info@zest-home.net by default; override via CONTACT_INBOX).

import { asyncHandler } from "../utils/asyncHandler.js";
import { sendContactEmail } from "../services/emailService.js";
import { logger } from "../utils/logger.js";

export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.validated.body;
  try {
    await sendContactEmail({ name, email, subject, message });
  } catch (err) {
    // Don't surface the upstream error verbatim — the visitor doesn't need
    // to see Resend internals. Logger captures detail for ops.
    logger.error({ err }, "Contact form send failed");
    return res.status(502).json({
      error: { code: "email_failed", message: "Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin." },
    });
  }
  res.status(202).json({ ok: true });
});
