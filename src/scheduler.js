require('dotenv').config();
const cron = require('node-cron');
const SteamClient = require('./classes/SteamClient');
const GameFetcher = require('./classes/GameFetcher');
const exportProfitableItemsToCSV = require('./exportCSV');
const { initDB } = require('./database');
const config = require('./config');
const { getAllGames } = require('./games');

// Configuration: Which games to track
const ENABLED_GAMES = process.env.ENABLED_GAMES
  ? process.env.ENABLED_GAMES.split(',').map(g => g.trim())
  : ['rust', 'csgo', 'dota2']; // default: all games

let steamClient;

/**
 * Run scheduled price update for all enabled games
 */
async function runTask() {
  console.log(`\n🕒 [${new Date().toLocaleString()}] Starting scheduled price update\n`);
  console.log(`🎮 Enabled games: ${ENABLED_GAMES.join(', ')}\n`);
  console.log('='.repeat(60));

  const summaries = [];

  try {
    // Ensure Steam client is authenticated
    if (!steamClient) {
      const credentials = {
        username: process.env.STEAM_USERNAME,
        password: process.env.STEAM_PASSWORD,
        sharedSecret: process.env.STEAM_SHARED_SECRET,
        identitySecret: process.env.STEAM_IDENTITY_SECRET
      };
      steamClient = new SteamClient(credentials);

      try {
        await steamClient.loadCookies();
      } catch {
        await steamClient.login();
        await steamClient.saveCookies();
      }
    }

    // Fetch prices for each enabled game
    for (const gameName of ENABLED_GAMES) {
      const fetcher = new GameFetcher(steamClient, config, gameName);
      const summary = await fetcher.fetchAll();
      summaries.push(summary);

      console.log('='.repeat(60));

      // Delay between games to avoid rate limiting
      if (gameName !== ENABLED_GAMES[ENABLED_GAMES.length - 1]) {
        console.log('⏳ Waiting 30 seconds before next game...\n');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    // Export profitable items to CSV
    console.log('\n📊 Exporting profitable items to CSV...');
    exportProfitableItemsToCSV();

    // Print summary
    console.log('\n📊 Update Summary:\n');
    summaries.forEach(s => {
      console.log(`${s.game} (AppID: ${s.appId}):`);
      console.log(`  ✅ Success: ${s.success}/${s.total}`);
      console.log(`  ❌ Failed: ${s.failed}/${s.total}`);
      console.log('');
    });

    const totalSuccess = summaries.reduce((sum, s) => sum + s.success, 0);
    const totalItems = summaries.reduce((sum, s) => sum + s.total, 0);

    console.log(`✅ Total: ${totalSuccess}/${totalItems} items updated successfully`);
    console.log(`⏰ Next update at: ${new Date(Date.now() + 3600000).toLocaleString()}`);
  } catch (error) {
    console.error('\n❌ Scheduled task failed:', error.message);
    // Don't exit, let scheduler continue
  }
}

/**
 * Start the scheduler
 */
(async () => {
  await initDB();

  console.log('🚀 Steam Trade Bot Scheduler\n');
  console.log('Configuration:');
  console.log(`  Enabled games: ${ENABLED_GAMES.join(', ')}`);
  console.log(`  Schedule: Every hour (0 * * * *)`);
  console.log(`  Items per game: Rust (48), CS:GO (38), Dota 2 (30)\n`);

  // Run initial task
  await runTask();

  // Schedule hourly updates
  cron.schedule('0 * * * *', runTask);

  console.log('\n✅ Scheduler started. Updates every hour.');
  console.log('💡 To change enabled games, set ENABLED_GAMES env variable (e.g., "rust,csgo")');
})();
