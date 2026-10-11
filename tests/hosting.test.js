const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../scripts/serve.cjs');

test('static hosting serves public pages and rejects private project paths', async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.server.close(resolve)));
  const port = server.server.address().port;
  for (const url of ['/', '/contact.html', '/departments/cse.html', '/assets/main.js', '/images/logo.png']) {
    const response = await fetch(`http://127.0.0.1:${port}${url}`, { signal: AbortSignal.timeout(5000) });
    await response.arrayBuffer();
    assert.equal(response.status, 200, url);
  }
  for (const url of ['/backend/server.js', '/backend/.env', '/package.json', '/.git/config', '/logs/', '/reports/audit.md', '/assets/%2e%2e/backend/server.js']) {
    const response = await fetch(`http://127.0.0.1:${port}${url}`, { signal: AbortSignal.timeout(5000) });
    await response.text();
    assert.equal(response.status, 404, url);
  }
});
