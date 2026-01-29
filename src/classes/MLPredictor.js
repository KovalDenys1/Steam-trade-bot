const { pool } = require('../database');

/**
 * MLPredictor class - Handles machine learning predictions for profitability
 */
class MLPredictor {
  constructor(config, marketAnalyzer) {
    this.config = config;
    this.analyzer = marketAnalyzer;
    this.weights = config.featureWeights;
  }

  /**
   * Predict profitability for an item
   * @param {string} itemName - Name of the item
   * @returns {Promise<Object>} Prediction result
   */
  async predict(itemName) {
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

      // Get historical success rate
      const historicalSuccess = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE type = 'sell' AND status = 'success') as successful_sells,
          COUNT(*) FILTER (WHERE type = 'buy' AND status = 'success') as successful_buys
        FROM transactions
        WHERE item_name = $1
      `, [itemName]);

      // Calculate trend and volatility
      const trend = await this.analyzer.calculateTrend(itemName, 48);
      const volatility = await this.analyzer.calculateVolatility(itemName, 48);

      // Calculate weighted score
      const scoreData = this._calculateScore(item, trend, volatility, historicalSuccess.rows[0]);

      // Determine prediction level
      let prediction = 'not_profitable';
      if (scoreData.score >= 70) prediction = 'highly_profitable';
      else if (scoreData.score >= 50) prediction = 'profitable';
      else if (scoreData.score >= 30) prediction = 'moderate';

      return {
        prediction,
        confidence: scoreData.score / 100,
        score: scoreData.score,
        reasons: scoreData.reasons,
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
   * Get ML recommendations for buying
   * @param {number} limit - Number of recommendations
   * @param {number} minConfidence - Minimum confidence score
   * @returns {Promise<Array>} Recommendations
   */
  async getRecommendations(limit = 10, minConfidence = 0.6) {
    try {
      // Get profitable items
      const items = await pool.query(`
        SELECT name, lowest_price, expected_profit, volume
        FROM items
        WHERE is_profitable = true
        ORDER BY expected_profit DESC
        LIMIT 50
      `);

      const recommendations = [];

      for (const item of items.rows) {
        const prediction = await this.predict(item.name);

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

  /**
   * Calculate weighted score for an item
   * @param {Object} item - Item data
   * @param {Object} trend - Trend analysis
   * @param {number} volatility - Volatility score
   * @param {Object} historical - Historical data
   * @returns {Object} Score and reasons
   */
  _calculateScore(item, trend, volatility, historical) {
    let score = 0;
    const reasons = [];

    // 1. Expected profit (weight from config)
    const profitWeight = this.weights.expectedProfit;
    if (item.expected_profit > 5) {
      score += profitWeight;
      reasons.push('High profit margin');
    } else if (item.expected_profit > 2) {
      score += profitWeight / 2;
      reasons.push('Moderate profit margin');
    }

    // 2. Volume (weight from config)
    const volumeWeight = this.weights.volume;
    if (item.volume > 50) {
      score += volumeWeight;
      reasons.push('High trading volume');
    } else if (item.volume > 10) {
      score += volumeWeight / 2;
      reasons.push('Moderate volume');
    }

    // 3. Price trend (weight from config)
    const trendWeight = this.weights.trend;
    if (trend.trend === 'rising' && trend.confidence > 0.5) {
      score += trendWeight;
      reasons.push('Rising price trend');
    } else if (trend.trend === 'stable') {
      score += trendWeight / 2;
      reasons.push('Stable price');
    } else if (trend.trend === 'falling') {
      score -= 10;
      reasons.push('Falling price (risky)');
    }

    // 4. Volatility (weight from config)
    const volatilityWeight = this.weights.volatility;
    if (volatility < 5) {
      score += volatilityWeight;
      reasons.push('Low volatility (stable)');
    } else if (volatility < 15) {
      score += volatilityWeight / 2;
      reasons.push('Moderate volatility');
    } else {
      score -= 5;
      reasons.push('High volatility (risky)');
    }

    // 5. Historical success rate (weight from config)
    const historyWeight = this.weights.historicalSuccess;
    if (historical.successful_sells > 0) {
      const rate = historical.successful_sells / (historical.successful_buys || 1);
      if (rate > 0.8) {
        score += historyWeight;
        reasons.push('Strong historical performance');
      } else if (rate > 0.5) {
        score += historyWeight / 2;
        reasons.push('Moderate historical performance');
      }
    }

    // Normalize score to 0-100
    const normalizedScore = Math.max(0, Math.min(100, score));

    return {
      score: normalizedScore,
      reasons
    };
  }

  /**
   * Update ML weights based on performance
   * @param {Object} newWeights - New weight configuration
   */
  updateWeights(newWeights) {
    this.weights = { ...this.weights, ...newWeights };
    console.log('✅ ML weights updated');
  }

  /**
   * Get current ML configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return {
      minConfidence: this.config.minConfidence,
      weights: this.weights
    };
  }
}

module.exports = MLPredictor;
