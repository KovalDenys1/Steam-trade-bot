const fs = require('fs');
const SteamCommunity = require('steamcommunity');

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

    community.buyMarketItem(options, (err, result) => {
      if (err) {
        console.error(`❌ Error placing order for ${itemName}:`, err.message);
        return reject(err);
      }

      console.log(`✅ Buy order for '${itemName}' at ${priceEUR.toFixed(2)} kr successfully placed.`);
      resolve(result);
    });
  });
}

module.exports = { placeBuyOrder };

const { pool } = require('./database');

async function placeTopOrders(limit = 3, budget = 100) {
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

  console.log(`🧾 Total spent: ~${spent.toFixed(2)} NOK`);
}

module.exports = { placeBuyOrder, placeTopOrders };