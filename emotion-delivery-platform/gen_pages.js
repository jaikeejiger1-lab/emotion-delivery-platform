const fs = require('fs');
const path = require('path');

const DIR = 'c:\\Users\\JAIKEE JIGER\\HAPPY\\emotion-delivery-platform';

const template = (title, emoji, heading, content) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Hardyy Gift Platform</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#0D0D1A;background-image:radial-gradient(ellipse at 15% 25%,rgba(232,93,154,.13) 0%,transparent 55%),radial-gradient(ellipse at 85% 75%,rgba(139,92,246,.13) 0%,transparent 55%);min-height:100vh;color:#fff;font-family:'Outfit',sans-serif;display:flex;flex-direction:column;}
.glass{background:rgba(255,255,255,.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.07);}
.gbtn{background:linear-gradient(135deg,#E85D9A,#8B5CF6);transition:all .3s;cursor:pointer;border:none;}
.gbtn:hover{box-shadow:0 12px 32px rgba(232,93,154,.4);transform:translateY(-1px);}
</style>
</head>
<body>
  <header class="glass" style="position:sticky;top:0;z-index:50;border-bottom:1px solid rgba(255,255,255,.05);padding:12px 24px;display:flex;align-items:center;justify-content:space-between;">
    <a href="index.html" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;">
      <div class="gbtn" style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 8px 24px rgba(232,93,154,.3)">&#127873;</div>
      <div>
        <div style="font-size:20px;font-weight:700;background:linear-gradient(135deg,#fff,#f9a8d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-family:'Playfair Display',serif;">Hardyy</div>
        <div style="font-size:10px;color:rgba(255,255,255,.35);letter-spacing:2px;text-transform:uppercase;line-height:1;">Gift Platform</div>
      </div>
    </a>
    <nav style="display:flex;gap:4px;">
      <a href="index.html" style="padding:8px 16px;border-radius:12px;font-size:13px;font-weight:500;text-decoration:none;color:rgba(255,255,255,.6);">Home</a>
      <a href="services.html" style="padding:8px 16px;border-radius:12px;font-size:13px;font-weight:500;text-decoration:none;color:rgba(255,255,255,.6);">Services</a>
      <a href="about.html" style="padding:8px 16px;border-radius:12px;font-size:13px;font-weight:500;text-decoration:none;color:rgba(255,255,255,.6);">About Us</a>
    </nav>
    <div>
      <a href="index.html" class="gbtn" style="padding:10px 20px;border-radius:12px;font-size:13px;font-weight:700;color:#fff;text-decoration:none;">Back to App</a>
    </div>
  </header>

  <main style="flex:1;max-width:900px;width:100%;margin:60px auto;padding:0 24px;">
    <div class="glass" style="border-radius:28px;padding:48px;border:1px solid rgba(255,255,255,.1);">
      <div style="text-align:center;margin-bottom:36px;">
        <div style="font-size:56px;margin-bottom:16px;">${emoji}</div>
        <h1 style="font-family:'Playfair Display',serif;font-size:36px;font-weight:800;">${heading}</h1>
      </div>
      <div style="color:rgba(255,255,255,.65);line-height:1.8;font-size:15px;display:flex;flex-direction:column;gap:20px;">
        ${content}
      </div>
    </div>
  </main>

  <footer style="background:rgba(0,0,0,.3);border-top:1px solid rgba(255,255,255,.05);padding:48px 24px 24px;margin-top:auto;">
    <div style="max-width:1200px;margin:0 auto;">
      <div style="border-top:1px solid rgba(255,255,255,.05);padding-top:18px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:rgba(255,255,255,.3);">
        <span>&#169; 2026 Hardyy Gift Platform. All rights reserved. Made with love in India.</span>
        <div style="display:flex;gap:16px;">
          <a href="privacy.html" style="color:inherit;text-decoration:none;">Privacy Policy</a>
          <a href="terms.html" style="color:inherit;text-decoration:none;">Terms of Service</a>
          <a href="refund.html" style="color:inherit;text-decoration:none;">Refund Policy</a>
        </div>
      </div>
    </div>
  </footer>
</body>
</html>`;

const pages = {
  'privacy.html': ['Privacy Policy', '🔒', 'Privacy Policy', `
    <p>We collect personal information such as your name, email, phone number, and delivery address when you register or place an order. We also collect payment details processed securely via Razorpay.</p>
    <h3 style="color:#fff;font-size:18px;font-weight:700;">Data Security & Encryption</h3>
    <p>All data is encrypted using AES-256 and transmitted over TLS/SSL. We do not store credit card numbers on our servers. Razorpay handles all payment processing under PCI-DSS compliance.</p>
    <h3 style="color:#fff;font-size:18px;font-weight:700;">Your Rights</h3>
    <p>You may request deletion of your account data at any time by emailing privacy@hardyy.in. We will process your request within 7 business days.</p>
  `],
  'terms.html': ['Terms of Service', '📋', 'Terms of Service', `
    <p>By accessing or using Hardyy, you agree to be bound by these Terms of Service. If you disagree with any part, please do not use our platform.</p>
    <h3 style="color:#fff;font-size:18px;font-weight:700;">Gift Fulfillments & Delivery</h3>
    <p>All gift orders are subject to availability. We partner with curated local gift shops to fulfill orders. Hardyy acts as a technology marketplace facilitator ensuring quality standards.</p>
    <h3 style="color:#fff;font-size:18px;font-weight:700;">Prohibited Uses</h3>
    <p>You may not use Hardyy for sending illegal items, harassment, spam, or any activity that violates Indian law. Anonymous Gift mode is strictly for respectful surprises.</p>
  `],
  'refund.html': ['Refund Policy', '💰', 'Refund Policy', `
    <p>We want every gifting experience to be magical. Full refunds are issued for damaged products, defective items, or failed deliveries where no re-attempt was possible.</p>
    <h3 style="color:#fff;font-size:18px;font-weight:700;">Non-Refundable Items</h3>
    <p>Customised items (handwritten letters, photo prints, video QR cards), perishable gifts (fresh flowers, artisan cakes), and midnight delivery surcharge fees are non-refundable once dispatched.</p>
    <h3 style="color:#fff;font-size:18px;font-weight:700;">Cancellation Window</h3>
    <p>Orders can be cancelled within 30 minutes of placement for a 100% refund. After 30 minutes, a nominal 20% curation fee applies if packing has commenced.</p>
  `],
  'services.html': ['Our Services', '✨', 'Hardyy Signature Services', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <div class="glass" style="padding:20px;border-radius:16px;">
        <div style="font-size:28px;margin-bottom:8px;">🌙</div>
        <h4 style="color:#fff;font-weight:700;margin-bottom:6px;">Midnight Delivery</h4>
        <p style="font-size:13px;color:rgba(255,255,255,.5);">Guaranteed delivery exactly at 12:00 AM sharp across 40+ major Indian cities.</p>
      </div>
      <div class="glass" style="padding:20px;border-radius:16px;">
        <div style="font-size:28px;margin-bottom:8px;">📹</div>
        <h4 style="color:#fff;font-weight:700;margin-bottom:6px;">Video QR Messages</h4>
        <p style="font-size:13px;color:rgba(255,255,255,.5);">Embed your personal scan-to-play video message inside the gift box.</p>
      </div>
      <div class="glass" style="padding:20px;border-radius:16px;">
        <div style="font-size:28px;margin-bottom:8px;">✍️</div>
        <h4 style="color:#fff;font-weight:700;margin-bottom:6px;">Handwritten Letters</h4>
        <p style="font-size:13px;color:rgba(255,255,255,.5);">Real pen-plotter printed messages in calligraphy, cursive, or print styles.</p>
      </div>
      <div class="glass" style="padding:20px;border-radius:16px;">
        <div style="font-size:28px;margin-bottom:8px;">📍</div>
        <h4 style="color:#fff;font-weight:700;margin-bottom:6px;">Live GPS Tracking</h4>
        <p style="font-size:13px;color:rgba(255,255,255,.5);">Real-time interactive map tracking of your delivery partner from shop to doorstep.</p>
      </div>
    </div>
  `],
  'about.html': ['About Us', '🎁', 'About Hardyy', `
    <p>Hardyy was born from a simple belief: <strong style="color:#fff;">gifts should feel like emotions, not transactions.</strong> Founded in 2024, we are India’s premier emotion delivery platform.</p>
    <p>We connect customers to over 500+ top-tier partner gift shops across India, enabling same-day and midnight delivery with personalised handwritten letters, video QR codes, and live GPS tracking.</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;text-align:center;margin-top:16px;">
      <div class="glass" style="padding:20px;border-radius:16px;">
        <div style="font-size:24px;font-weight:800;color:#f472b6;">50K+</div>
        <div style="font-size:12px;color:rgba(255,255,255,.4);">Delivered</div>
      </div>
      <div class="glass" style="padding:20px;border-radius:16px;">
        <div style="font-size:24px;font-weight:800;color:#fbbf24;">500+</div>
        <div style="font-size:12px;color:rgba(255,255,255,.4);">Partner Shops</div>
      </div>
      <div class="glass" style="padding:20px;border-radius:16px;">
        <div style="font-size:24px;font-weight:800;color:#a78bfa;">40+</div>
        <div style="font-size:12px;color:rgba(255,255,255,.4);">Cities</div>
      </div>
    </div>
  `]
};

for (const [file, [title, emoji, heading, content]] of Object.entries(pages)) {
  fs.writeFileSync(path.join(DIR, file), template(title, emoji, heading, content), 'utf8');
}
console.log('Successfully generated all boilerplate pages!');
