const fs = require('fs');
const path = require('path');
const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const { logError } = require('../database');

/**
 * SteamClient class - Handles Steam authentication and session management
 */
class SteamClient {
  constructor(credentials) {
    this.credentials = credentials;
    this.client = new SteamUser();
    this.community = new SteamCommunity();
    this.cookies = null;
    this.sessionID = null;
    this.isAuthenticated = false;
  }

  /**
   * Login to Steam with credentials
   * @returns {Promise<void>}
   */
  async login() {
    return new Promise((resolve, reject) => {
      const logOnOptions = {
        accountName: this.credentials.username,
        password: this.credentials.password,
        twoFactorCode: SteamTotp.generateAuthCode(this.credentials.sharedSecret)
      };

      // Handle logged on event
      this.client.once('loggedOn', () => {
        console.log(`✅ Logged into Steam as ${this.client.steamID.getSteam3RenderedID()}`);
        this.isAuthenticated = true;
      });

      // Handle web session event
      this.client.once('webSession', (sessionID, cookies) => {
        console.log('🌐 Web session acquired');
        this.sessionID = sessionID;
        this.cookies = cookies;
        this.community.setCookies(cookies);
        resolve();
      });

      // Handle errors
      this.client.once('error', async (err) => {
        console.error('❌ Login failed:', err.message);
        await logError('error', 'Steam login failed', { error: err.message });
        reject(err);
      });

      // Start login
      this.client.logOn(logOnOptions);
    });
  }

  /**
   * Save cookies to file
   * @param {string} filePath - Path to save cookies
   * @returns {Promise<void>}
   */
  async saveCookies(filePath = './cookies.json') {
    if (!this.cookies || !this.sessionID) {
      throw new Error('No cookies to save. Please login first.');
    }

    const data = {
      sessionID: this.sessionID,
      cookies: this.cookies
    };

    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
        if (err) {
          console.error('❌ Failed to save cookies:', err.message);
          reject(err);
        } else {
          console.log(`✅ Cookies saved to ${filePath}`);
          resolve();
        }
      });
    });
  }

  /**
   * Load cookies from file
   * @param {string} filePath - Path to cookies file
   * @returns {Promise<void>}
   */
  async loadCookies(filePath = './cookies.json') {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          console.error('❌ Failed to load cookies:', err.message);
          reject(err);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          this.sessionID = parsed.sessionID;
          this.cookies = parsed.cookies;
          this.community.setCookies(this.cookies);
          this.isAuthenticated = true;
          console.log('✅ Cookies loaded successfully');
          resolve();
        } catch (parseErr) {
          console.error('❌ Failed to parse cookies:', parseErr.message);
          reject(parseErr);
        }
      });
    });
  }

  /**
   * Get inventory contents
   * @param {number} appid - Steam AppID
   * @param {number} contextid - Inventory context ID
   * @returns {Promise<Array>}
   */
  async getInventory(appid, contextid) {
    return new Promise((resolve, reject) => {
      this.community.getMyInventoryContents(appid, contextid, true, (err, inventory) => {
        if (err) {
          reject(err);
        } else {
          resolve(inventory);
        }
      });
    });
  }

  /**
   * Place a buy order on Steam Market
   * @param {string} itemName - Market hash name of the item
   * @param {number} price - Price in currency units (NOK)
   * @param {number} appid - Steam AppID
   * @param {number} currency - Currency code
   * @returns {Promise<Object>}
   */
  async placeBuyOrder(itemName, price, appid = 252490, currency = 20) {
    return new Promise((resolve, reject) => {
      const priceInCents = Math.round(price * 100);

      const options = {
        market_hash_name: itemName,
        appid: appid,
        currency: currency,
        price: priceInCents,
        quantity: 1
      };

      this.community.buyMarketItem(options, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Sell an item on Steam Market
   * @param {number} appid - Steam AppID
   * @param {number} contextid - Context ID
   * @param {string} assetid - Asset ID of the item
   * @param {number} price - Sell price in currency units
   * @returns {Promise<void>}
   */
  async sellMarketItem(appid, contextid, assetid, price) {
    return new Promise((resolve, reject) => {
      const priceInCents = Math.round(price * 100);

      this.community.sellMarketItem({
        appid: appid,
        contextid: contextid,
        assetid: assetid,
        amount: 1,
        price: priceInCents
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Start confirmation checker for trade offers
   * @param {number} interval - Check interval in milliseconds
   * @returns {void}
   */
  startConfirmationChecker(interval = 20000) {
    if (!this.credentials.identitySecret) {
      console.warn('⚠️ Identity secret not provided. Confirmation checker disabled.');
      return;
    }
    this.community.startConfirmationChecker(interval, this.credentials.identitySecret);
    console.log(`✅ Confirmation checker started (interval: ${interval}ms)`);
  }

  /**
   * Get cookie header string for HTTP requests
   * @returns {string}
   */
  getCookieHeader() {
    if (!this.cookies) {
      throw new Error('No cookies available. Please login first.');
    }
    return this.cookies.map(c => `${c.name}=${c.value}`).join('; ');
  }

  /**
   * Check if client is authenticated
   * @returns {boolean}
   */
  isLoggedIn() {
    return this.isAuthenticated && this.cookies !== null;
  }
}

module.exports = SteamClient;
