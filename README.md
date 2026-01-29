# 🤖 Steam Trade Bot

**An intelligent, multi-game trading bot for the Steam Community Market with ML-powered analytics.**

[![Node.js](https://img.shields.io/badge/Node.js-16+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

This automated trading system buys and sells items on the Steam Market, using machine learning to predict profitability, manage risk, and apply dynamic pricing.

## 🎮 Supported Games

| Game         | Items    | Status     |
|--------------|----------|------------|
| 🔫 Rust      | 48 items | ✅ Active  |
| 🎯 CS:GO     | 38 items | ✅ Active  |
| ⚔️ Dota 2    | 30 items | ✅ Active  |

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone https://github.com/KovalDenys1/Steam-trade-bot.git
cd Steam-trade-bot
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Setup database and authenticate
npm run setup
npm run auth

# 4. Start trading
npm start
```

## 🎮 Usage & Commands

Once set up, you can use these commands to manage the bot:

| Command              | Description                                      |
|----------------------|--------------------------------------------------|
| `npm start`          | Start the automated hourly scheduler             |
| `npm run fetch-all`  | Fetch prices for all enabled games immediately   |
| `npm run analytics`  | Display market analysis and ML insights          |
| `npm run export`     | Export profitable items to CSV                   |
| `npm run auth`       | Authenticate with Steam and save the session     |
| `npm run setup`      | Verify configuration and dependencies            |

### Game-Specific Trading

| Command              | Action                                       |
|----------------------|----------------------------------------------|
| `npm run buy-ml`     | Buy Rust items with ML predictions           |
| `npm run sell`       | Sell Rust items with dynamic pricing         |
| `npm run csgo:buy`   | Buy CS:GO items with ML predictions          |
| `npm run csgo:sell`  | Sell CS:GO items with dynamic pricing        |
| `npm run dota2:buy`  | Buy Dota 2 items with ML predictions         |
| `npm run dota2:sell` | Sell Dota 2 items with dynamic pricing       |

## ✨ Features

### 🤖 Smart Trading

- **ML-Powered Predictions** - 5-feature weighted model for profitability analysis
- **Dynamic Pricing** - Adjusts sell prices based on market demand (5-25% markup)
- **Risk Management** - Automated stop-loss (10%) and take-profit (20%)
- **Multi-Game Support** - Trade across Rust, CS:GO, and Dota 2 simultaneously

### 📊 Market Analysis

- **Trend Detection** - Linear regression for price movement analysis
- **Volatility Metrics** - Standard deviation calculations to assess risk
- **Volume Tracking** - Monitor trading activity to gauge liquidity
- **Historical Data** - Complete price history stored in PostgreSQL

### 🛡️ Safety & Control

- **Blacklist System** - Exclude unprofitable or undesirable items
- **Price & Profit Limits** - Set max purchase prices and minimum profit thresholds
- **Transaction Logging** - Complete audit trail of all buy/sell activities

## 🏗️ Architecture & Tech Stack

### Core Classes

- **SteamClient** - Handles all Steam authentication and API interactions
- **GameFetcher** - Fetches prices for multiple games with rate limiting
- **MarketAnalyzer** - Analyzes price trends and market volatility
- **MLPredictor** - Runs machine learning model for profitability predictions
- **TradingBot** - Orchestrates trading logic, risk management, and selling

### Technology Stack

- **Backend** - Node.js, TypeScript
- **Database** - PostgreSQL
- **Steam Integration** - steam-user, steamcommunity, steam-totp
- **HTTP Client** - axios

## ⚙️ Configuration

### Environment Setup

Create a `.env` file with your credentials:

```env
# Steam Credentials
STEAM_USERNAME=your_username
STEAM_PASSWORD=your_password
STEAM_SHARED_SECRET=your_shared_secret
STEAM_IDENTITY_SECRET=your_identity_secret

# Database Configuration
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_db_password
PG_DATABASE=steam_trade_bot

# Game Selection (optional, comma-separated)
ENABLED_GAMES=rust,csgo,dota2
```

### Trading Logic

Fine-tune the bot behavior in `src/config.js`:

```javascript
module.exports = {
  trading: {
    maxItemsToBuy: 5,
    totalBudget: 300,
    minProfitMargin: 0.5,
    maxPricePerItem: 100,
  },
  riskManagement: {
    stopLoss: 10,
    takeProfit: 20,
  },
  ml: {
    minConfidence: 0.7,
  },
};
```

## 📚 Documentation

For detailed information on architecture, ML models, and multi-game implementation, see the guides in the `docs/` folder (available locally):

- **REFACTORING.md** - Complete architecture details
- **ML_GUIDE.md** - Machine learning features explained
- **MULTI_GAME_GUIDE.md** - Multi-game trading guide

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for details.

## ⚠️ Disclaimer

This bot is for educational purposes only. Trading on Steam carries financial risks, and using automated bots may be against Steam Terms of Service. Use at your own risk.

## 👤 Author

**Denys Koval**

- GitHub: [@KovalDenys1](https://github.com/KovalDenys1)
- Repository: [Steam-trade-bot](https://github.com/KovalDenys1/Steam-trade-bot)

---

**Made with ❤️ for the Steam trading community**

[⬆ Back to Top](#-steam-trade-bot)
