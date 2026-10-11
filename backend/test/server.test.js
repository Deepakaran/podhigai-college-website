'use strict';

const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const http = require('node:http');
const dotenv = require('dotenv');

// Import must not read any .env, open a listener, or connect to a database.
const connectGuard = mock.method(mongoose, 'connect', () => { throw new Error('Database access forbidden'); });
const listenGuard = mock.method(http.Server.prototype, 'listen', () => { throw new Error('Network listeners forbidden'); });
const dotenvGuard = mock.method(dotenv, 'config', () => { throw new Error('.env access forbidden'); });
const { app, server, io, start, authConfig, isOriginAllowed, models } = require('../server');
const { validateRequest } = require('../validation');
const { Contact, Event, GalleryPhoto, Review, Chairman } = models;
const savedEnv = { ...process.env };
let token;

// Exercise the registered validation middleware and actual route handler directly.
// Rate limiting/HTTP parsing are outside these unit tests. No listener or DB is used.
async function request(method, url, body = {}, authorization = token ? `Bearer ${token}` : '') {
  const parsed = new URL(url, 'http://unit.test');
  const layer = app._router.stack.find(item => item.route && item.route.methods[method.toLowerCase()] && item.regexp.test(parsed.pathname));
  assert.ok(layer, `Route exists: ${method} ${parsed.pathname}`);
  const match = layer.regexp.exec(parsed.pathname);
  const params = Object.fromEntries(layer.keys.map((key, index) => [key.name, decodeURIComponent(match[index + 1])]));
  const req = { method, path: parsed.pathname, query: app.get('query parser fn')(parsed.search.slice(1)), body, params, headers: { authorization }, ip: '192.0.2.10' };
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = JSON.parse(JSON.stringify(value)); return this; } };
  let valid = false;
  assert.ok(app._router.stack.some(item => item.handle === validateRequest), 'Validation is installed in the app');
  validateRequest(req, res, () => { valid = true; });
  if (valid) await layer.route.stack.at(-1).handle(req, res);
  assert.ok(res.body, 'Handler returned JSON');
  return res;
}

function query(rows = []) {
  return { sort() { return this; }, skip() { return this; }, limit() { return this; }, select() { return this; }, async lean() { return rows; } };
}

beforeEach(async () => {
  process.env.ADMIN_USERNAME = '  TestAdmin  ';
  process.env.ADMIN_PASSWORD = ' literal password ';
  process.env.JWT_SECRET = ' synthetic-unit-test-secret ';
  process.env.NODE_ENV = 'production';
  process.env.CORS_ORIGINS = 'https://podhigai-college-website.web.app';
  mock.method(console, 'log', () => {});
  mock.method(console, 'error', () => {});
  mock.method(io, 'emit', () => {});
  // Fail closed on any persistence operation not explicitly mocked by a test.
  for (const Model of Object.values(models)) {
    for (const method of ['find', 'findOne', 'findById', 'findByIdAndUpdate', 'findByIdAndDelete', 'findOneAndUpdate', 'findOneAndDelete', 'countDocuments', 'updateMany', 'bulkWrite', 'insertMany']) {
      mock.method(Model, method, () => { throw new Error(`Unmocked ${Model.modelName}.${method}`); });
    }
    mock.method(Model.prototype, 'save', () => { throw new Error(`Unmocked ${Model.modelName}.save`); });
  }
  token = undefined;
  const login = await request('POST', '/api/admin/login', { username: 'testadmin', password: ' literal password ' });
  assert.equal(login.statusCode, 200);
  token = login.body.token;
});

afterEach(() => {
  mock.restoreAll();
  for (const key of ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'JWT_SECRET', 'NODE_ENV', 'CORS_ORIGINS', 'MONGODB_URI', 'SEED_DEFAULT_CONTENT']) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

test('import does not read configuration, connect, or listen', () => {
  assert.equal(connectGuard.mock.callCount(), 0);
  assert.equal(listenGuard.mock.callCount(), 0);
  assert.equal(dotenvGuard.mock.callCount(), 0);
  assert.equal(server.listening, false);
  assert.equal(mongoose.connection.readyState, 0);
});

test('startup requires all auth configuration before attempting connection', async () => {
  const connect = mock.method(mongoose, 'connect', () => { throw new Error('Must not connect'); });
  for (const key of ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'JWT_SECRET']) {
    const value = process.env[key];
    delete process.env[key];
    assert.throws(authConfig, /must be configured/);
    await assert.rejects(start(), /must be configured/);
    const login = await request('POST', '/api/admin/login', { username: 'testadmin', password: ' literal password ' });
    assert.equal(login.statusCode, 503);
    assert.equal((await request('GET', '/api/admin/events')).statusCode, 401);
    process.env[key] = value;
  }
  assert.equal(connect.mock.callCount(), 0);
});

test('startup leaves empty collections alone unless seeding is explicitly enabled', async () => {
  process.env.MONGODB_URI = 'mongodb://unit.invalid/disposable';
  delete process.env.SEED_DEFAULT_CONTENT;
  mock.method(mongoose, 'connect', async () => {});
  mock.method(server, 'listen', (port, host, ready) => ready());
  mock.method(require('node:dns'), 'setDefaultResultOrder', () => {});
  await start();
  assert.equal(Event.countDocuments.mock.callCount(), 0);
  assert.equal(GalleryPhoto.countDocuments.mock.callCount(), 0);
  process.env.SEED_DEFAULT_CONTENT = 'true';
  mock.method(Event, 'countDocuments', async () => 0);
  mock.method(GalleryPhoto, 'countDocuments', async () => 0);
  const events = mock.method(Event, 'insertMany', async () => {});
  const photos = mock.method(GalleryPhoto, 'insertMany', async () => {});
  await start();
  assert.equal(events.mock.callCount(), 1);
  assert.equal(photos.mock.callCount(), 1);
});

test('login and bearer verification share normalization and preserve literal password whitespace', async () => {
  mock.method(Event, 'find', () => query());
  const login = await request('POST', '/api/admin/login', { username: ' TESTADMIN ', password: ' literal password ' });
  assert.equal(login.statusCode, 200);
  assert.equal((await request('GET', '/api/admin/events', {}, `Bearer ${login.body.token}`)).statusCode, 200);
  assert.equal((await request('GET', '/api/admin/events', {}, login.body.token)).statusCode, 401);
  assert.equal((await request('POST', '/api/admin/login', { username: 'testadmin', password: 'literal password' })).statusCode, 401);
  for (const body of [{ username: {}, password: 'x' }, { username: 'testadmin', password: [] }]) {
    assert.equal((await request('POST', '/api/admin/login', body)).statusCode, 400);
  }
});

test('CORS only allows explicit production origins and exact development loopback hostnames', () => {
  assert.equal(isOriginAllowed('https://podhigai-college-website.web.app'), true);
  for (const origin of ['https://other.web.app', 'https://other.firebaseapp.com', 'http://localhost:5500', 'https://localhost.evil.test', 'https://evil.test/127.0.0.1']) {
    assert.equal(isOriginAllowed(origin), false, origin);
  }
  process.env.NODE_ENV = 'development';
  for (const origin of ['http://localhost:5500', 'http://127.0.0.1:3000', 'http://[::1]:8080']) assert.equal(isOriginAllowed(origin), true, origin);
  for (const origin of ['https://localhost.evil.test', 'https://evil.test/localhost', 'http://localhost@evil.test', 'ftp://localhost', 'http://localhost:5500/path']) assert.equal(isOriginAllowed(origin), false, origin);
  let allowed;
  io.engine.opts.allowRequest({ headers: { origin: 'https://other.web.app' } }, (_, value) => { allowed = value; });
  assert.equal(allowed, false);
});

test('contact rejects bad types, optional field coercion and excessive length before persistence', async () => {
  const valid = { name: 'Name', email: 'user@example.test', message: 'Enquiry' };
  for (const change of [{ name: {} }, { email: [] }, { message: 4 }, { phone: {} }, { subject: false }, { name: 'x'.repeat(101) }, { message: 'x'.repeat(2001) }, { email: 'bad' }]) {
    assert.equal((await request('POST', '/api/contact', { ...valid, ...change })).statusCode, 400);
  }
  assert.equal((await request('POST', '/API/CONTACT/', { ...valid, phone: {} })).statusCode, 400);
  assert.equal(Contact.findOne.mock.callCount(), 0);
  assert.equal(Contact.prototype.save.mock.callCount(), 0);
});

test('contact normalizes padded email and persists only public submission fields', async () => {
  let duplicateFilter;
  mock.method(Contact, 'findOne', async filter => { duplicateFilter = filter; return null; });
  let saved;
  mock.method(Contact.prototype, 'save', async function () { saved = this.toObject(); return this; });
  const response = await request('POST', '/api/contact', { name: ' Name ', email: ' USER@EXAMPLE.TEST ', message: ' Enquiry ', isRead: true, ip: 'spoofed' });
  assert.equal(response.statusCode, 201);
  assert.equal(duplicateFilter.email, 'user@example.test');
  assert.equal(saved.name, 'Name');
  assert.equal(saved.isRead, false);
  assert.equal(saved.ip, '192.0.2.10');
});

test('reviews require integer numeric ratings and bounded string fields', async () => {
  const valid = { name: 'Name', rating: 5, title: 'Title', comment: 'Comment' };
  for (const change of [{ rating: '5' }, { rating: 'nonsense' }, { rating: 1.5 }, { rating: 0 }, { rating: 6 }, { rating: {} }, { role: [] }, { title: 7 }, { category: 'x'.repeat(51) }, { comment: 'x'.repeat(701) }]) {
    assert.equal((await request('POST', '/api/reviews', { ...valid, ...change })).statusCode, 400);
  }
  assert.equal(Review.prototype.save.mock.callCount(), 0);
});

test('public review list and creation omit IP addresses', async () => {
  const selections = [];
  mock.method(Review, 'find', () => ({ ...query(), select(selection) { selections.push(selection); return this; }, async lean() { return [{ name: 'Name', rating: 5 }]; } }));
  const listed = await request('GET', '/api/reviews');
  assert.equal(listed.statusCode, 200);
  assert.deepEqual(selections, ['-ip', 'rating']);
  assert.equal('ip' in listed.body.reviews[0], false);
  mock.method(Review.prototype, 'save', async function () { return this; });
  const created = await request('POST', '/api/reviews', { name: 'Name', rating: 5, title: 'Title', comment: 'Comment' });
  assert.equal(created.statusCode, 201);
  assert.equal('ip' in created.body.review, false);
});

test('query validation rejects injection objects, arrays, bad dates and invalid pagination', async () => {
  for (const suffix of ['search[$ne]=x', 'search=x&search=y', 'limit=-1', 'limit=0', 'limit=2junk', 'page=-4', 'page=9007199254740991', 'dateFrom=2026-02-30', 'dateTo=nope', 'dateFrom=2026-10-02&dateTo=2026-10-01']) {
    assert.equal((await request('GET', `/api/admin/messages?${suffix}`)).statusCode, 400, suffix);
  }
  for (const route of ['/api/gallery?category[$ne]=x', '/api/reviews?rating=2.5', '/api/admin/events?search[]=x', '/api/admin/reviews?rating[]=4']) {
    assert.equal((await request('GET', route)).statusCode, 400, route);
  }
  assert.equal(Contact.find.mock.callCount(), 0);
});

test('all search endpoints escape regex metacharacters and cap pagination', async () => {
  const search = '[a-z]+(x).*';
  const expected = '\\[a-z\\]\\+\\(x\\)\\.\\*';
  for (const [route, Model] of [['/api/admin/messages', Contact], ['/api/admin/events', Event], ['/api/gallery', GalleryPhoto], ['/api/admin/gallery', GalleryPhoto], ['/api/admin/reviews', Review]]) {
    let captured;
    let limit;
    let skip;
    mock.method(Model, 'find', filter => { captured = filter; return { ...query(), limit(value) { limit = value; return this; }, skip(value) { skip = value; return this; } }; });
    mock.method(Model, 'countDocuments', async () => 0);
    const result = await request('GET', `${route}?search=${encodeURIComponent(search)}&page=2&limit=1000`);
    assert.equal(result.statusCode, 200, route);
    for (const part of captured.$or) assert.equal(Object.values(part)[0].$regex, expected, route);
    if (Model === Contact) { assert.equal(limit, 100); assert.equal(skip, 100); }
  }
});

test('invalid ObjectIds are 400 and missing message read is 404 without broadcast', async () => {
  for (const [method, path] of [['PATCH', '/api/admin/messages/bad/read'], ['DELETE', '/api/admin/messages/bad'], ['DELETE', '/api/admin/reviews/bad'], ['PATCH', '/api/admin/reviews/bad/approve']]) {
    assert.equal((await request(method, path)).statusCode, 400);
  }
  mock.method(Contact, 'findByIdAndUpdate', async () => null);
  assert.equal((await request('PATCH', '/api/admin/messages/0123456789abcdef01234567/read')).statusCode, 404);
  assert.equal(io.emit.mock.callCount(), 0);
});

test('event partial updates retain omitted fields and enable Mongoose validators', async () => {
  let update;
  let options;
  const old = { id: 'evt_1', _id: '0123456789abcdef01234567', title: 'Old', date: 'Tomorrow', time: '10 AM', venue: 'Hall', category: 'Meet', description: 'Details', featured: true };
  mock.method(Event, 'findOneAndUpdate', async (_, changes, settings) => { update = changes; options = settings; return { ...old, ...changes.$set }; });
  const response = await request('PUT', '/api/admin/events/evt_1', { title: ' New ' });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(update, { $set: { title: 'New' } });
  assert.equal(options.runValidators, true);
  assert.equal(response.body.event.venue, 'Hall');
  assert.equal(response.body.event.time, '10 AM');
  assert.equal(Event.updateMany.mock.callCount(), 0);
});

test('invalid and missing event updates cannot clear the featured event', async () => {
  for (const change of [{ title: '' }, { title: 'x'.repeat(201) }, { date: [] }, { featured: 'false' }, { published: 0 }, { gallery: [{}] }, { time: null }]) {
    assert.equal((await request('PUT', '/api/admin/events/evt_1', { featured: true, ...change })).statusCode, 400);
  }
  assert.equal(Event.findOneAndUpdate.mock.callCount(), 0);
  mock.method(Event, 'findOneAndUpdate', async () => null);
  assert.equal((await request('PUT', '/api/admin/events/missing', { featured: true })).statusCode, 404);
  assert.equal(Event.updateMany.mock.callCount(), 0);
});

test('failed event persistence never demotes existing featured events', async () => {
  mock.method(Event, 'findOne', async () => null);
  mock.method(Event.prototype, 'save', async () => { throw new Error('Synthetic write failure'); });
  assert.equal((await request('POST', '/api/admin/events', { title: 'Title', date: 'Tomorrow', featured: true })).statusCode, 500);
  mock.method(Event, 'findOneAndUpdate', async () => { throw new Error('Synthetic write failure'); });
  assert.equal((await request('PUT', '/api/admin/events/evt_1', { featured: true })).statusCode, 500);
  mock.method(Event, 'findOne', async () => ({ featured: false, async save() { throw new Error('Synthetic write failure'); } }));
  assert.equal((await request('PATCH', '/api/admin/events/evt_1/toggle', { field: 'featured' })).statusCode, 500);
  assert.equal(Event.updateMany.mock.callCount(), 0);
  assert.equal(io.emit.mock.callCount(), 0);
});

test('event creation uses literal duplicate matching and demotes only after saving', async () => {
  const sequence = [];
  mock.method(Event, 'findOne', async filter => { assert.equal(filter.title.$regex, '^C\\+\\+ \\(2026\\)$'); return null; });
  mock.method(Event.prototype, 'save', async function () { sequence.push('save'); await this.validate(); return this; });
  mock.method(Event, 'updateMany', async filter => { sequence.push('demote'); assert.ok(filter._id.$ne); });
  const created = await request('POST', '/api/admin/events', { title: 'C++ (2026)', date: 'Tomorrow', featured: true });
  assert.equal(created.statusCode, 201);
  assert.deepEqual(sequence, ['save', 'demote']);
  assert.equal((await request('PATCH', '/api/admin/events/evt_1/toggle', { field: 'typo' })).statusCode, 400);
});

test('featuring an event via MongoDB ID excludes the target from demotion', async () => {
  const id = '0123456789abcdef01234567';
  const sequence = [];
  mock.method(Event, 'findOneAndUpdate', async () => { sequence.push('update'); return { _id: id, id: 'evt_1', featured: true }; });
  mock.method(Event, 'updateMany', async (filter, changes) => {
    sequence.push('demote');
    assert.deepEqual(filter, { _id: { $ne: id } });
    assert.deepEqual(changes, { featured: false });
  });
  assert.equal((await request('PUT', `/api/admin/events/${id}`, { featured: true })).statusCode, 200);
  assert.deepEqual(sequence, ['update', 'demote']);
});

test('gallery validation rejects unsafe coercion and bulk filter injection', async () => {
  const valid = { title: 'Photo', imageUrl: 'images/photo.png' };
  for (const change of [{ title: {} }, { caption: [] }, { imageUrl: {} }, { title: 'x'.repeat(201) }, { category: 'x'.repeat(101) }, { category: ' ' }, { order: '1' }, { order: -1 }, { size: 'huge' }]) {
    assert.equal((await request('POST', '/api/admin/gallery', { ...valid, ...change })).statusCode, 400);
  }
  for (const orders of [[null], [{ id: { $ne: null }, order: 1 }], [{ id: 'photo_1', order: 'oops' }], [{ id: 'photo_1', order: 1 }, { id: 'photo_1', order: 2 }]]) {
    assert.equal((await request('PUT', '/api/admin/gallery/reorder', { orders })).statusCode, 400);
  }
  assert.equal(GalleryPhoto.bulkWrite.mock.callCount(), 0);
  let updated;
  mock.method(GalleryPhoto, 'findOneAndUpdate', async (_, changes, options) => { assert.equal(options.runValidators, true); updated = changes; return { id: 'photo_1', title: 'Existing', ...changes.$set }; });
  assert.equal((await request('PUT', '/api/admin/gallery/photo_1', { caption: ' New ' })).statusCode, 200);
  assert.deepEqual(updated, { $set: { caption: 'New' } });
});

test('chairman persistence failures are errors with no broadcast or in-memory overwrite', async () => {
  mock.method(Chairman, 'findOneAndUpdate', () => ({ async lean() { throw new Error('Synthetic write failure'); } }));
  const saved = await request('POST', '/api/admin/chairman', { name: 'Unsaved name' });
  assert.equal(saved.statusCode, 500);
  assert.equal(saved.body.success, false);
  assert.equal(io.emit.mock.callCount(), 0);
  mock.method(Chairman, 'findOne', () => query(null));
  assert.equal((await request('GET', '/api/chairman')).body.chairman.name, 'KC Ezhilarasan');
  mock.method(Chairman, 'findOne', () => ({ async lean() { throw new Error('Synthetic read failure'); } }));
  assert.equal((await request('GET', '/api/chairman')).statusCode, 500);
  for (const body of [{ name: {} }, { role: [] }, { image: false }, { name: 'x'.repeat(101) }]) {
    assert.equal((await request('POST', '/api/admin/chairman', body)).statusCode, 400);
  }
});

test('chairman partial changes return persisted data and retain omitted fields', async () => {
  mock.method(Chairman, 'findOneAndUpdate', (filter, changes, options) => {
    assert.deepEqual(filter, { key: 'main_chairman' });
    assert.deepEqual(changes, { $set: { name: 'New name' } });
    assert.equal(options.runValidators, true);
    assert.equal(options.upsert, true);
    return query({ name: 'New name', role: 'Existing role', image: 'existing.png' });
  });
  const response = await request('POST', '/api/admin/chairman', { name: ' New name ' });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.chairman, { name: 'New name', role: 'Existing role', image: 'existing.png' });
  assert.equal(io.emit.mock.callCount(), 1);
});
