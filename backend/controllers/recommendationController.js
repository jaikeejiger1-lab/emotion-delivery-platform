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
