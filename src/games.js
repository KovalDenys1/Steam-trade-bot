/**
 * Game configurations for multi-game support
 * Each game has its own AppID, currency, and item lists
 */

const games = {
  rust: {
    appId: 252490,
    name: 'Rust',
    currency: 20, // NOK
    contextId: 2,
    items: [
      "Tempered AK47", "Big Grin Mask", "Blackout Hoodie", "Alien Red", "No Mercy AR",
      "Whiteout Pants", "Whiteout Hoodie", "Tempered Mask", "Tempered MP5", "Horror Bag",
      "Blackout Pants", "Whiteout Facemask", "Tempered LR300", "Tempered Chest Plate",
      "Rainbow Pony Hoodie", "Glory AK47", "Tempered Thompson", "No Mercy Hoodie",
      "Ghost Halloween Hoodie", "Tempered Door", "Tempered SAR", "Creepy Clown Hoodie",
      "Black Gold AK47", "Rainbow Pony Pants", "Black Gold MP5", "Cold Hunter AK47",
      "Black Gold Thompson", "Blackout Chest Plate", "Toxic Wolf Hoodie", "No Mercy Pants",
      "Skull Killer Hoodie", "Neo Soul AK47", "Neo Soul Hoodie", "Phantom Hoodie",
      "Neo Soul Pants", "Neo Soul SAR", "Phantom Pants", "Anubis AK47", "Neo Soul MP5",
      "White Camo Hoodie", "White Camo Pants", "Graffiti Thompson", "Blackout Facemask",
      "Toxic Wolf Pants", "Azul AK47", "Toxic Wolf Mask", "Neo Soul Facemask"
    ]
  },

  csgo: {
    appId: 730,
    name: 'CS:GO',
    currency: 20, // NOK
    contextId: 2,
    items: [
      // Popular CS:GO skins
      "AK-47 | Redline (Field-Tested)",
      "AK-47 | Asiimov (Field-Tested)",
      "AK-47 | Bloodsport (Minimal Wear)",
      "AK-47 | Neon Rider (Field-Tested)",
      "AK-47 | Phantom Disruptor (Field-Tested)",
      "AWP | Asiimov (Field-Tested)",
      "AWP | Hyper Beast (Field-Tested)",
      "AWP | Neo-Noir (Field-Tested)",
      "AWP | Containment Breach (Field-Tested)",
      "AWP | Wildfire (Field-Tested)",
      "M4A4 | Asiimov (Field-Tested)",
      "M4A4 | Desolate Space (Field-Tested)",
      "M4A4 | Neo-Noir (Field-Tested)",
      "M4A4 | Temukau (Field-Tested)",
      "M4A1-S | Hyper Beast (Field-Tested)",
      "M4A1-S | Cyrex (Field-Tested)",
      "M4A1-S | Golden Coil (Field-Tested)",
      "M4A1-S | Player Two (Field-Tested)",
      "Desert Eagle | Kumicho Dragon (Field-Tested)",
      "Desert Eagle | Sunset Storm 壱 (Minimal Wear)",
      "Desert Eagle | Code Red (Field-Tested)",
      "Glock-18 | Gamma Doppler (Factory New)",
      "USP-S | Kill Confirmed (Field-Tested)",
      "USP-S | Neo-Noir (Field-Tested)",
      "USP-S | Printstream (Field-Tested)",
      // Gloves
      "★ Sport Gloves | Superconductor (Field-Tested)",
      "★ Specialist Gloves | Tiger Strike (Field-Tested)",
      "★ Driver Gloves | King Snake (Field-Tested)",
      "★ Moto Gloves | Boom! (Field-Tested)",
      // Knives
      "★ Karambit | Doppler (Factory New)",
      "★ M9 Bayonet | Doppler (Factory New)",
      "★ Butterfly Knife | Fade (Factory New)",
      "★ Talon Knife | Doppler (Factory New)",
      // Cases and stickers
      "Operation Riptide Case",
      "Dreams & Nightmares Case",
      "Revolution Case",
      "Kilowatt Case"
    ]
  },

  dota2: {
    appId: 570,
    name: 'Dota 2',
    currency: 20, // NOK
    contextId: 2,
    items: [
      // Arcanas
      "Exalted Fractal Horns of Inner Abysm",
      "Exalted Bladeform Legacy",
      "Exalted Manifold Paradox",
      "Exalted Great Sage's Reckoning",
      "Exalted Frost Avalanche",
      "Exalted Swine of the Sunken Galley",
      "Exalted Tempest Helm of the Thundergod",

      // Immortals
      "Golden Profane Union",
      "Golden Rubick's Golden Staff",
      "Golden Scavenging Guttleslug",
      "Golden Almond the Frondillo",
      "Golden Atomic Ray Thrusters",

      // Sets
      "Fractal Horns of Inner Abysm",
      "Compass of the Rising Gale",
      "Bladeform Legacy",
      "Demon Eater",
      "Dragonclaw Hook",

      // Rare items
      "Unusual Wardog",
      "Unusual Enduring War Dog",
      "Unusual Baby Roshan",
      "Genuine Wynchell the Wyrmeleon",
      "Genuine Shagbark",

      // Treasures
      "Treasure of the Crimson Witness 2021",
      "Treasure of the Crimson Witness 2022",
      "Treasure of the Crimson Witness 2023",
      "Diretide 2022 Treasure",
      "The International 2023 Collector's Cache"
    ]
  }
};

// Export configuration
module.exports = {
  games,

  // Get game by name
  getGame(gameName) {
    const game = games[gameName.toLowerCase()];
    if (!game) {
      throw new Error(`Unknown game: ${gameName}. Available: ${Object.keys(games).join(', ')}`);
    }
    return game;
  },

  // Get all supported games
  getAllGames() {
    return Object.keys(games);
  },

  // Get game by AppID
  getGameByAppId(appId) {
    for (const [key, game] of Object.entries(games)) {
      if (game.appId === appId) {
        return { key, ...game };
      }
    }
    return null;
  }
};
