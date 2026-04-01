

// ===== DOM Refs =====
const transactionForm = document.querySelector('#transaction-form');
const amountInput = document.querySelector('#amount');
const categorySelect = document.querySelector('#category');
const btnIncome = document.querySelector('#btn-income');
const btnExpense = document.querySelector('#btn-expense');
const btnSavings = document.querySelector('#btn-savings');
const notesTextarea = document.querySelector('#notes');
const tableBody = document.querySelector('#transaction-table-body');
const balanceEl = document.querySelector('#balance');
const totalIncomeEl = document.querySelector('#total-income');
const totalExpensesEl = document.querySelector('#total-expenses');
const savingsEl = document.querySelector('#savings');
const searchInput = document.querySelector('#search-input');
const lineCanvas = document.querySelector('#line-chart');
const donutCanvas = document.querySelector('#donut-chart');
const donutValueEl = document.querySelector('#donut-value');
const donutLegendEl = document.querySelector('#donut-legend');
const balanceMetaEl = document.querySelector('#balance-meta');
const expenseMetaEl = document.querySelector('#expense-meta');

// ===== State =====
let selectedType = 'income';
let transactions = [];

// ===== Load from localStorage =====
(function loadFromStorage() {
  const stored = localStorage.getItem('et_transactions');
  if (stored) {
    try { transactions = JSON.parse(stored); }
    catch (e) { transactions = []; }
  }
})();

// ===== Save to localStorage =====
function saveToStorage() {
  localStorage.setItem('et_transactions', JSON.stringify(transactions));
}

// ===== Format currency =====
function formatCurrency(value) {
  return '₹' + Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ===== Format date =====
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ===== Escape HTML =====
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ===== Category → icon mapping =====
const categoryIcons = {
  'Salary': 'payments',
  'Freelance': 'work',
  'Investment': 'trending_up',
  'Gift': 'card_giftcard',
  'Other Income': 'attach_money',
  'Food': 'restaurant',
  'Transport': 'directions_car',
  'Housing': 'home',
  'Healthcare': 'local_hospital',
  'Entertainment': 'sports_esports',
  'Shopping': 'shopping_bag',
  'Education': 'school',
  'Utilities': 'bolt',
  'Other Expense': 'category',
  // Savings
  'Emergency Fund': 'shield',
  'Goal Savings': 'flag',
  'Investment Fund': 'trending_up',
  'Retirement Fund': 'elderly',
  'Other Savings': 'savings',
};

// ===== Category → badge class =====
function getBadgeClass(cat) {
  const map = {
    'Salary': 'badge--income',
    'Freelance': 'badge--income',
    'Investment': 'badge--income',
    'Gift': 'badge--income',
    'Other Income': 'badge--income',
    'Food': 'badge--food',
    'Transport': 'badge--travel',
    'Travel': 'badge--travel',
    'Housing': 'badge--housing',
    'Shopping': 'badge--shopping',
    'Utilities': 'badge--utilities',
    'Healthcare': 'badge--health',
    'Entertainment': 'badge--shopping',
    'Education': 'badge--shopping',
    'Emergency Fund': 'badge--savings',
    'Goal Savings': 'badge--savings',
    'Investment Fund': 'badge--savings',
    'Retirement Fund': 'badge--savings',
    'Other Savings': 'badge--savings',
  };
  return map[cat] || 'badge--default';
}

// ===== Update Summary Cards =====
function updateSummary() {
  const totals = transactions.reduce(function (acc, tx) {
    if (tx.type === 'income') acc.income += tx.amount;
    else if (tx.type === 'expense') acc.expenses += tx.amount;
    else if (tx.type === 'savings') acc.savings += tx.amount;
    return acc;
  }, { income: 0, expenses: 0, savings: 0 });

  const balance = totals.income - totals.expenses - totals.savings;

  balanceEl.textContent = formatCurrency(balance);
  totalIncomeEl.textContent = formatCurrency(totals.income);
  totalExpensesEl.textContent = formatCurrency(totals.expenses);
  savingsEl.textContent = formatCurrency(totals.savings);

  // Dynamic meta text
  if (transactions.length === 0) {
    balanceMetaEl.textContent = 'Track your transactions';
    expenseMetaEl.textContent = 'No expenses yet';
  } else {
    const incRatio = totals.income > 0
      ? '+' + ((totals.income / Math.max(1, totals.income + totals.expenses)) * 100).toFixed(1) + '% income ratio'
      : 'Add income';
    balanceMetaEl.textContent = incRatio;
    expenseMetaEl.textContent = totals.expenses > 0 ? formatCurrency(totals.expenses) + ' spent total' : 'No expenses';
  }
}

// ===== Render Transactions Table =====
function renderTransactions(filter) {
  filter = (filter || '').toLowerCase();
  tableBody.innerHTML = '';

  const list = [...transactions].reverse();
  const filtered = filter
    ? list.filter(function (tx) {
      return (tx.notes || '').toLowerCase().includes(filter)
        || (tx.category || '').toLowerCase().includes(filter)
        || tx.type.toLowerCase().includes(filter);
    })
    : list;

  if (filtered.length === 0) {
    const row = document.createElement('tr');
    row.classList.add('empty-row');
    row.innerHTML = '<td colspan="5">' + (filter ? 'No matching transactions' : 'No transactions yet') + '</td>';
    tableBody.appendChild(row);
    return;
  }

  filtered.forEach(function (tx) {
    const row = document.createElement('tr');
    const isIncome = tx.type === 'income';
    const isSavings = tx.type === 'savings';
    const icon = categoryIcons[tx.category] || 'receipt_long';
    const prefix = isIncome ? '+' : (isSavings ? '₪' : '-');
    const amtClass = isIncome ? 'tx-amount--income' : (isSavings ? 'tx-amount--savings' : 'tx-amount--expense');
    const badge = getBadgeClass(tx.category);

    row.innerHTML =
      '<td class="tx-date">' + formatDate(tx.date) + '</td>' +
      '<td>' +
      '<div class="tx-merchant">' +
      '<div class="tx-merchant-icon">' +
      '<span class="material-symbols-outlined">' + icon + '</span>' +
      '</div>' +
      '<span class="tx-merchant-name">' + escapeHTML(tx.notes || tx.category) + '</span>' +
      '</div>' +
      '</td>' +
      '<td>' +
      '<span class="category-badge ' + badge + '">' + escapeHTML(tx.category) + '</span>' +
      '</td>' +
      '<td class="tx-amount ' + amtClass + '">' + (isIncome ? '+' : isSavings ? '+' : '-') + formatCurrency(tx.amount) + '</td>' +
      '<td>' +
      '<button class="delete-btn" data-id="' + tx.id + '" title="Delete">' +
      '<span class="material-symbols-outlined">delete</span>' +
      '</button>' +
      '</td>';

    tableBody.appendChild(row);
  });

  // Delete listeners
  tableBody.querySelectorAll('.delete-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = parseInt(this.dataset.id, 10);
      transactions = transactions.filter(function (t) { return t.id !== id; });
      saveToStorage();
      renderAll();
      showToast('Transaction deleted', 'delete');
    });
  });
}

// ===== Draw Line Chart (Canvas) =====
function drawLineChart() {
  if (!lineCanvas) return;
  const ctx = lineCanvas.getContext('2d');
  const W = lineCanvas.offsetWidth || 800;
  const H = lineCanvas.offsetHeight || 240;
  lineCanvas.width = W * (window.devicePixelRatio || 1);
  lineCanvas.height = H * (window.devicePixelRatio || 1);
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

  ctx.clearRect(0, 0, W, H);

  // Aggregate last 7 months from transactions
  const now = new Date();
  const months = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0 });
  }

  transactions.forEach(function (tx) {
    const d = new Date(tx.date);
    const idx = months.findIndex(function (m) { return m.year === d.getFullYear() && m.month === d.getMonth(); });
    if (idx < 0) return;
    if (tx.type === 'income') months[idx].income += tx.amount;
    else months[idx].expense += tx.amount;
  });

  let maxVal = 0;
  months.forEach(function (m) { maxVal = Math.max(maxVal, m.income, m.expense); });
  if (maxVal === 0) maxVal = 1000;

  const pad = { top: 20, right: 20, bottom: 20, left: 20 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;
  const n = months.length;

  function xPos(i) { return pad.left + (i / (n - 1)) * cW; }
  function yPos(v) { return pad.top + cH - (v / maxVal) * cH; }

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (cH / 4) * i;
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(66,71,84,0.25)';
    ctx.lineWidth = 1;
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + cW, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Helper: build smooth bezier path points
  function catmullRomPath(pts) {
    if (pts.length < 2) return '';
    let d = 'M' + pts[0].x + ',' + pts[0].y;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : pts.length - 1];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C' + cp1x + ',' + cp1y + ' ' + cp2x + ',' + cp2y + ' ' + p2.x + ',' + p2.y;
    }
    return d;
  }

  const incomePoints = months.map(function (m, i) { return { x: xPos(i), y: yPos(m.income) }; });
  const expensePoints = months.map(function (m, i) { return { x: xPos(i), y: yPos(m.expense) }; });

  // Area fills using Path2D
  function drawArea(points, color) {
    const path = new Path2D();
    path.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    path.lineTo(points[points.length - 1].x, pad.top + cH);
    path.lineTo(points[0].x, pad.top + cH);
    path.closePath();

    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH);
    grad.addColorStop(0, color.replace(')', ', 0.25)').replace('rgb', 'rgba'));
    grad.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'));
    ctx.fillStyle = grad;
    ctx.fill(path);
  }

  function drawLine(points, color, glow) {
    ctx.save();
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
    }
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  // Draw income
  drawArea(incomePoints, 'rgb(173,198,255)');
  drawLine(incomePoints, '#adc6ff', true);

  // Draw spending
  drawArea(expensePoints, 'rgb(255,183,134)');
  drawLine(expensePoints, '#ffb786', true);

  // Data dots
  [[incomePoints, '#adc6ff'], [expensePoints, '#ffb786']].forEach(function (pair) {
    const pts = pair[0], color = pair[1];
    const highlight = pts.reduce(function (best, p) { return p.y < best.y ? p : best; }, pts[0]);
    ctx.beginPath();
    ctx.arc(highlight.x, highlight.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

// ===== Draw Donut Chart (Canvas) =====
function drawDonutChart() {
  if (!donutCanvas) return;

  // Aggregate by category from expenses
  const catTotals = {};
  transactions.forEach(function (tx) {
    if (tx.type === 'expense') {
      catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount;
    }
  });

  const totalExpenses = Object.values(catTotals).reduce(function (a, b) { return a + b; }, 0);

  const COLORS = ['#adc6ff', '#ffb786', '#b1c6f9', '#424754', '#4ade80', '#df7412', '#304671'];

  let segments = [];
  if (totalExpenses === 0) {
    // Default placeholder
    segments = [
      { label: 'Rent 45%', pct: 0.45, color: '#adc6ff' },
      { label: 'Food 25%', pct: 0.25, color: '#ffb786' },
      { label: 'Travel 20%', pct: 0.20, color: '#b1c6f9' },
      { label: 'Misc 10%', pct: 0.10, color: '#424754' },
    ];
    donutValueEl.textContent = '₹0';
  } else {
    const cats = Object.keys(catTotals).sort(function (a, b) { return catTotals[b] - catTotals[a]; });
    segments = cats.map(function (cat, i) {
      const pct = catTotals[cat] / totalExpenses;
      return { label: cat + ' ' + Math.round(pct * 100) + '%', pct: pct, color: COLORS[i % COLORS.length] };
    });
    // Compact display
    const v = totalExpenses >= 1000 ? '₹' + (totalExpenses / 1000).toFixed(1) + 'k' : formatCurrency(totalExpenses);
    donutValueEl.textContent = v;
  }

  // Render legend
  donutLegendEl.innerHTML = segments.map(function (s) {
    return '<div class="donut-legend-item">' +
      '<span class="legend-dot" style="background:' + s.color + ';"></span>' +
      '<span class="donut-legend-label">' + escapeHTML(s.label) + '</span>' +
      '</div>';
  }).join('');

  // Draw canvas
  const size = 192;
  const dpr = window.devicePixelRatio || 1;
  donutCanvas.width = size * dpr;
  donutCanvas.height = size * dpr;
  const ctx = donutCanvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const r = 72;
  const sw = 20;
  const gap = 0.025;

  // Background ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(66,71,84,0.2)';
  ctx.lineWidth = sw;
  ctx.stroke();

  // Segments
  let startAngle = -Math.PI / 2;
  segments.forEach(function (seg) {
    const sweep = seg.pct * Math.PI * 2 - gap;
    ctx.save();
    ctx.shadowColor = seg.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle + gap / 2, startAngle + sweep + gap / 2);
    ctx.strokeStyle = seg.color;
    ctx.lineWidth = sw;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
    startAngle += seg.pct * Math.PI * 2;
  });
}

// ===== Render All =====
function renderAll() {
  updateSummary();
  renderTransactions(searchInput ? searchInput.value : '');
  drawLineChart();
  drawDonutChart();
}

// ===== Type Toggle =====
btnIncome.addEventListener('click', function () {
  selectedType = 'income';
  btnIncome.classList.add('type-btn--active');
  if (btnExpense) btnExpense.classList.remove('type-btn--active', 'type-btn--savings');
  if (btnSavings) btnSavings.classList.remove('type-btn--active', 'type-btn--savings');
});

btnExpense.addEventListener('click', function () {
  selectedType = 'expense';
  btnExpense.classList.add('type-btn--active');
  if (btnIncome) btnIncome.classList.remove('type-btn--active', 'type-btn--savings');
  if (btnSavings) btnSavings.classList.remove('type-btn--active', 'type-btn--savings');
});

if (btnSavings) {
  btnSavings.addEventListener('click', function () {
    selectedType = 'savings';
    btnSavings.classList.add('type-btn--savings');
    if (btnIncome) btnIncome.classList.remove('type-btn--active', 'type-btn--savings');
    if (btnExpense) btnExpense.classList.remove('type-btn--active', 'type-btn--savings');
  });
}

// ===== Form Validation Helpers =====
const errAmount = document.querySelector('#err-amount');
const errCategory = document.querySelector('#err-category');
const formFeedback = document.querySelector('#form-feedback');

function showFieldError(input, errEl) {
  input.classList.add('form-input--error');
  input.classList.add('field-shake');
  if (errEl) errEl.classList.add('visible');
  input.addEventListener('animationend', function () {
    input.classList.remove('field-shake');
  }, { once: true });
}

function clearFieldError(input, errEl) {
  input.classList.remove('form-input--error');
  if (errEl) errEl.classList.remove('visible');
}

function clearFeedback() {
  if (formFeedback) formFeedback.innerHTML = '';
}

// Clear errors when user corrects the field
if (amountInput && errAmount) {
  amountInput.addEventListener('input', function () {
    if (parseFloat(this.value) > 0) clearFieldError(amountInput, errAmount);
    clearFeedback();
  });
}
if (categorySelect && errCategory) {
  categorySelect.addEventListener('change', function () {
    if (this.value) clearFieldError(categorySelect, errCategory);
    clearFeedback();
  });
}

// ===== Form Submit =====
transactionForm.addEventListener('submit', function (e) {
  e.preventDefault();
  clearFeedback();

  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;
  const notes = notesTextarea.value.trim();
  let hasError = false;

  // Validate amount
  if (!amount || amount <= 0) {
    showFieldError(amountInput, errAmount);
    hasError = true;
  } else {
    clearFieldError(amountInput, errAmount);
  }

  // Validate category
  if (!category) {
    showFieldError(categorySelect, errCategory);
    hasError = true;
  } else {
    clearFieldError(categorySelect, errCategory);
  }

  if (hasError) return;

  const tx = {
    id: Date.now(),
    amount: amount,
    category: category,
    type: selectedType,
    notes: notes,
    date: new Date().toISOString()
  };

  transactions.push(tx);
  saveToStorage();

  // Capture type before reset for success message
  const addedType = selectedType;
  const addedCategory = category;
  const addedAmount = amount;

  renderAll();

  // Animate newest row
  const firstRow = tableBody.querySelector('tr:first-child');
  if (firstRow) firstRow.classList.add('tx-row-enter');

  // Show inline success message with category + amount info
  if (formFeedback) {
    const typeLabel = addedType.charAt(0).toUpperCase() + addedType.slice(1);
    formFeedback.innerHTML =
      '<div class="form-success-msg">' +
      '<span class="material-symbols-outlined">check_circle</span>' +
      '<span>' +
      escapeHTML(typeLabel) + ' (' + escapeHTML(addedCategory) + ') — ' + formatCurrency(addedAmount) + ' added successfully!' +
      '</span>' +
      '</div>';
    setTimeout(clearFeedback, 4000);
  }

  // Reset form
  transactionForm.reset();
  categorySelect.value = '';
  selectedType = 'income';
  btnIncome.classList.add('type-btn--active');
  if (btnExpense) { btnExpense.classList.remove('type-btn--active', 'type-btn--savings'); }
  if (btnSavings) { btnSavings.classList.remove('type-btn--active', 'type-btn--savings'); }
});


// ===== Search =====
if (searchInput) {
  searchInput.addEventListener('input', function () {
    renderTransactions(this.value);
  });
}

// ===== Sidebar "Add Transaction" scrolls to form =====
const sidebarAddBtn = document.querySelector('#btn-add-transaction-sidebar');
if (sidebarAddBtn) {
  sidebarAddBtn.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector('#amount').scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.querySelector('#amount').focus();
  });
}

// ===== View history button =====
const viewHistoryBtn = document.querySelector('#btn-view-history');
if (viewHistoryBtn) {
  viewHistoryBtn.addEventListener('click', function () {
    document.querySelector('#transaction-table-body').scrollIntoView({ behavior: 'smooth' });
  });
}

// ===== Nav links — Dashboard stays active; others open modal =====
const MODAL_LINKS = {
  'nav-transactions': 'Transactions',
  'nav-categories': 'Categories',
  'nav-reports': 'Reports',
  'nav-settings': 'Settings'
};
document.querySelectorAll('.nav-link').forEach(function (link) {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const id = this.id;
    if (MODAL_LINKS[id]) {
      openSnavModal(MODAL_LINKS[id]);
    } else {
      document.querySelectorAll('.nav-link').forEach(function (l) { l.classList.remove('nav-link--active'); });
      this.classList.add('nav-link--active');
    }
  });
});

// ===== Toast notification =====
function showToast(message, icon) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML =
    '<span class="material-symbols-outlined">' + (icon || 'info') + '</span>' +
    '<span>' + escapeHTML(message) + '</span>';

  document.body.appendChild(toast);
  setTimeout(function () { toast.remove(); }, 3000);
}

// ===== Resize observer for chart redraw =====
if (typeof ResizeObserver !== 'undefined' && lineCanvas) {
  new ResizeObserver(function () {
    drawLineChart();
  }).observe(lineCanvas.parentElement);
}

// ===== Initial Render =====
renderAll();

/* =====================================================
   SIDEBAR NAV MODAL SYSTEM
   ===================================================== */
const snavOverlay = document.querySelector('#snav-overlay');
const snavModal = document.querySelector('#snav-modal');
const snavTitle = document.querySelector('#snav-modal-title');
const snavBody = document.querySelector('#snav-modal-body');
const snavClose = document.querySelector('#snav-modal-close');

// Track Chart.js instances so we can destroy before re-creating
let _lineChartInst = null;
let _pieChartInst = null;

function openSnavModal(section) {
  snavTitle.textContent = section;
  snavBody.innerHTML = '';

  if (section === 'Transactions') {
    buildTransactionsModal();
  } else if (section === 'Categories') {
    buildCategoriesModal();
  } else if (section === 'Reports') {
    buildReportsModal();
  } else if (section === 'Settings') {
    buildSettingsModal();
  }

  snavOverlay.classList.add('is-open');
  snavOverlay.setAttribute('aria-hidden', 'false');
}

function closeSnavModal() {
  snavOverlay.classList.remove('is-open');
  snavOverlay.setAttribute('aria-hidden', 'true');
  // Destroy chart instances to free memory
  if (_lineChartInst) { _lineChartInst.destroy(); _lineChartInst = null; }
  if (_pieChartInst) { _pieChartInst.destroy(); _pieChartInst = null; }
}

if (snavClose) snavClose.addEventListener('click', closeSnavModal);
if (snavOverlay) snavOverlay.addEventListener('click', function (e) {
  if (e.target === snavOverlay) closeSnavModal();
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && snavOverlay && snavOverlay.classList.contains('is-open')) closeSnavModal();
});

// ---- Transactions Modal ----
function buildTransactionsModal() {
  var html =
    '<div class="modal-tx-search">' +
    '<span class="material-symbols-outlined">search</span>' +
    '<input id="modal-tx-filter" class="modal-tx-input" placeholder="Search transactions..." type="text" />' +
    '</div>' +
    '<div style="overflow-x:auto;">' +
    '<table class="modal-tx-table">' +
    '<thead><tr>' +
    '<th>Date</th><th>Description</th><th>Category</th><th>Type</th><th style="text-align:right">Amount</th><th></th>' +
    '</tr></thead>' +
    '<tbody id="modal-tx-body"></tbody>' +
    '</table>' +
    '</div>';
  snavBody.innerHTML = html;

  function renderModalTx(filter) {
    var tbody = document.querySelector('#modal-tx-body');
    if (!tbody) return;
    filter = (filter || '').toLowerCase();
    var list = transactions.slice().reverse();
    if (filter) {
      list = list.filter(function (tx) {
        return (tx.notes || '').toLowerCase().includes(filter)
          || (tx.category || '').toLowerCase().includes(filter)
          || tx.type.toLowerCase().includes(filter);
      });
    }
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="modal-tx-empty">No transactions found.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (tx) {
      var isInc = tx.type === 'income';
      var isSav = tx.type === 'savings';
      var color = isInc ? '#4ade80' : (isSav ? '#2dd4bf' : '#ffb786');
      var prefix = (isInc || isSav) ? '+' : '-';
      return '<tr>' +
        '<td style="color:var(--on-surface-variant);white-space:nowrap;">' + formatDate(tx.date) + '</td>' +
        '<td style="font-weight:700;">' + escapeHTML(tx.notes || tx.category) + '</td>' +
        '<td><span class="category-badge badge--' + getBadgeClassKey(tx.category) + '">' + escapeHTML(tx.category) + '</span></td>' +
        '<td style="text-transform:capitalize;color:var(--on-surface-variant);font-size:0.75rem;">' + tx.type + '</td>' +
        '<td style="text-align:right;font-weight:900;color:' + color + ';white-space:nowrap;">' + prefix + formatCurrency(tx.amount) + '</td>' +
        '<td><button class="delete-btn" data-mid="' + tx.id + '" title="Delete" style="justify-content:center;"><span class="material-symbols-outlined">delete</span></button></td>' +
        '</tr>';
    }).join('');

    tbody.querySelectorAll('.delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(this.dataset.mid, 10);
        transactions = transactions.filter(function (t) { return t.id !== id; });
        saveToStorage();
        renderAll();
        renderModalTx(document.querySelector('#modal-tx-filter') ? document.querySelector('#modal-tx-filter').value : '');
        showToast('Deleted', 'delete');
      });
    });
  }

  renderModalTx('');
  var filterInput = document.querySelector('#modal-tx-filter');
  if (filterInput) {
    filterInput.addEventListener('input', function () { renderModalTx(this.value); });
  }
}

function getBadgeClassKey(cat) {
  var map = {
    'Salary': 'income', 'Freelance': 'income', 'Investment': 'income', 'Gift': 'income', 'Other Income': 'income',
    'Food': 'food', 'Transport': 'travel', 'Housing': 'housing', 'Shopping': 'shopping',
    'Utilities': 'utilities', 'Healthcare': 'health', 'Entertainment': 'shopping', 'Education': 'shopping',
    'Emergency Fund': 'savings', 'Goal Savings': 'savings', 'Investment Fund': 'savings',
    'Retirement Fund': 'savings', 'Other Savings': 'savings',
  };
  return map[cat] || 'default';
}

// ---- Categories Modal ----
function buildCategoriesModal() {
  // Aggregate totals per category
  var catMap = {};
  transactions.forEach(function (tx) {
    if (!catMap[tx.category]) {
      catMap[tx.category] = { income: 0, expense: 0, savings: 0, count: 0 };
    }
    if (tx.type === 'income') catMap[tx.category].income += tx.amount;
    else if (tx.type === 'expense') catMap[tx.category].expense += tx.amount;
    else if (tx.type === 'savings') catMap[tx.category].savings += tx.amount;
    catMap[tx.category].count++;
  });

  var cats = Object.keys(catMap);

  if (cats.length === 0) {
    snavBody.innerHTML =
      '<div style="text-align:center;padding:3rem 1rem;color:var(--on-surface-variant);">' +
      '<span class="material-symbols-outlined" style="font-size:3rem;opacity:0.3;display:block;margin-bottom:1rem;">category</span>' +
      '<p style="font-size:0.9rem;">No categories yet. Add transactions to see your breakdown.</p>' +
      '</div>';
    return;
  }

  // Separate income, expense, and savings categories
  var incomeCats = cats.filter(function (c) { return catMap[c].income > 0; });
  var expenseCats = cats.filter(function (c) { return catMap[c].expense > 0; });
  var savingsCats = cats.filter(function (c) { return catMap[c].savings > 0; });

  var maxInc = incomeCats.reduce(function (m, c) { return Math.max(m, catMap[c].income); }, 1);
  var maxExp = expenseCats.reduce(function (m, c) { return Math.max(m, catMap[c].expense); }, 1);
  var maxSav = savingsCats.reduce(function (m, c) { return Math.max(m, catMap[c].savings); }, 1);

  var COLORS = ['#adc6ff', '#ffb786', '#b1c6f9', '#4ade80', '#f87171', '#fbbf24', '#a78bfa', '#34d399'];

  function buildSection(title, list, getVal, max, colorStart) {
    if (list.length === 0) return '';
    var html =
      '<div style="margin-bottom:2rem;">' +
      '<h4 style="font-size:0.65rem;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;color:var(--on-surface-variant);margin-bottom:1rem;">' + title + '</h4>' +
      '<div style="display:flex;flex-direction:column;gap:1rem;">';

    list.forEach(function (cat, i) {
      var val = getVal(cat);
      var pct = Math.round((val / max) * 100);
      var color = COLORS[(i + colorStart) % COLORS.length];
      var icon = categoryIcons[cat] || 'category';
      html +=
        '<div style="background:var(--surface-container-low);border:1px solid rgba(66,71,84,0.12);border-radius:0.75rem;padding:1rem 1.25rem;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem;">' +
        '<div style="display:flex;align-items:center;gap:0.6rem;">' +
        '<div style="width:32px;height:32px;border-radius:0.5rem;background:var(--surface-container-highest);display:flex;align-items:center;justify-content:center;color:' + color + ';">' +
        '<span class="material-symbols-outlined" style="font-size:1rem;">' + icon + '</span>' +
        '</div>' +
        '<span style="font-weight:700;font-size:0.875rem;color:var(--on-surface);">' + escapeHTML(cat) + '</span>' +
        '</div>' +
        '<div style="text-align:right;">' +
        '<div style="font-weight:900;font-size:0.95rem;color:' + color + ';">' + formatCurrency(val) + '</div>' +
        '<div style="font-size:0.6rem;color:var(--on-surface-variant);text-transform:uppercase;letter-spacing:0.1em;">' + catMap[cat].count + ' transaction' + (catMap[cat].count !== 1 ? 's' : '') + '</div>' +
        '</div>' +
        '</div>' +
        '<div style="height:4px;background:var(--surface-container-highest);border-radius:9999px;overflow:hidden;">' +
        '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:9999px;transition:width 0.6s cubic-bezier(0.4,0,0.2,1);box-shadow:0 0 6px ' + color + '55;"></div>' +
        '</div>' +
        '</div>';
    });

    html += '</div></div>';
    return html;
  }

  snavBody.innerHTML =
    buildSection('Income Sources', incomeCats, function (c) { return catMap[c].income; }, maxInc, 0) +
    buildSection('Savings Buckets', savingsCats, function (c) { return catMap[c].savings; }, maxSav, 4) +
    buildSection('Expense Categories', expenseCats, function (c) { return catMap[c].expense; }, maxExp, 2);
}

// ---- Reports Modal ----

function buildReportsModal() {
  snavBody.innerHTML =
    '<div class="modal-reports-grid">' +
    '<div class="modal-report-card"><h4>Income vs Expenses — Monthly</h4><div class="modal-chart-wrap"><canvas id="modal-line-canvas"></canvas></div></div>' +
    '<div class="modal-report-card"><h4>Spending by Category</h4><div class="modal-chart-wrap"><canvas id="modal-pie-canvas"></canvas></div></div>' +
    '</div>';

  // Need Chart.js
  if (typeof Chart === 'undefined') {
    snavBody.innerHTML = '<p style="color:var(--on-surface-variant);padding:2rem;text-align:center;">Chart.js failed to load. Check your internet connection.</p>';
    return;
  }

  // Build monthly data (last 6 months)
  var now = new Date();
  var labels = [], incData = [], expData = [];
  for (var i = 5; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
    var inc = 0, exp = 0;
    transactions.forEach(function (tx) {
      var td = new Date(tx.date);
      if (td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth()) {
        if (tx.type === 'income') inc += tx.amount;
        else exp += tx.amount;
      }
    });
    incData.push(inc);
    expData.push(exp);
  }

  var lineCtx = document.querySelector('#modal-line-canvas');
  if (lineCtx) {
    _lineChartInst = new Chart(lineCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'Income', data: incData, borderColor: '#adc6ff', backgroundColor: 'rgba(173,198,255,0.15)', tension: 0.4, fill: true, pointBackgroundColor: '#adc6ff', pointRadius: 4 },
          { label: 'Expenses', data: expData, borderColor: '#ffb786', backgroundColor: 'rgba(255,183,134,0.12)', tension: 0.4, fill: true, pointBackgroundColor: '#ffb786', pointRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#c2c6d6', font: { family: 'Inter', size: 11 } } } },
        scales: {
          x: { ticks: { color: '#8c909f', font: { size: 10 } }, grid: { color: 'rgba(66,71,84,0.2)' } },
          y: { ticks: { color: '#8c909f', font: { size: 10 }, callback: function (v) { return '₹' + v; } }, grid: { color: 'rgba(66,71,84,0.2)' } }
        }
      }
    });
  }

  // Pie chart
  var catTotals = {};
  transactions.forEach(function (tx) {
    if (tx.type === 'expense') catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount;
  });
  var pieLabels = Object.keys(catTotals);
  var pieData = pieLabels.map(function (k) { return catTotals[k]; });
  var PIE_COLORS = ['#adc6ff', '#ffb786', '#b1c6f9', '#4ade80', '#f87171', '#fbbf24', '#a78bfa'];

  var pieCtx = document.querySelector('#modal-pie-canvas');
  if (pieCtx) {
    if (pieData.length === 0) {
      pieCtx.parentElement.innerHTML = '<p style="text-align:center;padding:4rem 1rem;color:var(--on-surface-variant);font-size:0.85rem;">No expense data yet.</p>';
    } else {
      _pieChartInst = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
          labels: pieLabels,
          datasets: [{ data: pieData, backgroundColor: PIE_COLORS, borderWidth: 0, hoverOffset: 6 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            legend: { position: 'bottom', labels: { color: '#c2c6d6', font: { family: 'Inter', size: 10 }, padding: 12 } },
            tooltip: { callbacks: { label: function (ctx) { return ctx.label + ': ₹' + ctx.parsed.toFixed(2); } } }
          }
        }
      });
    }
  }
}

// ---- Settings Modal ----
function buildSettingsModal() {
  var savedGoal = localStorage.getItem('et_savings_goal') || '5000';

  snavBody.innerHTML =
    '<div class="settings-list">' +

    // Theme (dark-only display info)
    '<div class="settings-item">' +
    '<div><div class="settings-item__label"><span class="material-symbols-outlined">dark_mode</span>Theme</div>' +
    '<div class="settings-item__desc">Dark mode — premium fintech UI always on</div></div>' +
    '<span style="font-size:0.7rem;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;background:rgba(173,198,255,0.12);color:var(--primary);padding:0.3rem 0.75rem;border-radius:9999px;">DARK</span>' +
    '</div>' +

    // Currency display
    '<div class="settings-item">' +
    '<div><div class="settings-item__label"><span class="material-symbols-outlined">currency_rupee</span>Currency Symbol</div>' +
    '<div class="settings-item__desc">Currently set to Indian Rupee (₹)</div></div>' +
    '<span style="font-size:1.4rem;font-weight:900;color:var(--primary);">&#x20B9;</span>' +
    '</div>' +

    // Savings goal
    '<div class="settings-item" style="flex-direction:column;align-items:flex-start;gap:0.75rem;">' +
    '<div class="settings-item__label"><span class="material-symbols-outlined">savings</span>Savings Goal</div>' +
    '<div style="display:flex;gap:0.75rem;width:100%;">' +
    '<input id="setting-goal" type="number" min="0" step="100" value="' + savedGoal + '" style="flex:1;background:var(--surface-container-lowest);border:1px solid rgba(66,71,84,0.3);border-radius:0.5rem;padding:0.5rem 0.75rem;color:var(--on-surface);font-family:Inter,sans-serif;font-size:0.875rem;outline:none;transition:border-color 0.2s ease,box-shadow 0.2s ease;" />' +
    '<button id="setting-goal-save" style="padding:0.5rem 1.25rem;background:linear-gradient(135deg,#adc6ff,#4d8eff);color:#00285d;font-weight:700;font-size:0.75rem;border-radius:0.5rem;font-family:Inter,sans-serif;cursor:pointer;transition:filter 0.2s ease,transform 0.1s ease;" onmouseover="this.style.filter=\'brightness(1.1)\'" onmouseout="this.style.filter=\'\'" onmousedown="this.style.transform=\'scale(0.96)\'" onmouseup="this.style.transform=\'\'">Save</button>' +
    '</div>' +
    '</div>' +

    // Clear data
    '<div class="settings-item">' +
    '<div><div class="settings-item__label"><span class="material-symbols-outlined">delete_forever</span>Clear All Data</div>' +
    '<div class="settings-item__desc">Permanently delete all transactions</div></div>' +
    '<button id="setting-clear" style="padding:0.5rem 1rem;background:rgba(147,0,10,0.2);color:#ffb4ab;border:1px solid rgba(147,0,10,0.3);border-radius:0.5rem;font-weight:700;font-size:0.7rem;font-family:Inter,sans-serif;cursor:pointer;transition:filter 0.2s ease;">Clear</button>' +
    '</div>' +

    '</div>';

  // Use event delegation on snavBody for dynamically injected buttons.
  // (#setting-theme does not exist — removed dead themeToggle guard.)
  snavBody.addEventListener('click', function (e) {
    var target = e.target.closest('button');
    if (!target) return;

    // Save savings goal
    if (target.id === 'setting-goal-save') {
      var goalInput = document.querySelector('#setting-goal');
      var val = goalInput ? parseFloat(goalInput.value) : NaN;
      if (!isNaN(val) && val >= 0) {
        localStorage.setItem('et_savings_goal', val.toFixed(0));
        var goalEl = document.querySelector('.summary-card__meta span:last-child');
        if (goalEl && goalEl.textContent.startsWith('Goal')) {
          goalEl.textContent = 'Goal: ₹' + Number(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        showToast('Goal saved!', 'check_circle');
      }
      return;
    }

    // Clear all data
    if (target.id === 'setting-clear') {
      if (confirm('Delete ALL transactions? This cannot be undone.')) {
        transactions = [];
        saveToStorage();
        renderAll();
        closeSnavModal();
        showToast('All data cleared', 'delete_forever');
      }
      return;
    }
  });
}
