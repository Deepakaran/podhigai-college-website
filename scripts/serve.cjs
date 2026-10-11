'use strict';
const path = require('node:path');
const fs = require('node:fs');
const httpServer = require('http-server');
const root = path.resolve(__dirname, '..');
const pages = new Set(['index.html', 'about.html', 'academics.html', 'admin.html', 'campus.html', 'contact.html', 'faq.html', 'placements.html']);

function publicOnly(req, res) {
  let pathname;
  try { pathname = decodeURIComponent(req.url.split('?')[0]); } catch { pathname = ''; }
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  const safeParts = pathname.startsWith('/') && !relative.split(/[\\/]/).some(p => p.startsWith('.') || !p);
  const allowed = pages.has(relative) || /^departments\/[a-z]+\.html$/.test(relative) || /^(assets|images)\/[\w/-]+\.(css|js|png|jpe?g|webp|gif|svg|ico|woff2?)$/i.test(relative);
  if (!['GET', 'HEAD'].includes(req.method) || !safeParts || !allowed) {
    res.statusCode = 404;
    return res.end('Not found');
  }
  try {
    const resolved = fs.realpathSync(path.join(root, relative));
    const expectedParent = relative.includes('/') ? path.join(root, relative.split('/')[0]) + path.sep : root + path.sep;
    if (!resolved.startsWith(expectedParent)) throw new Error('Outside public root');
  } catch {
    res.statusCode = 404;
    return res.end('Not found');
  }
  res.emit('next');
}

function createServer() {
  return httpServer.createServer({ root, cache: -1, showDir: false, showDotfiles: false, before: [publicOnly] });
}
if (require.main === module) {
  const port = Number(process.env.FRONTEND_PORT || 5500);
  createServer().listen(port, '127.0.0.1', () => console.log(`Website: http://localhost:${port}`));
}
module.exports = { createServer, publicOnly };
