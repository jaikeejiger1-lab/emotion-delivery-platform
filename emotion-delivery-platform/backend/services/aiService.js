/**
 * aiService.js
 *
 * AI-powered gift recommendation engine.
 *
 * Strategy:
 *  1. Build a context vector from the recipient's profile
 *     (relation type, preference tags, budget, past gifts, occasion).
 *  2. Score the product catalogue against that vector using a simple
 *     weighted keyword-match algorithm (no external API dependency).
 *  3. Return the top-N products sorted by relevance score.
 *
 * To upgrade to OpenAI / Gemini, replace `scoreProducts` with an
 * LLM-powered ranking call and pipe the catalogue as context.
 */

// ---------------------------------------------------------------------------
// Static product catalogue (replace with DB query in production)
// ---------------------------------------------------------------------------
const PRODUCT_CATALOGUE = [
  { id: 'p001', name: 'Artisan Chocolate Box', category: 'Food', tags: ['chocolate', 'sweet', 'luxury', 'indulgence'], price: 799, image: '/products/chocolate-box.jpg', rating: 4.8 },
  { id: 'p002', name: 'Scented Soy Candle Set', category: 'Self-Care', tags: ['self-care', 'relaxation', 'aromatherapy', 'luxury', 'feminine'], price: 1299, image: '/products/candle-set.jpg', rating: 4.7 },
  { id: 'p003', name: 'Handcrafted Leather Wallet', category: 'Accessories', tags: ['leather', 'masculine', 'premium', 'tech', 'practical'], price: 1999, image: '/products/wallet.jpg', rating: 4.6 },
  { id: 'p004', name: 'Personalised Jewelry Box', category: 'Jewellery', tags: ['jewellery', 'luxury', 'feminine', 'personalised', 'romantic'], price: 2499, image: '/products/jewelry-box.jpg', rating: 4.9 },
  { id: 'p005', name: 'Gourmet Tea Collection', category: 'Food', tags: ['tea', 'wellness', 'self-care', 'relaxation', 'health'], price: 649, image: '/products/tea.jpg', rating: 4.5 },
  { id: 'p006', name: 'Bluetooth Speaker', category: 'Tech', tags: ['tech', 'music', 'gadget', 'masculine', 'youthful'], price: 2999, image: '/products/speaker.jpg', rating: 4.7 },
  { id: 'p007', name: 'Custom Star Map Print', category: 'Decor', tags: ['romantic', 'personalised', 'decor', 'anniversary', 'memory'], price: 1499, image: '/products/starmap.jpg', rating: 4.9 },
  { id: 'p008', name: 'Spa & Wellness Hamper', category: 'Self-Care', tags: ['self-care', 'spa', 'luxury', 'feminine', 'relaxation', 'wellness'], price: 3499, image: '/products/spa-hamper.jpg', rating: 4.8 },
  { id: 'p009', name: 'Gourmet Coffee Kit', category: 'Food', tags: ['coffee', 'gourmet', 'masculine', 'morning', 'practical'], price: 999, image: '/products/coffee-kit.jpg', rating: 4.6 },
  { id: 'p010', name: 'Polaroid Photo Album', category: 'Memories', tags: ['memory', 'nostalgic', 'personalised', 'anniversary', 'birthday'], price: 1199, image: '/products/photo-album.jpg', rating: 4.7 },
  { id: 'p011', name: 'Luxury Perfume Duo', category: 'Accessories', tags: ['perfume', 'luxury', 'feminine', 'masculine', 'premium'], price: 4999, image: '/products/perfume.jpg', rating: 4.8 },
  { id: 'p012', name: 'Smart Fitness Band', category: 'Tech', tags: ['tech', 'health', 'fitness', 'gadget', 'wellness'], price: 3999, image: '/products/fitness-band.jpg', rating: 4.5 },
];

// ---------------------------------------------------------------------------
// Relation → inferred preference tags
// ---------------------------------------------------------------------------
const RELATION_TAGS = {
  Mom:         ['self-care', 'relaxation', 'jewellery', 'flowers', 'sweet'],
  Dad:         ['practical', 'tech', 'masculine', 'premium', 'health'],
  Girlfriend:  ['romantic', 'feminine', 'jewellery', 'luxury', 'personalised'],
  Boyfriend:   ['tech', 'masculine', 'gadget', 'premium', 'practical'],
  Wife:        ['romantic', 'luxury', 'jewellery', 'personalised', 'self-care'],
  Husband:     ['tech', 'luxury', 'masculine', 'premium', 'practical'],
  Sister:      ['feminine', 'self-care', 'sweet', 'personalised', 'youthful'],
  Brother:     ['tech', 'gadget', 'masculine', 'youthful', 'music'],
  Friend:      ['fun', 'personalised', 'memory', 'sweet', 'nostalgic'],
  Colleague:   ['practical', 'premium', 'coffee', 'desk', 'professional'],
  Boss:        ['luxury', 'premium', 'professional', 'practical'],
  Child:       ['fun', 'playful', 'sweet', 'educational', 'youthful'],
  Grandparent: ['health', 'wellness', 'tea', 'practical', 'memory'],
  Other:       [],
};

// ---------------------------------------------------------------------------
// Occasion → inferred tags
// ---------------------------------------------------------------------------
const OCCASION_TAGS = {
  Birthday:    ['birthday', 'sweet', 'celebration', 'personalised'],
  Anniversary: ['romantic', 'memory', 'anniversary', 'luxury'],
  Wedding:     ['luxury', 'home', 'premium', 'romantic'],
  Graduation:  ['achievement', 'practical', 'personalised', 'tech'],
  'Work Promotion': ['professional', 'premium', 'practical', 'luxury'],
  'Just Because': ['sweet', 'fun', 'nostalgic', 'personalised'],
};

// ---------------------------------------------------------------------------
// Core scoring function
// ---------------------------------------------------------------------------
const scoreProducts = (products, contextTags, budget) => {
  return products
    .filter((p) => p.price <= budget.max && p.price >= budget.min)
    .map((p) => {
      const matches = p.tags.filter((t) => contextTags.includes(t)).length;
      const tagScore = matches / Math.max(contextTags.length, 1);
      const priceScore = 1 - Math.abs(p.price - (budget.min + budget.max) / 2) / budget.max;
      const score = tagScore * 0.65 + priceScore * 0.2 + (p.rating / 5) * 0.15;
      return { ...p, score: parseFloat(score.toFixed(4)), matchedTags: matches };
    })
    .sort((a, b) => b.score - a.score);
};

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

/**
 * getRecommendations
 *
 * @param {Object} params
 * @param {string}   params.relation       - e.g. 'Mom', 'Girlfriend'
 * @param {string[]} params.preferenceTags - Tags from MemoryVault
 * @param {Object}   params.budgetRange    - { min, max }
 * @param {string}   params.occasion       - e.g. 'Birthday'
 * @param {string[]} params.pastGiftIds    - Product IDs to deprioritise
 * @param {number}   [params.topN=6]       - Number of results to return
 *
 * @returns {{ recommendations: Object[], contextTags: string[] }}
 */
const getRecommendations = ({
  relation = 'Other',
  preferenceTags = [],
  budgetRange = { min: 300, max: 5000 },
  occasion = 'Birthday',
  pastGiftIds = [],
  topN = 6,
}) => {
  // 1. Build context tag universe
  const relationTags = RELATION_TAGS[relation] || [];
  const occasionTags = OCCASION_TAGS[occasion] || [];
  const contextTags = [
    ...new Set([...preferenceTags, ...relationTags, ...occasionTags]),
  ];

  // 2. Score products (excluding recently gifted ones)
  const eligible = PRODUCT_CATALOGUE.filter((p) => !pastGiftIds.includes(p.id));
  const scored = scoreProducts(eligible, contextTags, budgetRange);

  // 3. Return top N
  const recommendations = scored.slice(0, topN);

  return { recommendations, contextTags };
};

module.exports = { getRecommendations };
