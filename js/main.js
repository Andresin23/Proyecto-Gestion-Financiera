/* ==========================================================================
   FINANPRO - ACCESSIBLE JAVASCRIPT LOGIC
   Dashboard, Gestión CRUD, Gráficos Dinámicos, Calculadoras, Divisas & ARIA
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  FinanApp.init();
});

const FinanApp = {
  state: {
    transactions: [],
    goals: [],
    budgets: {},
    rates: {
      USD: 1.0,
      EUR: 0.92,
      COP: 4050.0,
      MXN: 17.2,
      ARS: 950.0
    }
  },

  charts: {
    incomeExpense: null,
    category: null
  },

  async init() {
    await this.loadState();
    this.initTheme();
    this.initNavigation();
    this.initModals();
    this.initEventListeners();
    this.initCalculators();
    this.initCurrencyConverter();
    this.renderAll();
  },

  /* --- 1. CARGA Y ALMACENAMIENTO DE DATOS --- */
  async loadState() {
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isConfigured()) {
      const dbTx = await SupabaseDB.getTransactions();
      const dbGoals = await SupabaseDB.getGoals();
      const dbBudgets = await SupabaseDB.getBudgets();

      if (dbTx && dbTx.length > 0) {
        this.state.transactions = dbTx;
      }
      if (dbGoals && dbGoals.length > 0) {
        this.state.goals = dbGoals;
      }
      if (dbBudgets && Object.keys(dbBudgets).length > 0) {
        this.state.budgets = dbBudgets;
      }
    }

    // Fallback a localStorage si los datos aún no provienen de Supabase
    if (!this.state.transactions || this.state.transactions.length === 0) {
      const savedTx = localStorage.getItem('finanpro_transactions');
      if (savedTx) {
        this.state.transactions = JSON.parse(savedTx);
      } else {
        this.seedDefaultData();
      }
    }

    if (!this.state.goals || this.state.goals.length === 0) {
      const savedGoals = localStorage.getItem('finanpro_goals');
      if (savedGoals) {
        this.state.goals = JSON.parse(savedGoals);
      } else {
        this.state.goals = [
          { id: 1, name: 'Fondo de Emergencia', target: 5000, current: 3400, deadline: '2026-12-31' },
          { id: 2, name: 'Vacaciones Familiares', target: 2500, current: 1800, deadline: '2026-09-15' },
          { id: 3, name: 'Portafolio de Inversión', target: 10000, current: 4200, deadline: '2027-06-30' }
        ];
      }
    }

    if (!this.state.budgets || Object.keys(this.state.budgets).length === 0) {
      this.state.budgets = {
        'Vivienda': 1200,
        'Alimentación': 600,
        'Transporte': 350,
        'Servicios': 250,
        'Entretenimiento': 300,
        'Inversiones': 500,
        'Salud': 200
      };
    }
  },

  saveState() {
    localStorage.setItem('finanpro_transactions', JSON.stringify(this.state.transactions));
    localStorage.setItem('finanpro_goals', JSON.stringify(this.state.goals));
  },

  seedDefaultData() {
    const today = new Date();
    const formatDate = (daysAgo) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    this.state.transactions = [
      { id: 1, description: 'Salario Mensual', amount: 3500, type: 'ingreso', category: 'Salario', date: formatDate(2) },
      { id: 2, description: 'Pago de Arriendo / Hipoteca', amount: 950, type: 'gasto', category: 'Vivienda', date: formatDate(4) },
      { id: 3, description: 'Proyecto Freelance Web', amount: 800, type: 'ingreso', category: 'Freelance', date: formatDate(6) },
      { id: 4, description: 'Mercado Mensual Supermercado', amount: 420, type: 'gasto', category: 'Alimentación', date: formatDate(8) },
      { id: 5, description: 'Servicios de Luz e Internet', amount: 130, type: 'gasto', category: 'Servicios', date: formatDate(10) },
      { id: 6, description: 'Aporte a Fondo de Inversión', amount: 500, type: 'gasto', category: 'Inversiones', date: formatDate(12) },
      { id: 7, description: 'Salida a Restaurante', amount: 85, type: 'gasto', category: 'Entretenimiento', date: formatDate(14) },
      { id: 8, description: 'Mantenimiento de Vehículo', amount: 160, type: 'gasto', category: 'Transporte', date: formatDate(16) }
    ];
    this.saveState();
  },

  /* --- 2. GESTIÓN DE TEMA Y NAVEGACIÓN --- */
  initTheme() {
    const themeBtn = document.getElementById('theme-toggle');

    const savedTheme = localStorage.getItem('finanpro_theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    this.setTheme(savedTheme);

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
      });
    }
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('finanpro_theme', theme);

    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    if (theme === 'dark') {
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
    } else {
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
    }

    if (this.charts.incomeExpense) this.renderCharts();
  },

  initNavigation() {
    const toggleBtn = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (toggleBtn && navMenu) {
      toggleBtn.addEventListener('click', () => {
        const isActive = navMenu.classList.toggle('active');
        toggleBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      });
    }

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        if (navMenu) {
          navMenu.classList.remove('active');
          toggleBtn?.setAttribute('aria-expanded', 'false');
        }
      });
    });
  },

  /* --- 3. MODALES CON ACCESIBILIDAD TECLADO (ESC KEY) --- */
  initModals() {
    const txModal = document.getElementById('tx-modal');
    const openBtn1 = document.getElementById('open-modal-btn');
    const openBtn2 = document.getElementById('open-modal-btn-2');
    const closeBtn = document.getElementById('modal-close-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const txForm = document.getElementById('tx-form');

    const openModal = () => {
      document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
      txModal.classList.add('active');
      document.getElementById('tx-description')?.focus();
    };

    const closeModal = () => {
      txModal.classList.remove('active');
      txForm.reset();
    };

    if (openBtn1) openBtn1.addEventListener('click', openModal);
    if (openBtn2) openBtn2.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    txModal.addEventListener('click', (e) => {
      if (e.target === txModal) closeModal();
    });

    txForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddTransaction();
      closeModal();
    });

    // Goal Modal
    const goalModal = document.getElementById('goal-modal');
    const goalCloseBtn = document.getElementById('goal-modal-close-btn');
    const goalCancelBtn = document.getElementById('goal-modal-cancel-btn');
    const goalForm = document.getElementById('goal-form');

    const closeGoalModal = () => {
      goalModal.classList.remove('active');
      goalForm.reset();
    };

    if (goalCloseBtn) goalCloseBtn.addEventListener('click', closeGoalModal);
    if (goalCancelBtn) goalCancelBtn.addEventListener('click', closeGoalModal);

    goalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleGoalDeposit();
      closeGoalModal();
    });

    // Accesibilidad Teclado: Cerrar modales con tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (txModal.classList.contains('active')) closeModal();
        if (goalModal.classList.contains('active')) closeGoalModal();
      }
    });
  },

  initEventListeners() {
    document.getElementById('search-input')?.addEventListener('input', () => this.renderTransactionsTable());
    document.getElementById('filter-type')?.addEventListener('change', () => this.renderTransactionsTable());
    document.getElementById('filter-category')?.addEventListener('change', () => this.renderTransactionsTable());

    document.getElementById('export-csv-btn')?.addEventListener('click', () => this.exportCSV());

    document.getElementById('reset-demo-btn')?.addEventListener('click', () => {
      this.seedDefaultData();
      this.renderAll();
      this.showToast('Datos demo restaurados con éxito', 'success');
    });

    document.getElementById('transactions-tbody')?.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete-row');
      if (deleteBtn) {
        const id = parseInt(deleteBtn.dataset.id);
        this.deleteTransaction(id);
      }
    });

    document.getElementById('goals-grid')?.addEventListener('click', (e) => {
      const depositBtn = e.target.closest('.btn-goal-deposit');
      if (depositBtn) {
        const goalId = parseInt(depositBtn.dataset.id);
        const goal = this.state.goals.find(g => g.id === goalId);
        if (goal) {
          document.getElementById('goal-id').value = goal.id;
          document.getElementById('goal-name-label').textContent = `Abonar a: ${goal.name}`;
          document.getElementById('goal-modal').classList.add('active');
          document.getElementById('goal-deposit-amount')?.focus();
        }
      }
    });
  },

  /* --- 4. ACCIONES CRUD Y MANEJO DE MOVIMIENTOS --- */
  async handleAddTransaction() {
    const description = document.getElementById('tx-description').value.trim();
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const type = document.getElementById('tx-type').value;
    const category = document.getElementById('tx-category').value;
    const date = document.getElementById('tx-date').value;

    if (!description || isNaN(amount) || amount <= 0) {
      this.showToast('Por favor ingresa un concepto y monto válido', 'error');
      return;
    }

    const newTx = {
      id: Date.now(),
      description,
      amount,
      type,
      category,
      date
    };

    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isConfigured()) {
      const inserted = await SupabaseDB.addTransaction(newTx);
      if (inserted) {
        newTx.id = inserted.id;
      }
    }

    this.state.transactions.unshift(newTx);
    this.saveState();
    this.renderAll();
    this.showToast('Transacción registrada correctamente', 'success');
  },

  async deleteTransaction(id) {
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isConfigured()) {
      await SupabaseDB.deleteTransaction(id);
    }
    this.state.transactions = this.state.transactions.filter(t => t.id !== id);
    this.saveState();
    this.renderAll();
    this.showToast('Transacción eliminada', 'info');
  },

  async handleGoalDeposit() {
    const goalId = parseInt(document.getElementById('goal-id').value);
    const amount = parseFloat(document.getElementById('goal-deposit-amount').value);

    if (isNaN(amount) || amount <= 0) return;

    const goal = this.state.goals.find(g => g.id === goalId);
    if (goal) {
      goal.current += amount;
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.isConfigured()) {
        await SupabaseDB.updateGoalCurrent(goal.id, goal.current);
      }
      this.saveState();
      this.renderGoals();
      this.showToast(`Abonados $${amount.toLocaleString()} a ${goal.name}`, 'success');
    }
  },

  exportCSV() {
    if (!this.state.transactions.length) {
      this.showToast('No hay transacciones para exportar', 'error');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,ID,Fecha,Concepto,Tipo,Categoria,Monto\n';
    this.state.transactions.forEach(t => {
      csvContent += `${t.id},"${t.date}","${t.description}",${t.type},"${t.category}",${t.amount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinanPro_Reporte_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('Reporte CSV descargado con éxito', 'success');
  },

  /* --- 5. RENDERIZADO PRINCIPAL (DOM Y ACCESIBILIDAD) --- */
  renderAll() {
    this.renderKPIs();
    this.renderCharts();
    this.renderTransactionsTable();
    this.renderBudgets();
    this.renderGoals();
  },

  renderKPIs() {
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    this.state.transactions.forEach(t => {
      if (t.type === 'ingreso') {
        totalIncome += t.amount;
        incomeCount++;
      } else {
        totalExpense += t.amount;
        expenseCount++;
      }
    });

    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;

    document.getElementById('kpi-total-balance').textContent = this.formatCurrency(netBalance);
    document.getElementById('kpi-total-income').textContent = this.formatCurrency(totalIncome);
    document.getElementById('kpi-total-expense').textContent = this.formatCurrency(totalExpense);
    document.getElementById('kpi-savings-rate').textContent = `${savingsRate}%`;

    document.getElementById('kpi-income-count').textContent = `${incomeCount} movimiento(s)`;
    document.getElementById('kpi-expense-count').textContent = `${expenseCount} movimiento(s)`;

    const savingsBar = document.getElementById('kpi-savings-bar');
    const progressBarContainer = document.getElementById('kpi-savings-progressbar');

    if (savingsBar) savingsBar.style.width = `${Math.min(100, savingsRate)}%`;
    if (progressBarContainer) progressBarContainer.setAttribute('aria-valuenow', Math.min(100, savingsRate));
  },

  renderTransactionsTable() {
    const tbody = document.getElementById('transactions-tbody');
    const emptyState = document.getElementById('empty-state');
    if (!tbody) return;

    const query = (document.getElementById('search-input')?.value || '').toLowerCase();
    const typeFilter = document.getElementById('filter-type')?.value || 'all';
    const categoryFilter = document.getElementById('filter-category')?.value || 'all';

    const filtered = this.state.transactions.filter(t => {
      const matchesQuery = t.description.toLowerCase().includes(query) || t.category.toLowerCase().includes(query);
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesQuery && matchesType && matchesCat;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(t => `
      <tr>
        <td><strong>${t.description}</strong></td>
        <td><span class="badge-cat">${t.category}</span></td>
        <td>${t.date}</td>
        <td>
          <span class="badge-cat ${t.type === 'ingreso' ? 'badge-ingreso' : 'badge-gasto'}">
            ${t.type === 'ingreso' ? 'Ingreso' : 'Gasto'}
          </span>
        </td>
        <td class="${t.type === 'ingreso' ? 'text-green' : 'text-red'} font-bold">
          ${t.type === 'ingreso' ? '+' : '-'}${this.formatCurrency(t.amount)}
        </td>
        <td class="text-right">
          <button class="btn-delete-row" data-id="${t.id}" title="Eliminar ${t.description}" aria-label="Eliminar la transacción ${t.description}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      </tr>
    `).join('');
  },

  renderBudgets() {
    const container = document.getElementById('budget-list');
    if (!container) return;

    const spentPerCategory = {};
    this.state.transactions.forEach(t => {
      if (t.type === 'gasto') {
        spentPerCategory[t.category] = (spentPerCategory[t.category] || 0) + t.amount;
      }
    });

    const categories = Object.keys(this.state.budgets);

    container.innerHTML = categories.map(cat => {
      const budget = this.state.budgets[cat];
      const spent = spentPerCategory[cat] || 0;
      const pct = Math.min(100, Math.round((spent / budget) * 100));

      let fillClass = '';
      if (pct >= 100) fillClass = 'danger';
      else if (pct >= 80) fillClass = 'warning';

      return `
        <div class="budget-item">
          <div class="budget-info">
            <span>${cat}</span>
            <span>${this.formatCurrency(spent)} / ${this.formatCurrency(budget)} (${pct}%)</span>
          </div>
          <div class="budget-bar" role="progressbar" aria-label="Presupuesto para ${cat}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
            <div class="budget-fill ${fillClass}" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderGoals() {
    const container = document.getElementById('goals-grid');
    if (!container) return;

    container.innerHTML = this.state.goals.map(g => {
      const pct = Math.min(100, Math.round((g.current / g.target) * 100));
      return `
        <div class="goal-card">
          <div class="goal-header">
            <h4 class="goal-title">${g.name}</h4>
            <button class="btn btn-secondary btn-sm btn-goal-deposit" data-id="${g.id}" aria-label="Abonar fondos a la meta ${g.name}">+ Abonar</button>
          </div>
          <div class="goal-amounts">
            <span>Ahorrado: ${this.formatCurrency(g.current)}</span>
            <span>Objetivo: ${this.formatCurrency(g.target)}</span>
          </div>
          <div class="savings-progress-bar" role="progressbar" aria-label="Progreso de la meta ${g.name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
            <div class="savings-progress-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  /* --- 6. RENDERIZADO DE GRÁFICOS (CHART.JS) --- */
  renderCharts() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#cbd5e1' : '#475569';
    const gridColor = isDark ? '#334155' : '#cbd5e1';

    const ctx1 = document.getElementById('incomeExpenseChart')?.getContext('2d');
    if (ctx1) {
      if (this.charts.incomeExpense) this.charts.incomeExpense.destroy();

      let totalIncome = 0;
      let totalExpense = 0;
      this.state.transactions.forEach(t => {
        if (t.type === 'ingreso') totalIncome += t.amount;
        else totalExpense += t.amount;
      });

      this.charts.incomeExpense = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: ['Ingresos Totales', 'Gastos Totales'],
          datasets: [{
            label: 'Monto ($)',
            data: [totalIncome, totalExpense],
            backgroundColor: ['#10b981', '#ef4444'],
            borderRadius: 8,
            barThickness: 45
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 } }, grid: { display: false } },
            y: { ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 12 } }, grid: { color: gridColor } }
          }
        }
      });
    }

    const ctx2 = document.getElementById('categoryChart')?.getContext('2d');
    if (ctx2) {
      if (this.charts.category) this.charts.category.destroy();

      const catMap = {};
      this.state.transactions.forEach(t => {
        if (t.type === 'gasto') {
          catMap[t.category] = (catMap[t.category] || 0) + t.amount;
        }
      });

      const labels = Object.keys(catMap);
      const data = Object.values(catMap);
      const colors = ['#10b981', '#6366f1', '#0284c7', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

      this.charts.category = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['Sin Gastos'],
          datasets: [{
            data: data.length ? data : [1],
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: isDark ? '#151e32' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 } }
            }
          }
        }
      });
    }
  },

  /* --- 7. SIMULADORES Y CALCULADORAS --- */
  initCalculators() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const contentId = tab.dataset.tab;
        document.getElementById(contentId)?.classList.add('active');
      });
    });

    const interestForm = document.getElementById('interest-form');
    if (interestForm) {
      interestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.calculateCompoundInterest();
      });
      this.calculateCompoundInterest();
    }

    const loanForm = document.getElementById('loan-form');
    if (loanForm) {
      loanForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.calculateLoan();
      });
      this.calculateLoan();
    }
  },

  calculateCompoundInterest() {
    const P = parseFloat(document.getElementById('init-capital').value) || 0;
    const PMT = parseFloat(document.getElementById('monthly-deposit').value) || 0;
    const r = (parseFloat(document.getElementById('annual-rate').value) || 0) / 100;
    const t = parseFloat(document.getElementById('calc-years').value) || 1;
    const n = 12;

    const months = t * n;
    const ratePerMonth = r / n;

    const compoundP = P * Math.pow(1 + ratePerMonth, months);
    const compoundPMT = ratePerMonth > 0 ? PMT * ((Math.pow(1 + ratePerMonth, months) - 1) / ratePerMonth) : PMT * months;

    const finalBalance = compoundP + compoundPMT;
    const totalDeposited = P + (PMT * months);
    const totalInterest = finalBalance - totalDeposited;

    document.getElementById('res-final-balance').textContent = this.formatCurrency(finalBalance);
    document.getElementById('res-total-deposited').textContent = this.formatCurrency(totalDeposited);
    document.getElementById('res-total-interest').textContent = this.formatCurrency(totalInterest);

    const pctDep = Math.round((totalDeposited / finalBalance) * 100);
    const pctInt = 100 - pctDep;

    document.getElementById('bar-deposited').style.width = `${pctDep}%`;
    document.getElementById('bar-interest').style.width = `${pctInt}%`;
  },

  calculateLoan() {
    const P = parseFloat(document.getElementById('loan-amount').value) || 0;
    const annualRate = (parseFloat(document.getElementById('loan-rate').value) || 0) / 100;
    const n = parseInt(document.getElementById('loan-months').value) || 1;

    const r = annualRate / 12;

    let monthlyPayment = 0;
    if (r > 0) {
      monthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    } else {
      monthlyPayment = P / n;
    }

    const totalPaid = monthlyPayment * n;
    const totalInterest = totalPaid - P;

    document.getElementById('res-loan-monthly').textContent = this.formatCurrency(monthlyPayment);
    document.getElementById('res-loan-total').textContent = this.formatCurrency(totalPaid);
    document.getElementById('res-loan-interest').textContent = this.formatCurrency(totalInterest);
  },

  /* --- 8. CONVERSOR DE DIVISAS --- */
  initCurrencyConverter() {
    const amountInput = document.getElementById('conv-amount');
    const fromSelect = document.getElementById('conv-from');
    const toSelect = document.getElementById('conv-to');
    const swapBtn = document.getElementById('conv-swap-btn');

    const updateConversion = () => {
      const amount = parseFloat(amountInput.value) || 0;
      const from = fromSelect.value;
      const to = toSelect.value;

      const fromRateInUSD = this.state.rates[from];
      const toRateInUSD = this.state.rates[to];

      const amountInUSD = amount / fromRateInUSD;
      const converted = amountInUSD * toRateInUSD;
      const singleRate = (1 / fromRateInUSD) * toRateInUSD;

      document.getElementById('conv-result-value').textContent = 
        `${converted.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${to}`;

      document.getElementById('conv-rate-info').textContent = 
        `1 ${from} = ${singleRate.toLocaleString('es-ES', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ${to}`;
    };

    if (amountInput && fromSelect && toSelect) {
      amountInput.addEventListener('input', updateConversion);
      fromSelect.addEventListener('change', updateConversion);
      toSelect.addEventListener('change', updateConversion);

      if (swapBtn) {
        swapBtn.addEventListener('click', () => {
          const temp = fromSelect.value;
          fromSelect.value = toSelect.value;
          toSelect.value = temp;
          updateConversion();
        });
      }

      updateConversion();
    }
  },

  /* --- 9. HELPERS Y TOASTS --- */
  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};
