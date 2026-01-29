require('dotenv').config();
const SteamClient = require('./classes/SteamClient');
const TradingBot = require('./classes/TradingBot');
const config = require('./config');

/**
 * Buy CS:GO items using ML predictions
 */
async function buyCsgoItems() {
  const credentials = {
    username: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
    sharedSecret: process.env.STEAM_SHARED_SECRET,
    identitySecret: process.env.STEAM_IDENTITY_SECRET
  };

  const steamClient = new SteamClient(credentials);
  const bot = new TradingBot(steamClient, config, 'csgo');

  try {
    console.log('🔐 Authenticating with Steam...\n');
    try {
      await steamClient.loadCookies();
    } catch {
      await steamClient.login();
      await steamClient.saveCookies();
    }

    console.log('🎮 Starting CS:GO item buying with ML predictions\n');
    console.log('Configuration:');
    console.log(`  Items to buy: ${config.trading.maxItemsToBuy}`);
    console.log(`  Total budget: ${config.trading.totalBudget} NOK`);
    console.log(`  Min confidence: ${config.ml.minConfidence}\n`);
    console.log('='.repeat(60));

    const results = await bot.buyML(
      config.trading.maxItemsToBuy,
      config.trading.totalBudget,
      config.ml.minConfidence
    );

    console.log('\n📊 CS:GO Buying Session Summary:\n');
    console.log(`✅ Successful orders: ${results.success}`);
    console.log(`❌ Failed orders: ${results.failed}`);
    console.log(`💰 Total spent: ${results.totalSpent.toFixed(2)} NOK`);
    console.log('\nOrders:');
    results.orders.forEach(order => {
      const icon = order.status === 'success' ? '✅' : '❌';
      console.log(`${icon} ${order.item} - ${order.price} NOK (${order.reason})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Buying failed:', error.message);
    process.exit(1);
  }
}

buyCsgoItems();
