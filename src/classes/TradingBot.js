const axios = require('axios');
const { pool, logTransaction, logError } = require('../database');
const MarketAnalyzer = require('./MarketAnalyzer');
const MLPredictor = require('./MLPredictor');
const { getGame } = require('../games');

/**
 * TradingBot class - Handles buying and selling operations
 */
class TradingBot {
  constructor(steamClient, config, gameName = 'rust') {
    this.steamClient = steamClient;
    this.config = config;
    this.game = getGame(gameName);
    this.analyzer = new MarketAnalyzer(config.analytics);
    this.mlPredictor = new MLPredictor(config.ml, this.analyzer);
  }

  /**
   * Change game
   * @param {string} gameName - Name of the game (rust, csgo, dota2)
   */
  setGame(gameName) {
    this.game = getGame(gameName);
    console.log(`✅ Switched to ${this.game.name} (AppID: ${this.game.appId})`);
  }

  /**
   * Place a buy order for an item
   * @param {string} itemName - Name of the item
   * @param {number} price - Price in NOK
   * @returns {Promise<Object>}
   */
  async buy(itemName, price) {
    try {
      console.log(`🛒 [${this.game.name}] Placing buy order for ${itemName} at ${price.toFixed(2)} NOK`);

      const result = await this.steamClient.placeBuyOrder(
        itemName,
        price,
        this.game.appId,
        this.game.currency
      );

      console.log(`✅ Buy order placed successfully: ${itemName}`);
      await logTransaction(itemName, this.game.appId, this.game.name, 'buy', price, 1, 'success', 'Order placed successfully');

      return result;
    } catch (error) {
      console.error(`❌ Failed to place buy order for ${itemName}:`, error.message);
      await logTransaction(itemName, this.game.appId, this.game.name, 'buy', price, 1, 'failed', error.message);
      await logError('error', `Failed to place buy order for ${itemName}`, { price, error: error.message });
      throw error;
    }
  }

  /**
   * Buy top profitable items
   * @param {number} limit - Maximum number of items to buy
   * @param {number} budget - Total budget in NOK
   * @returns {Promise<Object>} Summary of purchases
   */
  async buyTop(limit = 3, budget = 100) {
    const result = await pool.query(`
      SELECT name, lowest_price, expected_profit, volume
      FROM items
      WHERE is_profitable = true AND volume > $1
      ORDER BY expected_profit DESC
      LIMIT $2
    `, [this.config.trading.minVolume, limit]);

    let spent = 0;
    let successCount = 0;
    const purchased = [];

    for (const item of result.rows) {
      const price = parseFloat(item.lowest_price) + 0.01;

      // Check blacklist
      if (this.config.blacklist.includes(item.name)) {
        console.log(`⛔ Skipping blacklisted item: ${item.name}`);
        continue;
      }

      // Check max price
      if (price > this.config.trading.maxPricePerItem) {
        console.log(`💸 Price too high (${price} NOK): ${item.name}`);
        continue;
      }

      // Check budget
      if (spent + price > budget) {
        console.log(`💰 Budget exhausted. Skipping ${item.name}`);
        break;
      }

      try {
        await this.buy(item.name, price);
        spent += price;
        successCount++;
        purchased.push({ name: item.name, price });

        // Rate limiting
        await this._delay(this.config.api.requestDelay);
      } catch (error) {
        console.error(`Failed to buy ${item.name}, continuing...`);
      }
    }

    console.log(`\n🧮 Summary: ${successCount} items purchased, Total: ${spent.toFixed(2)} NOK`);
    return { successCount, spent, purchased };
  }

  /**
   * Buy items using ML recommendations
   * @param {number} limit - Maximum number of items to buy
   * @param {number} budget - Total budget in NOK
   * @param {number} minConfidence - Minimum ML confidence
   * @returns {Promise<Object>} Summary of purchases
   */
  async buyML(limit = 5, budget = 200, minConfidence = null) {
    const confidence = minConfidence || this.config.ml.minConfidence;
    console.log(`🤖 Getting ML recommendations (min confidence: ${confidence})...\n`);

    const recommendations = await this.mlPredictor.getRecommendations(limit * 2, confidence);

    if (recommendations.length === 0) {
      console.log('⚠️ No ML recommendations found with sufficient confidence');
      return { successCount: 0, spent: 0, purchased: [] };
    }

    console.log(`📊 Found ${recommendations.length} ML-recommended items\n`);
    let spent = 0;
    let successCount = 0;
    const purchased = [];

    for (const rec of recommendations) {
      if (successCount >= limit) break;

      const price = parseFloat(rec.price) + 0.01;

      if (spent + price > budget) {
        console.log(`💰 Budget exhausted. Stopping.`);
        break;
      }

      console.log(`\n🎯 ${rec.name}`);
      console.log(`   ML Score: ${rec.mlScore.toFixed(1)}/100 (${(rec.confidence * 100).toFixed(0)}% confidence)`);
      console.log(`   Reasons: ${rec.reasons.join(', ')}`);
      console.log(`   Price: ${price.toFixed(2)} NOK, Expected profit: ${rec.expectedProfit.toFixed(2)} NOK`);

      try {
        await this.buy(rec.name, price);
        spent += price;
        successCount++;
        purchased.push({ name: rec.name, price, mlScore: rec.mlScore });

        await this._delay(this.config.api.requestDelay);
      } catch (error) {
        console.error(`Failed to buy ${rec.name}, continuing...`);
      }
    }

    console.log(`\n🧮 ML Summary: ${successCount} orders placed, Total: ${spent.toFixed(2)} NOK`);
    return { successCount, spent, purchased };
  }

  /**
   * Sell an item from inventory
   * @param {Object} item - Inventory item object
   * @param {number} sellPrice - Sell price in NOK
   * @returns {Promise<void>}
   */
  async sell(item, sellPrice) {
    const itemName = item.market_hash_name;

    try {
      console.log(`💰 [${this.game.name}] Listing ${itemName} for ${sellPrice.toFixed(2)} NOK`);

      await this.steamClient.sellMarketItem(
        this.game.appId,
        this.game.contextId,
        item.id,
        sellPrice
      );

      console.log(`✅ Successfully listed: ${itemName}`);
      await logTransaction(itemName, this.game.appId, this.game.name, 'sell', sellPrice, 1, 'success', 'Item listed for sale');
    } catch (error) {
      console.error(`❌ Failed to list ${itemName}:`, error.message);
      await logTransaction(itemName, this.game.appId, this.game.name, 'sell', sellPrice, 1, 'failed', error.message);
      await logError('error', `Failed to list ${itemName} for sale`, { price: sellPrice, error: error.message });
      throw error;
    }
  }

  /**
   * Auto-sell inventory items with dynamic pricing and risk management
   * @returns {Promise<Object>} Summary of sales
   */
  async autoSell() {
    console.log(`🔄 Starting auto-sell process for ${this.game.name}...\n`);

    const inventory = await this.steamClient.getInventory(
      this.game.appId,
      this.game.contextId
    );

    const marketable = inventory.filter(item => item.marketable);

    if (marketable.length === 0) {
      console.log('📦 No marketable items found.');
      return { successCount: 0, totalRevenue: 0 };
    }

    console.log(`🔎 Found ${marketable.length} marketable items.\n`);

    let successCount = 0;
    let totalRevenue = 0;

    for (const item of marketable) {
      const name = item.market_hash_name;

      try {
        // Fetch current market price
        const priceData = await this._fetchMarketPrice(name);
        if (!priceData) {
          console.log(`⚠️ No price data for ${name}\n`);
          continue;
        }

        // Get trend analysis
        const trend = await this.analyzer.calculateTrend(name, 24);

        // Check risk management
        const riskDecision = await this._checkRiskManagement(name, priceData.median);

        console.log(`📊 ${name}`);
        console.log(`   Market: ${priceData.median.toFixed(2)} NOK, Volume: ${priceData.volume}, Trend: ${trend.trend}`);
        console.log(`   Risk: ${riskDecision.message}`);

        if (!riskDecision.shouldSell) {
          console.log(`   ⏳ Holding item\n`);
          continue;
        }

        // Calculate dynamic sell price
        const markup = this._calculateDynamicMarkup(priceData.volume, trend.trend, priceData.median);
        const sellPrice = Math.max(priceData.median * (1 + markup), 1.00);

        console.log(`   💰 Dynamic markup: ${(markup * 100).toFixed(1)}%`);
        console.log(`   🎯 Listing at: ${sellPrice.toFixed(2)} NOK`);

        if (riskDecision.urgency === 'urgent') {
          console.log(`   🚨 ${riskDecision.reason.toUpperCase()}: Selling immediately!`);
        }

        await this.sell(item, sellPrice);
        successCount++;
        totalRevenue += sellPrice;

        console.log('');
        await this._delay(2000);
      } catch (error) {
        console.error(`⚠️ Failed to process ${name}:`, error.message);
        await logError('error', `Failed to process ${name}`, { error: error.message });
      }
    }

    console.log(`✅ Auto-sell completed: ${successCount} items listed, Total revenue: ${totalRevenue.toFixed(2)} NOK`);
    return { successCount, totalRevenue };
  }

  /**
   * Fetch market price for an item
   * @param {string} itemName - Name of the item
   * @returns {Promise<Object|null>} Price data
   */
  async _fetchMarketPrice(itemName) {
    try {
      const response = await axios.get('https://steamcommunity.com/market/priceoverview/', {
        params: {
          appid: this.game.appId,
          currency: this.game.currency,
          market_hash_name: itemName
        },
        headers: {
          'Cookie': this.steamClient.getCookieHeader(),
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const data = response.data;
      if (!data.success || !data.median_price) return null;

      const median = parseFloat(data.median_price.replace(/[^\d,.-]/g, '').replace(',', '.'));
      const volume = parseInt(data.volume?.replace(/[^\d]/g, '') || '0');

      return { median, volume };
    } catch (error) {
      console.error(`Error fetching price for ${itemName}:`, error.message);
      return null;
    }
  }

  /**
   * Calculate dynamic markup based on market conditions
   * @param {number} volume - Trading volume
   * @param {string} trend - Price trend
   * @param {number} median - Median price
   * @returns {number} Markup percentage
   */
  _calculateDynamicMarkup(volume, trend, median) {
    const cfg = this.config.dynamicPricing;
    let markup = cfg.baseMarkup;

    // Volume adjustment
    if (volume > cfg.highVolumeThreshold) {
      markup += cfg.highVolumeBonus;
    } else if (volume > cfg.highVolumeThreshold / 2) {
      markup += cfg.highVolumeBonus / 2;
    } else if (volume < 10) {
      markup -= 0.02;
    }

    // Trend adjustment
    if (trend === 'rising') markup += cfg.risingTrendBonus;
    else if (trend === 'falling') markup += cfg.fallingTrendPenalty;

    // Price range adjustment
    if (median > 100) markup -= 0.03;
    else if (median > 50) markup -= 0.01;

    return Math.max(cfg.minMarkup, Math.min(cfg.maxMarkup, markup));
  }

  /**
   * Check risk management rules
   * @param {string} itemName - Name of the item
   * @param {number} currentPrice - Current market price
   * @returns {Promise<Object>} Risk decision
   */
  async _checkRiskManagement(itemName, currentPrice) {
    try {
      const result = await pool.query(`
        SELECT price, timestamp
        FROM transactions
        WHERE item_name = $1 AND type = 'buy' AND status = 'success'
        ORDER BY timestamp DESC
        LIMIT 1
      `, [itemName]);

      if (result.rows.length === 0) {
        return { shouldSell: true, reason: 'no_purchase_history', urgency: 'normal' };
      }

      const buyPrice = result.rows[0].price;
      const profitPercent = ((currentPrice - buyPrice) / buyPrice) * 100;

      // Stop-loss
      if (profitPercent < -this.config.riskManagement.stopLossPercent) {
        return {
          shouldSell: true,
          reason: 'stop_loss',
          urgency: 'urgent',
          message: `Stop-loss triggered: ${profitPercent.toFixed(1)}% loss`
        };
      }

      // Take-profit
      if (profitPercent > this.config.riskManagement.takeProfitPercent) {
        return {
          shouldSell: true,
          reason: 'take_profit',
          urgency: 'high',
          message: `Take-profit triggered: ${profitPercent.toFixed(1)}% profit`
        };
      }

      // Minimum profit
      if (currentPrice - buyPrice >= this.config.riskManagement.minProfitToSell) {
        return {
          shouldSell: true,
          reason: 'profit',
          urgency: 'normal',
          message: `Profitable: +${(currentPrice - buyPrice).toFixed(2)} NOK`
        };
      }

      return {
        shouldSell: false,
        reason: 'holding',
        urgency: 'low',
        message: `Holding: ${profitPercent.toFixed(1)}% (bought at ${buyPrice.toFixed(2)})`
      };
    } catch (error) {
      console.error(`Error checking risk management for ${itemName}:`, error.message);
      return { shouldSell: true, reason: 'error', urgency: 'normal' };
    }
  }

  /**
   * Delay helper for rate limiting
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  async _delay(ms) {
    const variance = Math.random() * this.config.api.requestDelayRange;
    return new Promise(resolve => setTimeout(resolve, ms + variance));
  }
}

module.exports = TradingBot;
