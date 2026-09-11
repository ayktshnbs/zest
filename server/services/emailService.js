// Email delivery via Resend (resend.com).
//
// Each helper returns the Resend response. Errors are surfaced — but callers
// should catch them carefully: a failed password-reset email must NOT leak
// "user exists" through a 500 to the client.

import { Resend } from "resend";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

const resend = new Resend(config.resend.apiKey);

// `replyTo` defaults to the configured support address; the contact form
// overrides it with the visitor's own address.
const sendEmail = async ({ to, subject, html, text, replyTo }) => {
  try {
    const result = await resend.emails.send({
      from: config.resend.from,
      to,
      subject,
      html,
      text,
      replyTo: replyTo ?? config.resend.replyTo,
    });
    if (result.error) {
      logger.error({ err: result.error, to, subject }, "Resend returned error");
      throw new Error(result.error.message || "Resend send failed");
    }
    return result.data;
  } catch (err) {
    logger.error({ err, to, subject }, "Email send failed");
    throw err;
  }
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const subject = "Zest Home · Şifrenizi sıfırlayın";
  const text = `Merhaba ${name},

Şifre sıfırlama talebinde bulundunuz. Aşağıdaki bağlantı 1 saat geçerlidir:

${resetUrl}

Bu işlemi siz başlatmadıysanız bu e-postayı yok sayabilirsiniz.

— Zest Home
`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#111">
      <p style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#888;margin:0 0 24px">Zest Home</p>
      <h1 style="font-size:22px;margin:0 0 16px">Şifrenizi sıfırlayın</h1>
      <p>Merhaba ${escapeHtml(name)},</p>
      <p>Şifre sıfırlama talebinde bulundunuz. Aşağıdaki bağlantı <strong>1 saat</strong> geçerlidir:</p>
      <p style="margin:24px 0">
        <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;font-size:13px;letter-spacing:.2em;text-transform:uppercase">Şifreyi Sıfırla</a>
      </p>
      <p style="font-size:13px;color:#666">Bağlantı çalışmıyorsa şu URL'yi tarayıcınıza yapıştırın:<br>
        <span style="word-break:break-all">${resetUrl}</span>
      </p>
      <p style="font-size:13px;color:#666">Bu işlemi siz başlatmadıysanız bu e-postayı yok sayabilirsiniz.</p>
      <p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#aaa;margin-top:32px">— Zest Home</p>
    </div>
  `;
  return sendEmail({ to, subject, html, text });
};

export const sendWelcomeEmail = async ({ to, name, loginUrl }) => {
  const subject = "Zest Home'e hoş geldiniz";
  const text = `Hoş geldiniz ${name}!

Hesabınız oluşturuldu. Buradan giriş yapabilirsiniz: ${loginUrl}

— Zest Home
`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#111">
      <p style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#888;margin:0 0 24px">Zest Home</p>
      <h1 style="font-size:22px;margin:0 0 16px">Hoş geldiniz, ${escapeHtml(name)}</h1>
      <p>Hesabınız oluşturuldu. Mutfak için daha iyisini keşfetmeye hazırsınız.</p>
      <p style="margin:24px 0">
        <a href="${loginUrl}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;font-size:13px;letter-spacing:.2em;text-transform:uppercase">Giriş Yap</a>
      </p>
      <p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#aaa;margin-top:32px">— Zest Home</p>
    </div>
  `;
  return sendEmail({ to, subject, html, text });
};

export const sendVerificationEmail = async ({ to, name, verifyUrl }) => {
  const subject = "Zest Home · E-posta adresinizi doğrulayın";
  const text = `Merhaba ${name},

Hesabınızı etkinleştirmek için e-posta adresinizi doğrulayın. Aşağıdaki bağlantı 24 saat geçerlidir:

${verifyUrl}

Bu hesabı siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.

— Zest Home
`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#111">
      <p style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#888;margin:0 0 24px">Zest Home</p>
      <h1 style="font-size:22px;margin:0 0 16px">E-posta adresinizi doğrulayın</h1>
      <p>Merhaba ${escapeHtml(name)},</p>
      <p>Hesabınızı etkinleştirmek için e-posta adresinizi doğrulayın. Aşağıdaki bağlantı <strong>24 saat</strong> geçerlidir:</p>
      <p style="margin:24px 0">
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;font-size:13px;letter-spacing:.2em;text-transform:uppercase">E-postayı Doğrula</a>
      </p>
      <p style="font-size:13px;color:#666">Bağlantı çalışmıyorsa şu URL'yi tarayıcınıza yapıştırın:<br>
        <span style="word-break:break-all">${verifyUrl}</span>
      </p>
      <p style="font-size:13px;color:#666">Bu hesabı siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.</p>
      <p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#aaa;margin-top:32px">— Zest Home</p>
    </div>
  `;
  return sendEmail({ to, subject, html, text });
};

// Contact form → forwards what a visitor wrote on /contact to the support
// inbox. The visitor's email goes in the `replyTo` so hitting Reply in the
// inbox replies directly to them.
export const sendContactEmail = async ({ name, email, subject, message }) => {
  const inbox = config.contact?.inbox || "info@zest-home.net";
  const fullSubject = `Zest Home · İletişim · ${subject || "Yeni mesaj"}`;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject || "—");
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const text = `Yeni iletişim formu mesajı

Ad: ${name}
E-posta: ${email}
Konu: ${subject || "—"}

${message}
`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#111">
      <p style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#888;margin:0 0 16px">Zest Home · İletişim Formu</p>
      <h1 style="font-size:22px;margin:0 0 20px">${safeSubject}</h1>
      <table style="font-size:14px;border-collapse:collapse;width:100%;margin:0 0 24px">
        <tr><td style="padding:6px 12px 6px 0;color:#666;width:120px">Ad</td><td>${safeName}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#666">E-posta</td><td><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
      </table>
      <div style="border-top:1px solid #eee;padding-top:20px;font-size:15px;line-height:1.6">${safeMessage}</div>
    </div>
  `;
  // Route through sendEmail (rather than calling resend directly) so a
  // provider-level failure is actually DETECTED. Resend resolves with
  // { data, error } instead of throwing, so the old direct call reported
  // success to the visitor even when the message was never delivered.
  // The visitor's address becomes replyTo so support can just hit Reply.
  return sendEmail({
    to: inbox,
    replyTo: email,
    // Strip CR/LF so a crafted subject can't inject extra header lines.
    subject: fullSubject.replace(/[\r\n]+/g, " "),
    html,
    text,
  });
};

// ── Order emails ──────────────────────────────────────────────────────
// Sent by services/orderNotificationService.js once a PayTR callback has
// COMMITTED an order as paid. Both take the admin-shaped order row from
// OrderModel.findByIdAdmin (order columns + user_email / user_name), so the
// caller does a single query and the templates stay free of DB access.

const formatTl = (cents) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(Number(cents) / 100);

// shipping_address is the JSONB snapshot validated by addressSchema
// (utils/validation.js): fullName, line1, line2?, city, state?, postalCode,
// country, phone?.
const formatAddress = (a) => {
  if (!a) return [];
  return [
    a.fullName,
    a.line1,
    a.line2,
    [a.postalCode, a.city, a.state].filter(Boolean).join(" "),
    a.country,
    a.phone ? `Tel: ${a.phone}` : null,
  ].filter((line) => line && String(line).trim());
};

// Line items, totals and the shipping address, as matching HTML + plain text.
// items is the JSONB snapshot written at checkout: {name, quantity, unitPriceCents}.
export const renderOrderSummary = (order) => {
  const items = Array.isArray(order.items) ? order.items : [];
  const address = formatAddress(order.shipping_address);
  const shippingCents = Number(order.shipping_cents) || 0;
  const shippingLabel = shippingCents === 0 ? "Ücretsiz" : formatTl(shippingCents);

  const lines = items.map((it) => {
    const name = it.name ?? "Ürün";
    const qty = Number(it.quantity) || 0;
    const lineTotal = (Number(it.unitPriceCents) || 0) * qty;
    return { name, qty, lineTotal };
  });

  const rowsHtml = lines
    .map(
      (l) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${escapeHtml(l.name)}</td>
        <td style="padding:8px 8px;border-bottom:1px solid #eee;text-align:center;white-space:nowrap">${l.qty} ad.</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatTl(l.lineTotal)}</td>
      </tr>`,
    )
    .join("");

  const html = `
      <table style="font-size:14px;border-collapse:collapse;width:100%;margin:0 0 16px">
        ${rowsHtml}
      </table>
      <table style="font-size:14px;border-collapse:collapse;width:100%;margin:0 0 24px">
        <tr><td style="padding:4px 0;color:#666">Ara toplam</td><td style="padding:4px 0;text-align:right">${formatTl(order.subtotal_cents)}</td></tr>
        <tr><td style="padding:4px 0;color:#666">Kargo</td><td style="padding:4px 0;text-align:right">${shippingLabel}</td></tr>
        <tr><td style="padding:8px 0;font-weight:600;border-top:1px solid #111">Toplam</td><td style="padding:8px 0;text-align:right;font-weight:600;border-top:1px solid #111">${formatTl(order.total_cents)}</td></tr>
      </table>
      <p style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#888;margin:0 0 8px">Teslimat adresi</p>
      <p style="font-size:14px;line-height:1.6;margin:0 0 24px">${address.map(escapeHtml).join("<br>") || "—"}</p>`;

  const text = `${lines.map((l) => `  - ${l.name} × ${l.qty}  —  ${formatTl(l.lineTotal)}`).join("\n")}

Ara toplam: ${formatTl(order.subtotal_cents)}
Kargo:      ${shippingLabel}
Toplam:     ${formatTl(order.total_cents)}

Teslimat adresi:
${address.join("\n") || "—"}`;

  return { html, text };
};

const frontendBase = () => config.urls.frontend.replace(/\/$/, "");

/** Customer: "your payment was received, order is being prepared". */
export const sendOrderConfirmationEmail = async ({ to, name, order }) => {
  const orderNumber = order.order_number;
  const subject = `Zest Home · Siparişiniz alındı · ${orderNumber}`;
  const accountUrl = `${frontendBase()}/hesabim`;
  const summary = renderOrderSummary(order);
  const greeting = name ? `Merhaba ${name},` : "Merhaba,";

  const text = `${greeting}

Ödemeniz başarıyla alındı ve ${orderNumber} numaralı siparişiniz hazırlanmaya başlandı.

${summary.text}

Siparişinizi hesabınızdan takip edebilirsiniz: ${accountUrl}

— Zest Home
`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#111">
      <p style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#888;margin:0 0 24px">Zest Home</p>
      <h1 style="font-size:22px;margin:0 0 16px">Siparişiniz alındı</h1>
      <p>${escapeHtml(greeting)}</p>
      <p>Ödemeniz başarıyla alındı ve <strong>${escapeHtml(orderNumber)}</strong> numaralı siparişiniz hazırlanmaya başlandı.</p>
      ${summary.html}
      <p style="margin:24px 0">
        <a href="${accountUrl}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;font-size:13px;letter-spacing:.2em;text-transform:uppercase">Siparişimi Görüntüle</a>
      </p>
      <p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#aaa;margin-top:32px">— Zest Home</p>
    </div>
  `;
  return sendEmail({ to, subject, html, text });
};

/** Merchant: new paid order, with a link into the admin panel. */
export const sendNewOrderNotificationEmail = async ({
  to,
  order,
  customerName,
  customerEmail,
}) => {
  const orderNumber = order.order_number;
  const total = formatTl(order.total_cents);
  const subject = `Zest Home · Yeni sipariş · ${orderNumber} · ${total}`;
  const adminUrl = `${frontendBase()}/admin/orders/${order.id}`;
  const summary = renderOrderSummary(order);
  const phone = order.shipping_address?.phone;

  const text = `Yeni ödenmiş sipariş: ${orderNumber}

Müşteri: ${customerName || "—"}
E-posta: ${customerEmail || "—"}
Telefon: ${phone || "—"}

${summary.text}

Yönetim panelinde aç: ${adminUrl}
`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#111">
      <p style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#888;margin:0 0 16px">Zest Home · Yeni Sipariş</p>
      <h1 style="font-size:22px;margin:0 0 20px">${escapeHtml(orderNumber)} · ${total}</h1>
      <table style="font-size:14px;border-collapse:collapse;width:100%;margin:0 0 24px">
        <tr><td style="padding:6px 12px 6px 0;color:#666;width:120px">Müşteri</td><td>${escapeHtml(customerName || "—")}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#666">E-posta</td><td>${customerEmail ? `<a href="mailto:${escapeHtml(customerEmail)}">${escapeHtml(customerEmail)}</a>` : "—"}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#666">Telefon</td><td>${escapeHtml(phone || "—")}</td></tr>
      </table>
      ${summary.html}
      <p style="margin:24px 0">
        <a href="${adminUrl}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;font-size:13px;letter-spacing:.2em;text-transform:uppercase">Siparişi Yönet</a>
      </p>
    </div>
  `;
  return sendEmail({
    to,
    // Reply goes straight to the customer, like the contact form.
    replyTo: customerEmail || undefined,
    subject,
    html,
    text,
  });
};

// Minimal HTML escape for values interpolated into the email templates.
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
