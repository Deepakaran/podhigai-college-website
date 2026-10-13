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

test('all public pages load the shared premium layer and motion engine', () => {
  const publicPages = pages.filter(page => page !== 'admin.html' && !page.startsWith('public/'));
  for (const page of publicPages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const prefix = page.includes('/') ? '../assets/' : 'assets/';
    assert.match(html, new RegExp(`href=["']${prefix}premium\\.css["']`), page);
    assert.match(html, new RegExp(`src=["']${prefix}animations\\.js["']`), page);
  }
});

test('premium layer contains responsive and reduced-motion safeguards', () => {
  const premium = fs.readFileSync(path.join(root, 'assets/premium.css'), 'utf8');
  assert.match(premium, /@media \(max-width: 767px\)/);
  assert.match(premium, /@media \(max-width: 380px\)/);
  assert.match(premium, /prefers-reduced-motion: reduce/);
  assert.match(premium, /overflow/);
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
    revealObserver: null,
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

test('public interaction fallbacks cover unsupported observers, keyboard FAQ and breakpoint drawer cleanup', () => {
  assert.match(main, /typeof window\.IntersectionObserver === 'function'/);
  assert.match(main, /window\.innerWidth >= 1024/);
  assert.match(main, /question\.setAttribute\('role', 'button'\)/);
  assert.match(main, /event\.key !== 'Enter' && event\.key !== ' '/);
  assert.match(main, /aria-expanded', 'true'/);
  assert.match(main, /aria-expanded', 'false'/);
});

test('mobile event presentation retains event times and respects reduced motion', () => {
  const carousel = fs.readFileSync(path.join(root, 'assets/mobile-carousel.js'), 'utf8');
  assert.match(carousel, /event\.time/);
  assert.match(carousel, /prefers-reduced-motion: reduce/);
  assert.match(carousel, /regularEvents\.length <= 1 \|\| prefersReducedMotion\(\)/);
});

test('nebula visual layer defines the responsive design system and final reduced-motion guard', () => {
  const premium = fs.readFileSync(path.join(root, 'assets/premium.css'), 'utf8');
  assert.match(premium, /PODHIGAI \/ NEBULA PUBLIC EXPERIENCE/);
  assert.match(premium, /@media \(max-width: 1023px\)/);
  assert.match(premium, /@media \(max-width: 767px\)/);
  assert.match(premium, /@media \(max-width: 480px\)/);
  assert.match(premium, /@media \(prefers-reduced-motion: reduce\)/);
});

test('motion fallbacks reveal counters and elements without IntersectionObserver', () => {
  const counterAttrs = { 'data-target': '42' };
  const counter = {
    textContent: '42+',
    getAttribute(name) { return counterAttrs[name] ?? null; },
    setAttribute(name, value) { counterAttrs[name] = String(value); }
  };
  const revealed = new Set();
  const reveal = { classList: { add(name) { revealed.add(name); } } };
  const context = vm.createContext({
    window: {},
    document: {
      querySelectorAll(selector) {
        return selector.includes('.counter') ? [counter] : [reveal];
      }
    }
  });
  const block = main.slice(main.indexOf('  const animateCounter ='), main.indexOf('  /* --------------------------------------------------------------------------\n     5.'));

  assert.doesNotThrow(() => vm.runInContext(block, context));
  assert.equal(counter.textContent, '42+');
  assert.equal(counterAttrs['data-animated'], 'true');
  assert.ok(revealed.has('visible'));
});

test('mobile drawer closes and restores body scroll at the 1024px boundary', () => {
  const makeClassList = () => {
    const values = new Set();
    return {
      add(value) { values.add(value); },
      remove(value) { values.delete(value); },
      contains(value) { return values.has(value); }
    };
  };
  const makeElement = (id) => {
    const listeners = {};
    const attributes = {};
    return {
      id,
      style: {},
      classList: makeClassList(),
      attributes,
      listeners,
      contains() { return false; },
      querySelectorAll() { return []; },
      addEventListener(type, handler) { listeners[type] = handler; },
      setAttribute(name, value) { attributes[name] = String(value); }
    };
  };
  const mobileToggle = makeElement('mobileToggle');
  const mobileDrawer = makeElement('mobileDrawer');
  const backdrop = makeElement('drawerBackdrop');
  const body = { style: {}, appendChild() {} };
  let resizeHandler;
  const context = vm.createContext({
    navHeader: null,
    mobileToggle,
    mobileDrawer,
    window: {
      innerWidth: 1023,
      addEventListener(type, handler) { if (type === 'resize') resizeHandler = handler; }
    },
    document: {
      body,
      querySelector() { return backdrop; },
      addEventListener() {}
    }
  });
  const block = main.slice(main.indexOf('  if (mobileToggle && mobileDrawer) {'), main.indexOf('  /* --------------------------------------------------------------------------\n     1.1 SEARCH'));
  vm.runInContext(block, context);

  assert.equal(mobileToggle.attributes['aria-controls'], 'mobileDrawer');
  assert.equal(mobileDrawer.attributes['aria-hidden'], 'true');
  mobileToggle.listeners.click({ stopPropagation() {} });
  assert.equal(body.style.overflow, 'hidden');
  assert.equal(mobileToggle.attributes['aria-expanded'], 'true');
  assert.equal(mobileDrawer.attributes['aria-hidden'], 'false');

  context.window.innerWidth = 1024;
  resizeHandler();
  assert.equal(mobileDrawer.classList.contains('open'), false);
  assert.equal(body.style.overflow, '');
  assert.equal(mobileToggle.attributes['aria-expanded'], 'false');
  assert.equal(mobileDrawer.attributes['aria-hidden'], 'true');
});

test('non-button FAQ questions respond to keyboard activation and retain click behavior', () => {
  const makeClassList = () => {
    const values = new Set();
    return {
      add(value) { values.add(value); },
      remove(value) { values.delete(value); },
      contains(value) { return values.has(value); }
    };
  };
  const itemClassList = makeClassList();
  const attributes = {};
  const listeners = {};
  const question = {
    tagName: 'DIV',
    addEventListener(type, handler) { listeners[type] = handler; },
    setAttribute(name, value) { attributes[name] = String(value); }
  };
  const answer = { style: {}, scrollHeight: 48 };
  const item = {
    classList: itemClassList,
    querySelector(selector) {
      return selector.includes('faq-a') ? answer : question;
    }
  };
  const context = vm.createContext({
    document: { querySelectorAll() { return [item]; } }
  });
  const block = main.slice(main.indexOf('  const faqItems ='), main.indexOf('  /* --------------------------------------------------------------------------\n     3.'));
  vm.runInContext(block, context);

  let prevented = false;
  listeners.keydown({ key: 'Enter', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(itemClassList.contains('open'), true);
  assert.equal(attributes['role'], 'button');
  assert.equal(attributes['tabindex'], '0');
  assert.equal(attributes['aria-expanded'], 'true');
  assert.equal(answer.style.maxHeight, '48px');

  listeners.click();
  assert.equal(itemClassList.contains('open'), false);
  assert.equal(attributes['aria-expanded'], 'false');
  assert.equal(answer.style.maxHeight, null);
});

test('robot dock aria state tracks chatbot open and close state', () => {
  const makeClassList = () => {
    const values = new Set();
    return {
      add(value) { values.add(value); },
      remove(value) { values.delete(value); },
      contains(value) { return values.has(value); }
    };
  };
  const robotDock = {
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    addEventListener() {}
  };
  const chatWindow = { id: 'chatWindow', classList: makeClassList() };
  const elements = { robotDock, chatWindow };
  const context = vm.createContext({
    window: { innerWidth: 1200, location: { pathname: '/' } },
    document: {
      body: { style: {} },
      documentElement: { style: {} },
      getElementById(id) { return elements[id] || null; },
      addEventListener() {}
    },
    clearTimeout() {},
    setTimeout() { return 0; },
    tipTimer: null,
    hideTooltip() {},
    cyclePrompts() {}
  });
  const accessibilityBlock = main.slice(main.indexOf('  const robotDock ='), main.indexOf('  // Dynamic Page Link Helper'));
  vm.runInContext(accessibilityBlock, context);
  assert.equal(robotDock.attributes['aria-controls'], 'chatWindow');
  assert.equal(robotDock.attributes['aria-expanded'], 'false');

  const chatBlock = main.slice(main.indexOf('  let savedScrollY ='), main.indexOf("  robotDock?.addEventListener('click'"));
  vm.runInContext(chatBlock, context);
  vm.runInContext('openChat();', context);
  assert.equal(robotDock.attributes['aria-expanded'], 'true');
  vm.runInContext('closeChat();', context);
  assert.equal(robotDock.attributes['aria-expanded'], 'false');
});
