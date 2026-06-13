import nodemailer from 'nodemailer'

export type OtpEmailPurpose = 'verify_email' | 'reset_password'

function smtpConfig() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured')
  }

  return {
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  }
}

function fromAddress(): string {
  const email = process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER
  const name = process.env.SMTP_FROM_NAME ?? 'ClauseIQ'
  return `"${name}" <${email}>`
}

function purposeCopy(purpose: OtpEmailPurpose) {
  if (purpose === 'verify_email') {
    return {
      subject: 'Verify your ClauseIQ email',
      title: 'Verify your email',
      body: 'Use this code to verify your ClauseIQ account:',
    }
  }

  return {
    subject: 'Reset your ClauseIQ password',
    title: 'Password reset',
    body: 'Use this code to reset your ClauseIQ password:',
  }
}

export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: OtpEmailPurpose
): Promise<void> {
  if (process.env.PLAYWRIGHT_TEST === '1') {
    console.info(`[email:otp] ${purpose} → ${to}: ${code}`)
    return
  }

  const copy = purposeCopy(purpose)
  const transporter = nodemailer.createTransport(smtpConfig())

  await transporter.sendMail({
    from: fromAddress(),
    to,
    subject: copy.subject,
    text: `${copy.body} ${code}\n\nThis code expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family:Inter,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#0F172A;margin:0 0 12px;">${copy.title}</h2>
        <p style="color:#475569;margin:0 0 20px;">${copy.body}</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0F172A;background:#f1f5f9;border-radius:12px;padding:16px 24px;text-align:center;">
          ${code}
        </div>
        <p style="color:#94a3b8;font-size:13px;margin-top:24px;">Expires in 10 minutes. Do not share this code.</p>
      </div>
    `,
  })
}

export async function sendPasswordChangedEmail(to: string): Promise<void> {
  if (process.env.PLAYWRIGHT_TEST === '1') return

  const transporter = nodemailer.createTransport(smtpConfig())

  await transporter.sendMail({
    from: fromAddress(),
    to,
    subject: 'Your ClauseIQ password was changed',
    text: 'Your ClauseIQ password was changed successfully. If this was not you, contact support immediately.',
    html: `
      <div style="font-family:Inter,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#0F172A;">Password updated</h2>
        <p style="color:#475569;">Your ClauseIQ password was changed successfully.</p>
        <p style="color:#94a3b8;font-size:13px;">If this was not you, reset your password immediately.</p>
      </div>
    `,
  })
}
