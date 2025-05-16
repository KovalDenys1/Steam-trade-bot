require('dotenv').config();
const fs = require('fs');
const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');

const client = new SteamUser();
const community = new SteamCommunity();

const logOnOptions = {
  accountName: process.env.STEAM_USERNAME,
  password: process.env.STEAM_PASSWORD,
  twoFactorCode: SteamTotp.generateAuthCode(process.env.STEAM_SHARED_SECRET)
};

client.logOn(logOnOptions);

client.on('loggedOn', () => {
  console.log(`✅ Logged into Steam as ${client.steamID.getSteam3RenderedID()}`);
});

client.on('webSession', (sessionID, cookies) => {
  console.log('🌐 Web session acquired');
  fs.writeFileSync('./cookies.json', JSON.stringify({ sessionID, cookies }, null, 2));
  console.log('✅ Cookies saved to cookies.json');
  community.setCookies(cookies);
});