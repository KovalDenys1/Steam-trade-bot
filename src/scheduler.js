const cron = require('node-cron');
const fetchAndStore = require('./fetchAndStore');
const exportProfitableItemsToCSV = require('./exportCSV');
const { initDB } = require('./database');

async function runTask() {
  console.log(`\n🕒 [\${new Date().toLocaleString()}] Обновление цен...`);
  await fetchAndStore();
  exportProfitableItemsToCSV();
}

(async () => {
  await initDB();
  await runTask(); // запуск при старте
  cron.schedule('0 * * * *', runTask);
  console.log('✅ Планировщик запущен. Обновление и экспорт каждый час.');
})();
