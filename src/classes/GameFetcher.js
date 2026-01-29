const axios = require('axios');
const { upsertItem } = require('./database');
const { getGame } = require('./games');

/**
 * GameFetcher class - Fetches and stores prices for different games
 */
class GameFetcher {
  constructor(steamClient, config, gameName = 'rust') {
    this.steamClient = steamClient;
    this.config = config;
    this.game = getGame(gameName);
    this.commission = config.trading.commissionRate;
  }

  /**
   * Fetch price for a specific item
   * @param {string} itemName - Name of the item
   * @returns {Promise<Object|null>} Item data
   */
  async fetchPrice(itemName) {
    try {
      const response = await axios.get('https://steamcommunity.com/market/priceoverview/', {
        headers: {
          'Cookie': this.steamClient.getCookieHeader(),
          'User-Agent': 'Mozilla/5.0'
        },
        params: {
          appid: this.game.appId,
          currency: this.game.currency,
          country: 'NO',
          market_hash_name: itemName
        }
      });

      const data = response.data;
      if (data.success && data.lowest_price && data.median_price) {
        console.log(`💬 [${this.game.name}] ${itemName} → lowest: ${data.lowest_price}, median: ${data.median_price}`);

        const lowest = parseFloat(data.lowest_price.replace(/[^\d,.-]/g, '').replace(',', '.'));
        const median = parseFloat(data.median_price.replace(/[^\d,.-]/g, '').replace(',', '.'));
        const volume = parseInt(data.volume?.replace(/[^\d]/g, '') || '0');

        const profit = median * (1 - this.commission) - lowest;
        const isProfitable = profit > this.config.trading.minProfitMargin;

        return {
          name: itemName,
          appid: this.game.appId,
          game: this.game.name,
          lowest_price: lowest,
          median_price: median,
          volume,
          expected_profit: parseFloat(profit.toFixed(2)),
          is_profitable: isProfitable
        };
      }
    } catch (err) {
      console.error(`❌ Error fetching ${itemName}:`, err.message);
    }

    return null;
  }

  /**
   * Fetch and store prices for all items in the game
   * @returns {Promise<Object>} Summary of fetched items
   */
  async fetchAll() {
    console.log(`\n🎮 Fetching prices for ${this.game.name} (${this.game.items.length} items)...\n`);

    let successCount = 0;
    let failCount = 0;

    for (const item of this.game.items) {
      const data = await this.fetchPrice(item);
      if (data) {
        console.log(`💾 Saving ${data.name}: profit ~${data.expected_profit} NOK`);
        await upsertItem(data);
        successCount++;
      } else {
        failCount++;
      }

      // Rate limiting with variance
      const delay = this.config.api.requestDelay + Math.random() * this.config.api.requestDelayRange;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const summary = {
      game: this.game.name,
      appId: this.game.appId,
      total: this.game.items.length,
      success: successCount,
      failed: failCount
    };

    console.log(`\n✅ [${this.game.name}] Completed: ${successCount} success, ${failCount} failed\n`);
    return summary;
  }

  /**
   * Fetch prices for specific items
   * @param {Array<string>} itemNames - Array of item names
   * @returns {Promise<Array>} Array of item data
   */
  async fetchItems(itemNames) {
    console.log(`\n🎮 Fetching ${itemNames.length} items for ${this.game.name}...\n`);

    const results = [];

    for (const itemName of itemNames) {
      const data = await this.fetchPrice(itemName);
      if (data) {
        await upsertItem(data);
        results.push(data);
      }

      const delay = this.config.api.requestDelay + Math.random() * this.config.api.requestDelayRange;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return results;
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
   * Get current game info
   * @returns {Object} Current game configuration
   */
  getCurrentGame() {
    return {
      name: this.game.name,
      appId: this.game.appId,
      itemCount: this.game.items.length
    };
  }
}

module.exports = GameFetcher;
