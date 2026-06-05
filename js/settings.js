// ================================
// ARAMBH — Settings Logic
// ================================

const ACCENT_PRESETS = [
  '#7C6FFF', '#6366f1', '#3b82f6', '#0ea5e9',
  '#22c55e', '#84cc16', '#f59e0b', '#ef4444',
  '#ec4899', '#a855f7', '#14b8a6', '#f97316'
];

document.addEventListener('DOMContentLoaded', () => {
  initComponents('Settings');
  initSettingsNav();
  renderStudySettings();
  renderMoneySettings();
  renderQuickLinksSettings();
  renderAppearanceSettings();
  bindDataSettings();
});

// ── Settings Nav ──
function initSettingsNav() {
  document.getElementById('settingsNav')?.addEventListener('click', (e) => {
    const link = e.target.closest('[data-section]');
    if (!link) return;
    const section = link.dataset.section;

    document.querySelectorAll('.settings-nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));

    link.classList.add('active');
    document.getElementById(`section-${section}`)?.classList.add('active');
  });
}

// ── Study Settings ──
function renderStudySettings() {
  const subs = Store.getSubjects();
  const countEl = document.getElementById('subjectCountLabel');
  if (countEl) countEl.textContent = `(${subs.length}/6)`;

  const container = document.getElementById('settingsSubjectsList');
  if (!container) return;

  if (subs.length === 0) {
    container.innerHTML = `<div class="text-muted text-sm">No subjects yet. Add up to 6.</div>`;
  } else {
    container.innerHTML = subs.map((s, i) => `
      <div class="flex items-center gap-3" style="padding:10px;background:var(--bg-input);border-radius:var(--radius-md);margin-bottom:8px">
        <div style="width:16px;height:16px;border-radius:50%;background:${s.color};flex-shrink:0"></div>
        <input type="text" class="form-input" value="${escHtml(s.name)}" id="subj-name-${s.id}" style="flex:1" />
        <input type="color" value="${s.color}" id="subj-color-${s.id}" style="width:36px;height:36px;border:none;border-radius:6px;cursor:pointer;padding:2px;background:var(--bg-card)" />
        <button class="btn btn-secondary btn-sm" onclick="saveSubjectEdit('${s.id}')">✓</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="settingsDeleteSubject('${s.id}')">✕</button>
      </div>`).join('');
  }

  document.getElementById('settingsAddSubjectBtn')?.addEventListener('click', () => {
    const subs = Store.getSubjects();
    if (subs.length >= 6) { showToast('Max 6 subjects allowed', 'error'); return; }
    const name = prompt('Enter subject name:');
    if (!name || !name.trim()) return;
    const colors = ['#7C6FFF','#22c55e','#f59e0b','#ef4444','#3b82f6','#ec4899'];
    subs.push({ id: Store.genId(), name: name.trim(), color: colors[subs.length % colors.length] });
    Store.setSubjects(subs);
    showToast('Subject added!', 'success');
    renderStudySettings();
  });

  document.getElementById('resetStudyBtn')?.addEventListener('click', () => {
    confirmDialog('Reset ALL study data? This cannot be undone.', () => {
      Store.set('study.sessions', []);
      showToast('Study data cleared', 'info');
    });
  });
}

function saveSubjectEdit(id) {
  const name = document.getElementById(`subj-name-${id}`)?.value.trim();
  const color = document.getElementById(`subj-color-${id}`)?.value;
  if (!name) { showToast('Name cannot be empty', 'error'); return; }
  const subs = Store.getSubjects().map(s => s.id === id ? { ...s, name, color } : s);
  Store.setSubjects(subs);
  showToast('Subject saved!', 'success');
  renderStudySettings();
}

function settingsDeleteSubject(id) {
  confirmDialog('Delete this subject?', () => {
    Store.setSubjects(Store.getSubjects().filter(s => s.id !== id));
    showToast('Subject deleted', 'info');
    renderStudySettings();
  });
}

// ── Money Settings ──
function renderMoneySettings() {
  const input = document.getElementById('settingsBudgetInput');
  if (input) input.value = Store.get('money.budget') || Store.getBudget();

  document.getElementById('settingsBudgetSave')?.addEventListener('click', () => {
    const val = parseFloat(input?.value);
    if (!val || val <= 0) { showToast('Enter a valid budget', 'error'); return; }
    Store.setBudget(val);
    showToast('Budget saved!', 'success');
  });

  document.getElementById('resetMoneyBtn')?.addEventListener('click', () => {
    confirmDialog('Reset ALL money/expense data? This cannot be undone.', () => {
      Store.set('money.expenses', []);
      showToast('Money data cleared', 'info');
    });
  });
}

// ── Quick Links Settings ──
function renderQuickLinksSettings() {
  const container = document.getElementById('quickLinksList');
  if (!container) return;
  const links = Store.getQuickLinks();

  container.innerHTML = links.map((l, i) => `
    <div class="link-item" id="link-row-${l.id}">
      <input type="text" class="form-input link-icon-input" value="${escHtml(l.icon || '🔗')}" id="link-icon-${l.id}" maxlength="2" placeholder="🔗" />
      <input type="text" class="form-input link-name-input" value="${escHtml(l.name)}" id="link-name-${l.id}" placeholder="Name" />
      <input type="url" class="form-input link-url-input" value="${escHtml(l.url)}" id="link-url-${l.id}" placeholder="https://..." />
      <button class="btn btn-icon btn-danger btn-sm" onclick="removeQuickLinkRow('${l.id}')">✕</button>
    </div>`).join('');

  document.getElementById('addQuickLinkBtn')?.addEventListener('click', () => {
    const tempId = Store.genId();
    const row = document.createElement('div');
    row.className = 'link-item';
    row.id = `link-row-${tempId}`;
    row.innerHTML = `
      <input type="text" class="form-input link-icon-input" value="🔗" id="link-icon-${tempId}" maxlength="2" />
      <input type="text" class="form-input link-name-input" id="link-name-${tempId}" placeholder="Name" />
      <input type="url" class="form-input link-url-input" id="link-url-${tempId}" placeholder="https://..." />
      <button class="btn btn-icon btn-danger btn-sm" onclick="removeQuickLinkRow('${tempId}')">✕</button>`;
    container.appendChild(row);
  });

  document.getElementById('saveQuickLinksBtn')?.addEventListener('click', saveQuickLinks);
}

function removeQuickLinkRow(id) {
  document.getElementById(`link-row-${id}`)?.remove();
}

function saveQuickLinks() {
  const rows = document.querySelectorAll('#quickLinksList .link-item, [id^="link-row-"]');
  const links = [];

  document.querySelectorAll('[id^="link-row-"]').forEach(row => {
    const idPart = row.id.replace('link-row-', '');
    const name = document.getElementById(`link-name-${idPart}`)?.value.trim();
    const url = document.getElementById(`link-url-${idPart}`)?.value.trim();
    const icon = document.getElementById(`link-icon-${idPart}`)?.value.trim();
    if (name && url) {
      links.push({ id: idPart, name, url, icon: icon || '🔗' });
    }
  });

  Store.setQuickLinks(links);
  showToast('Quick links saved!', 'success');
}

// ── Appearance Settings ──
function renderAppearanceSettings() {
  // Theme toggle
  const checkbox = document.getElementById('themeCheckbox');
  if (checkbox) {
    checkbox.checked = Store.getTheme() === 'dark';
    checkbox.addEventListener('change', () => {
      const theme = checkbox.checked ? 'dark' : 'light';
      Store.setTheme(theme);
      document.documentElement.setAttribute('data-theme', theme);
      document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
      showToast(`${theme === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'info');
    });
  }

  // Accent swatches
  const swatchContainer = document.getElementById('accentSwatches');
  const currentAccent = Store.getAccentColor();
  if (swatchContainer) {
    swatchContainer.innerHTML = ACCENT_PRESETS.map(color => `
      <div class="accent-swatch ${color === currentAccent ? 'selected' : ''}"
        style="background:${color}"
        onclick="setAccent('${color}')"
        title="${color}">
      </div>`).join('');
  }

  // Custom accent
  const customInput = document.getElementById('customAccentInput');
  if (customInput) customInput.value = currentAccent;

  document.getElementById('applyCustomAccent')?.addEventListener('click', () => {
    const color = customInput.value;
    setAccent(color);
  });
}

function setAccent(color) {
  Store.setAccentColor(color);
  applyAccentColor(color);
  document.getElementById('customAccentInput').value = color;
  document.querySelectorAll('.accent-swatch').forEach(s => {
    s.classList.toggle('selected', s.style.background === color ||
      s.style.backgroundColor === color ||
      s.getAttribute('onclick')?.includes(color));
  });
  showToast('Accent color applied!', 'success');
}

// ── Data Management ──
function bindDataSettings() {
  document.getElementById('exportDataBtn')?.addEventListener('click', () => {
    const json = Store.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arambh-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported!', 'success');
  });

  document.getElementById('importDataBtn')?.addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });

  document.getElementById('importFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const success = Store.importJSON(ev.target.result);
      if (success) {
        showToast('Data imported successfully! Reloading...', 'success');
        setTimeout(() => location.reload(), 1500);
      } else {
        showToast('Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('clearAllBtn')?.addEventListener('click', () => {
    confirmDialog('⚠️ This will PERMANENTLY delete ALL your data including study sessions, expenses, reminders, and projects. Are you absolutely sure?', () => {
      Store.clearAll();
      showToast('All data cleared. Reloading...', 'info');
      setTimeout(() => location.reload(), 1500);
    });
  });
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
