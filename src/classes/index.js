/**
 * Main export file for Steam Trade Bot classes
 * Import all classes from a single location
 */

const SteamClient = require('./SteamClient');
const MarketAnalyzer = require('./MarketAnalyzer');
const MLPredictor = require('./MLPredictor');
const TradingBot = require('./TradingBot');
const GameFetcher = require('./GameFetcher');

module.exports = {
  SteamClient,
  MarketAnalyzer,
  MLPredictor,
  TradingBot,
  GameFetcher
};
