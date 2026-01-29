require('dotenv').config();
const SteamClient = require('./classes/SteamClient');
const TradingBot = require('./classes/TradingBot');
const config = require('./config');

/**
 * ML-powered auto-buy script
 * Uses machine learning predictions to buy items with highest profit potential
 */
async function autoBuyML() {
  // Configuration
  const CONFIG = {
    limit: 5,           // Maximum number of orders to place
    budget: 300,        // Total budget in NOK
    minConfidence: 0.7  // Minimum ML confidence score (0-1)
  };

  const credentials = {
    username: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
    sharedSecret: process.env.STEAM_SHARED_SECRET,
    identitySecret: process.env.STEAM_IDENTITY_SECRET
  };

  const steamClient = new SteamClient(credentials);

  try {
    console.log('🤖 Starting ML-powered auto-buy...\n');
    console.log(`Configuration:`);
    console.log(`  - Max orders: ${CONFIG.limit}`);
    console.log(`  - Budget: ${CONFIG.budget} NOK`);
    console.log(`  - Min confidence: ${(CONFIG.minConfidence * 100).toFixed(0)}%\n`);

    // Load existing session or login
    console.log('🔐 Authenticating with Steam...\n');
    try {
      await steamClient.loadCookies();
    } catch {
      await steamClient.login();
    }

    const tradingBot = new TradingBot(steamClient, config);

    await tradingBot.buyML(CONFIG.limit, CONFIG.budget, CONFIG.minConfidence);

    console.log('\n✅ ML auto-buy completed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ML auto-buy failed:', error.message);
    process.exit(1);
  }
}

autoBuyML();
