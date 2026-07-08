/**
 * qrService.js
 *
 * Generates a QR code that encodes a video message URL.
 * Returns the QR as a Base64 data-URI (ready for embedding in HTML)
 * or saves it to a file path for S3 upload.
 *
 * Dependencies: qrcode (npm i qrcode)
 */

const QRCode = require('qrcode');

/**
 * generateVideoQR
 *
 * @param {string} videoUrl  - The hosted video URL (S3 / YouTube / Vimeo short link)
 * @param {Object} [options] - QR code styling options
 * @returns {Promise<string>} - Base64 PNG data URI
 */
const generateVideoQR = async (videoUrl, options = {}) => {
  if (!videoUrl) throw new Error('videoUrl is required to generate a QR code');

  const qrOptions = {
    errorCorrectionLevel: 'H',   // Highest redundancy — survives gift wrapping wear
    type: 'image/png',
    margin: 2,
    color: {
      dark: options.darkColor || '#1A1A2E',   // Deep navy
      light: options.lightColor || '#FFFFFF',
    },
    width: options.width || 400,
    ...options,
  };

  // Generate QR as Base64 data URI
  const dataUri = await QRCode.toDataURL(videoUrl, qrOptions);
  return dataUri;
};

/**
 * generateVideoQRBuffer
 *
 * @param {string} videoUrl - Hosted video URL
 * @returns {Promise<Buffer>} - Raw PNG buffer (for S3 upload)
 */
const generateVideoQRBuffer = async (videoUrl) => {
  const buffer = await QRCode.toBuffer(videoUrl, {
    errorCorrectionLevel: 'H',
    width: 400,
    margin: 2,
    color: { dark: '#1A1A2E', light: '#FFFFFF' },
  });
  return buffer;
};

/**
 * buildVideoShortLink
 * In production, integrate a URL shortener (e.g., Bitly API or your own).
 * This stub returns a predictable path under your domain.
 *
 * @param {string} orderId
 * @returns {string}
 */
const buildVideoShortLink = (orderId) => {
  return `https://emotiondelivery.app/v/${orderId}`;
};

module.exports = {
  generateVideoQR,
  generateVideoQRBuffer,
  buildVideoShortLink,
};
