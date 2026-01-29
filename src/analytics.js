const { pool } = require('./database');

/**
 * Calculate price trend for an item based on historical data
 * @param {string} itemName - Name of the item
 * @param {number} hours - Number of hours to look back (default: 24)
 * @returns {Promise<Object>} Trend analysis result
 */
async function calculateTrend(itemName, hours = 24) {
  try {
    const result = await pool.query(`
      SELECT lowest_price, median_price, volume, timestamp
      FROM price_history
      WHERE item_name = $1
        AND timestamp > NOW() - INTERVAL '${hours} hours'
      ORDER BY timestamp ASC
    `, [itemName]);

    if (result.rows.length < 2) {
      return { trend: 'insufficient_data', confidence: 0 };
    }

    const prices = result.rows.map(r => r.lowest_price);
    const volumes = result.rows.map(r => r.volume);

    // Calculate linear regression for price trend
    const n = prices.length;
    const sumX = prices.reduce((sum, _, i) => sum + i, 0);
    const sumY = prices.reduce((sum, p) => sum + p, 0);
    const sumXY = prices.reduce((sum, p, i) => sum + i * p, 0);
    const sumX2 = prices.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / n;
    const priceChange = ((prices[n - 1] - prices[0]) / prices[0]) * 100;

    // Determine trend
    let trend = 'stable';
    if (slope > 0.1) trend = 'rising';
    else if (slope < -0.1) trend = 'falling';

    return {
      trend,
      slope: parseFloat(slope.toFixed(4)),
      priceChange: parseFloat(priceChange.toFixed(2)),
      avgVolume: Math.round(avgVolume),
      dataPoints: n,
      confidence: Math.min(n / 10, 1) // More data = higher confidence
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
async function getTrendingItems(trendType = 'rising', limit = 10) {
  try {
    const items = await pool.query(`
      SELECT DISTINCT item_name
      FROM price_history
      WHERE timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY item_name
      HAVING COUNT(*) >= 5
    `);

    const trends = [];
    for (const item of items.rows) {
      const trend = await calculateTrend(item.item_name, 24);
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
async function calculateVolatility(itemName, hours = 24) {
  try {
    const result = await pool.query(`
      SELECT lowest_price
      FROM price_history
      WHERE item_name = $1
        AND timestamp > NOW() - INTERVAL '${hours} hours'
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

module.exports = {
  calculateTrend,
  getTrendingItems,
  calculateVolatility
};
