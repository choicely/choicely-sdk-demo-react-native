console.log('Starting Metro proxy...')
const path = require('path')
const http = require('http')
const httpProxy = require('http-proxy')
const {getPorts} = require('./ports')

const projectRoot = path.resolve(__dirname, '..')
const {proxyPort, metroPort} = getPorts(projectRoot)

const targetUrl = `http://127.0.0.1:${metroPort}`
const proxy = httpProxy.createProxyServer({
  target: targetUrl,
  ws: true,
  changeOrigin: true,
  ignorePath: false,
})

function respond502(err, req, resOrSocket) {
  const msg = `Proxy failed to reach Metro on ${targetUrl}\n${String(err)}`

  if (resOrSocket && typeof resOrSocket.writeHead === 'function') {
    if (!resOrSocket.headersSent) {
      resOrSocket.writeHead(502, {'Content-Type': 'text/plain'})
    }
    resOrSocket.end(msg)
    return
  }

  const socket = resOrSocket
  if (socket && typeof socket.write === 'function') {
    try {
      const bodyLen = Buffer.byteLength(msg)
      socket.write(
        'HTTP/1.1 502 Bad Gateway\r\n' +
        'Content-Type: text/plain\r\n' +
        'Connection: close\r\n' +
        `Content-Length: ${bodyLen}\r\n` +
        '\r\n' + msg,
      )
    } catch {
    }
    try {
      socket.end()
    } catch {
    }
    try {
      socket.destroy()
    } catch {
    }
  }
}

proxy.on('error', (err, req, resOrSocket) => {
  console.error('[proxy] error:', err && err.stack ? err.stack : err)
  respond502(err, req, resOrSocket)
})

const server = http.createServer((req, res) => proxy.web(req, res))

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head, (err) => {
    if (err) respond502(err, req, socket)
  })
})

server.on('clientError', (err, socket) => {
  try {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
  } catch {
  }
})

server.listen(proxyPort, '0.0.0.0', () =>
  console.log(`[proxy] forwarding http/ws ${proxyPort} -> ${metroPort}`),
)

process.on('SIGINT', () => server.close(() => process.exit(0)))
process.on('SIGTERM', () => server.close(() => process.exit(0)))
