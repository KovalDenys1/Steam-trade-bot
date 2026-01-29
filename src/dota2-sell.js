require('dotenv').config();
const SteamClient = require('./classes/SteamClient');
const TradingBot = require('./classes/TradingBot');
const config = require('./config');

/**
 * Sell Dota 2 items from inventory with dynamic pricing
 */
async function sellDota2Items() {
  const credentials = {
    username: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
    sharedSecret: process.env.STEAM_SHARED_SECRET,
    identitySecret: process.env.STEAM_IDENTITY_SECRET
  };

  const steamClient = new SteamClient(credentials);
  const bot = new TradingBot(steamClient, config, 'dota2');

  try {
    console.log('🔐 Authenticating with Steam...\n');
    try {
      await steamClient.loadCookies();
    } catch {
      await steamClient.login();
      await steamClient.saveCookies();
    }

    console.log('🎮 Starting Dota 2 item selling with dynamic pricing\n');
    console.log('Configuration:');
    console.log(`  Base markup: ${config.dynamicPricing.baseMarkup}%`);
    console.log(`  Stop-loss: ${config.riskManagement.stopLoss}%`);
    console.log(`  Take-profit: ${config.riskManagement.takeProfit}%\n`);
    console.log('='.repeat(60));

    const results = await bot.autoSell();

    console.log('\n📊 Dota 2 Selling Session Summary:\n');
    console.log(`✅ Successful listings: ${results.success}`);
    console.log(`❌ Failed listings: ${results.failed}`);
    console.log(`💰 Total listed value: ${results.totalValue.toFixed(2)} NOK`);
    console.log(`📈 Expected profit: ${results.expectedProfit.toFixed(2)} NOK`);

    if (results.listings.length > 0) {
      console.log('\nListings:');
      results.listings.forEach(listing => {
        const icon = listing.status === 'success' ? '✅' : '❌';
        const markup = listing.markup ? ` (+${listing.markup}%)` : '';
        console.log(`${icon} ${listing.item} - ${listing.price} NOK${markup} (${listing.reason})`);
      });
    } else {
      console.log('\nNo items to sell in inventory');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Selling failed:', error.message);
    process.exit(1);
  }
}

sellDota2Items();
