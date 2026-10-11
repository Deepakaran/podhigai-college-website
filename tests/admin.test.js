const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../assets/admin.js'), 'utf8');

function harness(fetchImpl = async () => response({ success: true, messages: [], total: 0 })) {
  const nodes = new Map();
  const storage = new Map();
  const notices = [];
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, { style: {}, dataset: {}, value: '', innerHTML: '', textContent: '',
      classList: { add() {}, remove() {}, toggle() {} }, querySelector() { return node(id + '-text'); },
      remove() {}, scrollIntoView() {} });
    return nodes.get(id);
  }
  const store = { getItem: key => storage.get(key) ?? null, setItem: (key, val) => storage.set(key, val), removeItem: key => storage.delete(key) };
  const ctx = vm.createContext({ console: { log() {}, warn() {}, error() {} }, URLSearchParams,
    AbortSignal, FormData, fetch: fetchImpl, localStorage: store, sessionStorage: store,
    setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {},
    CustomEvent: class {}, StorageEvent: class {},
    window: { location: { hostname: 'localhost' }, dispatchEvent() {}, addEventListener() {} },
    document: { readyState: 'loading', addEventListener() {}, getElementById: node,
      querySelector: () => node('query'), querySelectorAll: () => [] } });
  vm.runInContext(source, ctx);
  ctx.notices = notices;
  vm.runInContext("adminToken = 'test-token'; showToast = (message, type) => notices.push({ message, type });", ctx);
  return { ctx, node, storage, run: code => vm.runInContext(code, ctx) };
}
function response(data, status = 200) { return { ok: status >= 200 && status < 300, status, json: async () => data }; }

test('messages read every API page and never resurrect local-only records', async () => {
  const calls = [];
  const h = harness(async url => {
    const page = Number(new URL(url).searchParams.get('page'));
    calls.push(page);
    return response({ success: true, total: 101, limit: 100, messages: Array.from({ length: page === 1 ? 100 : 1 }, (_, i) => ({ _id: String((page - 1) * 100 + i) })) });
  });
  h.storage.set('podhigai_contacts', JSON.stringify([{ _id: 'deleted-on-server' }]));
  const messages = await h.run('fetchMergedMessages()');
  assert.equal(messages.length, 101);
  assert.deepEqual(calls, [1, 2]);
  assert.equal(messages.some(m => m._id === 'deleted-on-server'), false);
});

test('message pagination slices cards and clamps the final page', async () => {
  const h = harness();
  h.ctx.messages = Array.from({ length: 51 }, (_, i) => ({ _id: String(i), name: 'User', isRead: false }));
  h.run('fetchMergedMessages = async () => messages; currentPage = 2;');
  await h.run('loadMessages()');
  assert.equal((h.node('messagesContainer').innerHTML.match(/class="msg-card /g) || []).length, 1);
  h.ctx.messages.pop();
  await h.run('loadMessages()');
  assert.equal(h.run('currentPage'), 1);
});

test('failed message mutations preserve cached state and restore controls', async () => {
  const h = harness(async () => response({ success: false, message: 'Save rejected' }, 500));
  const original = JSON.stringify([{ _id: 'm1', isRead: false }]);
  h.storage.set('podhigai_contacts', original);
  h.ctx.checkbox = { checked: true, disabled: false };
  await h.run("handleMarkReadCheckbox(checkbox, 'm1')");
  assert.equal(h.ctx.checkbox.checked, false);
  assert.equal(h.ctx.checkbox.disabled, false);
  assert.equal(h.storage.get('podhigai_contacts'), original);
  h.run("openDeleteModal('m1')");
  await h.run('confirmDelete()');
  assert.equal(h.storage.get('podhigai_contacts'), original);
  assert.equal(h.run('deleteTargetId'), 'm1');
  assert.equal(h.ctx.notices.some(n => n.type === 'success'), false);
});

test('local event reads preserve deletion, empty lists and jpg/webp images', () => {
  const h = harness();
  const events = [{ id: 'evt_1', coverImage: 'own.jpg', gallery: ['own.webp'] }];
  h.storage.set('podhigai_events', JSON.stringify(events));
  assert.equal(JSON.stringify(h.run('getLocalEvents()')), JSON.stringify(events));
  h.storage.set('podhigai_events', '[]');
  assert.equal(h.run('getLocalEvents().length'), 0);
});

test('HTTP health success with disconnected database is unhealthy', async () => {
  const h = harness(async () => response({ status: 'ok', db: 'disconnected' }));
  assert.equal(await h.run('checkBackendHealth()'), false);
  assert.equal(h.node('backendHealthBadge').className, 'health-badge offline');
});

test('password whitespace survives login', async () => {
  let sent;
  const h = harness(async (url, options) => { sent = JSON.parse(options.body); return response({ success: false }, 401); });
  h.node('adminUsername').value = ' admin ';
  h.node('adminPassword').value = ' pass ';
  await h.run('handleLogin({ preventDefault() {} })');
  assert.equal(sent.password, ' pass ');
});

test('message refresh reports server failure instead of displaying stale contacts or success', async () => {
  const h = harness(async () => response({ success: false }, 500));
  h.storage.set('podhigai_contacts', JSON.stringify([{ name: 'Stale secret' }]));
  await h.run('refreshMessages()');
  assert.match(h.node('messagesContainer').innerHTML, /Error loading messages/);
  assert.doesNotMatch(h.node('messagesContainer').innerHTML, /Stale secret/);
  assert.equal(h.ctx.notices.some(n => /refreshed from server/.test(n.message)), false);
  assert.equal(h.ctx.notices.at(-1).type, 'error');
});

test('401 expires auth, closes overlays, and does not show cached content', async () => {
  const h = harness(async () => response({ success: false }, 401));
  h.storage.set('adminToken', 'test-token');
  h.run("openDeleteModal('m1')");
  await h.run('loadMessages()');
  assert.equal(h.run('adminToken'), '');
  assert.equal(h.storage.has('adminToken'), false);
  assert.equal(h.node('dashboardScreen').style.display, 'none');
  assert.equal(h.node('deleteModal').style.display, 'none');
  assert.equal(h.node('messagesContainer').innerHTML, '');
  assert.match(h.node('loginError').textContent, /expired/);
});

test('dashboard re-entry resets the selected panel and message filters', async () => {
  const h = harness();
  h.run("currentView = 'gallery'; currentFilter = 'unread'; currentPage = 4; searchQuery = 'old'; dateFrom = '2020-01-01';");
  await h.run('showDashboard()');
  assert.equal(h.run('currentView'), 'messages');
  assert.equal(h.run('currentFilter'), 'all');
  assert.equal(h.run('currentPage'), 1);
  assert.equal(h.node('galleryPanel').style.display, 'none');
  assert.equal(h.node('messagesContainer').style.display, 'flex');
  assert.equal(h.run('searchQuery + dateFrom'), '');
});

test('dynamic IDs and image/category values cannot become HTML or inline script', () => {
  const h = harness();
  const attack = `x'\");alert(1);//\" onerror=\"alert(2)<script>`;
  h.ctx.item = { _id: attack, id: attack, name: '< script>', title: attack, coverImage: attack, imageUrl: attack, category: attack };
  const cards = [h.run('renderMessageCard(item, false)'), h.run('renderAdminEventCard(item)'), h.run('renderAdminPhotoCard(item)')];
  for (const html of cards) {
    assert.equal(html.includes(attack), false);
    assert.equal(html.includes('<script>'), false);
    const handlers = [...html.matchAll(/(?:onclick|onchange)="([^"]*)"/g)].map(match => match[1]);
    assert.ok(handlers.length > 0);
    assert.ok(handlers.every(handler => !handler.includes('alert') && handler.includes('this.dataset.id')));
  }
});

test('successful chairman save survives unavailable storage and failed saves preserve confirmed data', async () => {
  const h = harness();
  h.node('chNameInput').value = 'New Chairman';
  h.node('chRoleInput').value = 'Chairman';
  h.node('chImageUrlInput').value = 'portrait.webp';
  h.ctx.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  h.run('apiRequestWithProgress = async () => ({ ok: true, data: { success: true } });');
  await h.run('handleSaveChairman()');
  assert.equal(h.run('currentChairmanData.name'), 'New Chairman');
  assert.equal(h.ctx.notices.at(-1).type, 'success');
  h.node('chNameInput').value = 'Rejected Name';
  h.run('apiRequestWithProgress = async () => ({ ok: false, message: "Rejected" });');
  await h.run('handleSaveChairman()');
  assert.equal(h.run('currentChairmanData.name'), 'New Chairman');
  assert.equal(h.ctx.notices.at(-1).type, 'error');
});

test('event search retains complete edit cache even when localStorage is full', async () => {
  const events = [{ id: 'a', title: 'Match', gallery: ['custom.webp'] }, { id: 'b', title: 'Other' }];
  const h = harness(async () => response({ success: true, events }));
  h.ctx.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  h.run("evtSearchQuery = 'Match'");
  await h.run('loadEvents()');
  assert.equal(h.run('getLocalEvents().length'), 2);
  assert.match(h.node('eventsContainer').innerHTML, /Match/);
  assert.doesNotMatch(h.node('eventsContainer').innerHTML, />Other</);
  h.run("openEditEventModal('a')");
  assert.equal(h.node('evtInputTitle').value, 'Match');
});

test('gallery renders sorted filtered cards and rejected reorder does not mutate cache', async () => {
  const photos = [{ id: 'late', title: 'Later', category: 'campus', order: 2 }, { id: 'early', title: 'Earlier', category: 'campus', order: 1 }];
  const h = harness(async () => response({ success: true, photos }));
  await h.run('loadGallery()');
  const html = h.node('galleryContainer').innerHTML;
  assert.ok(html.indexOf('Earlier') < html.indexOf('Later'));
  h.run('apiRequestWithProgress = async () => ({ ok: false, message: "Rejected" }); loadGallery = async () => {};');
  await h.run("shiftPhotoOrder('late', -1)");
  assert.equal(h.run("getLocalGallery().find(p => p.id === 'late').order"), 2);
  assert.equal(h.ctx.notices.at(-1).type, 'error');
});

test('XHR auth expiry returns to login and does not resolve a save as successful', async () => {
  const h = harness();
  h.ctx.XMLHttpRequest = class {
    open() {} setRequestHeader() {}
    send() { this.status = 401; this.responseText = '{"success":false}'; this.onload(); }
  };
  await assert.rejects(h.run("apiRequestWithProgress({ url: '/test', token: adminToken })"), /expired/);
  assert.equal(h.run('adminToken'), '');
  assert.equal(h.node('loginScreen').style.display, 'flex');
});

test('saving event metadata preserves the existing gallery', async () => {
  const h = harness();
  h.run("saveLocalEvents([{ id: 'e1', title: 'Title', date: 'Tomorrow', gallery: ['first.jpg', 'second.webp'] }]); openEditEventModal('e1'); loadEvents = async () => {}; loadStats = async () => {};");
  let payload;
  h.ctx.apiRequestWithProgress = async options => { payload = options.data; return { ok: true, data: { success: true } }; };
  await h.run('handleSaveEvent({ preventDefault() {} })');
  assert.deepEqual(Array.from(payload.gallery), ['first.jpg', 'second.webp']);
});

test('chairman reset persists through the authenticated API', async () => {
  const h = harness();
  h.ctx.confirm = () => true;
  let request;
  h.ctx.apiRequestWithProgress = async options => { request = options; return { ok: true, data: { success: true } }; };
  await h.run('handleResetChairman()');
  assert.match(request.url, /\/admin\/chairman$/);
  assert.equal(request.token, 'test-token');
  assert.equal(request.data.name, h.run('DEFAULT_CHAIRMAN.name'));
  assert.equal(h.ctx.notices.at(-1).type, 'success');
});

test('XHR malformed 200 responses cannot claim a successful mutation', async () => {
  const h = harness();
  h.ctx.XMLHttpRequest = class {
    open() {} setRequestHeader() {}
    send() { this.status = 200; this.responseText = '<html>Proxy error</html>'; this.onload(); }
  };
  const result = await h.run("apiRequestWithProgress({ url: '/test', token: adminToken })");
  assert.equal(result.ok, false);
});
