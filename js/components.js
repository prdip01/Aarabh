// ================================
// ARAMBH — Shared Components
// Sidebar, Header, Ring, Toast
// ================================

// ── roundRect polyfill for older browsers ──
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

// ── Navigation Config ──
const NAV_ITEMS = [
  { label: 'Dashboard', href: 'index.html', icon: '⊞', badge: null },
  { label: 'Study Goal', href: 'study.html', icon: '📚', badge: null },
  { label: 'Money Goal', href: 'money.html', icon: '💰', badge: null },
  { label: 'Reminders', href: 'reminders.html', icon: '🔔', badge: 'pending' },
  { label: 'Projects', href: 'projects.html', icon: '🚀', badge: null },
  { label: 'Settings', href: 'settings.html', icon: '⚙️', badge: null },
];

// ── Determine Active Page ──
function getActivePage() {
  const path = window.location.pathname;
  const filename = path.split('/').pop() || 'index.html';
  return filename;
}

// ── Render Sidebar ──
function renderSidebar() {
  const activePage = getActivePage();
  const pendingCount = Store.getPendingTasks().length;

  const navHTML = NAV_ITEMS.map(item => {
    const isActive = item.href === activePage || (activePage === '' && item.href === 'index.html');
    const badge = item.badge === 'pending' && pendingCount > 0
      ? `<span class="nav-badge">${pendingCount}</span>` : '';
    return `
      <a href="${item.href}" class="nav-link ${isActive ? 'active' : ''}">
        <span class="nav-link-icon">${item.icon}</span>
        <span class="nav-link-label">${item.label}</span>
        ${badge}
      </a>`;
  }).join('');

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">✦</div>
        <span class="sidebar-logo-text">Arambh</span>
      </div>
      <nav class="sidebar-nav">${navHTML}</nav>
      <div class="sidebar-footer">
        <div class="text-xs text-muted">Made by Pradeep Kumar ❤️</div>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>`;
}

// ── Render Topbar ──
function renderTopbar(pageTitle) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const theme = Store.getTheme();
  const pendingCount = Store.getPendingTasks().length;

  return `
    <header class="topbar">
      <div class="flex items-center gap-4">
        <button class="hamburger" id="hamburgerBtn" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
        <div class="topbar-left">
          <div class="topbar-greeting">${greeting}, Explorer! 👋</div>
          <div class="topbar-date">${dateStr}</div>
        </div>
      </div>
      <div class="topbar-right">
        <button class="icon-btn" id="notifBtn" title="Reminders" onclick="window.location.href='reminders.html'">
          🔔
          ${pendingCount > 0 ? '<span class="notif-dot"></span>' : ''}
        </button>
        <button class="icon-btn" id="themeToggle" title="Toggle theme">
          ${theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>`;
}

// ── Init Shared Components ──
function initComponents(pageTitle = '') {
  // Inject sidebar & topbar
  const sidebarEl = document.getElementById('sidebar-container');
  const topbarEl = document.getElementById('topbar-container');
  if (sidebarEl) sidebarEl.innerHTML = renderSidebar();
  if (topbarEl) topbarEl.innerHTML = renderTopbar(pageTitle);

  // Mobile hamburger
  document.addEventListener('click', (e) => {
    const btn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (e.target === btn || btn?.contains(e.target)) {
      sidebar?.classList.toggle('open');
      overlay?.classList.toggle('show');
    }
    if (e.target === overlay) {
      sidebar?.classList.remove('open');
      overlay?.classList.remove('show');
    }
  });

  // Theme toggle
  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const current = Store.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    Store.setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    document.getElementById('themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
  });

  // Toast container
  if (!document.getElementById('toastContainer')) {
    const tc = document.createElement('div');
    tc.id = 'toastContainer';
    tc.className = 'toast-container';
    document.body.appendChild(tc);
  }
}

// ── Toast ──
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: '✓', error: '✗', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── SVG Ring ──
function createRing({ size = 80, strokeWidth = 8, progress = 0, color = '#7C6FFF', bg = 'rgba(255,255,255,0.08)', animated = true } = {}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${bg}" stroke-width="${strokeWidth}"/>
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"
        stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${animated ? circumference : offset}"
        ${animated ? `style="transition: stroke-dashoffset 1.2s ease; stroke-dashoffset: ${offset};"` : ''}
      />
    </svg>`;
}

// ── Modal Helper ──
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

function createModal({ id, title, content, onSave, saveLabel = 'Save' }) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = id;
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">${title}</h2>
        <button class="modal-close" onclick="closeModal('${id}')">✕</button>
      </div>
      <div class="modal-body">${content}</div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal('${id}')">Cancel</button>
        <button class="btn btn-primary" id="${id}-save">${saveLabel}</button>
      </div>
    </div>`;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(id);
  });

  document.body.appendChild(modal);
  if (onSave) {
    document.getElementById(`${id}-save`)?.addEventListener('click', onSave);
  }
  return modal;
}

// ── Confirm Dialog ──
function confirmDialog(message, onConfirm) {
  const id = 'confirmModal';
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.id = id;
  modal.innerHTML = `
    <div class="modal" style="max-width:360px">
      <div class="modal-header">
        <h2 class="modal-title">Confirm</h2>
        <button class="modal-close" onclick="document.getElementById('${id}').remove()">✕</button>
      </div>
      <p style="color:var(--text-secondary);font-size:14px;margin-bottom:24px;">${message}</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="document.getElementById('${id}').remove()">Cancel</button>
        <button class="btn btn-danger" id="confirmOkBtn">Delete</button>
      </div>
    </div>`;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
  document.getElementById('confirmOkBtn')?.addEventListener('click', () => {
    modal.remove();
    onConfirm();
  });
}

// ── Format Helpers ──
function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getDaysDiff(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}
