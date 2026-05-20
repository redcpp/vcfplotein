/**
 * Production server for the vcfplotein SPA.
 *
 * Serves the Vite build from ./dist and reverse-proxies /api/* calls to the
 * UNAM companion backend. The upstream TLS certificate expired on 2025-04-05,
 * so browsers refuse to call it directly; this server proxies those requests
 * with `rejectUnauthorized: false` to bypass the expired upstream cert.
 *
 * Zero external dependencies — Node.js built-in modules only.
 */

import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { URL, fileURLToPath } from 'node:url'

const PORT = process.env.PORT || 3000
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, '..', 'dist')
const INDEX_HTML = path.join(DIST_DIR, 'index.html')

// UNAM companion backend (expired cert — see header comment).
const UPSTREAM_HOST = 'vcfplotein.liigh.unam.mx'
const UPSTREAM_PORT = 8181

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
}

/**
 * Reverse-proxy a request to the UNAM backend, stripping the `/api` prefix.
 */
function proxyToUpstream (req, res) {
  const upstreamPath = req.url.replace(/^\/api/, '') || '/'

  // Clone headers and rewrite `host` so the upstream sees its own hostname.
  const headers = Object.assign({}, req.headers)
  headers.host = `${UPSTREAM_HOST}:${UPSTREAM_PORT}`

  const options = {
    hostname: UPSTREAM_HOST,
    port: UPSTREAM_PORT,
    path: upstreamPath,
    method: req.method,
    headers,
    rejectUnauthorized: false // upstream cert expired 2025-04-05
  }

  const upstreamReq = https.request(options, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode, upstreamRes.headers)
    upstreamRes.pipe(res)
  })

  upstreamReq.on('error', (err) => {
    console.error(`Proxy error for ${req.method} ${req.url}:`, err.message)
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
    }
    res.end(JSON.stringify({ error: 'Bad Gateway', message: err.message }))
  })

  // Forward the request body (POST and friends).
  req.pipe(upstreamReq)
}

/**
 * Serve a static file, falling back to the SPA index.html for client routing.
 */
function serveStatic (req, res) {
  // Resolve the requested path safely inside DIST_DIR (block path traversal).
  const requestPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  const resolved = path.normalize(path.join(DIST_DIR, requestPath))

  if (!resolved.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Forbidden')
    return
  }

  fs.stat(resolved, (err, stats) => {
    if (!err && stats.isFile()) {
      sendFile(res, resolved)
    } else {
      // Not a real file — fall back to the SPA entry point.
      sendSpaFallback(res)
    }
  })
}

function sendFile (res, filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': contentType })
  fs.createReadStream(filePath)
    .on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      }
      res.end('Internal Server Error')
    })
    .pipe(res)
}

function sendSpaFallback (res) {
  fs.stat(INDEX_HTML, (err, stats) => {
    if (!err && stats.isFile()) {
      sendFile(res, INDEX_HTML)
    } else {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Build not found: run the Vite build to generate ./dist first.')
    }
  })
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/') || req.url === '/api') {
    proxyToUpstream(req, res)
    return
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res)
    return
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Method Not Allowed')
})

server.listen(PORT, () => {
  console.log(`vcfplotein server listening on port ${PORT}`)
  console.log(`Serving SPA from ${DIST_DIR}`)
  console.log(`Proxying /api/* -> https://${UPSTREAM_HOST}:${UPSTREAM_PORT}`)
})
