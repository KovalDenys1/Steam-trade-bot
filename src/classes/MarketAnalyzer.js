const { pool } = require('../database');

/**
 * MarketAnalyzer class - Handles price trend analysis and market analytics
 */
class MarketAnalyzer {
  constructor(config = {}) {
    this.trendHours = config.trendHours || 24;
    this.minDataPoints = config.minDataPoints || 5;
    this.volatilityWindow = config.volatilityWindow || 24;
  }

  /**
   * Calculate price trend for an item based on historical data
   * @param {string} itemName - Name of the item
   * @param {number} hours - Number of hours to look back
   * @returns {Promise<Object>} Trend analysis result
   */
  async calculateTrend(itemName, hours = null) {
    const lookbackHours = hours || this.trendHours;

    try {
      const result = await pool.query(`
        SELECT lowest_price, median_price, volume, timestamp
        FROM price_history
        WHERE item_name = $1
          AND timestamp > NOW() - INTERVAL '${lookbackHours} hours'
        ORDER BY timestamp ASC
      `, [itemName]);

      if (result.rows.length < 2) {
        return { trend: 'insufficient_data', confidence: 0 };
      }

      const prices = result.rows.map(r => r.lowest_price);
      const volumes = result.rows.map(r => r.volume);

      // Calculate linear regression for price trend
      const stats = this._calculateLinearRegression(prices);
      const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
      const priceChange = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;

      // Determine trend
      let trend = 'stable';
      if (stats.slope > 0.1) trend = 'rising';
      else if (stats.slope < -0.1) trend = 'falling';

      return {
        trend,
        slope: parseFloat(stats.slope.toFixed(4)),
        priceChange: parseFloat(priceChange.toFixed(2)),
        avgVolume: Math.round(avgVolume),
        dataPoints: prices.length,
        confidence: Math.min(prices.length / this.minDataPoints, 1)
      };
    } catch (error) {
      console.error(`Error calculating trend for ${itemName}:`, error.message);
      return { trend: 'error', confidence: 0 };
    }
  }

  /**
   * Get items with the strongest price trends
   * @param {string} trendType - 'rising' or 'falling'
   * @param {number} limit - Number of items to return
   * @returns {Promise<Array>} List of trending items
   */
  async getTrendingItems(trendType = 'rising', limit = 10) {
    try {
      const items = await pool.query(`
        SELECT DISTINCT item_name
        FROM price_history
        WHERE timestamp > NOW() - INTERVAL '${this.trendHours} hours'
        GROUP BY item_name
        HAVING COUNT(*) >= ${this.minDataPoints}
      `);

      const trends = [];
      for (const item of items.rows) {
        const trend = await this.calculateTrend(item.item_name);
        if (trend.trend === trendType && trend.confidence > 0.5) {
          trends.push({
            name: item.item_name,
            ...trend
          });
        }
      }

      // Sort by absolute slope
      trends.sort((a, b) => Math.abs(b.slope) - Math.abs(a.slope));
      return trends.slice(0, limit);
    } catch (error) {
      console.error('Error getting trending items:', error.message);
      return [];
    }
  }

  /**
   * Calculate volatility (price fluctuation) for an item
   * @param {string} itemName - Name of the item
   * @param {number} hours - Hours to look back
   * @returns {Promise<number>} Volatility score (0-100)
   */
  async calculateVolatility(itemName, hours = null) {
    const lookbackHours = hours || this.volatilityWindow;

    try {
      const result = await pool.query(`
        SELECT lowest_price
        FROM price_history
        WHERE item_name = $1
          AND timestamp > NOW() - INTERVAL '${lookbackHours} hours'
        ORDER BY timestamp ASC
      `, [itemName]);

      if (result.rows.length < 3) return 0;

      const prices = result.rows.map(r => r.lowest_price);
      const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
      const stdDev = Math.sqrt(variance);

      // Normalize volatility as percentage of mean
      const volatility = (stdDev / mean) * 100;
      return parseFloat(volatility.toFixed(2));
    } catch (error) {
      console.error(`Error calculating volatility for ${itemName}:`, error.message);
      return 0;
    }
  }

  /**
   * Get price history for an item
   * @param {string} itemName - Name of the item
   * @param {number} hours - Hours to look back
   * @returns {Promise<Array>} Price history records
   */
  async getPriceHistory(itemName, hours = 24) {
    try {
      const result = await pool.query(`
        SELECT lowest_price, median_price, volume, timestamp
        FROM price_history
        WHERE item_name = $1
          AND timestamp > NOW() - INTERVAL '${hours} hours'
        ORDER BY timestamp ASC
      `, [itemName]);

      return result.rows;
    } catch (error) {
      console.error(`Error getting price history for ${itemName}:`, error.message);
      return [];
    }
  }

  /**
   * Get market statistics
   * @returns {Promise<Object>} Market statistics
   */
  async getMarketStats() {
    try {
      const totalItems = await pool.query('SELECT COUNT(DISTINCT name) as count FROM items');
      const profitableItems = await pool.query('SELECT COUNT(*) as count FROM items WHERE is_profitable = true');
      const avgProfit = await pool.query('SELECT AVG(expected_profit) as avg FROM items WHERE is_profitable = true');
      const highVolume = await pool.query('SELECT COUNT(*) as count FROM items WHERE volume > 50');

      return {
        totalItems: totalItems.rows[0].count,
        profitableItems: profitableItems.rows[0].count,
        avgExpectedProfit: parseFloat(avgProfit.rows[0].avg || 0).toFixed(2),
        highVolumeItems: highVolume.rows[0].count
      };
    } catch (error) {
      console.error('Error getting market stats:', error.message);
      return null;
    }
  }

  /**
   * Private: Calculate linear regression
   * @param {Array<number>} values - Array of values
   * @returns {Object} Slope and intercept
   */
  _calculateLinearRegression(values) {
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
    const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }
}

module.exports = MarketAnalyzer;
