/**
 * chatbotController.js
 *
 * POST /api/chatbot/message
 * Body: { message: string, history: [{role, content}] }
 */

// ── Hardyy FAQ canned responses (mock mode) ───────────────────────────
const FAQ_RESPONSES = [
  { k: ['midnight', 'night', '12am'], r: '🌙 Midnight Delivery is available in 40+ cities! We deliver exactly at 12:00 AM. Add it in the Gift Builder for just ₹299 extra.' },
  { k: ['track', 'tracking', 'where', 'location'], r: '📍 Once your order is dispatched, visit My Vault → Live Tracking for real-time GPS updates of your delivery partner!' },
  { k: ['qr', 'video', 'scan'], r: '📹 Our Video QR feature lets you embed a personal video inside the gift box. The recipient just scans the QR code to play your message!' },
  { k: ['return', 'refund', 'cancel'], r: '💝 We offer full refunds for damaged/incorrect items within 24 hours of delivery. Contact support@hardyy.in with your order ID.' },
  { k: ['coupon', 'discount', 'offer', 'code'], r: '🎁 Current coupons: HAPPY20 (20%), GIFT10 (10%), LOVE15 (15%), HARDYY25 (25%). Apply them at checkout!' },
  { k: ['anonymous', 'secret', 'hidden'], r: '👤 Anonymous Gift mode hides your name from all packaging, labels, and receipts. Enable it in the Gift Builder.' },
  { k: ['delivery', 'time', 'how long', 'fast'], r: '⚡ We offer: 60-Min Express delivery in select areas, Same-Day delivery (by 8PM), and scheduled delivery on any future date!' },
  { k: ['payment', 'pay', 'razorpay', 'upi'], r: '💳 We accept UPI, Credit/Debit Cards, Net Banking — all powered by Razorpay with 256-bit SSL encryption.' },
  { k: ['letter', 'handwritten', 'note'], r: '✍️ Our Handwritten Letter service uses a real pen-plotter to print your message in cursive, print, or calligraphy font!' },
  { k: ['partner', 'shop', 'store'], r: '🏪 We have 500+ partner gift shops pan-India. Orders are assigned to the nearest shop for expert packing and fast dispatch.' },
];

const DEFAULT_RESPONSE = `Hi! I'm Aurora's AI assistant 🎁 I can help you with:\n\n• 🌙 Midnight delivery info\n• 📹 Video QR setup\n• 🎟️ Coupon codes\n• 📍 Order tracking\n• ✍️ Handwritten letters\n• 💳 Payment options\n\nWhat would you like to know?`;

const findFaqResponse = (message) => {
  const lower = message.toLowerCase();
  for (const faq of FAQ_RESPONSES) {
    if (faq.k.some(kw => lower.includes(kw))) return faq.r;
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────
// POST /api/chatbot/message
// ─────────────────────────────────────────────────────────────────────
exports.handleMessage = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // ── Real GPT-4o-mini call ──────────────────────────────────────
    if (apiKey) {
      // NOTE: System prompt includes format instructions explicitly — do NOT
      // append a trailing assistant prefill message, as Anthropic/Vertex AI
      // and some OpenAI-compatible APIs reject conversations that end with
      // role: 'assistant' (HTTP 400: "conversation must end with a user message").
      const systemPrompt = `You are Aurora's helpful gift concierge AI. Aurora is India's premium gift delivery platform. You help customers with gifting ideas, order tracking, delivery options (including midnight delivery), gift customisation (handwritten letters, video QR, photo prints), and platform features. Be warm, helpful, and concise. Use emojis appropriately. Always recommend relevant Aurora features. Respond in plain text with emojis; do not wrap your answer in JSON or code blocks.`;

      // Sanitize history:
      // 1. Only keep recognised roles (user / assistant).
      // 2. Remove any trailing assistant turn — the conversation MUST end
      //    with the new user message we append below.
      const sanitizedHistory = history
        .slice(-8)
        .filter(h => h.role === 'user' || h.role === 'assistant')
        .map(h => ({ role: h.role, content: String(h.content || '').trim() }))
        .filter(h => h.content.length > 0);

      // Drop trailing assistant messages so the final role is always 'user'
      while (
        sanitizedHistory.length > 0 &&
        sanitizedHistory[sanitizedHistory.length - 1].role === 'assistant'
      ) {
        sanitizedHistory.pop();
      }

      const messages = [
        { role: 'system', content: systemPrompt },
        ...sanitizedHistory,
        // This MUST be the last entry — role: 'user'
        { role: 'user', content: message },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 300, temperature: 0.7 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'OpenAI API error');
      const reply = data.choices[0].message.content;
      return res.json({ success: true, reply, source: 'openai' });
    }

    // ── FAQ mock mode ──────────────────────────────────────────────
    const faqReply = findFaqResponse(message);
    const reply    = faqReply || DEFAULT_RESPONSE;

    // Add small delay to feel more realistic
    await new Promise(r => setTimeout(r, 600));
    res.json({ success: true, reply, source: 'faq' });
  } catch (error) { next(error); }
};
