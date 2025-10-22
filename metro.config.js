const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { getDefaultConfig } = require('@react-native/metro-config');

function parseIfExists(p) {
  try {
    return fs.existsSync(p) ? dotenv.parse(fs.readFileSync(p)) : {};
  } catch {
    return {};
  }
}

// --- load: default.env -> .env (real env still wins) ---
(function prepareEnv() {
  const root = __dirname;
  const defaults = parseIfExists(path.join(root, 'default.env'));
  const local = parseIfExists(path.join(root, '.env'));

  // merge order: default.env then .env override
  const merged = { ...defaults, ...local };

  // hydrate process.env without clobbering existing shell vars
  for (const [k, v] of Object.entries(merged)) {
    if (process.env[k] === undefined) process.env[k] = v;
  }

  // hard requirement: RCT_METRO_PORT must exist
  if (process.env.RCT_METRO_PORT === undefined) {
    throw new Error(
      'RCT_METRO_PORT is not set. Define it in `.env`, or `default.env`, or export it in your shell.'
    );
  }

  // validate port
  const n = Number(process.env.RCT_METRO_PORT);
  const isValid = Number.isInteger(n) && n >= 1 && n <= 65535;
  if (!isValid) {
    throw new Error(
      `RCT_METRO_PORT is invalid: "${process.env.RCT_METRO_PORT}". Must be an integer between 1 and 65535.`
    );
  }
})();

// --- Metro config (no defaults here) ---
const port = Number(process.env.RCT_METRO_PORT);

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  config.server = { ...config.server, port };
  return config;
})();
