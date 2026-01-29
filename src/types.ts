/**
 * Type definitions for Steam Trade Bot
 */

export interface ItemData {
  name: string;
  appid: number;
  lowest_price: number;
  median_price: number;
  volume: number;
  expected_profit: number;
  is_profitable: boolean;
}

export interface Transaction {
  id?: number;
  item_name: string;
  type: 'buy' | 'sell';
  price: number;
  volume: number;
  timestamp?: Date;
  status: 'success' | 'failed' | 'pending';
  details?: string;
}

export interface TrendAnalysis {
  trend: 'rising' | 'falling' | 'stable' | 'insufficient_data' | 'error';
  slope: number;
  priceChange: number;
  avgVolume: number;
  dataPoints: number;
  confidence: number;
}

export interface MLPrediction {
  prediction: 'highly_profitable' | 'profitable' | 'moderate' | 'not_profitable' | 'unknown' | 'error';
  confidence: number;
  score: number;
  reasons: string[];
  features?: {
    expectedProfit: number;
    volume: number;
    trend: string;
    volatility: number;
    priceChange: number;
  };
}

export interface MLRecommendation {
  name: string;
  price: number;
  expectedProfit: number;
  mlScore: number;
  confidence: number;
  prediction: string;
  reasons: string[];
}

export interface RiskDecision {
  shouldSell: boolean;
  reason: 'stop_loss' | 'take_profit' | 'profit' | 'holding' | 'no_purchase_history' | 'error';
  urgency: 'urgent' | 'high' | 'normal' | 'low';
  message?: string;
}

export interface BotConfig {
  trading: {
    maxPricePerItem: number;
    minVolume: number;
    minProfitMargin: number;
    commissionRate: number;
  };
  riskManagement: {
    stopLossPercent: number;
    takeProfitPercent: number;
    minProfitToSell: number;
  };
  ml: {
    minConfidence: number;
    featureWeights: {
      expectedProfit: number;
      volume: number;
      trend: number;
      volatility: number;
      historicalSuccess: number;
    };
  };
  dynamicPricing: {
    baseMarkup: number;
    highVolumeThreshold: number;
    highVolumeBonus: number;
    risingTrendBonus: number;
    fallingTrendPenalty: number;
    maxMarkup: number;
    minMarkup: number;
  };
  api: {
    appId: number;
    currency: number;
    contextId: number;
    requestDelay: number;
    requestDelayRange: number;
  };
  blacklist: string[];
  analytics: {
    trendHours: number;
    minDataPoints: number;
    volatilityWindow: number;
  };
}

export interface SteamCredentials {
  username: string;
  password: string;
  sharedSecret: string;
  identitySecret: string;
}

export interface SteamCookies {
  sessionID: string;
  cookies: Array<{ name: string; value: string }>;
}
