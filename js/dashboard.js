// ================================
// ARAMBH — Dashboard Home Logic
// ================================

document.addEventListener('DOMContentLoaded', () => {
  initComponents('Dashboard');
  renderSummaryCards();
  renderCalendar();
  renderQuickLinks();
  renderUpcomingTasks();
  renderStudyTodayWidget();
  renderBudgetWidget();
  bindQuickLinkModal();
});

// ── Summary Cards ──
function renderSummaryCards() {
  const container = document.getElementById('summaryCards');
  if (!container) return;

  // Study stats
  const sessions = Store.getStudySessions();
  const today = todayStr();
  const todaySessions = sessions.filter(s => s.date === today);
  const todayHours = todaySessions.reduce((sum, s) => sum + (parseFloat(s.hours) || 0), 0);
  const weekStart = getWeekStart();
  const weekSessions = sessions.filter(s => s.date >= weekStart && s.date <= today);
  const weekHours = weekSessions.reduce((sum, s) => sum + (parseFloat(s.hours) || 0), 0);
  const studyProgress = Math.min(100, Math.round((todayHours / 8) * 100));

  // Money stats
  const now = new Date();
  const budget = Store.get('money.budget') || Store.getBudget();
  const expenses = Store.getMonthlyExpenses(now.getFullYear(), now.getMonth());
  const spent = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const remaining = budget - spent;
  const moneyProgress = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const moneyColor = moneyProgress < 50 ? '#22c55e' : moneyProgress < 80 ? '#f59e0b' : '#ef4444';

  // Reminders stats
  const pendingTasks = Store.getPendingTasks();
  const nextTask = pendingTasks
    .filter(t => t.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  // Projects stats
  const projects = Store.getProjects();
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
    : 0;

  const cards = [
    {
      href: 'study.html',
      label: 'Study Goal',
      value: `${todayHours.toFixed(1)}h`,
      sub: `${weekHours.toFixed(1)}h this week`,
      progress: studyProgress,
      color: '#7C6FFF',
      icon: '📚'
    },
    {
      href: 'money.html',
      label: 'Money Goal',
      value: formatCurrency(spent),
      sub: `of ${formatCurrency(budget)} budget`,
      progress: moneyProgress,
      color: moneyColor,
      icon: '💰'
    },
    {
      href: 'reminders.html',
      label: 'Reminders',
      value: `${pendingTasks.length}`,
      sub: nextTask ? `Next: ${nextTask.title.slice(0, 18)}` : 'No upcoming tasks',
      progress: pendingTasks.length > 0 ? Math.min(100, pendingTasks.length * 10) : 0,
      color: '#ef4444',
      icon: '🔔'
    },
    {
      href: 'projects.html',
      label: 'Projects',
      value: `${avgProgress}%`,
      sub: `${projects.length} project${projects.length !== 1 ? 's' : ''} tracked`,
      progress: avgProgress,
      color: '#3b82f6',
      icon: '🚀'
    }
  ];

  container.innerHTML = cards.map(card => `
    <a href="${card.href}" class="summary-card">
      <div class="ring-container">
        ${createRing({ size: 72, strokeWidth: 7, progress: card.progress, color: card.color })}
        <div class="ring-text">
          <span style="font-size:20px;">${card.icon}</span>
        </div>
      </div>
      <div class="summary-card-info">
        <div class="summary-card-label">${card.label}</div>
        <div class="summary-card-value">${card.value}</div>
        <div class="summary-card-sub">${card.sub}</div>
      </div>
    </a>
  `).join('');
}

// ── Calendar ──
let calYear, calMonth;

function getWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

function renderCalendar() {
  const now = new Date();
  if (calYear === undefined) calYear = now.getFullYear();
  if (calMonth === undefined) calMonth = now.getMonth();

  const reminderDates = new Set(Store.getReminderDates());
  const today = now.toISOString().split('T')[0];

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calMonthTitle').textContent = `${monthNames[calMonth]} ${calYear}`;

  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay = new Date(calYear, calMonth + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = dayNames.map(d => `<div class="cal-day-name">${d}</div>`).join('');

  // Blank cells before
  for (let i = 0; i < startDow; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === today;
    const hasReminder = reminderDates.has(dateStr);
    html += `<div class="cal-day ${isToday ? 'today' : ''} ${hasReminder ? 'has-reminder' : ''}" title="${hasReminder ? 'Has reminder' : ''}">${d}</div>`;
  }

  document.getElementById('calendarGrid').innerHTML = html;

  document.getElementById('calPrev').onclick = () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  };
  document.getElementById('calNext').onclick = () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  };
  document.getElementById('calToday').onclick = () => {
    const n = new Date();
    calYear = n.getFullYear();
    calMonth = n.getMonth();
    renderCalendar();
  };
}

// ── Quick Links ──
function renderQuickLinks() {
  const container = document.getElementById('quickLinksGrid');
  if (!container) return;
  const links = Store.getQuickLinks();

  if (links.length === 0) {
    container.innerHTML = `
      <div style="width:100%;padding:16px 0;text-align:center">
        <div style="font-size:32px;margin-bottom:8px">🔗</div>
        <div style="font-size:13px;color:var(--text-muted)">No quick links yet.</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Click <strong>+ Add Link</strong> to get started.</div>
      </div>`;
    return;
  }

  container.innerHTML = links.map(link => `
    <div class="quick-link-chip" style="position:relative;display:inline-flex;align-items:center;">
      <a href="${escHtml(link.url)}" target="_blank" rel="noopener" class="quick-link-btn" id="ql-${link.id}">
        <span class="quick-link-icon">${link.icon || '🔗'}</span>
        <span>${escHtml(link.name)}</span>
      </a>
      <div class="ql-actions" style="
        position:absolute; top:-8px; right:-8px;
        display:none; gap:3px; z-index:10;">
        <button class="ql-action-btn" onclick="openEditLink('${link.id}')" title="Edit"
          style="width:20px;height:20px;border-radius:50%;background:var(--accent);border:none;color:white;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-sm)">✏️</button>
        <button class="ql-action-btn" onclick="deleteQuickLink('${link.id}')" title="Delete"
          style="width:20px;height:20px;border-radius:50%;background:var(--red);border:none;color:white;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-sm)">✕</button>
      </div>
    </div>
  `).join('');

  // Show/hide action buttons on hover
  document.querySelectorAll('.quick-link-chip').forEach(chip => {
    chip.addEventListener('mouseenter', () => {
      chip.querySelector('.ql-actions').style.display = 'flex';
    });
    chip.addEventListener('mouseleave', () => {
      chip.querySelector('.ql-actions').style.display = 'none';
    });
  });
}

// ── Quick Link Modal ──
function bindQuickLinkModal() {
  // Open modal for new link
  document.getElementById('addQuickLinkDashBtn')?.addEventListener('click', () => {
    document.getElementById('qlModalTitle').textContent = 'Add Quick Link';
    document.getElementById('editLinkId').value = '';
    document.getElementById('qlIcon').value = '';
    document.getElementById('qlName').value = '';
    document.getElementById('qlUrl').value = '';
    openModal('quickLinkModal');
    setTimeout(() => document.getElementById('qlName').focus(), 100);
  });

  // Save
  document.getElementById('saveQuickLinkBtn')?.addEventListener('click', saveQuickLink);

  // Close on backdrop click
  document.getElementById('quickLinkModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'quickLinkModal') closeModal('quickLinkModal');
  });

  // Save on Enter key
  ['qlName', 'qlUrl', 'qlIcon'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveQuickLink();
    });
  });
}

function openEditLink(id) {
  const link = Store.getQuickLinks().find(l => l.id === id);
  if (!link) return;
  document.getElementById('qlModalTitle').textContent = 'Edit Quick Link';
  document.getElementById('editLinkId').value = id;
  document.getElementById('qlIcon').value = link.icon || '';
  document.getElementById('qlName').value = link.name;
  document.getElementById('qlUrl').value = link.url;
  openModal('quickLinkModal');
  setTimeout(() => document.getElementById('qlName').focus(), 100);
}

function saveQuickLink() {
  const editId = document.getElementById('editLinkId').value;
  const icon   = document.getElementById('qlIcon').value.trim() || '🔗';
  const name   = document.getElementById('qlName').value.trim();
  const url    = document.getElementById('qlUrl').value.trim();

  if (!name) { showToast('Link name is required', 'error'); return; }
  if (!url)  { showToast('URL is required', 'error'); return; }

  let finalUrl = url;
  if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;

  const links = Store.getQuickLinks();
  if (editId) {
    // Edit existing
    const updated = links.map(l => l.id === editId ? { ...l, icon, name, url: finalUrl } : l);
    Store.setQuickLinks(updated);
    showToast('Link updated! ✅', 'success');
  } else {
    // Add new
    links.push({ id: Store.genId(), icon, name, url: finalUrl });
    Store.setQuickLinks(links);
    showToast('Quick link added! ⚡', 'success');
  }

  closeModal('quickLinkModal');
  renderQuickLinks();
}

function deleteQuickLink(id) {
  confirmDialog('Remove this quick link?', () => {
    const links = Store.getQuickLinks().filter(l => l.id !== id);
    Store.setQuickLinks(links);
    showToast('Link removed', 'info');
    renderQuickLinks();
  });
}

// ── Upcoming Tasks Widget ──
function renderUpcomingTasks() {
  const container = document.getElementById('upcomingTasksList');
  if (!container) return;
  const tasks = Store.getPendingTasks()
    .filter(t => t.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:24px 0">
        <div class="empty-state-icon">🎉</div>
        <div class="empty-state-text">All clear!</div>
        <div class="empty-state-sub">No upcoming tasks</div>
      </div>`;
    return;
  }

  const today = todayStr();
  container.innerHTML = tasks.map(t => {
    const diff = getDaysDiff(t.dueDate);
    const overdue = diff < 0;
    const dateLabel = overdue ? `${Math.abs(diff)}d overdue` : diff === 0 ? 'Today' : `${diff}d left`;
    return `
      <div class="task-item-mini">
        <div class="task-priority-dot priority-${t.priority || 'medium'}"></div>
        <span class="task-mini-title">${escHtml(t.title)}</span>
        <span class="task-mini-date ${overdue ? 'task-mini-overdue' : ''}">${dateLabel}</span>
      </div>`;
  }).join('');
}

// ── Study Today Widget ──
function renderStudyTodayWidget() {
  const container = document.getElementById('studyTodayWidget');
  if (!container) return;
  const today = todayStr();
  const sessions = Store.getStudySessions().filter(s => s.date === today);
  const subjects = Store.getSubjects();
  const totalHours = sessions.reduce((sum, s) => sum + (parseFloat(s.hours) || 0), 0);

  if (sessions.length === 0) {
    container.innerHTML = `
      <div class="text-muted text-sm" style="padding:8px 0">No study logged today.</div>
      <a href="study.html" class="btn btn-primary btn-sm mt-4" style="display:inline-flex">+ Log Study</a>`;
    return;
  }

  const bySubject = {};
  sessions.forEach(s => {
    bySubject[s.subjectId] = (bySubject[s.subjectId] || 0) + (parseFloat(s.hours) || 0);
  });

  container.innerHTML = `
    <div style="font-size:24px;font-weight:800;color:var(--text-primary);margin-bottom:12px">${totalHours.toFixed(1)}h <span style="font-size:14px;font-weight:400;color:var(--text-muted)">studied today</span></div>
    ${Object.entries(bySubject).map(([id, hrs]) => {
      const subj = subjects.find(s => s.id === id);
      const name = subj ? subj.name : 'Unknown';
      const color = subj ? subj.color : '#7C6FFF';
      const pct = Math.min(100, Math.round((hrs / 8) * 100));
      return `
        <div style="margin-bottom:10px">
          <div class="flex justify-between" style="margin-bottom:4px">
            <span style="font-size:12px;color:var(--text-secondary)">${name}</span>
            <span style="font-size:12px;color:var(--text-muted)">${hrs.toFixed(1)}h</span>
          </div>
          <div style="height:4px;background:var(--border-subtle);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${color};border-radius:2px;transition:width 1s ease"></div>
          </div>
        </div>`;
    }).join('')}`;
}

// ── Budget Widget ──
function renderBudgetWidget() {
  const container = document.getElementById('budgetWidget');
  if (!container) return;
  const now = new Date();
  const budget = Store.get('money.budget') || Store.getBudget();
  const expenses = Store.getMonthlyExpenses(now.getFullYear(), now.getMonth());
  const spent = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const remaining = budget - spent;
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const color = pct < 50 ? '#22c55e' : pct < 80 ? '#f59e0b' : '#ef4444';

  container.innerHTML = `
    <div class="flex items-center gap-4">
      <div class="ring-container">
        ${createRing({ size: 80, strokeWidth: 8, progress: pct, color })}
        <div class="ring-text">
          <span style="font-size:13px;font-weight:700;color:${color}">${pct}%</span>
        </div>
      </div>
      <div>
        <div style="font-size:13px;color:var(--text-muted)">Spent</div>
        <div style="font-size:18px;font-weight:800;color:var(--text-primary)">${formatCurrency(spent)}</div>
        <div style="font-size:12px;color:var(--text-muted)">of ${formatCurrency(budget)}</div>
        <div style="font-size:12px;margin-top:4px" class="${remaining >= 0 ? 'text-green' : 'text-red'}">${remaining >= 0 ? formatCurrency(remaining) + ' left' : formatCurrency(Math.abs(remaining)) + ' over'}</div>
      </div>
    </div>`;
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
