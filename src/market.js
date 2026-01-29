const fs = require('fs');
const SteamCommunity = require('steamcommunity');
const { logTransaction, logError } = require('./database');
const { getMLRecommendations } = require('./ml');

const { cookies } = JSON.parse(fs.readFileSync('./cookies.json', 'utf-8'));
const community = new SteamCommunity();

community.setCookies(cookies);

function placeBuyOrder(itemName, priceEUR) {
  return new Promise((resolve, reject) => {
    const marketHashName = itemName;
    const priceInCents = Math.round(priceEUR * 100);

    const options = {
      market_hash_name: marketHashName,
      appid: 252490,
      currency: 20, // 20 = NOK
      price: priceInCents,
      quantity: 1
    };

    community.buyMarketItem(options, async (err, result) => {
      if (err) {
        console.error(`❌ Error placing order for ${itemName}:`, err.message);
        await logTransaction(itemName, 'buy', priceEUR, 1, 'failed', err.message);
        await logError('error', `Failed to place buy order for ${itemName}`, { price: priceEUR, error: err.message });
        return reject(err);
      }

      console.log(`✅ Buy order for '${itemName}' at ${priceEUR.toFixed(2)} kr successfully placed.`);
      await logTransaction(itemName, 'buy', priceEUR, 1, 'success', 'Order placed successfully');
      resolve(result);
    });
  });
}

const { pool } = require('./database');


// Максимальная цена за предмет (NOK)
const MAX_PRICE = 100;
// Blacklist предметов (названия)
const BLACKLIST = [
  // Пример: 'Tempered Rock', 'Jester Mask'
];

async function placeTopOrders(limit = 3, budget = 100, maxPrice = MAX_PRICE, blacklist = BLACKLIST) {
  const res = await pool.query(`
    SELECT name, lowest_price, expected_profit, volume
    FROM items
    WHERE is_profitable = true AND volume > 5
    ORDER BY expected_profit DESC
    LIMIT $1
  `, [limit]);

  let spent = 0;

  for (const item of res.rows) {
    const price = parseFloat(item.lowest_price) + 0.01; // slightly above the lowest

    // Blacklist filter
    if (blacklist.includes(item.name)) {
      console.log(`⛔ Blacklisted: ${item.name}`);
      continue;
    }

    // Max price filter
    if (price > maxPrice) {
      console.log(`💸 Price too high (${price} NOK): ${item.name}`);
      continue;
    }

    if (spent + price > budget) {
      console.log(`💰 Budget exhausted. Skipping ${item.name}`);
      continue;
    }

    try {
      await placeBuyOrder(item.name, price);
      spent += price;
    } catch (err) {
      console.error(`❌ Failed to buy ${item.name}:`, err.message);
    }
  }

  console.log(`🧮 Total spent: ~${spent.toFixed(2)} NOK`);
}

/**
 * Place buy orders using ML recommendations
 * @param {number} limit - Maximum number of orders
 * @param {number} budget - Total budget in NOK
 * @param {number} minConfidence - Minimum ML confidence score (0-1)
 */
async function placeMLOrders(limit = 5, budget = 200, minConfidence = 0.7) {
  console.log(`🤖 Getting ML recommendations (min confidence: ${minConfidence})...`);

  const recommendations = await getMLRecommendations(limit * 2, minConfidence);

  if (recommendations.length === 0) {
    console.log('⚠️ No ML recommendations found with sufficient confidence');
    return;
  }

  console.log(`📊 Found ${recommendations.length} ML-recommended items`);
  let spent = 0;
  let orderCount = 0;

  for (const rec of recommendations) {
    if (orderCount >= limit) break;

    const price = parseFloat(rec.price) + 0.01;

    if (spent + price > budget) {
      console.log(`💰 Budget exhausted. Skipping ${rec.name}`);
      break;
    }

    console.log(`\n🎯 ${rec.name}`);
    console.log(`   ML Score: ${rec.mlScore.toFixed(1)}/100 (${(rec.confidence * 100).toFixed(0)}% confidence)`);
    console.log(`   Reasons: ${rec.reasons.join(', ')}`);
    console.log(`   Price: ${price.toFixed(2)} NOK, Expected profit: ${rec.expectedProfit.toFixed(2)} NOK`);

    try {
      await placeBuyOrder(rec.name, price);
      spent += price;
      orderCount++;
    } catch (err) {
      console.error(`❌ Failed to buy ${rec.name}:`, err.message);
    }
  }

  console.log(`\n🧮 ML Orders Summary: ${orderCount} orders placed, Total spent: ~${spent.toFixed(2)} NOK`);
}

module.exports = { placeBuyOrder, placeTopOrders, placeMLOrders };
