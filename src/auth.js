require('dotenv').config();
const SteamClient = require('./classes/SteamClient');

/**
 * Authenticate with Steam and save session cookies
 */
async function authenticate() {
  const credentials = {
    username: process.env.STEAM_USERNAME,
    password: process.env.STEAM_PASSWORD,
    sharedSecret: process.env.STEAM_SHARED_SECRET,
    identitySecret: process.env.STEAM_IDENTITY_SECRET
  };

  const steamClient = new SteamClient(credentials);

  try {
    console.log('🔐 Authenticating with Steam...\n');
    await steamClient.login();
    await steamClient.saveCookies('./cookies.json');
    console.log('\n✅ Authentication completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Authentication failed:', error.message);
    process.exit(1);
  }
}

authenticate();
