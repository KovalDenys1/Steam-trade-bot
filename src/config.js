/**
 * Trading Bot Configuration
 * Adjust these settings to customize bot behavior
 */

module.exports = {
  // Trading settings
  trading: {
    maxPricePerItem: 100,        // Maximum price per item in NOK
    minVolume: 5,                // Minimum trading volume to consider
    minProfitMargin: 2,          // Minimum expected profit in NOK
    commissionRate: 0.15,        // Steam market commission (15%)
  },

  // Risk management
  riskManagement: {
    stopLossPercent: 10,         // Sell if loss exceeds this %
    takeProfitPercent: 20,       // Sell when profit reaches this %
    minProfitToSell: 0.50,       // Minimum profit in NOK before selling
  },

  // ML settings
  ml: {
    minConfidence: 0.7,          // Minimum confidence for ML predictions (0-1)
    featureWeights: {
      expectedProfit: 30,        // Weight for profit margin
      volume: 20,                // Weight for trading volume
      trend: 25,                 // Weight for price trend
      volatility: 15,            // Weight for price volatility
      historicalSuccess: 10,     // Weight for past performance
    },
  },

  // Dynamic pricing
  dynamicPricing: {
    baseMarkup: 0.05,            // Base markup percentage (5%)
    highVolumeThreshold: 100,    // Volume threshold for "high demand"
    highVolumeBonus: 0.10,       // Extra markup for high volume
    risingTrendBonus: 0.08,      // Extra markup for rising prices
    fallingTrendPenalty: -0.05,  // Reduce markup for falling prices
    maxMarkup: 0.25,             // Maximum markup (25%)
    minMarkup: -0.05,            // Minimum markup (-5%)
  },

  // API settings
  api: {
    appId: 252490,               // Rust AppID
    currency: 20,                // Currency code for NOK
    contextId: 2,                // Steam inventory context
    requestDelay: 2500,          // Delay between API requests (ms)
    requestDelayRange: 2000,     // Random delay variance (ms)
  },

  // Blacklist (items to never buy)
  blacklist: [
    // Add item names here to exclude them
    // Example: 'Tempered Rock', 'Jester Mask'
  ],

  // Analytics
  analytics: {
    trendHours: 24,              // Hours to analyze for trends
    minDataPoints: 5,            // Minimum data points for trend analysis
    volatilityWindow: 24,        // Hours for volatility calculation
  },
};
