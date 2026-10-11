const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'assets/main.js'), 'utf8');
const contact = fs.readFileSync(path.join(root, 'contact.html'), 'utf8');
const pages = [...fs.readdirSync(root).filter(p => p.endsWith('.html')),
  ...fs.readdirSync(path.join(root, 'departments')).filter(p => p.endsWith('.html')).map(p => 'departments/' + p)];

test('all public HTML script and local asset/link targets exist', () => {
  const missing = [];
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
      const url = match[1];
      if (/^(?:[a-z]+:|\/\/|#)/i.test(url)) continue;
      const target = url.split(/[?#]/)[0];
      if (target && !fs.existsSync(path.resolve(root, path.dirname(page), target))) missing.push(`${page}: ${target}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('public JavaScript and inline scripts parse', () => {
  for (const file of fs.readdirSync(path.join(root, 'assets')).filter(p => p.endsWith('.js'))) {
    new vm.Script(fs.readFileSync(path.join(root, 'assets', file), 'utf8'), { filename: file });
  }
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) new vm.Script(match[1], { filename: page });
  }
});

function formHarness(kind, response) {
  const ids = kind === 'contact' ? ['cf-name', 'cf-email', 'cf-phone', 'cf-subject', 'cf-message'] : ['cName', 'cEmail', 'cPhone', 'cSubject', 'cMessage'];
  const values = ['<img src=x onerror=alert(1)>', 'test@example.com', '1234567890', 'Admissions', 'Please send information'];
  const elements = Object.fromEntries(ids.map((id, i) => [id, { value: values[i], focus() {} }]));
  const button = { disabled: false, innerHTML: '', style: {} };
  const status = { style: {}, textContent: '', innerHTML: '' };
  let handler;
  let resets = 0;
  elements[kind === 'contact' ? 'cf-submit' : 'contactSubmitBtn'] = button;
  elements[kind === 'contact' ? 'cf-status-box' : 'contactFormStatus'] = status;
  elements.contactForm = { getAttribute() { return null; }, addEventListener(type, fn) { handler = fn; }, reset() { resets++; } };
  const context = vm.createContext({
    document: { getElementById(id) { return elements[id] || null; } },
    window: { location: { hostname: 'localhost' } }, API_BASE: 'http://localhost:3001/api',
    fetch: async () => { if (response instanceof Error) throw response; return response; },
    AbortSignal: { timeout() {} }, setTimeout() {},
    showStatus(msg, type) { status.textContent = msg; status.type = type; }, showToast() {},
    localStorage: { getItem() { throw Error('Contact PII must not use storage'); }, setItem() { throw Error('Contact PII must not use storage'); } }
  });
  if (kind === 'contact') {
    vm.runInContext(contact.slice(contact.indexOf('    async function submitContactForm()'), contact.indexOf('    function showStatus(')), context);
    handler = context.submitContactForm;
  } else {
    vm.runInContext(main.slice(main.indexOf("  const contactForm ="), main.indexOf('  /* --------------------------------------------------------------------------\n     9.')), context);
  }
  return { run: () => handler({ preventDefault() {} }), button, status, elements, ids, resetCount: () => resets };
}

for (const kind of ['contact', 'admissions']) {
  for (const [label, response] of [
    ['network failure', new Error('offline')],
    ['HTTP error without message', { ok: false, json: async () => ({}) }],
    ['HTTP error with misleading success', { ok: false, json: async () => ({ success: true }) }],
    ['malformed success', { ok: true, json: async () => ({}) }]
  ]) test(`${kind}: ${label} preserves entries and does not claim delivery`, async () => {
    const form = formHarness(kind, response);
    await form.run();
    assert.equal(form.button.disabled, false);
    assert.equal(form.elements[form.ids[0]].value, '<img src=x onerror=alert(1)>');
    assert.equal(form.resetCount(), 0);
    assert.equal(kind === 'contact' ? form.status.type : form.status.className, kind === 'contact' ? 'error' : 'contact-form-status error');
  });
  test(`${kind}: confirmed success clears form and renders user text safely`, async () => {
    const form = formHarness(kind, { ok: true, json: async () => ({ success: true }) });
    await form.run();
    assert.equal(form.button.disabled, false);
    assert.equal(kind === 'contact' ? form.elements[form.ids[0]].value : form.resetCount(), kind === 'contact' ? '' : 1);
    assert.ok(!form.status.innerHTML.includes('<img'));
  });
}

test('department search links resolve to site pages', () => {
  const definition = main.match(/  const siteLink = .*;/)[0];
  const context = vm.createContext({ window: { location: { pathname: '/departments/cse.html' } } });
  vm.runInContext(definition, context);
  assert.equal(vm.runInContext("siteLink('contact.html')", context), '../contact.html');
  assert.equal(vm.runInContext("siteLink('departments/it.html')", context), '../departments/it.html');
});

test('mobile carousel respects an intentionally empty events cache', () => {
  const source = fs.readFileSync(path.join(root, 'assets/mobile-carousel.js'), 'utf8');
  const block = source.slice(source.indexOf('  const EVENTS_STORAGE_KEY'), source.indexOf('  let carouselIndex'));
  const context = vm.createContext({ localStorage: { getItem: () => '[]' } });
  vm.runInContext(block, context);
  assert.equal(vm.runInContext('getLocalEvents().length', context), 0);
});

test('event render uses current API state, escapes content and clears a removed featured event', () => {
  const featured = { innerHTML: '' };
  const grid = { innerHTML: '' };
  const context = vm.createContext({
    currentEvents: [{ id: 'event-1', title: '<img src=x onerror=alert(1)>', coverImage: 'x" onerror="alert(1)', featured: true }],
    isEventsExpanded: false, INITIAL_EVENT_COUNT: 4,
    getEvents() { throw Error('Must not overwrite API state with stale storage'); },
    document: { getElementById(id) { return id === 'featuredEventCard' ? featured : id === 'eventsGrid' ? grid : null; }, querySelectorAll() { return []; } }
  });
  const escapeBlock = main.slice(main.indexOf('  const escapeHtml ='), main.indexOf('  const performSearch ='));
  const renderBlock = main.slice(main.indexOf('  const renderEvents ='), main.indexOf('  const fetchLiveEvents ='));
  vm.runInContext(escapeBlock + renderBlock + '\nrenderEvents();', context);
  assert.ok(featured.innerHTML.includes('&lt;img'));
  assert.ok(featured.innerHTML.includes('x&quot; onerror=&quot;'));
  assert.ok(!featured.innerHTML.includes('<img src=x'));
  context.currentEvents = [];
  vm.runInContext('renderEvents();', context);
  assert.equal(featured.innerHTML, '');
  assert.equal(grid.innerHTML, '');
});

test('chat opened on mobile releases its fixed-position scroll lock after desktop resize', () => {
  const style = {};
  const context = vm.createContext({
    window: { innerWidth: 500, scrollY: 250, scrollTo(x, y) { assert.equal(y, 250); } },
    document: { body: { style }, documentElement: { style: {} } },
    chatWindow: null, chatBackdrop: null, robotPing: null, chatInput: null,
    tipTimer: null, hideTooltip() {}, cyclePrompts() {}, clearTimeout() {}, setTimeout() {}, requestAnimationFrame(fn) { fn(); }
  });
  const block = main.slice(main.indexOf('  let savedScrollY ='), main.indexOf("  robotDock?.addEventListener('click'"));
  vm.runInContext(block + '\nopenChat();', context);
  assert.equal(style.position, 'fixed');
  context.window.innerWidth = 1200;
  vm.runInContext('closeChat();', context);
  assert.equal(style.position, '');
  assert.equal(style.overflow, '');
});
