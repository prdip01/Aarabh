// ================================
// ARAMBH — Study Goal Logic
// ================================

let activeSubjectFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initComponents('Study Goal');
  setDefaultDate();
  renderSubjects();
  renderSubjectDropdown();
  renderSessionsList();
  renderHeatmap();
  renderSubjectBarChart();
  renderWeeklyChart();
  bindStudyEvents();
});

function setDefaultDate() {
  const el = document.getElementById('logDate');
  if (el) el.value = todayStr();
}

// ── Subjects ──
function renderSubjects() {
  const container = document.getElementById('subjectsList');
  if (!container) return;
  const subjects = Store.getSubjects();

  if (subjects.length === 0) {
    container.innerHTML = `<div class="text-muted text-sm">No subjects. Add one above.</div>`;
    return;
  }

  container.innerHTML = subjects.map((s, i) => `
    <div class="flex items-center gap-3" style="padding:8px 0;border-bottom:1px solid var(--border-subtle);">
      <div style="width:12px;height:12px;border-radius:50%;background:${s.color};flex-shrink:0"></div>
      <span style="flex:1;font-size:14px;font-weight:500">${escHtml(s.name)}</span>
      <input type="color" value="${s.color}" title="Change color"
        style="width:24px;height:24px;border:none;background:none;cursor:pointer;padding:0;border-radius:50%"
        onchange="updateSubjectColor('${s.id}', this.value)" />
      <button class="btn btn-icon btn-danger btn-sm" onclick="deleteSubject('${s.id}')" title="Delete">✕</button>
    </div>`).join('');
}

function renderSubjectDropdown() {
  const sel = document.getElementById('logSubject');
  if (!sel) return;
  const subjects = Store.getSubjects();
  sel.innerHTML = subjects.length === 0
    ? `<option value="">— No subjects —</option>`
    : subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

function updateSubjectColor(id, color) {
  const subs = Store.getSubjects();
  const updated = subs.map(s => s.id === id ? { ...s, color } : s);
  Store.setSubjects(updated);
  renderSubjects();
  renderSubjectDropdown();
  renderSubjectBarChart();
  renderHeatmap();
  renderSessionsList();
}

function deleteSubject(id) {
  confirmDialog('Delete this subject? Sessions logged under it will remain.', () => {
    const subs = Store.getSubjects().filter(s => s.id !== id);
    Store.setSubjects(subs);
    renderSubjects();
    renderSubjectDropdown();
    showToast('Subject deleted', 'success');
  });
}

function addSubject() {
  const subs = Store.getSubjects();
  if (subs.length >= 6) { showToast('Maximum 6 subjects allowed', 'error'); return; }
  const name = prompt('Subject name:');
  if (!name || !name.trim()) return;
  const colors = ['#7C6FFF','#22c55e','#f59e0b','#ef4444','#3b82f6','#ec4899'];
  const color = colors[subs.length % colors.length];
  subs.push({ id: Store.genId(), name: name.trim(), color });
  Store.setSubjects(subs);
  renderSubjects();
  renderSubjectDropdown();
  showToast('Subject added!', 'success');
}

// ── Log Session ──
function saveSession() {
  const date = document.getElementById('logDate').value;
  const subjectId = document.getElementById('logSubject').value;
  const hours = parseFloat(document.getElementById('logHours').value);
  const topics = document.getElementById('logTopics').value.trim();
  const notes = document.getElementById('logNotes').value.trim();

  if (!date) { showToast('Please select a date', 'error'); return; }
  if (!subjectId) { showToast('Please select a subject', 'error'); return; }
  if (!hours || hours <= 0) { showToast('Please enter valid hours', 'error'); return; }

  Store.addStudySession({ date, subjectId, hours, topics, notes });

  document.getElementById('logHours').value = '';
  document.getElementById('logTopics').value = '';
  document.getElementById('logNotes').value = '';

  showToast('Session logged! 🎓', 'success');
  renderSessionsList();
  renderHeatmap();
  renderSubjectBarChart();
  renderWeeklyChart();
}

// ── Session History ──
function renderSessionsList() {
  const container = document.getElementById('sessionsList');
  if (!container) return;
  const sessions = Store.getStudySessions().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  const subjects = Store.getSubjects();

  if (sessions.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">No sessions logged yet</div></div>`;
    return;
  }

  container.innerHTML = sessions.map(s => {
    const subj = subjects.find(x => x.id === s.subjectId);
    const name = subj ? subj.name : 'Unknown';
    const color = subj ? subj.color : '#7C6FFF';
    return `
      <div class="session-item">
        <span class="session-subject-badge" style="background:${color}">${name}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600">${formatDate(s.date)} &nbsp;·&nbsp; ${s.hours}h</div>
          ${s.topics ? `<div style="font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(s.topics)}</div>` : ''}
        </div>
        <button class="btn btn-icon btn-danger btn-sm" onclick="deleteSession('${s.id}')">✕</button>
      </div>`;
  }).join('');
}

function deleteSession(id) {
  confirmDialog('Delete this study session?', () => {
    Store.deleteStudySession(id);
    renderSessionsList();
    renderHeatmap();
    renderSubjectBarChart();
    renderWeeklyChart();
    showToast('Session deleted', 'info');
  });
}

// ── 30-Day Heatmap ──
function renderHeatmap() {
  const container = document.getElementById('heatmapGrid');
  const filtersEl = document.getElementById('heatmapFilters');
  if (!container) return;

  const subjects = Store.getSubjects();
  const sessions = Store.getStudySessions();

  // Filters
  if (filtersEl) {
    filtersEl.innerHTML = `
      <button class="tab-btn ${activeSubjectFilter === 'all' ? 'active' : ''}" onclick="setHeatFilter('all')">All</button>
      ${subjects.map(s => `
        <button class="tab-btn ${activeSubjectFilter === s.id ? 'active' : ''}" onclick="setHeatFilter('${s.id}')" style="border-left:3px solid ${s.color};padding-left:8px">${s.name}</button>
      `).join('')}`;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let html = '';

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const filtered = activeSubjectFilter === 'all'
      ? sessions.filter(s => s.date === dateStr)
      : sessions.filter(s => s.date === dateStr && s.subjectId === activeSubjectFilter);
    const hrs = filtered.reduce((sum, s) => sum + (parseFloat(s.hours) || 0), 0);
    const isPast = d < today;

    let cls = 'heat-cell';
    let style = '';
    let title = `${formatDate(dateStr)}: ${hrs > 0 ? hrs + 'h' : 'No study'}`;

    if (hrs > 0) {
      const subj = subjects.find(s => s.id === (filtered[0]?.subjectId));
      const color = activeSubjectFilter !== 'all' && subj ? subj.color : '#7C6FFF';
      const opacity = Math.min(1, 0.3 + (hrs / 8) * 0.7);
      style = `background:${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')};color:white;`;
      cls += ' studied';
    } else if (isPast) {
      cls += ' missed';
    }

    html += `<div class="${cls}" style="${style}" title="${title}">${d.getDate()}</div>`;
  }

  container.innerHTML = html;
}

function setHeatFilter(id) {
  activeSubjectFilter = id;
  renderHeatmap();
}

// ── Subject Bar Chart ──
function renderSubjectBarChart() {
  const container = document.getElementById('subjectBarChart');
  if (!container) return;
  const subjects = Store.getSubjects();
  const sessions = Store.getStudySessions();

  if (subjects.length === 0) {
    container.innerHTML = `<div class="text-muted text-sm">No subjects configured</div>`;
    return;
  }

  const totals = subjects.map(s => ({
    ...s,
    hours: sessions.filter(x => x.subjectId === s.id).reduce((sum, x) => sum + (parseFloat(x.hours) || 0), 0)
  })).sort((a, b) => b.hours - a.hours);

  const max = totals[0]?.hours || 1;
  container.innerHTML = totals.map(s => `
    <div class="chart-bar-row">
      <div class="chart-bar-label">${escHtml(s.name)}</div>
      <div class="chart-bar-bg">
        <div class="chart-bar-fill" style="width:${(s.hours / max) * 100}%;background:${s.color}"></div>
      </div>
      <div class="chart-bar-val">${s.hours.toFixed(1)}h</div>
    </div>`).join('');
}

// ── Weekly Chart (Canvas) ──
function renderWeeklyChart() {
  const canvas = document.getElementById('weeklyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const sessions = Store.getStudySessions();

  const labels = [];
  const data = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    labels.push(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]);
    const hrs = sessions.filter(s => s.date === dateStr).reduce((sum, s) => sum + (parseFloat(s.hours) || 0), 0);
    data.push(hrs);
  }

  const W = canvas.parentElement.clientWidth || 280;
  const H = 140;
  canvas.width = W;
  canvas.height = H;

  const isDark = Store.getTheme() === 'dark';
  const textColor = isDark ? '#9196b5' : '#4a4f7a';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const accentColor = Store.getAccentColor();

  const maxVal = Math.max(...data, 4);
  const padL = 28, padR = 10, padT = 10, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barW = chartW / labels.length;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  for (let g = 0; g <= 4; g++) {
    const y = padT + (chartH * g) / 4;
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
  }

  // Draw bars + line
  const points = [];
  data.forEach((val, i) => {
    const x = padL + i * barW + barW / 2;
    const barH = (val / maxVal) * chartH;
    const y = padT + chartH - barH;

    // Bar
    ctx.fillStyle = accentColor + '30';
    ctx.beginPath();
    ctx.roundRect(padL + i * barW + barW * 0.2, y, barW * 0.6, barH, 3);
    ctx.fill();

    points.push({ x, y: padT + chartH - (val / maxVal) * chartH });

    // Label
    ctx.fillStyle = textColor;
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x, H - 8);

    if (val > 0) {
      ctx.fillStyle = textColor;
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText(val.toFixed(1), x, y - 3);
    }
  });

  // Line
  if (points.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Dots
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();
    });
  }
}

// ── PDF Export ──
function exportPDF() {
  const sessions = Store.getStudySessions().sort((a, b) => b.date.localeCompare(a.date));
  const subjects = Store.getSubjects();

  const win = window.open('', '_blank');
  const rows = sessions.slice(0, 30).map(s => {
    const subj = subjects.find(x => x.id === s.subjectId);
    return `<tr>
      <td>${formatDate(s.date)}</td>
      <td><span style="display:inline-block;padding:2px 8px;border-radius:99px;background:${subj?.color || '#888'};color:white;font-size:11px">${subj?.name || 'Unknown'}</span></td>
      <td>${s.hours}h</td>
      <td>${escHtml(s.topics || '—')}</td>
      <td>${escHtml(s.notes || '—')}</td>
    </tr>`;
  }).join('');

  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>Arambh — Study Report</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:32px;color:#111}
      h1{font-size:24px;margin-bottom:4px}p{color:#666;margin-bottom:24px}
      table{width:100%;border-collapse:collapse}
      th{background:#f5f5f5;padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px}
      td{padding:10px 12px;border-top:1px solid #eee;font-size:13px}
    </style></head><body>
    <h1>📚 Study Report — Arambh</h1>
    <p>Generated on ${new Date().toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</p>
    <table><thead><tr><th>Date</th><th>Subject</th><th>Hours</th><th>Topics</th><th>Notes</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <script>window.print();window.close();<\/script>
    </body></html>`);
}

function bindStudyEvents() {
  document.getElementById('saveSessionBtn')?.addEventListener('click', saveSession);
  document.getElementById('addSubjectBtn')?.addEventListener('click', addSubject);
  document.getElementById('exportPdfBtn')?.addEventListener('click', exportPDF);
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
