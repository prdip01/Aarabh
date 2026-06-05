// ================================
// ARAMBH — Money Goal Logic
// ================================

const CAT_ICONS = {
  'Online Payment': '💳',
  'Education': '📚',
  'Shopping': '🛍️',
  'Travel': '✈️',
  'Food': '🍽️',
  'Others': '📦'
};

const CAT_COLORS = {
  'Online Payment': '#7C6FFF',
  'Education': '#22c55e',
  'Shopping': '#f59e0b',
  'Travel': '#3b82f6',
  'Food': '#ef4444',
  'Others': '#9196b5'
};

let selectedMonth, selectedYear;

document.addEventListener('DOMContentLoaded', () => {
  initComponents('Money Goal');

  const now = new Date();
  selectedYear = now.getFullYear();
  selectedMonth = now.getMonth();

  // Set defaults
  const monthInput = document.getElementById('monthFilter');
  if (monthInput) {
    monthInput.value = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    monthInput.addEventListener('change', () => {
      const [y, m] = monthInput.value.split('-');
      selectedYear = parseInt(y);
      selectedMonth = parseInt(m) - 1;
      renderAll();
    });
  }

  const expDate = document.getElementById('expDate');
  if (expDate) expDate.value = todayStr();

  const budgetInput = document.getElementById('budgetInput');
  if (budgetInput) budgetInput.value = Store.get('money.budget') || Store.getBudget();

  document.getElementById('setBudgetBtn')?.addEventListener('click', setBudget);
  document.getElementById('addExpenseBtn')?.addEventListener('click', addExpense);

  renderAll();
});

function renderAll() {
  renderBudgetRing();
  renderSummaryCards();
  renderCategoryChart();
  renderTransactionsTable();
}

// ── Budget Ring ──
function renderBudgetRing() {
  const container = document.getElementById('mainRingContainer');
  if (!container) return;

  const budget = Store.get('money.budget') || Store.getBudget();
  const expenses = Store.getMonthlyExpenses(selectedYear, selectedMonth);
  const spent = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const remaining = budget - spent;
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const color = pct < 50 ? '#22c55e' : pct < 80 ? '#f59e0b' : '#ef4444';

  container.innerHTML = `
    ${createRing({ size: 160, strokeWidth: 16, progress: pct, color })}
    <div class="donut-center">
      <div class="donut-amount" style="color:${color}">${pct}%</div>
      <div class="donut-label">${formatCurrency(spent)} spent</div>
      <div class="donut-label">of ${formatCurrency(budget)}</div>
    </div>`;

  document.getElementById('statSpent').textContent = formatCurrency(spent);
  const remEl = document.getElementById('statRemaining');
  remEl.textContent = formatCurrency(Math.abs(remaining));
  remEl.className = `summary-stat-val ${remaining >= 0 ? 'text-green' : 'text-red'}`;
}

// ── Set Budget ──
function setBudget() {
  const val = parseFloat(document.getElementById('budgetInput').value);
  if (!val || val <= 0) { showToast('Enter a valid budget', 'error'); return; }
  Store.setBudget(val);
  showToast('Budget updated!', 'success');
  renderAll();
}

// ── Add Expense ──
function addExpense() {
  const amount = parseFloat(document.getElementById('expAmount').value);
  const date = document.getElementById('expDate').value;
  const category = document.getElementById('expCategory').value;
  const note = document.getElementById('expNote').value.trim();

  if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
  if (!date) { showToast('Please select a date', 'error'); return; }

  Store.addExpense({ amount, date, category, note });

  document.getElementById('expAmount').value = '';
  document.getElementById('expNote').value = '';

  showToast('Expense added! 💸', 'success');
  renderAll();
}

// ── Summary Cards ──
function renderSummaryCards() {
  const container = document.getElementById('moneySummaryCards');
  if (!container) return;

  const budget = Store.get('money.budget') || Store.getBudget();
  const expenses = Store.getMonthlyExpenses(selectedYear, selectedMonth);
  const spent = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const remaining = budget - spent;

  // Top category
  const byCat = {};
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + (parseFloat(e.amount) || 0); });
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

  // Daily average
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const daily = expenses.length > 0 ? spent / daysInMonth : 0;

  const cards = [
    { label: 'Total Spent', value: formatCurrency(spent), color: 'var(--red)', icon: '💸' },
    { label: 'Remaining', value: formatCurrency(Math.abs(remaining)), color: remaining >= 0 ? 'var(--green)' : 'var(--red)', icon: remaining >= 0 ? '✅' : '⚠️' },
    { label: 'Top Category', value: topCat ? `${CAT_ICONS[topCat[0]] || ''} ${topCat[0]}` : '—', color: 'var(--accent)', icon: '🏆' },
    { label: 'Daily Average', value: formatCurrency(daily), color: 'var(--yellow)', icon: '📅' }
  ];

  container.innerHTML = cards.map(c => `
    <div class="card" style="text-align:center;padding:16px">
      <div style="font-size:24px;margin-bottom:6px">${c.icon}</div>
      <div style="font-size:17px;font-weight:800;color:${c.color};margin-bottom:4px">${c.value}</div>
      <div style="font-size:11px;color:var(--text-muted)">${c.label}</div>
    </div>`).join('');
}

// ── Category Chart ──
function renderCategoryChart() {
  const container = document.getElementById('categoryChart');
  if (!container) return;

  const expenses = Store.getMonthlyExpenses(selectedYear, selectedMonth);
  const byCat = {};
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + (parseFloat(e.amount) || 0); });

  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((sum, [, v]) => sum + v, 0);

  if (sorted.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:24px 0"><div class="empty-state-icon">📊</div><div class="empty-state-text">No data yet</div></div>`;
    return;
  }

  const max = sorted[0][1];
  container.innerHTML = sorted.map(([cat, amount]) => `
    <div class="cat-bar-row">
      <div class="cat-bar-icon">${CAT_ICONS[cat] || '📦'}</div>
      <div class="cat-bar-label">${cat}</div>
      <div class="cat-bar-bg">
        <div class="cat-bar-fill" style="width:${(amount / max) * 100}%;background:${CAT_COLORS[cat] || '#7C6FFF'}"></div>
      </div>
      <div class="cat-bar-val">${formatCurrency(amount)}</div>
      <div style="font-size:11px;color:var(--text-muted);width:32px;text-align:right">${Math.round((amount/total)*100)}%</div>
    </div>`).join('');
}

// ── Transactions Table ──
let editingExpId = null;

function renderTransactionsTable() {
  const tbody = document.getElementById('expensesTable');
  if (!tbody) return;

  const expenses = Store.getMonthlyExpenses(selectedYear, selectedMonth)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (expenses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px">No expenses this month</td></tr>`;
    return;
  }

  tbody.innerHTML = expenses.map(e => {
    if (editingExpId === e.id) {
      return `
        <tr>
          <td><input type="date" class="form-input" id="edit-date" value="${e.date}" style="padding:4px 8px;font-size:12px"></td>
          <td>
            <select class="form-input" id="edit-cat" style="padding:4px 8px;font-size:12px">
              ${Object.keys(CAT_ICONS).map(c => `<option value="${c}" ${c === e.category ? 'selected' : ''}>${CAT_ICONS[c]} ${c}</option>`).join('')}
            </select>
          </td>
          <td><input type="text" class="form-input" id="edit-note" value="${escHtml(e.note || '')}" style="padding:4px 8px;font-size:12px" /></td>
          <td><input type="number" class="form-input" id="edit-amount" value="${e.amount}" style="padding:4px 8px;font-size:12px;width:80px" /></td>
          <td>
            <div class="flex gap-2">
              <button class="btn btn-primary btn-sm" onclick="saveEditExpense('${e.id}')">✓</button>
              <button class="btn btn-secondary btn-sm" onclick="cancelEditExpense()">✕</button>
            </div>
          </td>
        </tr>`;
    }
    return `
      <tr>
        <td>${formatDate(e.date)}</td>
        <td><span class="badge badge-muted">${CAT_ICONS[e.category] || ''} ${e.category}</span></td>
        <td style="color:var(--text-muted);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(e.note || '—')}</td>
        <td style="font-weight:600;color:var(--red)">${formatCurrency(e.amount)}</td>
        <td>
          <div class="flex gap-2">
            <button class="btn btn-icon btn-secondary btn-sm" onclick="startEditExpense('${e.id}')" title="Edit">✏️</button>
            <button class="btn btn-icon btn-danger btn-sm" onclick="deleteExpenseEntry('${e.id}')" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function startEditExpense(id) {
  editingExpId = id;
  renderTransactionsTable();
}

function cancelEditExpense() {
  editingExpId = null;
  renderTransactionsTable();
}

function saveEditExpense(id) {
  const date = document.getElementById('edit-date').value;
  const category = document.getElementById('edit-cat').value;
  const note = document.getElementById('edit-note').value.trim();
  const amount = parseFloat(document.getElementById('edit-amount').value);
  if (!amount || amount <= 0) { showToast('Invalid amount', 'error'); return; }
  Store.updateExpense(id, { date, category, note, amount });
  editingExpId = null;
  showToast('Updated!', 'success');
  renderAll();
}

function deleteExpenseEntry(id) {
  confirmDialog('Delete this expense?', () => {
    Store.deleteExpense(id);
    showToast('Deleted', 'info');
    renderAll();
  });
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
