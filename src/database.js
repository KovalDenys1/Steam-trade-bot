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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE,
      appid INTEGER,
      lowest_price REAL,
      median_price REAL,
      volume INTEGER,
      last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expected_profit REAL,
      is_profitable BOOLEAN
    )
  `);
}

async function upsertItem(item) {
  await pool.query(`
    INSERT INTO items (name, appid, lowest_price, median_price, volume, last_checked, expected_profit, is_profitable)
    VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
    ON CONFLICT (name) DO UPDATE SET
      lowest_price = EXCLUDED.lowest_price,
      median_price = EXCLUDED.median_price,
      volume = EXCLUDED.volume,
      last_checked = NOW(),
      expected_profit = EXCLUDED.expected_profit,
      is_profitable = EXCLUDED.is_profitable
  `, [
    item.name,
    item.appid,
    item.lowest_price,
    item.median_price,
    item.volume,
    item.expected_profit,
    item.is_profitable
  ]);
}

module.exports = { pool, upsertItem, initDB };
