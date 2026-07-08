/**
 * recommendationController.js
 *
 * GET /api/recommendations
 *
 * Query params:
 *   relation        e.g. Mom, Girlfriend
 *   occasion        e.g. Birthday, Anniversary
 *   budgetMin       number (INR)
 *   budgetMax       number (INR)
 *   relationId      ObjectId — if provided, loads preferences from MemoryVault
 *   topN            number (default 6)
 */

const MemoryVault = require('../models/MemoryVault');
const { getRecommendations } = require('../services/aiService');

exports.getRecommendations = async (req, res, next) => {
  try {
    const {
      relation = 'Other',
      occasion = 'Birthday',
      budgetMin = 300,
      budgetMax = 5000,
      relationId,
      topN = 6,
    } = req.query;

    let preferenceTags = [];
    let pastGiftIds = [];
    let budgetRange = {
      min: parseInt(budgetMin, 10),
      max: parseInt(budgetMax, 10),
    };

    // If a relationId is provided, enrich from MemoryVault
    if (relationId) {
      const vault = await MemoryVault.findOne({ userId: req.user._id });
      if (vault) {
        const rel = vault.relations.id(relationId);
        if (rel) {
          preferenceTags = rel.aiPreferenceTags || [];
          pastGiftIds = (rel.pastGifts || [])
            .map((g) => g.productSnapshot?.id)
            .filter(Boolean);
          // Use the relation's budget preference if not overridden in query
          if (!req.query.budgetMin) budgetRange.min = rel.budgetRange.min;
          if (!req.query.budgetMax) budgetRange.max = rel.budgetRange.max;
        }
      }
    }

    const { recommendations, contextTags } = getRecommendations({
      relation,
      preferenceTags,
      budgetRange,
      occasion,
      pastGiftIds,
      topN: parseInt(topN, 10),
    });

    res.json({
      success: true,
      data: {
        recommendations,
        meta: {
          relation,
          occasion,
          budgetRange,
          contextTags,
          totalResults: recommendations.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const MOCK_GREETINGS = {
  birthday: [
    "Wishing you a magical birthday surrounded by love, joy, and unforgettable surprises! May this year be your brightest yet. ✨🎂",
    "Another year older, wiser, and even more wonderful! Sending you a box full of love on your special day. 🎉💖",
    "Happy Birthday! May your day be as sweet, vibrant, and amazing as you are to everyone around you. 🍰✨"
  ],
  anniversary: [
    "Happy Anniversary to my favorite person in the world! Every moment with you is a treasure, and I cherish all our beautiful memories. ❤️🥂",
    "Through every season of life, my love for you only grows deeper. Happy Anniversary, my heart and my home. 💍🌹",
    "Celebrating the wonderful journey we share together. Here's to countless more memories and endless smiles! 🥂✨"
  ],
  apology: [
    "I truly value our bond and I am deeply sorry for what happened. Please accept this gift as a heartfelt token of my sincerity. 🙏🥺",
    "No words can undo the past, but I hope this gesture shows how much I care about making things right between us. 🕊️❤️",
    "You mean the world to me, and I hate knowing I upset you. Sending all my love and sincere apologies. 🙏💝"
  ],
  romantic: [
    "You are my anchor, my joy, and my biggest blessing. Just wanted to send a little surprise to remind you how much you mean to me! 💖🌹",
    "Every day with you feels like a fairytale. I love you more than words or gifts could ever fully express. ✨❤️",
    "Just because you crossed my mind today and made me smile. Sending you all my hugs and affection! 🥰🎁"
  ],
  congratulate: [
    "Congratulations on your incredible achievement! Your dedication, passion, and resilience truly shine. So proud of you! 🎉🏆",
    "Big milestone, big celebration! You earned every bit of this success. Keep reaching for the stars! 🌟👏",
    "Hats off to you on this amazing victory! May this be the start of many more triumphant moments ahead. 🎊✨"
  ],
  thankyou: [
    "Words aren't enough to express how grateful I am for your kindness and support. Thank you from the bottom of my heart! ✨🙏",
    "Your generosity and warmth always leave a lasting mark. Thank you for being such an extraordinary friend and human! 💐❤️",
    "A small token of gratitude for the huge difference you make in my life every day. Thank you so much! 🙏🎁"
  ],
  general: [
    "Sending you a little box of happiness and warm thoughts! Hope this surprise brightens your day and puts a big smile on your face. 🎁✨",
    "A special treat just for you! May your week be filled with peace, laughter, and delightful surprises. 🌸😊",
    "Thinking of you today and sending lots of good vibes your way. Enjoy this curated surprise box! ✨💝"
  ]
};

exports.generateGreeting = async (req, res, next) => {
  try {
    const { category = 'general', relation = 'Friend', occasion = 'Special Day' } = req.body;
    const catKey = (category || 'general').toLowerCase();

    const apiKey = process.env.OPENAI_API_KEY;
    const isPlaceholderKey = !apiKey || apiKey.includes('placeholder') || apiKey.includes('your_') || apiKey.length < 20;

    // ── Real GPT-4o-mini call if API key is active ─────────────────────────
    if (!isPlaceholderKey) {
      try {
        const systemPrompt = `You are Hardyy's expert AI gift writer. Craft a warm, heartfelt, and memorable greeting card message (approx 2 to 3 sentences, around 40-60 words) suitable for a printed luxury greeting card. Include appropriate emojis. Do not wrap in quotes or formatting.`;
        const userPrompt = `Write a ${catKey} greeting message for a ${relation} on the occasion of ${occasion}. Make it genuine and touching.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 150,
            temperature: 0.8
          }),
        });

        const data = await response.json();
        if (response.ok && data.choices && data.choices[0]?.message?.content) {
          return res.json({
            success: true,
            greeting: data.choices[0].message.content.trim(),
            source: 'ai'
          });
        }
      } catch (aiErr) {
        console.warn(`[AI Greeting Fallback] OpenAI call failed: ${aiErr.message}`);
      }
    }

    // ── Curated Mock / Fallback Path ───────────────────────────────────────
    const pool = MOCK_GREETINGS[catKey] || MOCK_GREETINGS.general;
    const greeting = pool[Math.floor(Math.random() * pool.length)];

    res.json({
      success: true,
      greeting,
      source: 'curated'
    });
  } catch (error) {
    next(error);
  }
};
