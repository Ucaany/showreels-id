/**
 * Email templates for Showreels.id
 * Uses simple HTML templates (no React Email dependency needed).
 */

export type EmailType = "welcome" | "subscription_activated" | "subscription_expired" | "payment_success";

interface WelcomeEmailData {
  userName: string;
  dashboardUrl: string;
}

interface SubscriptionActivatedData {
  userName: string;
  planName: string;
  expiresAt: string;
  dashboardUrl: string;
}

interface SubscriptionExpiredData {
  userName: string;
  planName: string;
  upgradeUrl: string;
}

interface PaymentSuccessData {
  userName: string;
  planName: string;
  amount: string;
  invoiceId: string;
  dashboardUrl: string;
}

export type EmailTemplateData =
  | { type: "welcome"; data: WelcomeEmailData }
  | { type: "subscription_activated"; data: SubscriptionActivatedData }
  | { type: "subscription_expired"; data: SubscriptionExpiredData }
  | { type: "payment_success"; data: PaymentSuccessData };

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Showreels.id</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 24px; }
    .heading { font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
    .text { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 16px; }
    .button { display: inline-block; background: #0f172a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px; }
    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; }
    .highlight { background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .highlight-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .highlight-value { font-size: 16px; font-weight: 600; color: #1e293b; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">🎬 Showreels.id</div>
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Showreels.id — Platform portfolio video untuk kreator Indonesia</p>
      <p>Email ini dikirim otomatis. Jangan membalas email ini.</p>
    </div>
  </div>
</body>
</html>`;
}

export function renderWelcomeEmail(data: WelcomeEmailData): { subject: string; html: string } {
  const html = baseLayout(`
    <h1 class="heading">Selamat datang, ${escapeHtml(data.userName)}! 🎉</h1>
    <p class="text">
      Terima kasih telah bergabung dengan Showreels.id. Akun kamu sudah aktif dan siap digunakan.
    </p>
    <p class="text">
      Mulai buat portfolio video profesional kamu sekarang. Upload video, atur profil, dan bagikan ke klien atau rekruter.
    </p>
    <p style="margin-top: 24px;">
      <a href="${escapeHtml(data.dashboardUrl)}" class="button">Buka Dashboard →</a>
    </p>
  `);

  return {
    subject: "Selamat datang di Showreels.id! 🎬",
    html,
  };
}

export function renderSubscriptionActivatedEmail(data: SubscriptionActivatedData): { subject: string; html: string } {
  const html = baseLayout(`
    <h1 class="heading">Langganan ${escapeHtml(data.planName)} Aktif! ✨</h1>
    <p class="text">
      Hai ${escapeHtml(data.userName)}, langganan kamu sudah aktif. Nikmati semua fitur premium Showreels.id.
    </p>
    <div class="highlight">
      <div class="highlight-label">Plan</div>
      <div class="highlight-value">${escapeHtml(data.planName)}</div>
    </div>
    <div class="highlight">
      <div class="highlight-label">Berlaku Hingga</div>
      <div class="highlight-value">${escapeHtml(data.expiresAt)}</div>
    </div>
    <p style="margin-top: 24px;">
      <a href="${escapeHtml(data.dashboardUrl)}" class="button">Buka Dashboard →</a>
    </p>
  `);

  return {
    subject: `Langganan ${data.planName} kamu sudah aktif! ✨`,
    html,
  };
}

export function renderSubscriptionExpiredEmail(data: SubscriptionExpiredData): { subject: string; html: string } {
  const html = baseLayout(`
    <h1 class="heading">Langganan Kamu Berakhir</h1>
    <p class="text">
      Hai ${escapeHtml(data.userName)}, langganan ${escapeHtml(data.planName)} kamu telah berakhir.
      Akun kamu masih aktif dengan fitur dasar (Free plan).
    </p>
    <p class="text">
      Untuk tetap menikmati fitur premium, silakan perpanjang langganan kamu.
    </p>
    <p style="margin-top: 24px;">
      <a href="${escapeHtml(data.upgradeUrl)}" class="button">Perpanjang Langganan →</a>
    </p>
  `);

  return {
    subject: "Langganan kamu telah berakhir",
    html,
  };
}

export function renderPaymentSuccessEmail(data: PaymentSuccessData): { subject: string; html: string } {
  const html = baseLayout(`
    <h1 class="heading">Pembayaran Berhasil! ✅</h1>
    <p class="text">
      Hai ${escapeHtml(data.userName)}, pembayaran kamu telah berhasil diproses.
    </p>
    <div class="highlight">
      <div class="highlight-label">Plan</div>
      <div class="highlight-value">${escapeHtml(data.planName)}</div>
    </div>
    <div class="highlight">
      <div class="highlight-label">Jumlah</div>
      <div class="highlight-value">${escapeHtml(data.amount)}</div>
    </div>
    <div class="highlight">
      <div class="highlight-label">Invoice ID</div>
      <div class="highlight-value">${escapeHtml(data.invoiceId)}</div>
    </div>
    <p style="margin-top: 24px;">
      <a href="${escapeHtml(data.dashboardUrl)}" class="button">Buka Dashboard →</a>
    </p>
  `);

  return {
    subject: "Pembayaran berhasil — Showreels.id",
    html,
  };
}

export function renderEmailTemplate(template: EmailTemplateData): { subject: string; html: string } {
  switch (template.type) {
    case "welcome":
      return renderWelcomeEmail(template.data);
    case "subscription_activated":
      return renderSubscriptionActivatedEmail(template.data);
    case "subscription_expired":
      return renderSubscriptionExpiredEmail(template.data);
    case "payment_success":
      return renderPaymentSuccessEmail(template.data);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
