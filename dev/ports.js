const {loadEnv} = require('./env')

function assertPortRange(n, min = 1, max = 65535) {
  return Number.isInteger(n) && n >= min && n <= max
}

function getPorts(rootDir) {
  loadEnv(rootDir)
  const raw = process.env.RCT_METRO_PORT
  if (raw === undefined) {
    throw new Error('RCT_METRO_PORT is not set. Define it in `.env`, `default.env`, or export it.')
  }
  const proxyPort = Number(raw)
  if (!assertPortRange(proxyPort, 2, 65535)) {
    throw new Error(`RCT_METRO_PORT invalid: "${raw}". Must be an integer between 2 and 65535.`)
  }
  const metroPort = proxyPort
  if (!assertPortRange(metroPort)) {
    throw new Error(`Derived Metro port invalid: ${metroPort}`)
  }
  const rawWebPort = process.env.WEB_PORT
  if (rawWebPort === undefined) {
    throw new Error('WEB_PORT is not set. Define it in `.env`, `default.env`, or export it.')
  }
  const webPort = Number(rawWebPort)
  if (!assertPortRange(webPort)) {
    throw new Error(`WEB_PORT invalid: "${rawWebPort}". Must be an integer between 1 and 65535.`)
  }
  return {proxyPort, metroPort, webPort}
}

module.exports = {getPorts, assertPortRange}
