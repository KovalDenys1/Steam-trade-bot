require('dotenv').config();
const SteamClient = require('./classes/SteamClient');
const TradingBot = require('./classes/TradingBot');
const config = require('./config');

/**
 * Auto-sell inventory items with dynamic pricing and risk management
 */
async function autoSell() {
  const credentials = {
    username: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
    sharedSecret: process.env.STEAM_SHARED_SECRET,
    identitySecret: process.env.STEAM_IDENTITY_SECRET
  };

  const steamClient = new SteamClient(credentials);

  try {
    console.log('🔐 Authenticating with Steam...\n');
    
    // Load existing session or login
    try {
      await steamClient.loadCookies();
    } catch {
      await steamClient.login();
    }

    // Start confirmation checker for trade confirmations
    steamClient.startConfirmationChecker(20000);

    const tradingBot = new TradingBot(steamClient, config);

    await tradingBot.autoSell();

    console.log('\n✅ Auto-sell process completed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Auto-sell failed:', error.message);
    process.exit(1);
  }
}

autoSell();
