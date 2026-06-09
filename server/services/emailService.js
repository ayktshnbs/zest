// Email delivery via Resend (resend.com).
//
// Each helper returns the Resend response. Errors are surfaced — but callers
// should catch them carefully: a failed password-reset email must NOT leak
// "user exists" through a 500 to the client.

import { Resend } from "resend";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

const resend = new Resend(config.resend.apiKey);

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const result = await resend.emails.send({
      from: config.resend.from,
      to,
      subject,
      html,
      text,
      replyTo: config.resend.replyTo,
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

// Minimal HTML escape for values interpolated into the email templates.
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
