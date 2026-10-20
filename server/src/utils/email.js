import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

if (env.email.host && env.email.user) {
  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: {
      user: env.email.user,
      pass: (env.email.pass || '').replace(/\s+/g, '')
    }
  });
}

export async function sendEmail({ to, subject, html, text }) {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"SmartCampus AI" <${env.email.from || env.email.user}>`,
        to,
        subject,
        text,
        html
      });
      console.log(`[Email] Sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`[Email Error] Failed to send email to ${to}:`, error.message);
      // Do not throw to avoid crashing transaction, but return failure
      return { success: false, error: error.message };
    }
  } else {
    console.log(`\n================== [DEVELOPMENT EMAIL SIMULATOR] ==================`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text Body: ${text}`);
    console.log(`===================================================================\n`);
    return { success: true, simulated: true };
  }
}

export async function sendVerificationEmail(user, token) {
  const verifyUrl = `${env.frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
  const subject = 'Verify Your SmartCampus AI Account';
  const text = `Hello ${user.name},\n\nPlease verify your email by clicking the following link:\n${verifyUrl}\n\nThis link will expire in 24 hours.\n\nSmartCampus AI Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e3a8a;">Welcome to SmartCampus AI</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Thank you for registering with SmartCampus AI. Please verify your email address to complete your account setup:</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="color: #64748b; font-size: 14px;">Or copy and paste this link in your browser:<br/><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours. If you did not create this account, please ignore this email.</p>
    </div>
  `;
  return sendEmail({ to: user.email, subject, html, text });
}

export async function sendPasswordResetEmail(user, token, otp) {
  const displayOtp = otp || token;
  const resetUrl = `${env.frontendUrl}/reset-password?otp=${displayOtp}&email=${encodeURIComponent(user.email)}`;
  const subject = `${displayOtp} is your SmartCampus AI Password Reset Code`;
  const text = `Hello ${user.name},\n\nYour 6-digit OTP verification code to reset your password is:\n\n${displayOtp}\n\nThis code expires in 15 minutes.\n\nSmartCampus AI Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #4338ca; margin-bottom: 8px;">SmartCampus AI — Password Recovery</h2>
      <p style="color: #475569; font-size: 14px;">Hello <strong>${user.name}</strong>,</p>
      <p style="color: #475569; font-size: 14px;">We received a request to reset your password. Use the 6-digit OTP verification code below:</p>
      <div style="margin: 24px 0; text-align: center;">
        <span style="font-size: 32px; letter-spacing: 8px; font-weight: 800; color: #4338ca; background: #eef2ff; padding: 12px 28px; border-radius: 10px; border: 1px dashed #6366f1; display: inline-block;">
          ${displayOtp}
        </span>
      </div>
      <p style="color: #ef4444; font-size: 13px; font-weight: 600; text-align: center;">⏰ This OTP is valid for 15 minutes.</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 13px;">Reset Password Online</a>
      </div>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">If you did not request a password reset, please ignore this email. Your account remains completely secure.</p>
    </div>
  `;
  return sendEmail({ to: user.email, subject, html, text });
}
