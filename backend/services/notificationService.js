/**
 * notificationService.js — Multi-Channel Communications Engine
 *
 * Dispatches transactional alerts across In-App (MongoDB Notification collection),
 * Email (Nodemailer SMTP with graceful fallback), and SMS (Twilio with graceful fallback).
 */
const Notification = require('../models/Notification');
const User = require('../models/User');
const twilio = require('twilio');
const nodemailer = require('nodemailer');

// ------------------------------------------------------------------
// Twilio client (SMS)
// ------------------------------------------------------------------
let twilioClient;
if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  !process.env.TWILIO_ACCOUNT_SID.includes('xxxx') &&
  !process.env.TWILIO_ACCOUNT_SID.includes('XXXX') &&
  !process.env.TWILIO_ACCOUNT_SID.includes('your_')
) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
} else {
  console.warn('⚠️ Twilio credentials not set or placeholder detected. SMS notifications will be logged to console.');
}

// ------------------------------------------------------------------
// Nodemailer transporter (SMTP / Gmail)
// ------------------------------------------------------------------
let transporter;
if (
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS &&
  !process.env.EMAIL_USER.includes('your_email') &&
  !process.env.EMAIL_USER.includes('example.com') &&
  !process.env.EMAIL_USER.includes('your_')
) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
} else {
  console.warn('⚠️ SMTP credentials not set or placeholder detected. Email notifications will be logged to console.');
}

// ------------------------------------------------------------------
// Base Channel Dispatchers
// ------------------------------------------------------------------
const sendSMS = async (to, body) => {
  if (!to) return { success: false, message: 'No phone provided' };
  try {
    if (!twilioClient) {
      console.log(`💬 [MOCK SMS] To: ${to} | Body: "${body}"`);
      return { success: true, mock: true };
    }
    const msg = await twilioClient.messages.create({
      from: process.env.TWILIO_SMS_FROM || '+15005550006',
      to,
      body,
    });
    console.log(`💬 SMS sent → ${to} [SID: ${msg.sid}]`);
    return { success: true, sid: msg.sid };
  } catch (err) {
    console.warn(`[SMS Fallback] Failed sending SMS to ${to}: ${err.message}`);
    console.log(`💬 [MOCK SMS] To: ${to} | Body: "${body}"`);
    return { success: true, mock: true, error: err.message };
  }
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!to) return { success: false, message: 'No email provided' };
  try {
    if (!transporter) {
      console.log(`✉️ [MOCK EMAIL] To: ${to} | Subject: "${subject}"`);
      return { success: true, mock: true };
    }
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Aurora" <no-reply@emotiondelivery.app>',
      to,
      subject,
      html: html || `<p>${text || subject}</p>`,
      text: text || subject,
    });
    console.log(`✉️ Email sent → ${to} [MsgID: ${info.messageId}]`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.warn(`[Email Fallback] Failed sending email to ${to}: ${err.message}`);
    console.log(`✉️ [MOCK EMAIL] To: ${to} | Subject: "${subject}"`);
    return { success: true, mock: true, error: err.message };
  }
};

// ------------------------------------------------------------------
// Unified Master Dispatcher: sendNotification
// ------------------------------------------------------------------
/**
 * Dispatches a notification via one or multiple channels.
 * @param {Object} params
 * @param {string|ObjectId} params.userId - Recipient User ID
 * @param {string} params.title - Title of alert
 * @param {string} params.message - Body content
 * @param {string} [params.type='system'] - 'order_update' | 'promotional' | 'security' | 'system' | 'delivery'
 * @param {string|string[]} [params.channel='in_app'] - 'in_app' | 'email' | 'sms' or array of channels
 * @param {string} [params.actionUrl=''] - Target deep link URL
 * @param {Object} [params.metadata={}] - Additional data
 */
const sendNotification = async ({
  userId,
  title,
  message,
  type = 'system',
  channel = 'in_app',
  actionUrl = '',
  metadata = {},
}) => {
  try {
    const channels = Array.isArray(channel) ? channel : [channel];
    let user = null;

    if (channels.includes('email') || channels.includes('sms')) {
      user = await User.findById(userId).select('email phone firstName');
    }

    const tasks = [];

    // 1. In-App Notification (Always execute if requested or by default)
    if (channels.includes('in_app')) {
      tasks.push(
        Notification.create({
          recipient: userId,
          title,
          message,
          type,
          channel: 'in_app',
          actionUrl,
          metadata,
        })
      );
    }

    // 2. Email Notification
    if (channels.includes('email') && user?.email) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: auto; padding: 24px; border: 1px solid #333; background: #0A0A14; color: #fff; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 28px;">🎁</span>
            <h2 style="color: #E85D9A; margin: 8px 0;">${title}</h2>
          </div>
          <p style="font-size: 15px; line-height: 1.6; color: #ddd;">${message.replace(/\n/g, '<br>')}</p>
          ${actionUrl ? `
            <div style="text-align: center; margin: 28px 0;">
              <a href="http://localhost:3000${actionUrl}" style="background: linear-gradient(to right, #E85D9A, #9333EA); color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold;">
                View Details
              </a>
            </div>
          ` : ''}
          <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
          <p style="font-size: 11px; color: #666; text-align: center;">Aurora • Secure Automated Notification</p>
        </div>
      `;
      tasks.push(sendEmail({ to: user.email, subject: title, html, text: message }));
    }

    // 3. SMS Notification
    if (channels.includes('sms') && user?.phone) {
      tasks.push(sendSMS(user.phone, `${title}: ${message}`));
    }

    await Promise.allSettled(tasks);
    return { success: true };
  } catch (err) {
    console.error('[NotificationService] Dispatch error:', err.message);
    return { success: false, error: err.message };
  }
};

// ------------------------------------------------------------------
// Specialized System Alert Helpers
// ------------------------------------------------------------------
const notifyAdmins = async ({ title, message, type = 'system', actionUrl = '' }) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, isBanned: false }).select('_id email');
    const tasks = admins.map((admin) =>
      sendNotification({
        userId: admin._id,
        title,
        message,
        type,
        channel: ['in_app', 'email'],
        actionUrl,
      })
    );
    await Promise.allSettled(tasks);
  } catch (err) {
    console.error('[NotificationService] NotifyAdmins error:', err.message);
  }
};

const sendOrderConfirmation = async (order, user) => {
  const orderNum = order.orderNumber || `Order #${order._id.toString().slice(-6).toUpperCase()}`;
  const total = `₹${order.pricing?.total?.toLocaleString('en-IN') || 0}`;

  await sendNotification({
    userId: user._id,
    title: `Order Confirmed — ${orderNum}`,
    message: `Your gift has been placed successfully! Total: ${total}. Our artisans are crafting it with love.`,
    type: 'order_update',
    channel: ['in_app', 'email', 'sms'],
    actionUrl: `/track/${order._id}`,
  });
};

const sendOrderStatusAlert = async (orderId, newStatus, message) => {
  try {
    const Order = require('../models/Order');
    const order = await Order.findById(orderId).populate('userId');
    if (!order || !order.userId) return;

    const orderNum = order.orderNumber || `Order #${order._id.toString().slice(-6).toUpperCase()}`;
    await sendNotification({
      userId: order.userId._id,
      title: `Order Update: ${newStatus}`,
      message: message || `Your order ${orderNum} status is now: ${newStatus}.`,
      type: 'order_update',
      channel: ['in_app', 'email'],
      actionUrl: `/track/${order._id}`,
    });
  } catch (err) {
    console.error('[NotificationService] StatusAlert error:', err.message);
  }
};

module.exports = {
  sendNotification,
  notifyAdmins,
  sendOrderConfirmation,
  sendOrderStatusAlert,
  sendSMS,
  sendEmail,
};
