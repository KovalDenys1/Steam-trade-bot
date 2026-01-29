/**
 * Example usage of the refactored Steam Trade Bot classes
 * This file demonstrates how to use the new OOP architecture
 */

require('dotenv').config();
const { SteamClient, MarketAnalyzer, MLPredictor, TradingBot } = require('./classes');
const config = require('./config');

/**
 * Example 1: Basic authentication
 */
async function exampleAuth() {
  console.log('=== Example 1: Authentication ===\n');

  const credentials = {
    username: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
    sharedSecret: process.env.STEAM_SHARED_SECRET,
    identitySecret: process.env.STEAM_IDENTITY_SECRET
  };

  const client = new SteamClient(credentials);

  try {
    // Option 1: Login and save cookies
    await client.login();
    await client.saveCookies('./cookies.json');

    // Option 2: Load existing cookies
    // await client.loadCookies('./cookies.json');

    console.log('✅ Authenticated successfully\n');
    return client;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

/**
 * Example 2: Market analysis
 */
async function exampleAnalysis() {
  console.log('=== Example 2: Market Analysis ===\n');

  const analyzer = new MarketAnalyzer(config.analytics);

  // Calculate trend for specific item
  const trend = await analyzer.calculateTrend('Tempered AK47', 24);
  console.log('Trend Analysis:', trend);

  // Get trending items
  const risingItems = await analyzer.getTrendingItems('rising', 5);
  console.log('\nRising Items:', risingItems.length);

  // Calculate volatility
  const volatility = await analyzer.calculateVolatility('Tempered AK47', 24);
  console.log('Volatility:', volatility + '%\n');
}

/**
 * Example 3: ML predictions
 */
async function exampleML() {
  console.log('=== Example 3: ML Predictions ===\n');

  const analyzer = new MarketAnalyzer(config.analytics);
  const mlPredictor = new MLPredictor(config.ml, analyzer);

  // Predict single item
  const prediction = await mlPredictor.predict('Tempered AK47');
  console.log('Prediction:', prediction);

  // Get recommendations
  const recommendations = await mlPredictor.getRecommendations(5, 0.7);
  console.log('\nTop 5 ML Recommendations:', recommendations.length);

  if (recommendations.length > 0) {
    console.log('Best item:', recommendations[0].name);
    console.log('ML Score:', recommendations[0].mlScore + '/100\n');
  }
}

/**
 * Example 4: Trading operations
 */
async function exampleTrading() {
  console.log('=== Example 4: Trading Operations ===\n');

  const credentials = {
    username: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
    sharedSecret: process.env.STEAM_SHARED_SECRET,
    identitySecret: process.env.STEAM_IDENTITY_SECRET
  };

  const steamClient = new SteamClient(credentials);

  try {
    await steamClient.loadCookies();
  } catch {
    await steamClient.login();
  }

  const tradingBot = new TradingBot(steamClient, config);

  // Example: Buy single item
  // await tradingBot.buy('Tempered AK47', 50.00);

  // Example: Buy top items
  console.log('Buying top 3 items with 100 NOK budget...');
  const buyResult = await tradingBot.buyTop(3, 100);
  console.log('Buy Result:', buyResult);

  // Example: ML-powered buying
  console.log('\nML-powered buying (2 items, 100 NOK)...');
  const mlBuyResult = await tradingBot.buyML(2, 100, 0.7);
  console.log('ML Buy Result:', mlBuyResult);

  // Example: Auto-sell inventory
  // console.log('\nAuto-selling inventory...');
  // const sellResult = await tradingBot.autoSell();
  // console.log('Sell Result:', sellResult);
}

/**
 * Example 5: Complete workflow
 */
async function completeWorkflow() {
  console.log('=== Example 5: Complete Workflow ===\n');

  // 1. Setup
  const credentials = {
    username: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
    sharedSecret: process.env.STEAM_SHARED_SECRET,
    identitySecret: process.env.STEAM_IDENTITY_SECRET
  };

  const steamClient = new SteamClient(credentials);
  const analyzer = new MarketAnalyzer(config.analytics);
  const mlPredictor = new MLPredictor(config.ml, analyzer);
  const tradingBot = new TradingBot(steamClient, config);

  // 2. Authenticate
  try {
    await steamClient.loadCookies();
  } catch {
    await steamClient.login();
    await steamClient.saveCookies();
  }

  // 3. Analyze market
  const risingItems = await analyzer.getTrendingItems('rising', 3);
  console.log('Rising items:', risingItems.map(i => i.name).join(', '));

  // 4. Get ML recommendations
  const recommendations = await mlPredictor.getRecommendations(3, 0.7);
  console.log('ML recommendations:', recommendations.length);

  // 5. Execute trades (commented out for safety)
  // const buyResult = await tradingBot.buyML(3, 200, 0.7);
  // console.log(`Purchased ${buyResult.successCount} items`);

  console.log('\n✅ Workflow completed!\n');
}

/**
 * Run examples
 */
async function runExamples() {
  try {
    // Run individual examples
    // await exampleAuth();
    await exampleAnalysis();
    await exampleML();
    // await exampleTrading(); // Commented out - requires auth
    // await completeWorkflow(); // Commented out - requires auth

    console.log('✅ All examples completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Example failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runExamples();
}

module.exports = {
  exampleAuth,
  exampleAnalysis,
  exampleML,
  exampleTrading,
  completeWorkflow
};
