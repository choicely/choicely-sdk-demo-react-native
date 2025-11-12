console.log('Starting Metro proxy...');
const path = require('path');
const http = require('http');
const httpProxy = require('http-proxy');
const { getPorts } = require('./ports');

const projectRoot = path.resolve(__dirname, '..');
const { proxyPort, metroPort } = getPorts(projectRoot);

const targetUrl = `http://127.0.0.1:${metroPort}`;
const proxy = httpProxy.createProxyServer({
  target: targetUrl,
  ws: true,
  changeOrigin: true,
  ignorePath: false,
});

proxy.on('error', (err, req, res) => {
  if (res && !res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain' });
  if (res) res.end(`Proxy failed to reach Metro on ${targetUrl}\n${String(err)}`);
});

const server = http.createServer((req, res) => proxy.web(req, res));
server.on('upgrade', (req, socket, head) => proxy.ws(req, socket, head));
server.listen(proxyPort, '0.0.0.0', () =>
  console.log(`[proxy] forwarding http/ws ${proxyPort} -> ${metroPort}`)
);

process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
