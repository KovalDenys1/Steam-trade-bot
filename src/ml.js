const { pool } = require('./database');
const { calculateTrend, calculateVolatility } = require('./analytics');

/**
 * Simple ML-based profitability prediction using historical data
 * @param {string} itemName - Name of the item
 * @returns {Promise<Object>} Prediction result with confidence score
 */
async function predictProfitability(itemName) {
  try {
    // Get current item data
    const currentData = await pool.query(`
      SELECT lowest_price, median_price, volume, expected_profit, is_profitable
      FROM items
      WHERE name = $1
    `, [itemName]);

    if (currentData.rows.length === 0) {
      return { prediction: 'unknown', confidence: 0, reason: 'No data' };
    }

    const item = currentData.rows[0];

    // Get historical success rate for similar items
    const historicalSuccess = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE type = 'sell' AND status = 'success') as successful_sells,
        COUNT(*) FILTER (WHERE type = 'buy' AND status = 'success') as successful_buys
      FROM transactions
      WHERE item_name = $1
    `, [itemName]);

    // Calculate trend and volatility
    const trend = await calculateTrend(itemName, 48);
    const volatility = await calculateVolatility(itemName, 48);

    // Feature scoring (simple weighted model)
    let score = 0;
    let reasons = [];

    // 1. Expected profit (weight: 30%)
    if (item.expected_profit > 5) {
      score += 30;
      reasons.push('High profit margin');
    } else if (item.expected_profit > 2) {
      score += 15;
      reasons.push('Moderate profit margin');
    }

    // 2. Volume (weight: 20%)
    if (item.volume > 50) {
      score += 20;
      reasons.push('High trading volume');
    } else if (item.volume > 10) {
      score += 10;
      reasons.push('Moderate volume');
    }

    // 3. Price trend (weight: 25%)
    if (trend.trend === 'rising' && trend.confidence > 0.5) {
      score += 25;
      reasons.push('Rising price trend');
    } else if (trend.trend === 'stable') {
      score += 12;
      reasons.push('Stable price');
    } else if (trend.trend === 'falling') {
      score -= 10;
      reasons.push('Falling price (risky)');
    }

    // 4. Volatility (weight: 15%)
    if (volatility < 5) {
      score += 15;
      reasons.push('Low volatility (stable)');
    } else if (volatility < 15) {
      score += 8;
      reasons.push('Moderate volatility');
    } else {
      score -= 5;
      reasons.push('High volatility (risky)');
    }

    // 5. Historical success rate (weight: 10%)
    const successRate = historicalSuccess.rows[0];
    if (successRate.successful_sells > 0) {
      const rate = successRate.successful_sells / (successRate.successful_buys || 1);
      if (rate > 0.8) {
        score += 10;
        reasons.push('Strong historical performance');
      } else if (rate > 0.5) {
        score += 5;
        reasons.push('Moderate historical performance');
      }
    }

    // Normalize score to 0-100
    const normalizedScore = Math.max(0, Math.min(100, score));

    // Determine prediction
    let prediction = 'not_profitable';
    if (normalizedScore >= 70) prediction = 'highly_profitable';
    else if (normalizedScore >= 50) prediction = 'profitable';
    else if (normalizedScore >= 30) prediction = 'moderate';

    return {
      prediction,
      confidence: normalizedScore / 100,
      score: normalizedScore,
      reasons,
      features: {
        expectedProfit: item.expected_profit,
        volume: item.volume,
        trend: trend.trend,
        volatility,
        priceChange: trend.priceChange
      }
    };
  } catch (error) {
    console.error(`Error predicting profitability for ${itemName}:`, error.message);
    return { prediction: 'error', confidence: 0, reason: error.message };
  }
}

/**
 * Get ML-enhanced recommendations for items to buy
 * @param {number} limit - Number of recommendations
 * @param {number} minConfidence - Minimum confidence score (0-1)
 * @returns {Promise<Array>} List of recommended items with ML scores
 */
async function getMLRecommendations(limit = 10, minConfidence = 0.6) {
  try {
    // Get all profitable items
    const items = await pool.query(`
      SELECT name, lowest_price, expected_profit, volume
      FROM items
      WHERE is_profitable = true
      ORDER BY expected_profit DESC
      LIMIT 50
    `);

    const recommendations = [];

    for (const item of items.rows) {
      const prediction = await predictProfitability(item.name);

      if (prediction.confidence >= minConfidence) {
        recommendations.push({
          name: item.name,
          price: item.lowest_price,
          expectedProfit: item.expected_profit,
          mlScore: prediction.score,
          confidence: prediction.confidence,
          prediction: prediction.prediction,
          reasons: prediction.reasons
        });
      }
    }

    // Sort by ML score
    recommendations.sort((a, b) => b.mlScore - a.mlScore);
    return recommendations.slice(0, limit);
  } catch (error) {
    console.error('Error getting ML recommendations:', error.message);
    return [];
  }
}

module.exports = {
  predictProfitability,
  getMLRecommendations
};
