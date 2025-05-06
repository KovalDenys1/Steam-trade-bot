const fs = require('fs');
const axios = require('axios');
const { upsertItem } = require('./database');

const { cookies } = JSON.parse(fs.readFileSync('./cookies.json', 'utf-8'));
const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

const COMMISSION = 0.15;
const APP_ID = 252490; // Rust

const rustItems = [
    "Tempered AK47", "Big Grin Mask", "Blackout Hoodie", "Alien Red", "No Mercy AR",
    "Whiteout Pants", "Whiteout Hoodie", "Tempered Mask", "Tempered MP5", "Horror Bag",
    "Blackout Pants", "Whiteout Facemask", "Tempered LR300", "Tempered Chest Plate",
    "Rainbow Pony Hoodie", "Glory AK47", "Tempered Thompson", "No Mercy Hoodie", "Cursed Cauldron",
    "Ghost Halloween Hoodie", "Tempered Door", "Tempered SAR", "Creepy Clown Hoodie", "Black Gold AK47",
    "Rainbow Pony Pants", "Black Gold MP5", "Cold Hunter AK47", "Black Gold Thompson", "Blackout Chest Plate",
    "Toxic Wolf Hoodie", "No Mercy Pants", "Skull Killer Hoodie", "Neo Soul AK47", "Neo Soul Hoodie",
    "Phantom Hoodie", "Neo Soul Pants", "Neo Soul SAR", "Phantom Pants", "Anubis AK47",
    "Neo Soul MP5", "White Camo Hoodie", "White Camo Pants", "Graffiti Thompson", "Blackout Facemask",
    "Toxic Wolf Pants", "Azul AK47", "Toxic Wolf Mask", "Neo Soul Facemask", "Gilded SAR",
    "Tempered SMG", "Molten Visage", "Cold Hunter Pants", "Skull Killer Pants", "Skull Killer Facemask",
    "Neo Soul Chest Plate", "Skull Killer Chest Plate", "Lunar AK47", "Lunar Pants", "Tempered Crossbow",
    "Lunar Hoodie", "Glory SAR", "Graphite MP5", "CyberCode Hoodie", "Dragon Horn",
    "Skull Killer SMG", "Neo Soul Door", "Tempered Revolver", "Rainbow Pony Mask", "Digital Camo MP5",
    "Jester Mask", "Tempered Rock", "Blackout SMG", "Blackout SAR", "Alien Red Hoodie",
    "Red Skull Hoodie", "Cold Hunter Mask", "Tempered Pickaxe", "Neo Soul L96", "Graffiti Hoodie",
    "Neo Soul Hoodie", "Whiteout Chest Plate", "Graffiti Pants", "Phantom Chest Plate", "Tempered Metal Door",
    "Whiteout Mask", "Whiteout Gloves", "Blackout Gloves", "Neo Soul Crossbow", "Cold Hunter LR300",
    "Tempered Hatchet", "Neo Soul M249", "Tempered Pants", "Tempered Hoodie", "Blackout LR300",
    "Cold Hunter Hoodie", "No Mercy Mask", "Anubis Mask", "Neo Soul Rock", "Cold Hunter SMG",
    "Skull Killer Rock", "Blackout Rock", "Red Rebel Hoodie", "Cold Hunter Chest Plate", "Glory Hoodie",
    "Neo Soul Hammer", "Tempered Bolt", "Toxic Wolf Chest Plate", "Blackout Hammer", "Red Skull Pants",
    "Anubis Hoodie", "Cold Hunter Gloves", "Anubis Pants", "Neo Soul Torch", "Phantom Gloves",
    "Molten AK47", "Glory MP5", "Tempered Torch", "Glory L96", "Blackout M249", "Cold Hunter Pickaxe",
    "Neo Soul Hatchet", "Tempered M92", "No Mercy SMG", "Neo Soul Pants", "Skull Killer Torch",
    "Red Skull Mask", "Blackout M92", "Toxic Wolf Rock", "CyberCode Mask", "Molten Mask",
    "Neo Soul SMG", "Tempered LR", "Neo Soul Revolver", "Phantom Chest Plate", "Tempered MP5A4",
    "Blackout Hoodie v2", "Lunar Hoodie v2", "No Mercy LR300", "Tempered MP5 v2", "Rainbow Pony LR",
    "Tempered Bow", "Glory M249", "Blackout AK47", "Glory Torch", "Neo Soul Hammer v2",
    "Red Skull SAR", "Skull Killer M249", "Toxic Wolf M249", "Tempered Door v2", "Whiteout Rock",
    "Neo Soul L96 v2", "Glory Rock", "Tempered LR300 v2", "Neo Soul Knife", "Blackout Knife",
    "Whiteout Knife", "Tempered Knife", "Glory Knife", "Phantom Knife", "Red Skull Knife",
    "Cold Hunter Knife", "Neo Soul Jackhammer", "Glory Jackhammer", "Whiteout Jackhammer", "Tempered Jackhammer",
    "Blackout Jackhammer", "Phantom Jackhammer", "Skull Killer Jackhammer", "Toxic Wolf Jackhammer", "Red Skull Jackhammer",
    "Anubis Jackhammer", "Lunar Jackhammer", "Rainbow Pony Jackhammer", "Molten Jackhammer", "Glory Mask",
    "Skull Killer Knife", "No Mercy Knife", "Toxic Wolf Knife", "Red Skull Hoodie v2", "Neo Soul Bandana",
    "Skull Killer Bandana", "Whiteout Bandana", "Glory Bandana", "Molten Bandana", "Phantom Bandana"
];

async function fetchPrice(itemName) {
  try {
    const response = await axios.get('https://steamcommunity.com/market/priceoverview/', {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0'
      },
      params: {
        appid: APP_ID,
        currency: 20, // 20 = NOK
        country: 'NO',
        market_hash_name: itemName
      }
    });

    const data = response.data;
    if (data.success && data.lowest_price && data.median_price) {
      console.log(`💬 ${itemName} → lowest: ${data.lowest_price}, median: ${data.median_price}`);

      const lowest = parseFloat(data.lowest_price.replace(/[^\d,.-]/g, '').replace(',', '.'));
      const median = parseFloat(data.median_price.replace(/[^\d,.-]/g, '').replace(',', '.'));
      const volume = parseInt(data.volume.replace(/[^\d]/g, '')) || 0;

      const profit = median * (1 - COMMISSION) - lowest;
      const isProfitable = profit > 2;
      
      return {
        name: itemName,
        appid: APP_ID,
        lowest_price: lowest,
        median_price: median,
        volume,
        expected_profit: parseFloat(profit.toFixed(2)),
        is_profitable: isProfitable ? 1 : 0
      };
    }
  } catch (err) {
    console.error(`❌ Ошибка при получении ${itemName}:`, err.message);
  }

  return null;
}

async function run() {
  for (const item of rustItems) {
    const data = await fetchPrice(item);
    if (data) {
      console.log(`💾 Сохраняю ${data.name}: прибыль ~kr${data.expected_profit}`);
      upsertItem(data);
    }
    await new Promise(res => setTimeout(res, 2500 + Math.random() * 2000)); // пауза между запросами
  }
}

module.exports = run;