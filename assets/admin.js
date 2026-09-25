// ============================================================
//  Podhigai Admin Panel — JavaScript (Unified API & Local Storage)
// ============================================================

const API = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'http://localhost:3001/api'
  : '/api';
let adminToken = '';
let currentPage = 1;
let searchQuery = '';
let dateFrom = '';
let dateTo = '';
let currentFilter = 'all'; // 'all' | 'unread' | 'read'
let deleteTargetId = null;
let deleteReviewTargetId = null;
let rvCurrentRating = 'all';
let rvSearchQuery = '';
let currentView = 'messages'; // 'messages' | 'reviews'

// ── Local Storage Helpers ─────────────────────────────────────
const CONTACTS_KEY = 'podhigai_contacts';
const REVIEWS_KEY = 'podhigai_reviews';
const DELETED_REVIEWS_KEY = 'podhigai_deleted_reviews';

function getDeletedReviewIds() {
  try {
    return JSON.parse(localStorage.getItem(DELETED_REVIEWS_KEY) || '[]');
  } catch {
    return [];
  }
}

function addDeletedReviewId(id, name, title) {
  try {
    const deleted = getDeletedReviewIds();
    const strId = String(id || '');
    if (strId && !deleted.includes(strId)) deleted.push(strId);
    if (name && title) {
      const key = `${name.trim().toLowerCase()}__${title.trim().toLowerCase()}`;
      if (!deleted.includes(key)) deleted.push(key);
    }
    localStorage.setItem(DELETED_REVIEWS_KEY, JSON.stringify(deleted));
  } catch {}
}

function isReviewDeleted(r) {
  if (!r) return true;
  const deleted = getDeletedReviewIds();
  const id1 = String(r._id || '');
  const id2 = String(r.id || '');
  const key = `${(r.name || '').trim().toLowerCase()}__${(r.title || '').trim().toLowerCase()}`;
  return deleted.includes(id1) || deleted.includes(id2) || deleted.includes(key);
}

function getLocalContacts() {
  try {
    return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalContacts(contacts) {
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch {}
}

function getLocalReviews() {
  try {
    const arr = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');
    return arr.filter(r => !isReviewDeleted(r));
  } catch {
    return [];
  }
}

function saveLocalReviews(reviews) {
  try {
    const valid = (reviews || []).filter(r => !isReviewDeleted(r));
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(valid));
  } catch {}
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const savedToken = sessionStorage.getItem('adminToken');
  if (savedToken) {
    adminToken = savedToken;
    showDashboard();
  } else {
    showLogin();
  }

  document.getElementById('loginForm').addEventListener('submit', handleLogin);

  // Show / Hide Password toggle
  const togglePassBtn = document.getElementById('togglePasswordBtn');
  const adminPassInput = document.getElementById('adminPassword');
  if (togglePassBtn && adminPassInput) {
    togglePassBtn.addEventListener('click', () => {
      const isPassword = adminPassInput.type === 'password';
      adminPassInput.type = isPassword ? 'text' : 'password';
      togglePassBtn.title = isPassword ? 'Hide password' : 'Show password';
      togglePassBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      togglePassBtn.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
             <line x1="1" y1="1" x2="23" y2="23"></line>
           </svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
             <circle cx="12" cy="12" r="3"></circle>
           </svg>`;
    });
  }

  // Search input — debounced
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = searchInput.value.trim();
        currentPage = 1;
        loadMessages();
      }, 300);
    });
  }

  // Date filters
  const dFrom = document.getElementById('dateFrom');
  if (dFrom) {
    dFrom.addEventListener('change', () => {
      dateFrom = dFrom.value;
      currentPage = 1;
      loadMessages();
    });
  }

  const dTo = document.getElementById('dateTo');
  if (dTo) {
    dTo.addEventListener('change', () => {
      dateTo = dTo.value;
      currentPage = 1;
      loadMessages();
    });
  }

  const confDelBtn = document.getElementById('confirmDeleteBtn');
  if (confDelBtn) confDelBtn.addEventListener('click', confirmDelete);
  const cancDelBtn = document.getElementById('cancelDeleteBtn');
  if (cancDelBtn) cancDelBtn.addEventListener('click', closeDeleteModal);
  const delOverlay = document.getElementById('deleteOverlay');
  if (delOverlay) delOverlay.addEventListener('click', closeDeleteModal);

  // Event search — debounced
  const evtSearch = document.getElementById('evtSearchInput');
  if (evtSearch) {
    let evtSearchTimeout;
    evtSearch.addEventListener('input', () => {
      clearTimeout(evtSearchTimeout);
      evtSearchTimeout = setTimeout(() => {
        evtSearchQuery = evtSearch.value.trim();
        loadEvents();
      }, 300);
    });
  }

  // Gallery search — debounced
  const galSearch = document.getElementById('galSearchInput');
  if (galSearch) {
    let galSearchTimeout;
    galSearch.addEventListener('input', () => {
      clearTimeout(galSearchTimeout);
      galSearchTimeout = setTimeout(() => {
        galSearchQuery = galSearch.value.trim();
        loadGallery();
      }, 300);
    });
  }

  // Close event modal on backdrop click
  const evtModal = document.getElementById('eventModal');
  if (evtModal) {
    evtModal.addEventListener('click', (e) => {
      if (e.target === evtModal) closeEventModal();
    });
  }

  // Close delete event modal on backdrop click
  const delEvtModal = document.getElementById('deleteEventModal');
  if (delEvtModal) {
    delEvtModal.addEventListener('click', (e) => {
      if (e.target === delEvtModal) closeDeleteEventModal();
    });
  }

  // Close photo modal on backdrop click
  const pModal = document.getElementById('photoModal');
  if (pModal) {
    pModal.addEventListener('click', (e) => {
      if (e.target === pModal) closePhotoModal();
    });
  }

  // Close delete photo modal on backdrop click
  const delPModal = document.getElementById('deletePhotoModal');
  if (delPModal) {
    delPModal.addEventListener('click', (e) => {
      if (e.target === delPModal) closeDeletePhotoModal();
    });
  }

  // Initialize Event & Gallery Drag & Drop Image Uploaders
  initEventDragAndDrop();
  initGalleryDragAndDrop();
});

// ── Login ─────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('adminUsername');
  const passwordInput = document.getElementById('adminPassword');
  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';
  const btn = document.getElementById('loginBtn');
  const errorEl = document.getElementById('loginError');

  if (!username || !password) {
    if (errorEl) errorEl.textContent = 'Please enter both username and password.';
    shakeElement(document.querySelector('.login-card'));
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span style="display:inline-block;width:14px;height:14px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:8px;vertical-align:middle;"></span> Authenticating…';
  if (errorEl) errorEl.textContent = '';

  try {
    const res = await fetch(`${API}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success && data.token) {
      adminToken = data.token;
      sessionStorage.setItem('adminToken', adminToken);
      showDashboard();
      return;
    } else {
      const fallbackMsg = res.status === 429 ? 'Too many login attempts. Please wait a moment.' : 'Invalid username or password.';
      if (errorEl) errorEl.textContent = data.message || fallbackMsg;
      shakeElement(document.querySelector('.login-card'));
    }
  } catch (err) {
    console.error('Login request error:', err);
    if (errorEl) {
      errorEl.textContent = 'Authentication server is unreachable. Please verify the backend is running.';
    }
    shakeElement(document.querySelector('.login-card'));
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in to Admin Panel →';
  }
}

// ── Views ─────────────────────────────────────────────────────
function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboardScreen').style.display = 'none';
}

async function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboardScreen').style.display = 'flex';
  await Promise.all([loadStats(), loadMessages()]);
}

function handleLogout() {
  sessionStorage.removeItem('adminToken');
  adminToken = '';
  const uInput = document.getElementById('adminUsername');
  const pInput = document.getElementById('adminPassword');
  if (uInput) uInput.value = '';
  if (pInput) pInput.value = '';
  const errorEl = document.getElementById('loginError');
  if (errorEl) errorEl.textContent = '';
  showLogin();
}

// ── Panel Switching ───────────────────────────────────────────
function showMessagesPanel() {
  currentView = 'messages';
  const evtPanel = document.getElementById('eventsPanel');
  if (evtPanel) evtPanel.style.display = 'none';
  const galPanel = document.getElementById('galleryPanel');
  if (galPanel) galPanel.style.display = 'none';
  const chPanel = document.getElementById('chairmanPanel');
  if (chPanel) chPanel.style.display = 'none';
  const msgCont = document.getElementById('messagesContainer');
  if (msgCont) msgCont.style.display = 'flex';
  const pgArea = document.getElementById('paginationArea');
  if (pgArea) pgArea.style.display = '';
  const fBar = document.getElementById('messagesFilterBar');
  if (fBar) fBar.style.display = '';
  const cRow = document.getElementById('messagesControlsRow');
  if (cRow) cRow.style.display = '';
  const title = document.getElementById('dashTitle');
  if (title) title.textContent = FILTER_TITLES[currentFilter] || 'All Messages';
  const sub = document.querySelector('.dash-sub');
  if (sub) sub.textContent = 'Contact enquiries submitted through the website';

  const cBtn = document.getElementById('sideNav-chairman');
  if (cBtn) cBtn.classList.remove('active');
}

function showEventsPanel() {
  currentView = 'events';
  const evtPanel = document.getElementById('eventsPanel');
  if (evtPanel) evtPanel.style.display = 'block';
  const galPanel = document.getElementById('galleryPanel');
  if (galPanel) galPanel.style.display = 'none';
  const chPanel = document.getElementById('chairmanPanel');
  if (chPanel) chPanel.style.display = 'none';
  const msgCont = document.getElementById('messagesContainer');
  if (msgCont) msgCont.style.display = 'none';
  const pgArea = document.getElementById('paginationArea');
  if (pgArea) pgArea.style.display = 'none';
  const fBar = document.getElementById('messagesFilterBar');
  if (fBar) fBar.style.display = 'none';
  const cRow = document.getElementById('messagesControlsRow');
  if (cRow) cRow.style.display = 'none';
  const title = document.getElementById('dashTitle');
  if (title) title.textContent = 'Events & Media';
  const sub = document.querySelector('.dash-sub');
  if (sub) sub.textContent = 'Create, publish and manage college events and photo galleries';

  // Update sidebar active states
  ['all','unread','read'].forEach(f => {
    const btn = document.getElementById(`sideNav-${f}`);
    if (btn) btn.classList.remove('active');
  });
  const eBtn = document.getElementById('sideNav-events');
  if (eBtn) eBtn.classList.add('active');
  const gBtn = document.getElementById('sideNav-gallery');
  if (gBtn) gBtn.classList.remove('active');
  const cBtn = document.getElementById('sideNav-chairman');
  if (cBtn) cBtn.classList.remove('active');

  closeSidebar();
  loadEvents();
}

function showGalleryPanel() {
  currentView = 'gallery';
  const evtPanel = document.getElementById('eventsPanel');
  if (evtPanel) evtPanel.style.display = 'none';
  const galPanel = document.getElementById('galleryPanel');
  if (galPanel) galPanel.style.display = 'block';
  const chPanel = document.getElementById('chairmanPanel');
  if (chPanel) chPanel.style.display = 'none';
  const msgCont = document.getElementById('messagesContainer');
  if (msgCont) msgCont.style.display = 'none';
  const pgArea = document.getElementById('paginationArea');
  if (pgArea) pgArea.style.display = 'none';
  const fBar = document.getElementById('messagesFilterBar');
  if (fBar) fBar.style.display = 'none';
  const cRow = document.getElementById('messagesControlsRow');
  if (cRow) cRow.style.display = 'none';
  const title = document.getElementById('dashTitle');
  if (title) title.textContent = 'Campus Photos & Galleries';
  const sub = document.querySelector('.dash-sub');
  if (sub) sub.textContent = 'Manage photos across Campus, Labs, Student Life, Events, Programs & Graduation';

  // Update sidebar active states
  ['all','unread','read'].forEach(f => {
    const btn = document.getElementById(`sideNav-${f}`);
    if (btn) btn.classList.remove('active');
  });
  const eBtn = document.getElementById('sideNav-events');
  if (eBtn) eBtn.classList.remove('active');
  const gBtn = document.getElementById('sideNav-gallery');
  if (gBtn) gBtn.classList.add('active');
  const cBtn = document.getElementById('sideNav-chairman');
  if (cBtn) cBtn.classList.remove('active');

  closeSidebar();
  loadGallery();
}

function showChairmanPanel() {
  currentView = 'chairman';
  const evtPanel = document.getElementById('eventsPanel');
  if (evtPanel) evtPanel.style.display = 'none';
  const galPanel = document.getElementById('galleryPanel');
  if (galPanel) galPanel.style.display = 'none';
  const chPanel = document.getElementById('chairmanPanel');
  if (chPanel) chPanel.style.display = 'block';
  const msgCont = document.getElementById('messagesContainer');
  if (msgCont) msgCont.style.display = 'none';
  const pgArea = document.getElementById('paginationArea');
  if (pgArea) pgArea.style.display = 'none';
  const fBar = document.getElementById('messagesFilterBar');
  if (fBar) fBar.style.display = 'none';
  const cRow = document.getElementById('messagesControlsRow');
  if (cRow) cRow.style.display = 'none';
  const title = document.getElementById('dashTitle');
  if (title) title.textContent = 'Hero Section Chairman';
  const sub = document.querySelector('.dash-sub');
  if (sub) sub.textContent = 'Change Chairman photo, full name, and designation displayed in hero showcase';

  // Update sidebar active states
  ['all','unread','read'].forEach(f => {
    const btn = document.getElementById(`sideNav-${f}`);
    if (btn) btn.classList.remove('active');
  });
  const eBtn = document.getElementById('sideNav-events');
  if (eBtn) eBtn.classList.remove('active');
  const gBtn = document.getElementById('sideNav-gallery');
  if (gBtn) gBtn.classList.remove('active');
  const cBtn = document.getElementById('sideNav-chairman');
  if (cBtn) cBtn.classList.add('active');

  closeSidebar();
  loadChairmanSettings();
}

// ── Sidebar ───────────────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!sidebar) return;
  const isOpen = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  if (backdrop) backdrop.classList.toggle('visible', !isOpen);
}

function closeSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('visible');
}

// ── Sidebar nav filter ────────────────────────────────────────
const FILTER_TITLES = {
  all: 'All Messages',
  unread: 'Unread Messages',
  read: 'Read Messages'
};

function selectFilter(filter) {
  currentFilter = filter;
  currentPage = 1;

  if (currentView === 'events' || currentView === 'gallery' || currentView === 'chairman') {
    showMessagesPanel();
  }

  ['all', 'unread', 'read'].forEach(f => {
    const btn = document.getElementById(`sideNav-${f}`);
    if (btn) btn.classList.toggle('active', f === filter);
  });
  const eBtn = document.getElementById('sideNav-events');
  if (eBtn) eBtn.classList.remove('active');
  const gBtn = document.getElementById('sideNav-gallery');
  if (gBtn) gBtn.classList.remove('active');
  const cBtn = document.getElementById('sideNav-chairman');
  if (cBtn) cBtn.classList.remove('active');

  const dashTitle = document.getElementById('dashTitle');
  if (dashTitle) dashTitle.textContent = FILTER_TITLES[filter] || 'Messages';

  closeSidebar();
  loadMessages();
}

// ── Clear all filters ─────────────────────────────────────────
function clearFilters() {
  searchQuery = '';
  dateFrom = '';
  dateTo = '';
  currentPage = 1;

  const searchInput = document.getElementById('searchInput');
  const dateFromEl = document.getElementById('dateFrom');
  const dateToEl = document.getElementById('dateTo');
  if (searchInput) searchInput.value = '';
  if (dateFromEl) dateFromEl.value = '';
  if (dateToEl) dateToEl.value = '';

  loadMessages();
}

// ── Fetch & Merge Messages (Deduplicated) ────────────────────
async function fetchMergedMessages() {
  let apiMessages = [];
  try {
    const params = new URLSearchParams({ page: 1, limit: 100 });
    const res = await fetch(`${API}/admin/messages?${params}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        apiMessages = data.messages;
      }
    }
  } catch (e) {}

  // Use API messages as primary source of truth
  const merged = [...apiMessages];
  const localContacts = getLocalContacts();

  // Merge any locally stored messages that aren't already represented in the API response
  localContacts.forEach(locMsg => {
    const exists = merged.some(m =>
      (m._id && locMsg._id && String(m._id) === String(locMsg._id)) ||
      ((m.email || '').toLowerCase().trim() === (locMsg.email || '').toLowerCase().trim() &&
       (m.message || '').trim() === (locMsg.message || '').trim())
    );
    if (!exists) {
      merged.push(locMsg);
    }
  });

  return merged;
}

// ── Stats ─────────────────────────────────────────────────────
async function loadStats() {
  try {
    const messages = await fetchMergedMessages();
    const events = getLocalEvents();
    const gallery = getLocalGallery();

    const total = messages.length;
    const unread = messages.filter(m => !m.isRead).length;
    const read = total - unread;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = messages.filter(m => new Date(m.createdAt || Date.now()) >= today).length;
    const totalEvents = events.length;
    const totalPhotos = gallery.length;

    animateCount('statTotal', total);
    animateCount('statUnread', unread);
    animateCount('statToday', todayCount);
    animateCount('statEvents', totalEvents);

    const setBadge = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setBadge('sideBadgeTotal', total);
    setBadge('sideBadgeUnread', unread);
    setBadge('sideBadgeRead', read);
    setBadge('sideBadgeEvents', totalEvents);
    setBadge('sideBadgeGallery', totalPhotos);
  } catch (err) {
    console.error('Stats error:', err);
  }
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  if (target === 0) {
    el.textContent = '0';
    return;
  }
  const step = Math.max(1, Math.ceil(target / 20));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 25);
}

// ── Messages ──────────────────────────────────────────────────
async function loadMessages() {
  const container = document.getElementById('messagesContainer');
  if (!container) return;
  container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading messages…</p></div>';

  try {
    let messages = await fetchMergedMessages();

    // Apply Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      messages = messages.filter(m => 
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.subject && m.subject.toLowerCase().includes(q)) ||
        (m.message && m.message.toLowerCase().includes(q))
      );
    }

    // Apply Sidebar Filter
    if (currentFilter === 'unread') messages = messages.filter(m => !m.isRead);
    if (currentFilter === 'read') messages = messages.filter(m => m.isRead);

    // Apply Date Range Filter
    if (dateFrom) {
      const from = new Date(dateFrom);
      messages = messages.filter(m => new Date(m.createdAt || Date.now()) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      messages = messages.filter(m => new Date(m.createdAt || Date.now()) <= to);
    }

    const resCount = document.getElementById('resultCount');
    if (messages.length === 0) {
      const emptyMsg = searchQuery || dateFrom || dateTo
        ? 'No messages match your filters.'
        : currentFilter === 'unread' ? 'No unread messages. All caught up! ✅'
        : currentFilter === 'read' ? 'No read messages yet.'
        : 'No messages yet. The inbox is empty.';
      container.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <p>${emptyMsg}</p>
        </div>`;
      const pgArea = document.getElementById('paginationArea');
      if (pgArea) pgArea.innerHTML = '';
      if (resCount) resCount.textContent = '0 messages';
      return;
    }

    const hasFilters = searchQuery || dateFrom || dateTo;
    if (resCount) {
      resCount.textContent = `${messages.length} message${messages.length !== 1 ? 's' : ''}${hasFilters ? ' found' : ''}`;
    }

    const unread = messages.filter(m => !m.isRead);
    const read = messages.filter(m => m.isRead);

    let html = '';

    if (currentFilter !== 'read') {
      html += `
        <div class="section-header">
          <span class="section-label new">New Messages</span>
          <span class="section-count new-count">${unread.length}</span>
          <div class="section-rule"></div>
        </div>`;
      if (unread.length === 0) {
        html += '<div class="section-empty">No unread messages. All caught up! ✅</div>';
      } else {
        html += unread.map(msg => renderMessageCard(msg, false)).join('');
      }
    }

    if (currentFilter !== 'unread') {
      html += `
        <div class="section-header" style="margin-top:28px;">
          <span class="section-label read">Read Messages</span>
          <span class="section-count read-count">${read.length}</span>
          <div class="section-rule"></div>
        </div>`;
      if (read.length === 0) {
        html += '<div class="section-empty">No read messages yet.</div>';
      } else {
        html += read.map(msg => renderMessageCard(msg, true)).join('');
      }
    }

    container.innerHTML = html;
    renderPagination(messages.length, 50);
    setTimeout(loadStats, 400);

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Error loading messages. Please refresh.</p>
      </div>`;
  }
}

// ── Render a message card ──────────────────────────────────────
function renderMessageCard(msg, isReadSection) {
  const msgId = msg._id || msg.id;
  const date = new Date(msg.createdAt || Date.now());
  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const initials = (msg.name || 'User').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const cardClass = isReadSection ? 'msg-card msg-read-old' : 'msg-card msg-unread';
  const cbChecked = msg.isRead ? 'checked' : '';
  const cbDisabled = msg.isRead ? 'disabled title="Already marked as read"' : '';

  return `
    <div class="${cardClass}" id="msg-${msgId}">
      <div class="msg-avatar">${initials}</div>
      <div class="msg-body">
        <div class="msg-header">
          <div class="msg-sender-row">
            <span class="msg-name">${escHtml(msg.name || 'Visitor')}</span>
            ${!msg.isRead ? '<span class="new-pill">New</span>' : ''}
          </div>
          <span class="msg-time">${dateStr} &middot; ${timeStr}</span>
        </div>
        <div class="msg-meta">
          <span class="msg-detail">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>
            ${escHtml(msg.email || 'No email')}
          </span>
          ${msg.phone && msg.phone !== 'Not Provided' ? `<span class="msg-detail">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            ${escHtml(msg.phone)}
          </span>` : ''}
          ${msg.subject ? `<span class="msg-subject-tag">${escHtml(msg.subject)}</span>` : ''}
        </div>
        <p class="msg-text">${escHtml(msg.message || '')}</p>

        <div class="msg-actions">
          <label class="mark-read-label" for="cb-${msgId}">
            <input
              class="mark-read-cb"
              type="checkbox"
              id="cb-${msgId}"
              ${cbChecked}
              ${cbDisabled}
              onchange="handleMarkReadCheckbox(this, '${msgId}')"
            >
            Mark as Read
          </label>
        </div>
      </div>
      <button class="msg-delete-btn" onclick="openDeleteModal('${msgId}')" title="Delete message">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>`;
}

// ── Checkbox: Mark as Read ─────────────────────────────────────
async function handleMarkReadCheckbox(checkbox, id) {
  if (!checkbox.checked) return;
  checkbox.disabled = true;

  // 1. Update in LocalStorage
  const localContacts = getLocalContacts();
  const updated = localContacts.map(c => {
    if (c._id === id || c.id === id) {
      return { ...c, isRead: true };
    }
    return c;
  });
  saveLocalContacts(updated);

  // 2. Update via API
  try {
    await fetch(`${API}/admin/messages/${id}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      signal: AbortSignal.timeout(3000)
    });
  } catch (err) {}

  const card = document.getElementById(`msg-${id}`);
  if (card) {
    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    card.style.opacity = '0';
    card.style.transform = 'translateX(-20px)';
  }
  setTimeout(() => { loadMessages(); loadStats(); }, 400);
}

// ── Pagination ─────────────────────────────────────────────────
function renderPagination(total, limit) {
  const totalPages = Math.ceil(total / limit);
  const area = document.getElementById('paginationArea');
  if (!area) return;
  if (totalPages <= 1) { area.innerHTML = ''; return; }

  let html = '<div class="pagination">';
  html += `<button class="pg-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pg-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  html += `<button class="pg-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;
  html += '</div>';
  area.innerHTML = html;
}

function goPage(page) {
  currentPage = page;
  loadMessages();
  const cont = document.getElementById('messagesContainer');
  if (cont) cont.scrollIntoView({ behavior: 'smooth' });
}

// ── Delete Message Modal ───────────────────────────────────────
function openDeleteModal(id) {
  deleteTargetId = id;
  const dModal = document.getElementById('deleteModal');
  const dOverlay = document.getElementById('deleteOverlay');
  if (dModal) dModal.style.display = 'flex';
  if (dOverlay) dOverlay.style.display = 'block';
}

function closeDeleteModal() {
  deleteTargetId = null;
  const dModal = document.getElementById('deleteModal');
  const dOverlay = document.getElementById('deleteOverlay');
  if (dModal) dModal.style.display = 'none';
  if (dOverlay) dOverlay.style.display = 'none';
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  const btn = document.getElementById('confirmDeleteBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Deleting…';
  }

  // 1. Delete from LocalStorage
  const localContacts = getLocalContacts();
  const filtered = localContacts.filter(c => c._id !== deleteTargetId && c.id !== deleteTargetId);
  saveLocalContacts(filtered);

  // 2. Delete via API
  try {
    await fetch(`${API}/admin/messages/${deleteTargetId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      signal: AbortSignal.timeout(3000)
    });
  } catch (err) {}

  const card = document.getElementById(`msg-${deleteTargetId}`);
  if (card) {
    card.style.transform = 'translateX(100%)';
    card.style.opacity = '0';
    card.style.transition = 'all 0.3s ease';
    setTimeout(() => { card.remove(); loadMessages(); loadStats(); }, 300);
  } else {
    loadMessages();
    loadStats();
  }

  closeDeleteModal();
  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Delete';
  }
  deleteTargetId = null;
}

// ── Utilities ──────────────────────────────────────────────────
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function shakeElement(el) {
  if (!el) return;
  el.style.animation = 'none';
  setTimeout(() => { el.style.animation = 'shake 0.4s ease'; }, 10);
}

function refreshDashboard() {
  loadStats();
  if (currentView === 'events') {
    loadEvents();
  } else if (currentView === 'gallery') {
    loadGallery();
  } else if (currentView === 'reviews') {
    loadReviews();
  } else {
    loadMessages();
  }
}

// ══════════════════════════════════════════════════════════════
//  EVENTS MANAGEMENT (FULL CRUD & GALLERY)
// ══════════════════════════════════════════════════════════════
const EVENTS_KEY = 'podhigai_events';
let deleteEventTargetId = null;
let editingEventId = null;
let evtSearchQuery = '';

const DEFAULT_ADMIN_EVENTS = [
  {
    id: 'evt_1',
    title: 'TechNova 2026: National Level Technical Symposium & Project Expo',
    date: 'October 15, 2026',
    time: '09:30 AM – 04:30 PM',
    venue: 'Main Academic Block & APJ Auditorium',
    category: 'Symposium',
    description: 'A prestigious inter-collegiate technical convergence featuring paper presentations, AI hackathons, robotics challenges, code-debugging showdowns, and cash awards for engineering innovators.',
    featured: true,
    published: true,
    coverImage: 'images/event-technova-symposium.png',
    gallery: ['images/event-technova-symposium.png', 'images/gallery-computing-lab.png', 'images/gallery-ai-research-lab.png', 'images/gallery-it-innovation-hub.png']
  },
  {
    id: 'evt_2',
    title: 'Annual Placement Day & Corporate Recruiters Felicitation 2026',
    date: 'November 04, 2026',
    time: '10:00 AM – 02:00 PM',
    venue: 'Central Seminar Hall',
    category: 'Placement',
    description: 'Honoring placed graduates across Tier-1 Tech Giants including TCS, Wipro, Infosys, Zoho, Cognizant, and HCL with corporate appointment orders.',
    featured: false,
    published: true,
    coverImage: 'images/event-placement-drive.png',
    gallery: ['images/event-placement-drive.png', 'images/hero-student-life.png', 'images/about-aerial-campus.png']
  },
  {
    id: 'evt_3',
    title: 'National Workshop on Edge Computing & Generative AI Systems',
    date: 'December 12, 2026',
    time: '09:00 AM – 04:00 PM',
    venue: 'Advanced Computing Lab (IT Block)',
    category: 'Workshop',
    description: 'Hands-on industrial masterclass on training large language models on edge devices, real-time IoT computer vision pipelines, and full-stack cloud AI deployment.',
    featured: false,
    published: true,
    coverImage: 'images/event-ai-cloud-workshop.png',
    gallery: ['images/event-ai-cloud-workshop.png', 'images/dept-it.png', 'images/dept-aids.png']
  },
  {
    id: 'evt_4',
    title: 'RoboQuest 2027: Autonomous Drone & Mobile Robotics Challenge',
    date: 'January 20, 2027',
    time: '10:00 AM – 05:00 PM',
    venue: 'Mechanical & Automation Workshop',
    category: 'Competition',
    description: 'Annual robotics arena featuring autonomous maze navigation, drone obstacle maneuvering, and pick-and-place industrial robotic arm simulations.',
    featured: false,
    published: true,
    coverImage: 'images/event-robowar-mech-expo.png',
    gallery: ['images/event-robowar-mech-expo.png', 'images/gallery-mech-workshop.png', 'images/dept-mech.png']
  },
  {
    id: 'evt_5',
    title: 'Podhigai Sangamam: Annual Cultural & Arts Grand Fest 2027',
    date: 'February 18, 2027',
    time: '04:00 PM – 09:30 PM',
    venue: 'Open Air Amphitheatre',
    category: 'Cultural Fest',
    description: 'Mega inter-college celebration of music, classical & western dance, theatrical drama, fine arts exhibitions, and celebrity guest performances.',
    featured: false,
    published: true,
    coverImage: 'images/event-cultural-fest.png',
    gallery: ['images/event-cultural-fest.png', 'images/hero-student-life.png', 'images/gallery-academic-complex.png']
  },
  {
    id: 'evt_6',
    title: 'Smart India 24-Hour Code Marathon & Hackathon 2026',
    date: 'March 05, 2027',
    time: '24 Hours Non-Stop',
    venue: 'Innovation & Incubation Hub',
    category: 'Hackathon',
    description: 'High-intensity 24-hour sprint developing smart city prototypes, fintech pipelines, assistive AI healthcare platforms, and cloud web apps.',
    featured: false,
    published: true,
    coverImage: 'images/event-hackathon.png',
    gallery: ['images/event-hackathon.png', 'images/gallery-it-innovation-hub.png', 'images/gallery-computing-lab.png']
  },
  {
    id: 'evt_7',
    title: 'Inter-Collegiate TNEA Engineering Athletic & Sports Championship',
    date: 'March 22, 2027',
    time: '08:00 AM – 06:00 PM',
    venue: 'University Sports Arena & Grounds',
    category: 'Sports Meet',
    description: 'State-level track & field tournaments, basketball, cricket championship cup, volleyball, and badminton trophies with university awards.',
    featured: false,
    published: true,
    coverImage: 'images/gallery-campus-landscape.png',
    gallery: ['images/gallery-campus-landscape.png', 'images/hero-student-life.png', 'images/about-aerial-campus.png']
  },
  {
    id: 'evt_8',
    title: 'International Conference on Sustainable Energy & Smart EV Systems',
    date: 'April 10, 2027',
    time: '09:30 AM – 05:00 PM',
    venue: 'APJ Abdul Kalam Conference Hall',
    category: 'Conference',
    description: 'Global researchers and Anna University professors delivering keynote addresses on smart power grids, EV battery tech, and green renewables.',
    featured: false,
    published: true,
    coverImage: 'images/dept-eee.png',
    gallery: ['images/dept-eee.png', 'images/gallery-ai-research-lab.png', 'images/dept-ece.png']
  }
];

function getLocalEvents() {
  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    if (!stored) {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(DEFAULT_ADMIN_EVENTS));
      return DEFAULT_ADMIN_EVENTS;
    }
    let parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length) {
      // Merge any new default events
      DEFAULT_ADMIN_EVENTS.forEach(defEvt => {
        if (!parsed.some(e => e.id === defEvt.id)) {
          parsed.push(defEvt);
        }
      });

      const cleaned = parsed.map(e => {
        if (e.coverImage && (e.coverImage.endsWith('.jpg') || e.coverImage.endsWith('.webp'))) {
          if (e.id === 'evt_1') e.coverImage = 'images/event-technova-symposium.png';
          else if (e.id === 'evt_2') e.coverImage = 'images/event-placement-drive.png';
          else if (e.id === 'evt_3') e.coverImage = 'images/event-ai-cloud-workshop.png';
          else if (e.id === 'evt_4') e.coverImage = 'images/event-robowar-mech-expo.png';
          else if (e.id === 'evt_5') e.coverImage = 'images/event-cultural-fest.png';
          else if (e.id === 'evt_6') e.coverImage = 'images/event-hackathon.png';
          else if (e.id === 'evt_7') e.coverImage = 'images/gallery-campus-landscape.png';
          else if (e.id === 'evt_8') e.coverImage = 'images/dept-eee.png';
        }
        if (Array.isArray(e.gallery)) {
          e.gallery = e.gallery.map(g => {
            if (g.endsWith('.jpg') || g.endsWith('.webp')) return 'images/event-technova-symposium.png';
            return g;
          });
        }
        return e;
      });
      localStorage.setItem(EVENTS_KEY, JSON.stringify(cleaned));
      return cleaned;
    }
    return DEFAULT_ADMIN_EVENTS;
  } catch {
    return DEFAULT_ADMIN_EVENTS;
  }
}

function saveLocalEvents(events) {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events || []));
  } catch {}
}

async function loadEvents() {
  const container = document.getElementById('eventsContainer');
  if (!container) return;
  container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading events…</p></div>';

  try {
    let events = [];
    // 1. Fetch from backend API
    try {
      const searchParam = evtSearchQuery ? `?search=${encodeURIComponent(evtSearchQuery)}` : '';
      const res = await fetch(`${API}/admin/events${searchParam}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.events)) {
          events = data.events;
          saveLocalEvents(events);
        }
      }
    } catch (apiErr) {
      console.warn('API events fetch fallback to local:', apiErr);
    }

    // 2. Fallback to local storage if API was unreachable
    if (!events.length) {
      events = getLocalEvents();
      if (evtSearchQuery) {
        const q = evtSearchQuery.toLowerCase();
        events = events.filter(e =>
          (e.title && e.title.toLowerCase().includes(q)) ||
          (e.venue && e.venue.toLowerCase().includes(q)) ||
          (e.category && e.category.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q))
        );
      }
    }

    const resultCount = document.getElementById('evtResultCount');
    if (resultCount) resultCount.textContent = `${events.length} event${events.length !== 1 ? 's' : ''}`;

    if (events.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <p>No events found. Click "Add New Event" to create one.</p>
        </div>`;
      return;
    }

    container.innerHTML = events.map(e => renderAdminEventCard(e)).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>Error loading events.</p></div>`;
  }
}

function renderAdminEventCard(e) {
  const isPub = e.published !== false;
  const isFeat = e.featured === true;
  const photoCount = Array.isArray(e.gallery) ? e.gallery.length : 1;

  return `
    <div class="event-admin-card ${isPub ? '' : 'draft'}" id="evt-${e.id}">
      <div class="event-admin-thumb">
        <img src="${e.coverImage || 'images/event-technova-symposium.png'}" alt="${escHtml(e.title)}">
        <span class="photo-count-badge">📷 ${photoCount} Photos</span>
      </div>
      <div class="event-admin-body">
        <div class="event-admin-header">
          <div>
            <div class="event-admin-title">${escHtml(e.title)}</div>
            <div class="event-admin-meta">📅 ${escHtml(e.date || 'TBA')} • ⏰ ${escHtml(e.time || '')} • 📍 ${escHtml(e.venue || 'Campus')} • 🏷️ ${escHtml(e.category || 'General')}</div>
          </div>
          <div class="event-admin-badges">
            ${isFeat ? '<span class="event-badge featured">★ Featured</span>' : ''}
            ${isPub ? '<span class="event-badge published">✓ Published</span>' : '<span class="event-badge draft">Draft (Hidden)</span>'}
          </div>
        </div>
        <p class="event-admin-desc">${escHtml(e.description || '')}</p>
        <div class="event-admin-actions">
          <button class="approve-toggle-btn ${isPub ? 'unapprove' : 'approve'}" onclick="togglePublishEvent('${e.id}', ${isPub})">
            ${isPub ? 'Unpublish (Hide)' : 'Publish to Website'}
          </button>
          <button class="event-edit-btn" onclick="openEditEventModal('${e.id}')">✏️ Edit Event</button>
          <button class="review-delete-btn" onclick="openDeleteEventModal('${e.id}')" title="Delete event">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>`;
}

function setEventCoverPreview(src) {
  const previewWrap = document.getElementById('evtImagePreviewWrap');
  const previewImg = document.getElementById('evtImagePreview');
  const dropContent = document.getElementById('evtDropZoneContent');
  const hiddenInput = document.getElementById('evtInputCover');
  const manualInput = document.getElementById('evtInputCoverManual');

  if (src && src.trim()) {
    if (previewImg) previewImg.src = src;
    if (previewWrap) previewWrap.style.display = 'block';
    if (dropContent) dropContent.style.display = 'none';
    if (hiddenInput) hiddenInput.value = src;
    if (manualInput) manualInput.value = src;
  } else {
    if (previewImg) previewImg.src = '';
    if (previewWrap) previewWrap.style.display = 'none';
    if (dropContent) dropContent.style.display = 'block';
    if (hiddenInput) hiddenInput.value = '';
    if (manualInput) manualInput.value = '';
    const fileInput = document.getElementById('evtFileInput');
    if (fileInput) fileInput.value = '';
  }
}

function initEventDragAndDrop() {
  const dropZone = document.getElementById('evtDropZone');
  const fileInput = document.getElementById('evtFileInput');
  const dropContent = document.getElementById('evtDropZoneContent');
  const removeBtn = document.getElementById('evtRemoveImgBtn');
  const manualInput = document.getElementById('evtInputCoverManual');

  if (!dropZone) return;

  // Open file browser on click
  dropContent?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput?.click();
  });

  // Handle selected file from input
  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) handleImageFile(file);
  });

  // Drag & drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const file = dt?.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  });

  // Remove image
  removeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    setEventCoverPreview('');
  });

  // Manual input sync
  manualInput?.addEventListener('input', () => {
    const val = manualInput.value.trim();
    if (val) {
      setEventCoverPreview(val);
    } else {
      setEventCoverPreview('');
    }
  });

  function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image is too large. Please select an image under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setEventCoverPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }
}

function openAddEventModal() {
  editingEventId = null;
  const modal = document.getElementById('eventModal');
  const title = document.getElementById('eventModalTitle');
  const form = document.getElementById('eventForm');
  if (title) title.textContent = 'Add New College Event';
  if (form) form.reset();
  setEventCoverPreview('');
  if (modal) modal.style.display = 'flex';
}

function openEditEventModal(id) {
  editingEventId = id;
  const events = getLocalEvents();
  const evt = events.find(e => e.id === id);
  if (!evt) return;

  const modal = document.getElementById('eventModal');
  const modalTitle = document.getElementById('eventModalTitle');
  if (modalTitle) modalTitle.textContent = 'Edit College Event';

  document.getElementById('evtInputTitle').value = evt.title || '';
  document.getElementById('evtInputDate').value = evt.date || '';
  document.getElementById('evtInputTime').value = evt.time || '';
  document.getElementById('evtInputVenue').value = evt.venue || '';
  document.getElementById('evtInputCategory').value = evt.category || 'Symposium';
  document.getElementById('evtInputDesc').value = evt.description || '';
  document.getElementById('evtInputFeatured').checked = !!evt.featured;
  document.getElementById('evtInputPublished').checked = evt.published !== false;

  setEventCoverPreview(evt.coverImage || '');

  if (modal) modal.style.display = 'flex';
}

function closeEventModal() {
  editingEventId = null;
  const modal = document.getElementById('eventModal');
  setEventCoverPreview('');
  if (modal) modal.style.display = 'none';
}

async function handleSaveEvent(e) {
  e.preventDefault();
  const events = getLocalEvents();

  const title = document.getElementById('evtInputTitle').value.trim();
  const date = document.getElementById('evtInputDate').value.trim();
  const time = document.getElementById('evtInputTime').value.trim();
  const venue = document.getElementById('evtInputVenue').value.trim();
  const category = document.getElementById('evtInputCategory').value;
  const description = document.getElementById('evtInputDesc').value.trim();
  const coverImage = document.getElementById('evtInputCover')?.value?.trim() || document.getElementById('evtInputCoverManual')?.value?.trim() || 'images/event-technova-symposium.png';
  const featured = document.getElementById('evtInputFeatured').checked;
  const published = document.getElementById('evtInputPublished').checked;

  if (!title || !date) {
    alert('Please enter event title and date.');
    return;
  }

  const payload = {
    title, date, time, venue, category, description, coverImage, featured, published,
    gallery: [coverImage, 'images/hero-campus-entrance.png']
  };

  try {
    if (editingEventId) {
      const res = await fetch(`${API}/admin/events/${editingEventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to update event.');
        return;
      }
    } else {
      const res = await fetch(`${API}/admin/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to create event.');
        return;
      }
    }
  } catch (apiErr) {
    // Local fallback update if offline
    console.warn('Event API save error, saving locally:', apiErr);
    if (editingEventId) {
      const idx = events.findIndex(ev => ev.id === editingEventId);
      if (idx !== -1) {
        events[idx] = { ...events[idx], ...payload };
      }
    } else {
      const newId = 'evt_' + Date.now();
      events.unshift({ id: newId, ...payload });
    }
    saveLocalEvents(events);
  }

  closeEventModal();
  loadEvents();
  loadStats();
}

async function togglePublishEvent(id, currentlyPublished) {
  try {
    await fetch(`${API}/admin/events/${id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ field: 'published' })
    });
  } catch (err) {
    console.warn('Toggle event API error:', err);
  }

  const events = getLocalEvents();
  const updated = events.map(e => (e.id === id || e._id === id) ? { ...e, published: !currentlyPublished } : e);
  saveLocalEvents(updated);
  loadEvents();
}

function openDeleteEventModal(id) {
  deleteEventTargetId = id;
  const modal = document.getElementById('deleteEventModal');
  if (modal) modal.style.display = 'flex';
}

function closeDeleteEventModal() {
  deleteEventTargetId = null;
  const modal = document.getElementById('deleteEventModal');
  if (modal) modal.style.display = 'none';
}

async function confirmDeleteEvent() {
  if (!deleteEventTargetId) return;

  try {
    await fetch(`${API}/admin/events/${deleteEventTargetId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
  } catch (err) {
    console.warn('Delete event API error:', err);
  }

  const events = getLocalEvents();
  const filtered = events.filter(e => e.id !== deleteEventTargetId && e._id !== deleteEventTargetId);
  saveLocalEvents(filtered);
  closeDeleteEventModal();
  loadEvents();
  loadStats();
}

// ══════════════════════════════════════════════════════════════
//  CAMPUS PHOTOS & GALLERIES MANAGEMENT (FULL CRUD)
// ══════════════════════════════════════════════════════════════
const GALLERY_KEY = 'podhigai_gallery';
const DELETED_PHOTOS_KEY = 'podhigai_deleted_photos';
let deletePhotoTargetId = null;
let editingPhotoId = null;
let galCurrentCategory = 'all';
let galSearchQuery = '';

function getDeletedPhotoIds() {
  try {
    const raw = localStorage.getItem(DELETED_PHOTOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function trackDeletedPhoto(id) {
  if (!id) return;
  try {
    const list = getDeletedPhotoIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(DELETED_PHOTOS_KEY, JSON.stringify(list));
    }
  } catch {}
}

function unmarkDeletedPhoto(id) {
  if (!id) return;
  try {
    const list = getDeletedPhotoIds().filter(delId => delId !== id);
    localStorage.setItem(DELETED_PHOTOS_KEY, JSON.stringify(list));
  } catch {}
}

const DEFAULT_ADMIN_GALLERY = [
  {
    id: 'photo_1',
    title: 'Main Academic Complex',
    caption: 'Smart Lecture Halls & Central Quadrangle',
    category: 'campus',
    imageUrl: 'images/gallery-academic-complex.png',
    size: 'large',
    order: 1
  },
  {
    id: 'photo_2',
    title: 'Computing Center',
    caption: 'High-Speed AI & Software Workstations',
    category: 'labs',
    imageUrl: 'images/gallery-computing-lab.png',
    size: 'normal',
    order: 2
  },
  {
    id: 'photo_3',
    title: 'AI Research Lab',
    caption: 'GPU Accelerated Deep Learning Cluster',
    category: 'labs',
    imageUrl: 'images/gallery-ai-research-lab.png',
    size: 'normal',
    order: 3
  },
  {
    id: 'photo_4',
    title: 'Campus Aerial View',
    caption: 'Scenic Landscape along Salem Main Road',
    category: 'campus',
    imageUrl: 'images/gallery-campus-landscape.png',
    size: 'normal',
    order: 4
  },
  {
    id: 'photo_5',
    title: 'IT Innovation Hub',
    caption: 'Cloud Computing & Hackathon Workspace',
    category: 'life',
    imageUrl: 'images/gallery-it-innovation-hub.png',
    size: 'normal',
    order: 5
  },
  {
    id: 'photo_6',
    title: 'Mechanical Workshops',
    caption: 'CNC Machines, CAD/CAM & Robotics Arenas',
    category: 'labs',
    imageUrl: 'images/gallery-mech-workshop.png',
    size: 'normal',
    order: 6
  },
  {
    id: 'photo_7',
    title: 'TechNova National Symposium',
    caption: 'Inter-Collegiate Technical Convergence & Paper Presentations',
    category: 'events',
    imageUrl: 'images/event-technova-symposium.png',
    size: 'large',
    order: 7
  },
  {
    id: 'photo_8',
    title: 'Podhigai Sangamam Cultural Fest',
    caption: 'Music, Arts, Dance & Theatrical Celebrations',
    category: 'life',
    imageUrl: 'images/event-cultural-fest.png',
    size: 'normal',
    order: 8
  },
  {
    id: 'photo_9',
    title: 'Administrative Block & Admissions Office',
    caption: 'Student Support, Academic Counselling & Enquiries',
    category: 'campus',
    imageUrl: 'images/about-aerial-campus.png',
    size: 'normal',
    order: 9
  },
  {
    id: 'photo_10',
    title: 'Annual Placement Felicitation Day',
    caption: 'Honoring Tier-1 IT & Core Recruiters Placements',
    category: 'events',
    imageUrl: 'images/event-placement-drive.png',
    size: 'normal',
    order: 10
  },
  {
    id: 'photo_11',
    title: 'University Sports Complex & Grounds',
    caption: 'Cricket, Volleyball, Athletic Tracks & Indoor Games',
    category: 'life',
    imageUrl: 'images/hero-student-life.png',
    size: 'normal',
    order: 11
  },
  {
    id: 'photo_12',
    title: 'Robotics & Automation Arena',
    caption: 'Autonomous Drone Obstacle & Robo-Wars Arena',
    category: 'labs',
    imageUrl: 'images/event-robowar-mech-expo.png',
    size: 'normal',
    order: 12
  },
  {
    id: 'photo_13',
    title: 'B.Tech IT Innovation Studio',
    caption: 'Full-Stack Web, Mobile Apps & Cloud Architecture Labs',
    category: 'programs',
    imageUrl: 'images/dept-it.png',
    size: 'normal',
    order: 13
  },
  {
    id: 'photo_14',
    title: 'Central Digital Library & Reading Hall',
    caption: 'Over 25,000+ Engineering Volumes & IEEE E-Journals',
    category: 'campus',
    imageUrl: 'images/hero-campus-entrance.png',
    size: 'normal',
    order: 14
  },
  {
    id: 'photo_15',
    title: 'Electrical & Electronics Engineering Lab',
    caption: 'Power Systems, Renewable Energy & EV Technology Labs',
    category: 'labs',
    imageUrl: 'images/dept-eee.png',
    size: 'normal',
    order: 15
  },
  {
    id: 'photo_16',
    title: 'Annual Graduation & Degree Convocation',
    caption: 'Anna University Degree Awarding & Distinguished Alumni Felicitations',
    category: 'graduation',
    imageUrl: 'images/gallery-academic-complex.png',
    size: 'large',
    order: 16
  },
  {
    id: 'photo_17',
    title: 'B.Tech AI & Data Science Workstations',
    caption: 'Python, Neural Networks, PyTorch & GPU Workstations',
    category: 'programs',
    imageUrl: 'images/dept-aids.png',
    size: 'normal',
    order: 17
  }
];

function getLocalGallery() {
  const deletedIds = getDeletedPhotoIds();
  try {
    const stored = localStorage.getItem(GALLERY_KEY);
    if (!stored) {
      const initial = DEFAULT_ADMIN_GALLERY.filter(p => !deletedIds.includes(p.id));
      localStorage.setItem(GALLERY_KEY, JSON.stringify(initial));
      return initial;
    }
    let parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter(p => !deletedIds.includes(p.id) && !deletedIds.includes(p._id));
    }
    return DEFAULT_ADMIN_GALLERY.filter(p => !deletedIds.includes(p.id));
  } catch {
    return DEFAULT_ADMIN_GALLERY.filter(p => !deletedIds.includes(p.id));
  }
}

function saveLocalGallery(photos) {
  try {
    const deletedIds = getDeletedPhotoIds();
    const valid = (photos || []).filter(p => !deletedIds.includes(p.id) && !deletedIds.includes(p._id));
    localStorage.setItem(GALLERY_KEY, JSON.stringify(valid));
    try {
      window.dispatchEvent(new StorageEvent('storage', { key: GALLERY_KEY, newValue: JSON.stringify(valid) }));
    } catch {}
  } catch (err) {
    console.warn('saveLocalGallery storage error:', err);
  }
}

async function loadGallery() {
  const container = document.getElementById('galleryContainer');
  if (!container) return;
  container.innerHTML = '<div class="loading-state" style="grid-column: 1/-1;"><div class="spinner"></div><p>Loading photos…</p></div>';

  try {
    let allPhotos = [];
    // 1. Fetch from backend API
    try {
      const res = await fetch(`${API}/admin/gallery`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.photos)) {
          allPhotos = data.photos;
          saveLocalGallery(allPhotos);
        }
      }
    } catch (apiErr) {
      console.warn('API gallery fetch fallback to local:', apiErr);
    }

    // 2. Fallback to local storage if API was unreachable
    if (!allPhotos.length) {
      allPhotos = getLocalGallery();
    }

    // Update Category Pill Counts across all categories
    const countAll = allPhotos.length;
    const countCampus = allPhotos.filter(p => (p.category || '').toLowerCase() === 'campus').length;
    const countLabs = allPhotos.filter(p => (p.category || '').toLowerCase() === 'labs').length;
    const countLife = allPhotos.filter(p => (p.category || '').toLowerCase() === 'life').length;
    const countEvents = allPhotos.filter(p => (p.category || '').toLowerCase() === 'events').length;
    const countPrograms = allPhotos.filter(p => (p.category || '').toLowerCase() === 'programs').length;
    const countGrad = allPhotos.filter(p => (p.category || '').toLowerCase() === 'graduation').length;

    const setCount = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setCount('countCatAll', countAll);
    setCount('countCatCampus', countCampus);
    setCount('countCatLabs', countLabs);
    setCount('countCatLife', countLife);
    setCount('countCatEvents', countEvents);
    setCount('countCatPrograms', countPrograms);
    setCount('countCatGraduation', countGrad);

    // Filter by selected category & search query
    let filtered = [...allPhotos];
    if (galCurrentCategory && galCurrentCategory !== 'all') {
      filtered = filtered.filter(p => (p.category || '').toLowerCase() === galCurrentCategory.toLowerCase());
    }

    if (galSearchQuery) {
      const q = galSearchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.caption && p.caption.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    const resultCount = document.getElementById('galResultCount');
    if (resultCount) {
      resultCount.textContent = `${filtered.length} photo${filtered.length !== 1 ? 's' : ''} found`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <p>No photos found in this category. Click "+ Add New Photo" to upload one.</p>
        </div>`;
      return;
    }

    // Sort all photos ascending by order (1, 2, 3...)
    allPhotos.sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));

    container.innerHTML = filtered.map(p => renderAdminPhotoCard(p)).join('');
  } catch (err) {
    console.error('loadGallery error:', err);
    container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>Error loading photos.</p></div>`;
  }
}

function renderAdminPhotoCard(p) {
  const cat = (p.category || 'campus').toLowerCase();
  const catClass = `cat-${cat}`;
  const catNames = {
    campus: '🏛️ Campus',
    labs: '💻 Labs',
    life: '🎉 Student Life',
    events: '📅 Past Events',
    programs: '🎓 Programs',
    graduation: '🏆 Graduation'
  };
  const catLabel = catNames[cat] || cat;
  const isLarge = p.size === 'large';
  const orderNum = Number(p.order) || 1;

  return `
    <div class="admin-photo-card" id="photoCard-${p.id || p._id}">
      <div class="photo-thumb-wrap">
        <img src="${escHtml(p.imageUrl || 'images/gallery-academic-complex.png')}" alt="${escHtml(p.title)}" class="photo-thumb-img" loading="lazy">
        <span class="photo-cat-badge ${catClass}">${catLabel}</span>
        <span class="photo-order-badge" title="Display Order #${orderNum}">#${orderNum}</span>
        ${isLarge ? '<span class="photo-size-badge">★ Hero Size</span>' : ''}
      </div>
      <div class="photo-card-body">
        <div class="photo-card-title">${escHtml(p.title)}</div>
        <div class="photo-card-caption">${escHtml(p.caption || '')}</div>
        <div class="photo-card-footer">
          <div class="photo-order-actions" title="Shift order on website">
            <button type="button" class="photo-order-btn" title="Move Up (Display earlier on site)" onclick="shiftPhotoOrder('${p.id || p._id}', -1)">▲</button>
            <button type="button" class="photo-order-btn" title="Move Down (Display later on site)" onclick="shiftPhotoOrder('${p.id || p._id}', 1)">▼</button>
          </div>
          <div style="display:flex;gap:6px;">
            <button type="button" class="photo-action-btn edit" onclick="openEditPhotoModal('${p.id || p._id}')">
              ✏️ Edit
            </button>
            <button type="button" class="photo-action-btn delete" onclick="openDeletePhotoModal('${p.id || p._id}')">
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

async function shiftPhotoOrder(id, direction) {
  const photos = getLocalGallery();
  photos.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  const index = photos.findIndex(p => p.id === id || p._id === id);
  if (index === -1) return;

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= photos.length) return; // Boundary reached

  // Swap photos
  const temp = photos[index];
  photos[index] = photos[targetIndex];
  photos[targetIndex] = temp;

  // Re-index orders 1, 2, 3...
  const orderUpdates = [];
  photos.forEach((p, idx) => {
    p.order = idx + 1;
    orderUpdates.push({ id: p.id || p._id, order: idx + 1 });
  });

  saveLocalGallery(photos);
  loadGallery();

  try {
    const res = await fetch(`${API}/admin/gallery/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ orders: orderUpdates })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      console.warn('Reorder API notice:', data.message);
    }
  } catch (err) {
    console.warn('Reorder API network notice:', err);
  }
}

function selectGalleryCategory(cat) {
  galCurrentCategory = cat;
  const tabs = document.querySelectorAll('#galleryAdminCatTabs .gal-cat-pill');
  tabs.forEach(t => t.classList.remove('active'));
  const activeBtn = document.getElementById(`galCatBtn-${cat}`);
  if (activeBtn) activeBtn.classList.add('active');
  loadGallery();
}

function setPhotoPreview(src) {
  const previewWrap = document.getElementById('photoImagePreviewWrap');
  const previewImg = document.getElementById('photoImagePreview');
  const dropContent = document.getElementById('photoDropZoneContent');
  const hiddenInput = document.getElementById('photoInputImg');
  const manualInput = document.getElementById('photoInputImgManual');

  if (src && src.trim()) {
    if (previewImg) previewImg.src = src;
    if (previewWrap) previewWrap.style.display = 'block';
    if (dropContent) dropContent.style.display = 'none';
    if (hiddenInput) hiddenInput.value = src;
    if (manualInput) manualInput.value = src;
  } else {
    if (previewImg) previewImg.src = '';
    if (previewWrap) previewWrap.style.display = 'none';
    if (dropContent) dropContent.style.display = 'block';
    if (hiddenInput) hiddenInput.value = '';
    if (manualInput) manualInput.value = '';
    const fileInput = document.getElementById('photoFileInput');
    if (fileInput) fileInput.value = '';
  }
}

function initGalleryDragAndDrop() {
  const dropZone = document.getElementById('photoDropZone');
  const fileInput = document.getElementById('photoFileInput');
  const dropContent = document.getElementById('photoDropZoneContent');
  const removeBtn = document.getElementById('photoRemoveImgBtn');
  const manualInput = document.getElementById('photoInputImgManual');

  if (!dropZone) return;

  dropContent?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput?.click();
  });

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) handlePhotoFile(file);
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const file = dt?.files?.[0];
    if (file) handlePhotoFile(file);
  });

  removeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    setPhotoPreview('');
  });

  manualInput?.addEventListener('input', () => {
    const val = manualInput.value.trim();
    setPhotoPreview(val || '');
  });

  function handlePhotoFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert('Image is too large. Please select an image under 15MB.');
      return;
    }

    // Compress client-side so base64 stays ~100-250KB, avoiding quota limits
    compressImageFile(file, 1400, 1400, 0.84, (compressedDataUrl) => {
      setPhotoPreview(compressedDataUrl);
    }, () => {
      // Fallback to direct dataURL
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    });
  }
}

function compressImageFile(file, maxWidth, maxHeight, quality, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const format = (file.type === 'image/png' && file.size < 600000) ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(format, quality);
        onSuccess(dataUrl);
      } catch (err) {
        if (onError) onError(err);
      }
    };
    img.onerror = () => { if (onError) onError(); };
    img.src = e.target.result;
  };
  reader.onerror = () => { if (onError) onError(); };
  reader.readAsDataURL(file);
}

function openAddPhotoModal() {
  editingPhotoId = null;
  const modal = document.getElementById('photoModal');
  const title = document.getElementById('photoModalTitle');
  const form = document.getElementById('photoForm');
  const oInput = document.getElementById('photoInputOrder');
  const photos = getLocalGallery();
  if (title) title.textContent = 'Add New Campus Photo';
  if (form) form.reset();
  if (oInput) oInput.value = photos.length + 1;
  setPhotoPreview('');
  if (modal) modal.style.display = 'flex';
}

function openEditPhotoModal(id) {
  editingPhotoId = id;
  const photos = getLocalGallery();
  const photo = photos.find(p => p.id === id || p._id === id);
  if (!photo) return;

  const modal = document.getElementById('photoModal');
  const modalTitle = document.getElementById('photoModalTitle');
  if (modalTitle) modalTitle.textContent = 'Edit Campus Photo';

  const tInput = document.getElementById('photoInputTitle');
  const cInput = document.getElementById('photoInputCaption');
  const catInput = document.getElementById('photoInputCategory');
  const sInput = document.getElementById('photoInputSize');
  const oInput = document.getElementById('photoInputOrder');

  if (tInput) tInput.value = photo.title || '';
  if (cInput) cInput.value = photo.caption || '';
  if (catInput) catInput.value = (photo.category || 'campus').toLowerCase();
  if (sInput) sInput.value = photo.size === 'large' ? 'large' : 'normal';
  if (oInput) oInput.value = Number(photo.order) || 1;

  setPhotoPreview(photo.imageUrl || '');

  if (modal) modal.style.display = 'flex';
}

function closePhotoModal() {
  editingPhotoId = null;
  const modal = document.getElementById('photoModal');
  setPhotoPreview('');
  if (modal) modal.style.display = 'none';
}

async function handleSavePhoto(e) {
  e.preventDefault();
  const photos = getLocalGallery();

  const title = document.getElementById('photoInputTitle')?.value?.trim();
  const caption = document.getElementById('photoInputCaption')?.value?.trim() || '';
  const category = document.getElementById('photoInputCategory')?.value || 'campus';
  const size = document.getElementById('photoInputSize')?.value || 'normal';
  const orderVal = document.getElementById('photoInputOrder')?.value;
  const imageUrl = document.getElementById('photoInputImg')?.value?.trim() ||
                   document.getElementById('photoInputImgManual')?.value?.trim() ||
                   'images/gallery-academic-complex.png';

  if (!title) {
    alert('Please enter a photo title.');
    return;
  }
  if (!imageUrl) {
    alert('Please choose or upload a photo image.');
    return;
  }

  let orderNum = photos.length + 1;
  if (orderVal !== undefined && orderVal !== '' && !isNaN(Number(orderVal))) {
    orderNum = Number(orderVal);
  } else if (editingPhotoId) {
    const existing = photos.find(p => p.id === editingPhotoId || p._id === editingPhotoId);
    if (existing && existing.order) orderNum = Number(existing.order);
  }

  const payload = {
    title,
    caption,
    category: category.toLowerCase(),
    size,
    imageUrl,
    order: orderNum
  };

  try {
    if (editingPhotoId) {
      const res = await fetch(`${API}/admin/gallery/${editingPhotoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        alert(data.message || 'Failed to update photo on server.');
        return;
      }
      unmarkDeletedPhoto(editingPhotoId);
      const updatedPhoto = data.photo || { id: editingPhotoId, ...payload };
      const idx = photos.findIndex(p => p.id === editingPhotoId || p._id === editingPhotoId);
      if (idx !== -1) {
        photos[idx] = { ...photos[idx], ...updatedPhoto };
      } else {
        photos.unshift(updatedPhoto);
      }
      saveLocalGallery(photos);
    } else {
      const res = await fetch(`${API}/admin/gallery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        alert(data.message || 'Failed to create photo on server.');
        return;
      }
      const newPhoto = data.photo || { id: 'photo_' + Date.now(), ...payload };
      unmarkDeletedPhoto(newPhoto.id);
      photos.unshift(newPhoto);
      saveLocalGallery(photos);
    }
  } catch (apiErr) {
    console.warn('Gallery API save notice (offline fallback):', apiErr);
    if (editingPhotoId) {
      const idx = photos.findIndex(p => p.id === editingPhotoId || p._id === editingPhotoId);
      if (idx !== -1) {
        photos[idx] = { ...photos[idx], ...payload };
      } else {
        photos.unshift({ id: editingPhotoId, ...payload });
      }
      unmarkDeletedPhoto(editingPhotoId);
    } else {
      const newId = 'photo_' + Date.now();
      photos.unshift({ id: newId, ...payload });
      unmarkDeletedPhoto(newId);
    }
    saveLocalGallery(photos);
  }

  closePhotoModal();
  loadGallery();
  loadStats();
}

function openDeletePhotoModal(id) {
  deletePhotoTargetId = id;
  const modal = document.getElementById('deletePhotoModal');
  if (modal) modal.style.display = 'flex';
}

function closeDeletePhotoModal() {
  deletePhotoTargetId = null;
  const modal = document.getElementById('deletePhotoModal');
  if (modal) modal.style.display = 'none';
}

async function confirmDeletePhoto() {
  if (!deletePhotoTargetId) return;
  const targetId = deletePhotoTargetId;

  // 1. Permanently track as deleted so no default array or cache can resurrect it
  trackDeletedPhoto(targetId);

  // 2. Delete immediately from local storage & broadcast to website
  const photos = getLocalGallery();
  const filtered = photos.filter(p => p.id !== targetId && p._id !== targetId);
  saveLocalGallery(filtered);

  // 3. Delete from backend MongoDB
  try {
    const res = await fetch(`${API}/admin/gallery/${targetId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!res.ok) {
      console.warn('Delete gallery photo API response status:', res.status);
    }
  } catch (err) {
    console.warn('Delete gallery photo API network notice:', err);
  }

  closeDeletePhotoModal();
  loadGallery();
  loadStats();
}

// ── HERO CHAIRMAN SETTINGS MANAGEMENT ────────────────────────
const CHAIRMAN_STORAGE_KEY = 'podhigai_chairman_settings';
const DEFAULT_CHAIRMAN = {
  name: 'KC Ezhilarasan',
  role: 'College Chairman',
  image: 'images/chairman.png'
};

let currentChairmanData = { ...DEFAULT_CHAIRMAN };

function getStoredChairmanSettings() {
  try {
    const stored = localStorage.getItem(CHAIRMAN_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CHAIRMAN, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error parsing chairman settings:', e);
  }
  return { ...DEFAULT_CHAIRMAN };
}

async function loadChairmanSettings() {
  currentChairmanData = getStoredChairmanSettings();

  // Try fetching from backend if available
  try {
    const res = await fetch(`${API}/chairman`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.chairman) {
        currentChairmanData = { ...DEFAULT_CHAIRMAN, ...data.chairman };
        localStorage.setItem(CHAIRMAN_STORAGE_KEY, JSON.stringify(currentChairmanData));
      }
    }
  } catch (e) {
    // Offline / fallback to localStorage
  }

  // Populate form
  const nameInput = document.getElementById('chNameInput');
  const roleInput = document.getElementById('chRoleInput');
  const imgUrlInput = document.getElementById('chImageUrlInput');
  const statusEl = document.getElementById('chairmanSaveStatus');
  const fileNameEl = document.getElementById('chPhotoFileName');
  const fileInput = document.getElementById('chPhotoFile');

  if (statusEl) statusEl.style.display = 'none';
  if (nameInput) nameInput.value = currentChairmanData.name || '';
  if (roleInput) roleInput.value = currentChairmanData.role || 'College Chairman';
  if (imgUrlInput) imgUrlInput.value = currentChairmanData.image || 'images/chairman.png';
  if (fileNameEl) fileNameEl.textContent = '';
  if (fileInput) fileInput.value = '';

  updateChairmanLivePreview();
}

function updateChairmanLivePreview() {
  const nameInput = document.getElementById('chNameInput');
  const roleInput = document.getElementById('chRoleInput');
  const imgUrlInput = document.getElementById('chImageUrlInput');

  const previewName = document.getElementById('chPreviewName');
  const previewRole = document.getElementById('chPreviewRole');
  const previewImg = document.getElementById('chPreviewImg');

  const nameVal = nameInput?.value.trim() || currentChairmanData.name || DEFAULT_CHAIRMAN.name;
  const roleVal = roleInput?.value.trim() || currentChairmanData.role || DEFAULT_CHAIRMAN.role;
  const imgVal = imgUrlInput?.value.trim() || currentChairmanData.image || DEFAULT_CHAIRMAN.image;

  if (previewName) previewName.textContent = nameVal;
  if (previewRole) previewRole.textContent = roleVal;
  if (previewImg && imgVal) {
    previewImg.src = imgVal;
  }
}

function handleChairmanFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const fileNameEl = document.getElementById('chPhotoFileName');
  if (fileNameEl) fileNameEl.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    const imgUrlInput = document.getElementById('chImageUrlInput');
    if (imgUrlInput) imgUrlInput.value = base64;
    updateChairmanLivePreview();
  };
  reader.readAsDataURL(file);
}

async function handleSaveChairman(e) {
  if (e) e.preventDefault();
  const nameInput = document.getElementById('chNameInput');
  const roleInput = document.getElementById('chRoleInput');
  const imgUrlInput = document.getElementById('chImageUrlInput');
  const statusEl = document.getElementById('chairmanSaveStatus');
  const saveBtn = document.getElementById('saveChairmanBtn');

  const name = nameInput?.value.trim();
  const role = roleInput?.value.trim() || 'College Chairman';
  const image = imgUrlInput?.value.trim() || 'images/chairman.png';

  if (!name) {
    alert('Please enter the Chairman full name.');
    return;
  }

  const updated = { name, role, image };
  currentChairmanData = updated;

  // 1. Save to LocalStorage
  localStorage.setItem(CHAIRMAN_STORAGE_KEY, JSON.stringify(updated));

  // 2. Dispatch custom event so other components / open tabs update immediately
  window.dispatchEvent(new CustomEvent('podhigai:chairmanUpdated', { detail: updated }));

  // 3. Save to backend API if available
  try {
    await fetch(`${API}/admin/chairman`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(updated)
    });
  } catch (err) {
    // Offline mode, localStorage is sufficient
  }

  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.style.background = '#ECFDF5';
    statusEl.style.color = '#065F46';
    statusEl.style.border = '1px solid #A7F3D0';
    statusEl.innerHTML = '✅ <strong>Saved!</strong> Chairman details successfully updated in hero section.';
    setTimeout(() => {
      if (statusEl) statusEl.style.display = 'none';
    }, 4500);
  }

  if (saveBtn) {
    const oldHtml = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span>✓ Saved Successfully</span>';
    setTimeout(() => {
      saveBtn.innerHTML = oldHtml;
    }, 2500);
  }
}

function handleResetChairman() {
  if (!confirm('Reset Chairman to default configuration (KC Ezhilarasan, images/chairman.png)?')) return;
  currentChairmanData = { ...DEFAULT_CHAIRMAN };
  localStorage.setItem(CHAIRMAN_STORAGE_KEY, JSON.stringify(DEFAULT_CHAIRMAN));
  window.dispatchEvent(new CustomEvent('podhigai:chairmanUpdated', { detail: DEFAULT_CHAIRMAN }));

  const nameInput = document.getElementById('chNameInput');
  const roleInput = document.getElementById('chRoleInput');
  const imgUrlInput = document.getElementById('chImageUrlInput');
  const fileNameEl = document.getElementById('chPhotoFileName');
  const fileInput = document.getElementById('chPhotoFile');

  if (nameInput) nameInput.value = DEFAULT_CHAIRMAN.name;
  if (roleInput) roleInput.value = DEFAULT_CHAIRMAN.role;
  if (imgUrlInput) imgUrlInput.value = DEFAULT_CHAIRMAN.image;
  if (fileNameEl) fileNameEl.textContent = '';
  if (fileInput) fileInput.value = '';

  updateChairmanLivePreview();

  const statusEl = document.getElementById('chairmanSaveStatus');
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.style.background = '#EFF6FF';
    statusEl.style.color = '#1E40AF';
    statusEl.style.border = '1px solid #BFDBFE';
    statusEl.innerHTML = 'ℹ️ Chairman settings restored to default.';
    setTimeout(() => {
      if (statusEl) statusEl.style.display = 'none';
    }, 3500);
  }
}

