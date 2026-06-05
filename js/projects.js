// ================================
// ARAMBH — Projects Logic
// ================================

let activeFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initComponents('Projects');
  renderProjectSummary();
  renderProjects();
  bindProjectEvents();
});

function bindProjectEvents() {
  document.getElementById('addProjectBtn')?.addEventListener('click', () => {
    clearProjectForm();
    document.getElementById('projectModalTitle').textContent = 'New Project';
    document.getElementById('editProjectId').value = '';
    openModal('projectModal');
  });

  document.getElementById('saveProjectBtn')?.addEventListener('click', saveProject);

  document.getElementById('projectFilterTabs')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('#projectFilterTabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProjects();
  });
}

// ── Summary ──
function renderProjectSummary() {
  const container = document.getElementById('projectSummary');
  if (!container) return;
  const projects = Store.getProjects();
  const total = projects.length;
  const done = projects.filter(p => p.status === 'Completed').length;
  const inProg = projects.filter(p => p.status === 'In Progress').length;
  const notStarted = projects.filter(p => p.status === 'Not Started').length;
  const avg = total > 0 ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / total) : 0;

  const cards = [
    { label: 'Total', value: total, icon: '🚀', color: 'var(--accent)' },
    { label: 'In Progress', value: inProg, icon: '🔄', color: 'var(--blue)' },
    { label: 'Completed', value: done, icon: '✅', color: 'var(--green)' },
    { label: 'Avg Progress', value: `${avg}%`, icon: '📊', color: 'var(--yellow)' },
  ];

  container.innerHTML = cards.map(c => `
    <div class="card" style="text-align:center;padding:16px">
      <div style="font-size:24px;margin-bottom:6px">${c.icon}</div>
      <div style="font-size:22px;font-weight:800;color:${c.color}">${c.value}</div>
      <div style="font-size:11px;color:var(--text-muted)">${c.label}</div>
    </div>`).join('');
}

// ── Render Projects ──
function renderProjects() {
  const container = document.getElementById('projectsGrid');
  if (!container) return;
  let projects = Store.getProjects();

  if (activeFilter !== 'all') {
    projects = projects.filter(p => p.status === activeFilter);
  }

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;padding:64px">
        <div class="empty-state-icon">🚀</div>
        <div class="empty-state-text">No projects yet</div>
        <div class="empty-state-sub">Click "New Project" to get started</div>
      </div>`;
    return;
  }

  container.innerHTML = projects.map(p => projectCardHTML(p)).join('');
}

function getStatusConfig(status) {
  const cfg = {
    'Not Started': { cls: 'status-not-started', icon: '⏳', color: 'var(--text-muted)', progressColor: '#9196b5' },
    'In Progress': { cls: 'status-in-progress', icon: '🔄', color: 'var(--blue)', progressColor: '#3b82f6' },
    'Completed': { cls: 'status-completed', icon: '✅', color: 'var(--green)', progressColor: '#22c55e' },
  };
  return cfg[status] || cfg['Not Started'];
}

function projectCardHTML(p) {
  const cfg = getStatusConfig(p.status);
  const progress = p.progress || 0;
  const nextStatus = { 'Not Started': 'In Progress', 'In Progress': 'Completed', 'Completed': 'Not Started' };

  return `
    <div class="project-card" id="proj-${p.id}">
      <div class="project-card-header">
        <div class="project-ring ring-container">
          ${createRing({ size: 56, strokeWidth: 5, progress, color: cfg.progressColor })}
          <div class="ring-text" style="font-size:11px;font-weight:700;color:${cfg.progressColor}">${progress}%</div>
        </div>
        <div style="flex:1;min-width:0">
          <div class="project-name">${escHtml(p.name)}</div>
          ${p.description ? `<div class="project-desc">${escHtml(p.description)}</div>` : ''}
        </div>
      </div>

      <div>
        <span class="badge ${cfg.cls} project-status-cycle" onclick="cycleStatus('${p.id}')" title="Click to change status">
          ${cfg.icon} ${p.status}
        </span>
      </div>

      <div class="project-progress-row">
        <input type="range" class="progress-slider" min="0" max="100" step="5" value="${progress}"
          style="flex:1;accent-color:${cfg.progressColor}"
          oninput="updateProjectProgress('${p.id}', this.value, this)" />
        <span class="progress-label" id="prog-label-${p.id}">${progress}%</span>
      </div>

      ${(p.deployLink || p.githubLink) ? `
        <div class="project-links">
          ${p.deployLink ? `<a href="${escHtml(p.deployLink)}" target="_blank" rel="noopener" class="project-link-btn">🌐 Live</a>` : ''}
          ${p.githubLink ? `<a href="${escHtml(p.githubLink)}" target="_blank" rel="noopener" class="project-link-btn">🐙 GitHub</a>` : ''}
        </div>` : ''}

      <div class="project-actions">
        <button class="btn btn-icon btn-secondary btn-sm" onclick="editProject('${p.id}')" title="Edit">✏️</button>
        <button class="btn btn-icon btn-secondary btn-sm" onclick="duplicateProject('${p.id}')" title="Duplicate">📋</button>
        <button class="btn btn-icon btn-danger btn-sm" onclick="deleteProject('${p.id}')" title="Delete">🗑️</button>
      </div>
    </div>`;
}

// ── Project Actions ──
function cycleStatus(id) {
  const proj = Store.getProjects().find(p => p.id === id);
  if (!proj) return;
  const next = { 'Not Started': 'In Progress', 'In Progress': 'Completed', 'Completed': 'Not Started' };
  Store.updateProject(id, { status: next[proj.status] });
  renderProjects();
  renderProjectSummary();
  showToast(`Status updated to "${next[proj.status]}"`, 'success');
}

function updateProjectProgress(id, value, sliderEl) {
  const labelEl = document.getElementById(`prog-label-${id}`);
  if (labelEl) labelEl.textContent = `${value}%`;
  Store.updateProject(id, { progress: parseInt(value) });
  renderProjectSummary();
}

function editProject(id) {
  const proj = Store.getProjects().find(p => p.id === id);
  if (!proj) return;

  document.getElementById('projectModalTitle').textContent = 'Edit Project';
  document.getElementById('editProjectId').value = id;
  document.getElementById('projName').value = proj.name || '';
  document.getElementById('projDesc').value = proj.description || '';
  document.getElementById('projStatus').value = proj.status || 'Not Started';
  document.getElementById('projProgress').value = proj.progress || 0;
  document.getElementById('progressDisplay').textContent = `${proj.progress || 0}%`;
  document.getElementById('projDeployLink').value = proj.deployLink || '';
  document.getElementById('projGithubLink').value = proj.githubLink || '';

  openModal('projectModal');
}

function duplicateProject(id) {
  Store.duplicateProject(id);
  renderProjects();
  renderProjectSummary();
  showToast('Project duplicated!', 'success');
}

function deleteProject(id) {
  confirmDialog('Delete this project?', () => {
    Store.deleteProject(id);
    renderProjects();
    renderProjectSummary();
    showToast('Project deleted', 'info');
  });
}

function clearProjectForm() {
  document.getElementById('projName').value = '';
  document.getElementById('projDesc').value = '';
  document.getElementById('projStatus').value = 'Not Started';
  document.getElementById('projProgress').value = 0;
  document.getElementById('progressDisplay').textContent = '0%';
  document.getElementById('projDeployLink').value = '';
  document.getElementById('projGithubLink').value = '';
}

function saveProject() {
  const id = document.getElementById('editProjectId').value;
  const name = document.getElementById('projName').value.trim();
  if (!name) { showToast('Project name is required', 'error'); return; }

  const data = {
    name,
    description: document.getElementById('projDesc').value.trim(),
    status: document.getElementById('projStatus').value,
    progress: parseInt(document.getElementById('projProgress').value),
    deployLink: document.getElementById('projDeployLink').value.trim(),
    githubLink: document.getElementById('projGithubLink').value.trim(),
  };

  if (id) {
    Store.updateProject(id, data);
    showToast('Project updated!', 'success');
  } else {
    Store.addProject(data);
    showToast('Project added! 🚀', 'success');
  }

  closeModal('projectModal');
  renderProjects();
  renderProjectSummary();
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
