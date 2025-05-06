# 🔥 Steam Trade Bot

An automated trading bot for Rust skins on the Steam Community Market. It buys items at the lowest price, sells them for profit, stores data in a PostgreSQL database, and exports profitable items to CSV.

## 🚀 Features

- 📥 **Auto-buy** Rust items at the lowest market price
- 📤 **Auto-sell** purchased items with profit margin
- 🧠 **Profit filtering**, volume control, and price thresholds
- 💾 Stores all item data in **PostgreSQL**
- 📊 Exports profitable items to `profitable_items.csv`
- 🔐 Steam login via Guard (TOTP or shared_secret)
- 💱 Converts currency (e.g., CDN$ → NOK)

## 📦 Installation

```bash
git clone https://github.com/KovalDenys1/Steam-trade-bot.git
cd Steam-trade-bot
npm install
```

## ⚙️ Setup

Create a `.env` file in the root directory:

```env
STEAM_USERNAME=your_username
STEAM_PASSWORD=your_password
STEAM_SHARED_SECRET=your_shared_secret
STEAM_IDENTITY_SECRET=your_identity_secret

PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_pg_password
PG_DATABASE=rust_trade
```

## 📚 Scripts

| Script             | Description                           |
|--------------------|---------------------------------------|
| `auth.js`          | Login to Steam and save cookies       |
| `scheduler.js`     | Update prices and save to database    |
| `autobuy.js`       | Automatically place buy orders        |
| `autoSell.js`      | Automatically sell inventory items    |
| `exportCSV.js`     | Export profitable items to `.csv`     |
| `showAll.js`       | Show all stored items with filters    |

## 🧠 Example Usage

```bash
node src/auth.js          # 1. Log in and save cookies
node src/scheduler.js     # 2. Fetch prices and store data
node src/autobuy.js       # 3. Auto-buy profitable items
node src/autoSell.js      # 4. Auto-sell items from inventory
```

## 📌 Dependencies

- `steam-user`
- `steamcommunity`
- `steam-totp`
- `pg`
- `axios`

## 🛡 Security Tips

❗ Never upload your `.env`, `cookies.json`, or `.csv` files  
Make sure your `.gitignore` is properly set

## 👤 Author

Denys Koval — [@KovalDenys1](https://github.com/KovalDenys1)

---

💬 Feel free to reach out if you'd like to add:
- Telegram notifications
- Web dashboard
- Support for other games
