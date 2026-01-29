require('dotenv').config();
const SteamClient = require('./classes/SteamClient');
const GameFetcher = require('./classes/GameFetcher');
const config = require('./config');
const { getAllGames } = require('./games');

/**
 * Fetch prices for all supported games
 */
async function fetchAllGames() {
  const credentials = {
    username: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
    sharedSecret: process.env.STEAM_SHARED_SECRET,
    identitySecret: process.env.STEAM_IDENTITY_SECRET
  };

  const steamClient = new SteamClient(credentials);

  try {
    console.log('🔐 Authenticating with Steam...\n');
    try {
      await steamClient.loadCookies();
    } catch {
      await steamClient.login();
      await steamClient.saveCookies();
    }

    const games = getAllGames();
    console.log(`\n🎮 Fetching prices for ${games.length} games: ${games.join(', ')}\n`);
    console.log('='.repeat(60));

    const summaries = [];

    for (const gameName of games) {
      const fetcher = new GameFetcher(steamClient, config, gameName);
      const summary = await fetcher.fetchAll();
      summaries.push(summary);

      console.log('='.repeat(60));

      // Delay between games
      if (gameName !== games[games.length - 1]) {
        console.log('⏳ Waiting 30 seconds before next game...\n');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    console.log('\n📊 Summary for all games:\n');
    summaries.forEach(s => {
      console.log(`${s.game} (AppID: ${s.appId}):`);
      console.log(`  ✅ Success: ${s.success}/${s.total}`);
      console.log(`  ❌ Failed: ${s.failed}/${s.total}`);
      console.log('');
    });

    const totalSuccess = summaries.reduce((sum, s) => sum + s.success, 0);
    const totalItems = summaries.reduce((sum, s) => sum + s.total, 0);

    console.log(`\n✅ Total: ${totalSuccess}/${totalItems} items fetched successfully`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fetch failed:', error.message);
    process.exit(1);
  }
}

fetchAllGames();
