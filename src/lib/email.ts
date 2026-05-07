import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || "BetNexus <noreply@betnexus.com>";
const APP_NAME = "BetNexus";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#0f1118;color:#ffffff;font-family:Arial,Helvetica,sans-serif}
  .wrapper{max-width:600px;margin:0 auto;padding:20px}
  .header{text-align:center;padding:30px 0;border-bottom:1px solid #2a3050}
  .logo{font-size:24px;font-weight:bold;color:#ffffff}
  .logo span{color:#00d46e}
  .content{padding:30px 0}
  .btn{display:inline-block;background:linear-gradient(135deg,#00d46e,#00b85c);color:#ffffff;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:14px}
  .footer{text-align:center;padding:20px 0;border-top:1px solid #2a3050;color:#5a6485;font-size:12px}
  .stat{display:inline-block;padding:10px 20px;background:#1c2033;border:1px solid #2a3050;border-radius:8px;text-align:center;margin:5px}
  .stat-label{font-size:11px;color:#5a6485}
  .stat-value{font-size:18px;font-weight:bold;color:#00d46e;margin-top:4px}
  h2{color:#ffffff;margin:0 0 10px}
  p{color:#8b95b8;line-height:1.6;margin:10px 0}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">Bet<span>Nexus</span></div>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
    <p>You received this email because you have an account at ${APP_NAME}.</p>
  </div>
</div>
</body>
</html>`;
}

async function sendMail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER) {
    console.log(`[email] SMTP not configured. Would send "${subject}" to ${to}`);
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email]", err);
  }
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  referralCode: string
) {
  const html = baseTemplate(`
    <h2>Welcome to ${APP_NAME}, ${firstName}! 🎉</h2>
    <p>Your account has been created successfully. You're ready to start betting on your favorite sports, virtual games, and casino games.</p>
    <p style="text-align:center;margin:30px 0">
      <a href="${APP_URL}/deposit" class="btn">Make Your First Deposit</a>
    </p>
    <p>Share your referral code with friends and earn bonuses:</p>
    <div style="text-align:center;margin:20px 0">
      <div class="stat">
        <div class="stat-label">Your Referral Code</div>
        <div class="stat-value">${referralCode}</div>
      </div>
    </div>
    <p>Need help? Visit our <a href="${APP_URL}/help" style="color:#3b82f6">Help Center</a>.</p>
  `);
  await sendMail(to, `Welcome to ${APP_NAME}!`, html);
}

export async function sendDepositConfirmation(
  to: string,
  firstName: string,
  amount: number,
  currency: string,
  method: string,
  reference: string,
  newBalance: number
) {
  const html = baseTemplate(`
    <h2>Deposit Confirmed ✅</h2>
    <p>Hi ${firstName}, your deposit has been credited successfully.</p>
    <div style="text-align:center;margin:20px 0">
      <div class="stat">
        <div class="stat-label">Amount</div>
        <div class="stat-value">${currency} ${amount.toFixed(2)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">New Balance</div>
        <div class="stat-value">${currency} ${newBalance.toFixed(2)}</div>
      </div>
    </div>
    <p>Method: ${method} &bull; Ref: ${reference}</p>
    <p style="text-align:center;margin:30px 0">
      <a href="${APP_URL}/sports" class="btn">Start Betting</a>
    </p>
  `);
  await sendMail(to, `Deposit of ${currency} ${amount.toFixed(2)} Confirmed`, html);
}

export async function sendWithdrawalRequest(
  to: string,
  firstName: string,
  amount: number,
  currency: string,
  method: string,
  reference: string
) {
  const html = baseTemplate(`
    <h2>Withdrawal Requested 📤</h2>
    <p>Hi ${firstName}, your withdrawal request has been submitted.</p>
    <div style="text-align:center;margin:20px 0">
      <div class="stat">
        <div class="stat-label">Amount</div>
        <div class="stat-value">${currency} ${amount.toFixed(2)}</div>
      </div>
    </div>
    <p>Method: ${method} &bull; Ref: ${reference}</p>
    <p>Processing time depends on your chosen method. You'll receive a confirmation once completed.</p>
  `);
  await sendMail(to, `Withdrawal Request: ${currency} ${amount.toFixed(2)}`, html);
}

export async function sendBetResult(
  to: string,
  firstName: string,
  status: "won" | "lost",
  match: string,
  stake: number,
  payout: number,
  currency: string
) {
  const isWin = status === "won";
  const html = baseTemplate(`
    <h2>Bet ${isWin ? "Won! 🎉" : "Result"}</h2>
    <p>Hi ${firstName}, your bet on <strong>${match}</strong> has been settled.</p>
    <div style="text-align:center;margin:20px 0">
      <div class="stat">
        <div class="stat-label">Stake</div>
        <div class="stat-value" style="color:#8b95b8">${currency} ${stake.toFixed(2)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">${isWin ? "Payout" : "Result"}</div>
        <div class="stat-value" style="color:${isWin ? "#00d46e" : "#ff4757"}">${isWin ? `+${currency} ${payout.toFixed(2)}` : "Lost"}</div>
      </div>
    </div>
    <p style="text-align:center;margin:30px 0">
      <a href="${APP_URL}/account/history" class="btn">View Bet History</a>
    </p>
  `);
  await sendMail(to, isWin ? `You Won ${currency} ${payout.toFixed(2)}!` : `Bet Result: ${match}`, html);
}

export async function sendKYCStatusEmail(
  to: string,
  firstName: string,
  status: "approved" | "rejected",
  note?: string
) {
  const isApproved = status === "approved";
  const html = baseTemplate(`
    <h2>KYC Verification ${isApproved ? "Approved ✅" : "Update"}</h2>
    <p>Hi ${firstName}, your identity verification has been <strong style="color:${isApproved ? "#00d46e" : "#ff4757"}">${status}</strong>.</p>
    ${isApproved ? "<p>You now have full access to deposits, withdrawals, and higher limits.</p>" : ""}
    ${note ? `<p><strong>Note:</strong> ${note}</p>` : ""}
    ${!isApproved ? `<p style="text-align:center;margin:30px 0"><a href="${APP_URL}/account/kyc" class="btn">Resubmit Documents</a></p>` : ""}
  `);
  await sendMail(to, `KYC Verification ${isApproved ? "Approved" : "Update"}`, html);
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetUrl: string
) {
  const html = baseTemplate(`
    <h2>Reset Your Password</h2>
    <p>Hi ${firstName},</p>
    <p>We received a request to reset the password for your BetNexus account. Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
    <p style="text-align:center;margin:30px 0">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </p>
    <p>If you did not request a password reset, you can safely ignore this email. Your password will not be changed.</p>
    <p style="font-size:12px;color:#5a6485">If the button above doesn't work, copy and paste this link into your browser:<br>${resetUrl}</p>
  `);
  await sendMail(to, "Reset your BetNexus password", html);
}
