// ================================
// ARAMBH — Unified Data Store
// Single localStorage namespace
// ================================

const STORE_KEY = 'arambh_v1';

const DEFAULT_STORE = {
  settings: {
    theme: 'dark',
    accentColor: '#7C6FFF',
    subjects: [
      { id: 's1', name: 'Mathematics', color: '#7C6FFF' },
      { id: 's2', name: 'English', color: '#22c55e' },
      { id: 's3', name: 'Science', color: '#f59e0b' },
      { id: 's4', name: 'History', color: '#ef4444' },
    ],
    budget: 10000,
    quickLinks: [
      { id: 'ql1', name: 'SSC ChatGPT', url: 'https://chatgpt.com', icon: '🤖' },
      { id: 'ql2', name: 'Kimi AI', url: 'https://kimi.moonshot.cn', icon: '🌙' },
      { id: 'ql3', name: 'MS Word Online', url: 'https://www.office.com/launch/word', icon: '📄' },
      { id: 'ql4', name: 'Hugging Face', url: 'https://huggingface.co', icon: '🤗' },
    ]
  },
  study: {
    sessions: [] // { id, date (YYYY-MM-DD), subjectId, hours, topics, notes }
  },
  money: {
    budget: 10000,
    expenses: [] // { id, amount, date, category, note }
  },
  reminders: {
    tasks: [] // { id, title, dueDate, priority, description, completed, createdAt }
  },
  projects: {
    list: [] // { id, name, status, progress, deployLink, githubLink, description, createdAt }
  }
};

const Store = {
  _data: null,

  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // Deep merge with defaults
        this._data = this._deepMerge(JSON.parse(JSON.stringify(DEFAULT_STORE)), saved);
      } else {
        this._data = JSON.parse(JSON.stringify(DEFAULT_STORE));
      }
    } catch {
      this._data = JSON.parse(JSON.stringify(DEFAULT_STORE));
    }
    return this;
  },

  save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(this._data));
    return this;
  },

  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this._data);
  },

  set(path, value) {
    const parts = path.split('.');
    let obj = this._data;
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
    this.save();
    return this;
  },

  _deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (Array.isArray(source[key])) {
        target[key] = source[key];
      } else if (typeof source[key] === 'object' && source[key] !== null) {
        if (!target[key]) target[key] = {};
        this._deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  },

  // ── Helpers ──

  genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  // Study
  addStudySession(session) {
    const s = this.get('study.sessions') || [];
    s.push({ id: this.genId(), ...session });
    this.set('study.sessions', s);
  },

  getStudySessions() { return this.get('study.sessions') || []; },

  deleteStudySession(id) {
    const s = this.getStudySessions().filter(x => x.id !== id);
    this.set('study.sessions', s);
  },

  updateStudySession(id, updates) {
    const s = this.getStudySessions().map(x => x.id === id ? { ...x, ...updates } : x);
    this.set('study.sessions', s);
  },

  // Money
  addExpense(expense) {
    const e = this.get('money.expenses') || [];
    e.push({ id: this.genId(), ...expense });
    this.set('money.expenses', e);
  },

  getExpenses() { return this.get('money.expenses') || []; },

  deleteExpense(id) {
    this.set('money.expenses', this.getExpenses().filter(x => x.id !== id));
  },

  updateExpense(id, updates) {
    const e = this.getExpenses().map(x => x.id === id ? { ...x, ...updates } : x);
    this.set('money.expenses', e);
  },

  getMonthlyExpenses(year, month) {
    return this.getExpenses().filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  },

  // Reminders
  addTask(task) {
    const t = this.get('reminders.tasks') || [];
    t.push({ id: this.genId(), completed: false, createdAt: new Date().toISOString(), ...task });
    this.set('reminders.tasks', t);
  },

  getTasks() { return this.get('reminders.tasks') || []; },

  deleteTask(id) {
    this.set('reminders.tasks', this.getTasks().filter(x => x.id !== id));
  },

  updateTask(id, updates) {
    const t = this.getTasks().map(x => x.id === id ? { ...x, ...updates } : x);
    this.set('reminders.tasks', t);
  },

  getPendingTasks() { return this.getTasks().filter(t => !t.completed); },

  getReminderDates() {
    return [...new Set(this.getPendingTasks().map(t => t.dueDate).filter(Boolean))];
  },

  // Projects
  addProject(project) {
    const p = this.get('projects.list') || [];
    p.push({ id: this.genId(), status: 'Not Started', progress: 0, createdAt: new Date().toISOString(), ...project });
    this.set('projects.list', p);
  },

  getProjects() { return this.get('projects.list') || []; },

  deleteProject(id) {
    this.set('projects.list', this.getProjects().filter(x => x.id !== id));
  },

  updateProject(id, updates) {
    const p = this.getProjects().map(x => x.id === id ? { ...x, ...updates } : x);
    this.set('projects.list', p);
  },

  duplicateProject(id) {
    const proj = this.getProjects().find(x => x.id === id);
    if (!proj) return;
    const copy = { ...proj, id: this.genId(), name: proj.name + ' (Copy)', createdAt: new Date().toISOString() };
    const p = this.getProjects();
    p.push(copy);
    this.set('projects.list', p);
  },

  // Subjects
  getSubjects() { return this.get('settings.subjects') || []; },
  setSubjects(subjects) { this.set('settings.subjects', subjects); },

  // Quick Links
  getQuickLinks() { return this.get('settings.quickLinks') || []; },
  setQuickLinks(links) { this.set('settings.quickLinks', links); },

  // Settings
  getTheme() { return this.get('settings.theme') || 'dark'; },
  setTheme(t) { this.set('settings.theme', t); },

  getAccentColor() { return this.get('settings.accentColor') || '#7C6FFF'; },
  setAccentColor(c) { this.set('settings.accentColor', c); },

  getBudget() { return this.get('settings.budget') || 10000; },
  setBudget(b) { this.set('settings.budget', b); this.set('money.budget', b); },

  // Export / Import
  exportJSON() {
    return JSON.stringify(this._data, null, 2);
  },

  importJSON(json) {
    try {
      const parsed = JSON.parse(json);
      this._data = this._deepMerge(JSON.parse(JSON.stringify(DEFAULT_STORE)), parsed);
      this.save();
      return true;
    } catch {
      return false;
    }
  },

  clearAll() {
    this._data = JSON.parse(JSON.stringify(DEFAULT_STORE));
    this.save();
  }
};

// Initialize on load
Store.load();

// Apply theme immediately
(function applyTheme() {
  const theme = Store.getTheme();
  document.documentElement.setAttribute('data-theme', theme);
  const accent = Store.getAccentColor();
  applyAccentColor(accent);
})();

function applyAccentColor(color) {
  // Convert hex to rgb for CSS vars
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.25)`);
  // Darken by 20%
  const darken = (v) => Math.max(0, Math.floor(v * 0.8)).toString(16).padStart(2, '0');
  document.documentElement.style.setProperty('--accent-dark', `#${darken(r)}${darken(g)}${darken(b)}`);
  // Lighten by 20%
  const lighten = (v) => Math.min(255, Math.floor(v + (255 - v) * 0.3)).toString(16).padStart(2, '0');
  document.documentElement.style.setProperty('--accent-light', `#${lighten(r)}${lighten(g)}${lighten(b)}`);
}
