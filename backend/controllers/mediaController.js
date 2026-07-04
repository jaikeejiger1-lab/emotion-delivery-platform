/**
 * mediaController.js
 *
 * POST /api/media/upload-video  — saves Base64 video to disk, returns URL
 * POST /api/media/qr            — generates QR code PNG data-URI from a URL
 * POST /api/media/generate-image — calls DALL-E 3 (mock if no API key)
 */
const path  = require('path');
const fs    = require('fs');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directory exists
const VIDEO_DIR = path.join(__dirname, '..', 'uploads', 'videos');
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });

// ─────────────────────────────────────────────────────────────────────
// POST /api/media/upload-video
// Body: { base64Video: 'data:video/mp4;base64,...', filename: 'myvideo.mp4' }
// ─────────────────────────────────────────────────────────────────────
exports.uploadVideo = async (req, res, next) => {
  try {
    const { base64Video, filename } = req.body;
    if (!base64Video) {
      return res.status(400).json({ success: false, message: 'base64Video is required' });
    }

    // Strip data URL prefix
    const matches = base64Video.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, message: 'Invalid base64 video format' });
    }
    const ext       = matches[1].split('/')[1] || 'mp4';
    const buffer    = Buffer.from(matches[2], 'base64');
    const safeSize  = 50 * 1024 * 1024; // 50 MB limit
    if (buffer.length > safeSize) {
      return res.status(413).json({ success: false, message: 'Video exceeds 50 MB limit' });
    }

    const fileName  = `${uuidv4()}.${ext}`;
    const filePath  = path.join(VIDEO_DIR, fileName);
    fs.writeFileSync(filePath, buffer);

    const videoUrl = `${req.protocol}://${req.get('host')}/uploads/videos/${fileName}`;
    res.json({ success: true, videoUrl, fileName });
  } catch (error) { next(error); }
};

// ─────────────────────────────────────────────────────────────────────
// POST /api/media/qr
// Body: { url: 'https://...' }
// Returns: { qrDataUrl: 'data:image/png;base64,...' }
// ─────────────────────────────────────────────────────────────────────
exports.generateQR = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'url is required' });
    }
    const qrDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: { dark: '#D4AF37', light: '#080B1A' },
    });
    res.json({ success: true, qrDataUrl });
  } catch (error) { next(error); }
};

// ─────────────────────────────────────────────────────────────────────
// POST /api/media/generate-image
// Body: { prompt: 'A beautiful gift box with roses...' }
// Returns: { imageUrl: '...' }
// ─────────────────────────────────────────────────────────────────────
exports.generateImage = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'prompt is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // ── Real DALL-E 3 call ─────────────────────────────────────────
    if (apiKey) {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'DALL-E API error');
      return res.json({ success: true, imageUrl: data.data[0].url, generated: true });
    }

    // ── Mock response (no API key) ─────────────────────────────────
    console.log(`[DALL-E MOCK] Prompt: "${prompt}"`);
    const mockImages = [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80',
      'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
      'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&q=80',
    ];
    const imageUrl = mockImages[Math.floor(Math.random() * mockImages.length)];
    res.json({ success: true, imageUrl, generated: false, note: 'Mock image — add OPENAI_API_KEY for real generation' });
  } catch (error) { next(error); }
};
