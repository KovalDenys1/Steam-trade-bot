const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});


async function initDB() {
  // Main items table with game support
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT,
      appid INTEGER,
      game VARCHAR(20),
      lowest_price REAL,
      median_price REAL,
      volume INTEGER,
      last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expected_profit REAL,
      is_profitable BOOLEAN,
      UNIQUE(name, appid)
    );
    CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
    CREATE INDEX IF NOT EXISTS idx_items_game ON items(game);
    CREATE INDEX IF NOT EXISTS idx_items_appid ON items(appid);
    CREATE INDEX IF NOT EXISTS idx_items_profitable ON items(is_profitable);
    CREATE INDEX IF NOT EXISTS idx_items_volume ON items(volume);
  `);

  // Transaction history with game support
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      item_name TEXT,
      appid INTEGER,
      game VARCHAR(20),
      type VARCHAR(10), -- 'buy' or 'sell'
      price REAL,
      volume INTEGER,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20),
      details TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_game ON transactions(game);
    CREATE INDEX IF NOT EXISTS idx_transactions_appid ON transactions(appid);
  `);

  // Bot configuration
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // System logs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id SERIAL PRIMARY KEY,
      level VARCHAR(10),
      message TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      meta TEXT
    );
  `);

  // Price history for trend analysis with game support
  await pool.query(`
    CREATE TABLE IF NOT EXISTS price_history (
      id SERIAL PRIMARY KEY,
      item_name TEXT,
      appid INTEGER,
      game VARCHAR(20),
      lowest_price REAL,
      median_price REAL,
      volume INTEGER,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_price_history_item ON price_history(item_name);
    CREATE INDEX IF NOT EXISTS idx_price_history_game ON price_history(game);
    CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp);
  `);
}

async function upsertItem(item) {
  await pool.query(`
    INSERT INTO items (name, appid, game, lowest_price, median_price, volume, last_checked, expected_profit, is_profitable)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)
    ON CONFLICT (name, appid) DO UPDATE SET
      lowest_price = EXCLUDED.lowest_price,
      median_price = EXCLUDED.median_price,
      volume = EXCLUDED.volume,
      last_checked = NOW(),
      expected_profit = EXCLUDED.expected_profit,
      is_profitable = EXCLUDED.is_profitable
  `, [
    item.name,
    item.appid,
    item.game,
    item.lowest_price,
    item.median_price,
    item.volume,
    item.expected_profit,
    item.is_profitable
  ]);

  // Save to price history
  await pool.query(`
    INSERT INTO price_history (item_name, appid, game, lowest_price, median_price, volume)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [item.name, item.appid, item.game, item.lowest_price, item.median_price, item.volume]);
}

/**
 * Log a transaction to the database
 * @param {string} itemName - Name of the item
 * @param {number} appId - Game AppID
 * @param {string} game - Game name
 * @param {string} type - 'buy' or 'sell'
 * @param {number} price - Price in NOK
 * @param {number} volume - Volume/quantity
 * @param {string} status - Transaction status
 * @param {string} details - Additional details
 */
async function logTransaction(itemName, appId, game, type, price, volume, status, details = '') {
  try {
    await pool.query(`
      INSERT INTO transactions (item_name, appid, game, type, price, volume, status, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [itemName, appId, game, type, price, volume, status, details]);
  } catch (error) {
    console.error('Failed to log transaction:', error.message);
  }
}

/**
 * Log an error to the database
 * @param {string} level - Error level (error, warn, info)
 * @param {string} message - Error message
 * @param {object} meta - Additional metadata
 */
async function logError(level, message, meta = {}) {
  try {
    await pool.query(`
      INSERT INTO logs (level, message, meta)
      VALUES ($1, $2, $3)
    `, [level, message, JSON.stringify(meta)]);
  } catch (error) {
    console.error('Failed to log error:', error.message);
  }
}

module.exports = { pool, upsertItem, initDB, logTransaction, logError };
