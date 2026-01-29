require('dotenv').config();
const SteamClient = require('./classes/SteamClient');
const TradingBot = require('./classes/TradingBot');
const config = require('./config');

/**
 * Auto-buy profitable items using basic strategy
 */
async function autoBuy() {
  const credentials = {
    username: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
    sharedSecret: process.env.STEAM_SHARED_SECRET,
    identitySecret: process.env.STEAM_IDENTITY_SECRET
  };

  const steamClient = new SteamClient(credentials);

  try {
    // Load existing session or login
    console.log('🔐 Authenticating with Steam...\n');
    try {
      await steamClient.loadCookies();
    } catch {
      await steamClient.login();
    }

    const tradingBot = new TradingBot(steamClient, config);

    // Buy top items
    const limit = 5;
    const budget = 500;

    console.log(`\n🛒 Starting auto-buy (limit: ${limit}, budget: ${budget} NOK)...\n`);
    await tradingBot.buyTop(limit, budget);

    console.log('\n✅ Auto-buy completed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Auto-buy failed:', error.message);
    process.exit(1);
  }
}

autoBuy();
