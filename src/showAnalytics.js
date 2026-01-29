require('dotenv').config();
const MarketAnalyzer = require('./classes/MarketAnalyzer');
const MLPredictor = require('./classes/MLPredictor');
const { pool } = require('./database');
const config = require('./config');

/**
 * Display market analytics and trends
 */
async function displayAnalytics() {
  const analyzer = new MarketAnalyzer(config.analytics);
  const mlPredictor = new MLPredictor(config.ml, analyzer);

  console.log('📊 Market Analytics Dashboard\n');
  console.log('='.repeat(60));

  // 1. Rising trends
  console.log('\n📈 Top Rising Items (24h):\n');
  const rising = await analyzer.getTrendingItems('rising', 5);
  if (rising.length > 0) {
    rising.forEach((item, i) => {
      console.log(`${i + 1}. ${item.name}`);
      console.log(`   Slope: ${item.slope.toFixed(4)}, Change: ${item.priceChange > 0 ? '+' : ''}${item.priceChange.toFixed(2)}%`);
      console.log(`   Confidence: ${(item.confidence * 100).toFixed(0)}%, Avg Volume: ${item.avgVolume}`);
    });
  } else {
    console.log('   No rising trends found');
  }

  // 2. Falling trends
  console.log('\n📉 Top Falling Items (24h):\n');
  const falling = await analyzer.getTrendingItems('falling', 5);
  if (falling.length > 0) {
    falling.forEach((item, i) => {
      console.log(`${i + 1}. ${item.name}`);
      console.log(`   Slope: ${item.slope.toFixed(4)}, Change: ${item.priceChange > 0 ? '+' : ''}${item.priceChange.toFixed(2)}%`);
      console.log(`   Confidence: ${(item.confidence * 100).toFixed(0)}%, Avg Volume: ${item.avgVolume}`);
    });
  } else {
    console.log('   No falling trends found');
  }

  // 3. ML Recommendations
  console.log('\n🤖 ML Buy Recommendations:\n');
  const recommendations = await mlPredictor.getRecommendations(5, 0.6);
  if (recommendations.length > 0) {
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.name}`);
      console.log(`   ML Score: ${rec.mlScore.toFixed(1)}/100 (${(rec.confidence * 100).toFixed(0)}% confidence)`);
      console.log(`   Price: ${rec.price.toFixed(2)} NOK, Expected Profit: ${rec.expectedProfit.toFixed(2)} NOK`);
      console.log(`   Reasons: ${rec.reasons.join(', ')}`);
    });
  } else {
    console.log('   No recommendations available');
  }

  // 4. Recent transactions
  console.log('\n💼 Recent Transactions (Last 10):\n');
  const transactions = await pool.query(`
    SELECT item_name, type, price, status, timestamp
    FROM transactions
    ORDER BY timestamp DESC
    LIMIT 10
  `);

  if (transactions.rows.length > 0) {
    transactions.rows.forEach((tx, i) => {
      const emoji = tx.type === 'buy' ? '🛒' : '💰';
      const statusEmoji = tx.status === 'success' ? '✅' : '❌';
      console.log(`${i + 1}. ${emoji} ${tx.type.toUpperCase()} - ${tx.item_name}`);
      console.log(`   ${statusEmoji} ${tx.price.toFixed(2)} NOK at ${new Date(tx.timestamp).toLocaleString()}`);
    });
  } else {
    console.log('   No transactions yet');
  }

  // 5. Overall statistics
  console.log('\n📊 Overall Statistics:\n');
  const stats = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE type = 'buy' AND status = 'success') as successful_buys,
      COUNT(*) FILTER (WHERE type = 'sell' AND status = 'success') as successful_sells,
      COUNT(*) FILTER (WHERE status = 'failed') as failed_transactions,
      COALESCE(SUM(price) FILTER (WHERE type = 'buy' AND status = 'success'), 0) as total_spent,
      COALESCE(SUM(price) FILTER (WHERE type = 'sell' AND status = 'success'), 0) as total_earned
    FROM transactions
  `);

  const s = stats.rows[0];
  const profit = parseFloat(s.total_earned) - parseFloat(s.total_spent);

  console.log(`   Successful Buys: ${s.successful_buys}`);
  console.log(`   Successful Sells: ${s.successful_sells}`);
  console.log(`   Failed Transactions: ${s.failed_transactions}`);
  console.log(`   Total Spent: ${parseFloat(s.total_spent).toFixed(2)} NOK`);
  console.log(`   Total Earned: ${parseFloat(s.total_earned).toFixed(2)} NOK`);
  console.log(`   Net Profit: ${profit >= 0 ? '+' : ''}${profit.toFixed(2)} NOK`);

  // 6. Market statistics
  console.log('\n📈 Market Overview:\n');
  const marketStats = await analyzer.getMarketStats();
  if (marketStats) {
    console.log(`   Total Items Tracked: ${marketStats.totalItems}`);
    console.log(`   Profitable Items: ${marketStats.profitableItems}`);
    console.log(`   Avg Expected Profit: ${marketStats.avgExpectedProfit} NOK`);
    console.log(`   High Volume Items: ${marketStats.highVolumeItems}`);
  }

  console.log('\n' + '='.repeat(60));
}

// Run analytics
displayAnalytics()
  .then(() => {
    console.log('\n✅ Analytics displayed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error displaying analytics:', error.message);
    process.exit(1);
  });
