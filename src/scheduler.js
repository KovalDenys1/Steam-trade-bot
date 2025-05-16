const cron = require('node-cron');
const fetchAndStore = require('./fetchAndStore');
const exportProfitableItemsToCSV = require('./exportCSV');
const { initDB } = require('./database');

async function runTask() {
  console.log(`\n🕒 [${new Date().toLocaleString()}] Updating prices...`);
  await fetchAndStore();
  exportProfitableItemsToCSV();
}

(async () => {
  await initDB();
  await runTask(); // run on startup
  cron.schedule('0 * * * *', runTask);
  console.log('✅ Scheduler started. Updates and exports every hour.');
})();