const fs = require('fs');
const SteamCommunity = require('steamcommunity');
const axios = require('axios');
require('dotenv').config();

const { cookies } = JSON.parse(fs.readFileSync('./cookies.json', 'utf-8'));
const community = new SteamCommunity();
community.setCookies(cookies);

const APP_ID = 252490;
const contextID = 2; // инвентарь Steam
const identitySecret = process.env.STEAM_IDENTITY_SECRET;

// Запускаем авто-подтверждение сделок каждые 20 сек
community.startConfirmationChecker(20000, identitySecret);

community.getMyInventoryContents(APP_ID, contextID, true, async (err, inventory) => {
  if (err) return console.error('❌ Ошибка загрузки инвентаря:', err.message);

  const filtered = inventory.filter(item => item.marketable);

  if (filtered.length === 0) {
    console.log('📦 Нет предметов для продажи.');
    return;
  }

  console.log(`🔎 Найдено ${filtered.length} предметов для продажи.`);

  for (const item of filtered) {
    const name = item.market_hash_name;

    try {
      const res = await axios.get('https://steamcommunity.com/market/priceoverview/', {
        params: {
          appid: APP_ID,
          currency: 20, // NOK
          market_hash_name: name
        },
        headers: {
          'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; '),
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const data = res.data;
      if (!data.success || !data.median_price) continue;

      const median = parseFloat(data.median_price.replace(/[^\d,.-]/g, '').replace(',', '.'));
      const sellPrice = Math.max(median - 0.10, 1.00); // минимум 1 крон

      community.sellMarketItem({
        appid: APP_ID,
        contextid: contextID,
        assetid: item.id,
        amount: 1,
        price: Math.round(sellPrice * 100) // сотые NOK
      }, err => {
        if (err) {
          console.error(`❌ Не удалось продать ${name}:`, err.message);
        } else {
          console.log(`✅ Выставлен на продажу: ${name} за ~${sellPrice.toFixed(2)} kr`);
        }
      });

      await new Promise(res => setTimeout(res, 1500)); // задержка между итерациями

    } catch (err) {
      console.error(`⚠️ Не удалось получить цену для ${name}`);
    }
  }
});