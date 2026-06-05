// ================================
// ARAMBH — Reminders Logic
// ================================

let currentView = 'upcoming';
let selectedPriority = 'medium';
let editingTaskId = null;

document.addEventListener('DOMContentLoaded', () => {
  initComponents('Reminders');

  // Default due date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dd = document.getElementById('taskDueDate');
  if (dd) dd.value = tomorrow.toISOString().split('T')[0];

  bindRemindersEvents();
  renderTasks();
  renderTaskStats();
});

// ── Bind Events ──
function bindRemindersEvents() {
  document.getElementById('addTaskBtn')?.addEventListener('click', addTask);

  // Priority selector
  document.getElementById('prioritySelector')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-priority]');
    if (!btn) return;
    selectedPriority = btn.dataset.priority;
    updatePriorityButtons();
  });

  // View tabs
  document.getElementById('viewTabs')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (!btn) return;
    currentView = btn.dataset.view;
    document.querySelectorAll('#viewTabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTasks();
  });
}

function updatePriorityButtons() {
  const colors = { low: 'var(--green)', medium: 'var(--yellow)', high: 'var(--red)' };
  ['low', 'medium', 'high'].forEach(p => {
    const btn = document.getElementById(`pri-${p}`);
    if (!btn) return;
    if (p === selectedPriority) {
      btn.style.borderColor = colors[p];
      btn.style.color = colors[p];
      btn.style.background = `${colors[p]}20`;
    } else {
      btn.style.borderColor = '';
      btn.style.color = '';
      btn.style.background = '';
    }
  });
}

// ── Add Task ──
function addTask() {
  const title = document.getElementById('taskTitle').value.trim();
  const dueDate = document.getElementById('taskDueDate').value;
  const description = document.getElementById('taskDesc').value.trim();

  if (!title) { showToast('Task title is required', 'error'); return; }
  if (!dueDate) { showToast('Due date is required', 'error'); return; }

  Store.addTask({ title, dueDate, priority: selectedPriority, description });

  document.getElementById('taskTitle').value = '';
  document.getElementById('taskDesc').value = '';

  showToast('Task added! 📋', 'success');
  renderTasks();
  renderTaskStats();
  // Re-render sidebar badge
  document.getElementById('sidebar-container').innerHTML = renderSidebar();
}

// ── Render Tasks ──
function renderTasks() {
  const container = document.getElementById('tasksContainer');
  if (!container) return;

  const allTasks = Store.getTasks();
  const pendingTasks = allTasks.filter(t => !t.completed);
  const completedTasks = allTasks.filter(t => t.completed);

  const countEl = document.getElementById('taskCount');

  if (currentView === 'upcoming') {
    const sorted = pendingTasks
      .filter(t => t.dueDate)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const noDate = pendingTasks.filter(t => !t.dueDate);
    if (countEl) countEl.textContent = `${pendingTasks.length} pending`;

    if (sorted.length + noDate.length === 0) {
      container.innerHTML = emptyState('🎉', 'All done!', 'No pending tasks');
      return;
    }
    container.innerHTML = `
      <div class="tasks-grid">
        ${[...sorted, ...noDate].map(t => taskCardHTML(t)).join('')}
      </div>`;

  } else if (currentView === 'priority') {
    if (countEl) countEl.textContent = `${pendingTasks.length} pending`;
    if (pendingTasks.length === 0) {
      container.innerHTML = emptyState('🎉', 'All done!', 'No pending tasks');
      return;
    }

    const groups = [
      { label: '🔴 High Priority', key: 'high', color: 'var(--red)' },
      { label: '🟡 Medium Priority', key: 'medium', color: 'var(--yellow)' },
      { label: '🟢 Low Priority', key: 'low', color: 'var(--green)' },
    ];

    container.innerHTML = groups.map(g => {
      const tasks = pendingTasks.filter(t => t.priority === g.key)
        .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
      if (tasks.length === 0) return '';
      return `
        <div style="margin-bottom:20px">
          <div class="priority-group-header">
            <div style="width:8px;height:8px;border-radius:50%;background:${g.color}"></div>
            ${g.label} (${tasks.length})
          </div>
          <div class="tasks-grid">${tasks.map(t => taskCardHTML(t)).join('')}</div>
        </div>`;
    }).join('');

  } else if (currentView === 'completed') {
    if (countEl) countEl.textContent = `${completedTasks.length} completed`;
    if (completedTasks.length === 0) {
      container.innerHTML = emptyState('📋', 'Nothing completed yet', 'Mark tasks as done to see them here');
      return;
    }
    container.innerHTML = `<div class="tasks-grid">${completedTasks.map(t => taskCardHTML(t)).join('')}</div>`;
  }
}

function taskCardHTML(task) {
  const diff = task.dueDate ? getDaysDiff(task.dueDate) : null;
  const overdue = diff !== null && diff < 0;
  const dueLabel = diff === null ? 'No due date'
    : diff < 0 ? `${Math.abs(diff)}d overdue`
    : diff === 0 ? 'Due today'
    : `${diff}d left`;

  return `
    <div class="task-card priority-${task.priority || 'medium'} ${task.completed ? 'completed' : ''}">
      <div class="task-header">
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask('${task.id}')">
          ${task.completed ? '✓' : ''}
        </div>
        <div class="task-title">${escHtml(task.title)}</div>
      </div>
      ${task.description ? `<div class="task-desc">${escHtml(task.description)}</div>` : ''}
      <div class="task-meta">
        <span class="badge ${overdue ? 'badge-red' : diff === 0 ? 'badge-yellow' : 'badge-muted'}">📅 ${dueLabel}</span>
        <span class="badge badge-muted">${task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)} Priority</span>
      </div>
      <div class="task-actions">
        <button class="btn btn-icon btn-secondary btn-sm" onclick="editTask('${task.id}')" title="Edit">✏️</button>
        <button class="btn btn-icon btn-danger btn-sm" onclick="deleteTask('${task.id}')" title="Delete">🗑️</button>
      </div>
    </div>`;
}

function emptyState(icon, text, sub) {
  return `<div class="empty-state"><div class="empty-state-icon">${icon}</div><div class="empty-state-text">${text}</div><div class="empty-state-sub">${sub}</div></div>`;
}

// ── Task Actions ──
function toggleTask(id) {
  const task = Store.getTasks().find(t => t.id === id);
  if (!task) return;
  Store.updateTask(id, { completed: !task.completed });
  renderTasks();
  renderTaskStats();
  document.getElementById('sidebar-container').innerHTML = renderSidebar();
  showToast(task.completed ? 'Task reopened' : 'Task completed! 🎉', 'success');
}

function deleteTask(id) {
  confirmDialog('Delete this task?', () => {
    Store.deleteTask(id);
    renderTasks();
    renderTaskStats();
    document.getElementById('sidebar-container').innerHTML = renderSidebar();
    showToast('Task deleted', 'info');
  });
}

function editTask(id) {
  const task = Store.getTasks().find(t => t.id === id);
  if (!task) return;

  const modal = createModal({
    id: 'editTaskModal',
    title: '✏️ Edit Task',
    content: `
      <div class="modal-form">
        <div class="form-group">
          <label class="form-label">Title</label>
          <input type="text" class="form-input" id="editTaskTitle" value="${escHtml(task.title)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input type="date" class="form-input" id="editTaskDate" value="${task.dueDate || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-input" id="editTaskPriority">
            <option value="low" ${task.priority === 'low' ? 'selected' : ''}>🟢 Low</option>
            <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>🟡 Medium</option>
            <option value="high" ${task.priority === 'high' ? 'selected' : ''}>🔴 High</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="editTaskDesc" rows="3">${escHtml(task.description || '')}</textarea>
        </div>
      </div>`,
    onSave: () => {
      const title = document.getElementById('editTaskTitle').value.trim();
      const dueDate = document.getElementById('editTaskDate').value;
      const priority = document.getElementById('editTaskPriority').value;
      const description = document.getElementById('editTaskDesc').value.trim();
      if (!title) { showToast('Title required', 'error'); return; }
      Store.updateTask(id, { title, dueDate, priority, description });
      closeModal('editTaskModal');
      renderTasks();
      renderTaskStats();
      showToast('Task updated!', 'success');
    }
  });
  openModal('editTaskModal');
}

// ── Task Stats ──
function renderTaskStats() {
  const container = document.getElementById('taskStats');
  if (!container) return;
  const all = Store.getTasks();
  const pending = all.filter(t => !t.completed);
  const high = pending.filter(t => t.priority === 'high').length;
  const overdue = pending.filter(t => t.dueDate && getDaysDiff(t.dueDate) < 0).length;
  const done = all.filter(t => t.completed).length;

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px">
      <div class="flex justify-between items-center">
        <span style="font-size:13px;color:var(--text-secondary)">Pending Tasks</span>
        <span style="font-weight:700;color:var(--accent)">${pending.length}</span>
      </div>
      <div class="flex justify-between items-center">
        <span style="font-size:13px;color:var(--text-secondary)">High Priority</span>
        <span style="font-weight:700;color:var(--red)">${high}</span>
      </div>
      <div class="flex justify-between items-center">
        <span style="font-size:13px;color:var(--text-secondary)">Overdue</span>
        <span style="font-weight:700;color:var(--red)">${overdue}</span>
      </div>
      <div class="flex justify-between items-center">
        <span style="font-size:13px;color:var(--text-secondary)">Completed</span>
        <span style="font-weight:700;color:var(--green)">${done}</span>
      </div>
      <div style="margin-top:8px">
        <div class="flex justify-between" style="margin-bottom:4px;font-size:12px;color:var(--text-muted)">
          <span>Completion rate</span>
          <span>${all.length > 0 ? Math.round((done / all.length) * 100) : 0}%</span>
        </div>
        <div style="height:6px;background:var(--bg-input);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${all.length > 0 ? Math.round((done / all.length) * 100) : 0}%;background:var(--green);border-radius:3px;transition:width 1s ease"></div>
        </div>
      </div>
    </div>`;
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
