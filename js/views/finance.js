// 2. Finance View - Complete personal finance tracker with progressive animations
import { state } from '../state.js';
import { formatMoney, formatThaiDateTime, formatThaiDateShort, showToast, animateCounter } from '../utils.js';
import { showConfirmDialog } from '../modals.js';

let financeDetailChart = null;
let currentFilterType = 'all';
let currentSearch = '';
let currentCategory = 'all';

export function renderFinance(container) {
  const metrics = state.getFinancialMetrics();
  let txs = state.data.transactions;

  if (currentFilterType !== 'all') {
    txs = txs.filter(t => t.type === currentFilterType);
  }
  if (currentCategory !== 'all') {
    txs = txs.filter(t => t.category === currentCategory);
  }
  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase();
    txs = txs.filter(t => t.title.toLowerCase().includes(q) || (t.note && t.note.toLowerCase().includes(q)));
  }

  const categories = Array.from(new Set(state.data.transactions.map(t => t.category).filter(Boolean)));
  const savingsRate = metrics.totalIncome > 0 ? Math.max(0, Math.round((metrics.balance / metrics.totalIncome) * 100)) : 0;

  container.innerHTML = `
    <div class="space-y-6 pb-12">
      <!-- Header Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 stagger-item stagger-1">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2">
            <i data-lucide="wallet" class="w-6 h-6 text-purple-400"></i>
            การเงินและรายรับ-รายจ่าย (Finance)
          </h1>
          <p class="text-xs text-slate-400 mt-1">บันทึกทุกการเคลื่อนไหวทางการเงิน พร้อมวันเวลาชัดเจนและกราฟวิเคราะห์</p>
        </div>
        <div class="flex items-center gap-2.5">
          <button id="btn-export-csv" class="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium border border-slate-700 transition-all hover:scale-105 flex items-center gap-2">
            <i data-lucide="download" class="w-4 h-4"></i> ส่งออก CSV
          </button>
          <button id="btn-add-tx" class="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all hover:scale-105 flex items-center gap-2">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> บันทึกรายการใหม่
          </button>
        </div>
      </div>

      <!-- Financial Metrics Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass-panel glass-panel-hover p-4 flex items-center gap-4 stagger-item stagger-1">
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <i data-lucide="arrow-down-left" class="w-6 h-6"></i>
          </div>
          <div>
            <div class="text-xs text-slate-400">รายรับรวมทั้งหมด</div>
            <div id="finance-total-income" class="text-xl font-bold text-emerald-400 mt-0.5">฿ 0</div>
          </div>
        </div>

        <div class="glass-panel glass-panel-hover p-4 flex items-center gap-4 stagger-item stagger-2">
          <div class="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <i data-lucide="arrow-up-right" class="w-6 h-6"></i>
          </div>
          <div>
            <div class="text-xs text-slate-400">รายจ่ายรวมทั้งหมด</div>
            <div id="finance-total-expense" class="text-xl font-bold text-rose-400 mt-0.5">฿ 0</div>
          </div>
        </div>

        <div class="glass-panel glass-panel-hover p-4 flex items-center gap-4 stagger-item stagger-3">
          <div class="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <i data-lucide="piggy-bank" class="w-6 h-6"></i>
          </div>
          <div>
            <div class="text-xs text-slate-400">เงินคงเหลือสุทธิ</div>
            <div id="finance-net-balance" class="text-xl font-bold text-white mt-0.5">฿ 0</div>
          </div>
        </div>

        <div class="glass-panel glass-panel-hover p-4 flex items-center gap-4 stagger-item stagger-4">
          <div class="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <i data-lucide="percent" class="w-6 h-6"></i>
          </div>
          <div>
            <div class="text-xs text-slate-400">อัตราการออม</div>
            <div id="finance-savings-rate" class="text-xl font-bold text-cyan-400 mt-0.5">0%</div>
          </div>
        </div>
      </div>

      <!-- Financial Chart Section -->
      <div class="glass-panel glass-panel-hover p-5 stagger-item stagger-3">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <span class="font-semibold text-white text-sm">การเปรียบเทียบรายรับและรายจ่าย</span>
          <span class="text-xs text-slate-400">อัปเดตล่าสุด: วันนี้</span>
        </div>
        <div class="h-64 relative">
          <canvas id="finance-detail-chart"></canvas>
        </div>
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="glass-panel p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 stagger-item stagger-4">
        <div class="relative flex-1">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
          <input 
            type="text" 
            id="tx-search-input" 
            placeholder="ค้นหาชื่อรายการ หรือบันทึกข้อความ..." 
            value="${currentSearch}"
            class="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-700 text-xs">
            <button class="tx-filter-btn px-3 py-1.5 rounded-lg transition-all ${currentFilterType === 'all' ? 'bg-purple-600 text-white font-medium shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'}" data-filter="all">ทั้งหมด</button>
            <button class="tx-filter-btn px-3 py-1.5 rounded-lg transition-all ${currentFilterType === 'income' ? 'bg-purple-600 text-white font-medium shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'}" data-filter="income">รายรับ</button>
            <button class="tx-filter-btn px-3 py-1.5 rounded-lg transition-all ${currentFilterType === 'expense' ? 'bg-purple-600 text-white font-medium shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'}" data-filter="expense">รายจ่าย</button>
          </div>

          <select id="tx-cat-select" class="bg-slate-900/80 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500">
            <option value="all">ทุกหมวดหมู่</option>
            ${categories.map(c => `<option value="${c}" ${currentCategory === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Transaction History Table / Cards -->
      <div class="glass-panel overflow-hidden stagger-item stagger-5">
        <div class="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <span class="font-semibold text-white text-sm">ประวัติธุรกรรมทั้งหมด (${txs.length} รายการ)</span>
          <span class="text-xs text-slate-400">บันทึกวันและเวลาอย่างละเอียด</span>
        </div>

        <div class="divide-y divide-slate-800/60">
          ${txs.length === 0 ? `
            <div class="p-8 text-center text-slate-400 text-xs">
              <i data-lucide="receipt" class="w-8 h-8 mx-auto text-slate-600 mb-2"></i>
              ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา
            </div>
          ` : txs.map(tx => {
            const isInc = tx.type === 'income';
            const iconBg = isInc ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30';
            const iconName = isInc ? 'arrow-down-left' : 'arrow-up-right';
            return `
              <div class="p-4 hover:bg-slate-800/30 transition-all duration-200 hover:translate-x-1 flex items-center justify-between gap-4">
                <div class="flex items-center gap-3.5 min-w-0">
                  <div class="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}">
                    <i data-lucide="${iconName}" class="w-5 h-5"></i>
                  </div>
                  <div class="min-w-0">
                    <div class="text-sm font-semibold text-white truncate">${tx.title}</div>
                    <div class="flex flex-wrap items-center gap-2 mt-1">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/20">${tx.category}</span>
                      <span class="text-[11px] text-slate-400 flex items-center gap-1">
                        <i data-lucide="clock" class="w-3 h-3"></i>
                        ${formatThaiDateTime(tx.date)}
                      </span>
                      ${tx.note ? `<span class="text-[11px] text-slate-400 italic">• ${tx.note}</span>` : ''}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-4 shrink-0">
                  <div class="text-right">
                    <div class="text-sm font-bold ${isInc ? 'text-emerald-400' : 'text-rose-400'}">
                      ${isInc ? '+' : '-'} ${formatMoney(tx.amount)}
                    </div>
                  </div>
                  <button class="btn-delete-tx text-slate-500 hover:text-rose-400 transition-colors p-1" data-id="${tx.id}" title="ลบรายการนี้">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }

  animateCounter(container.querySelector('#finance-total-income'), metrics.totalIncome, 1200, '฿ ');
  animateCounter(container.querySelector('#finance-total-expense'), metrics.totalExpense, 1200, '฿ ');
  animateCounter(container.querySelector('#finance-net-balance'), metrics.balance, 1200, '฿ ');
  animateCounter(container.querySelector('#finance-savings-rate'), savingsRate, 1200, '', '%');

  bindFinanceEvents(container);
  initFinanceCharts();
}

function initFinanceCharts() {
  if (financeDetailChart) financeDetailChart.destroy();
  const canvas = document.getElementById('finance-detail-chart');
  if (!canvas || !window.Chart) return;

  // Aggregate real transactions by week of current month
  const txs = state.data.transactions;
  const now = new Date();
  const incomeByWeek = [0, 0, 0, 0];
  const expenseByWeek = [0, 0, 0, 0];

  txs.forEach(t => {
    const d = new Date(t.date);
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return;
    const week = Math.min(3, Math.floor((d.getDate() - 1) / 7));
    if (t.type === 'income') incomeByWeek[week] += Number(t.amount) || 0;
    else expenseByWeek[week] += Number(t.amount) || 0;
  });

  const hasData = incomeByWeek.some(v => v > 0) || expenseByWeek.some(v => v > 0);

  // Show empty state if no transactions this month
  if (!hasData) {
    canvas.style.display = 'none';
    const parent = canvas.parentElement;
    if (!parent.querySelector('.chart-empty-state')) {
      const empty = document.createElement('div');
      empty.className = 'chart-empty-state flex flex-col items-center justify-center h-full gap-3 text-slate-500';
      empty.innerHTML = `
        <svg class="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        <p class="text-sm">ยังไม่มีธุรกรรมเดือนนี้</p>
        <p class="text-xs text-slate-600">เพิ่มรายรับหรือรายจ่ายเพื่อดูกราฟ</p>
      `;
      parent.appendChild(empty);
    }
    return;
  }

  // Remove empty state if exists
  canvas.style.display = '';
  canvas.parentElement.querySelector('.chart-empty-state')?.remove();

  const ctx = canvas.getContext('2d');
  financeDetailChart = new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['สัปดาห์ 1', 'สัปดาห์ 2', 'สัปดาห์ 3', 'สัปดาห์ 4'],
      datasets: [
        {
          label: 'รายรับ',
          data: incomeByWeek,
          backgroundColor: 'rgba(16,185,129,0.85)',
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 8
        },
        {
          label: 'รายจ่าย',
          data: expenseByWeek,
          backgroundColor: 'rgba(244,63,94,0.85)',
          borderColor: '#f43f5e',
          borderWidth: 1,
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1500,
        easing: 'easeInOutQuart'
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#94a3b8', font: { size: 11 } }
        },
        tooltip: {
          backgroundColor: '#1e213e',
          borderColor: 'rgba(147,130,245,0.3)',
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#cbd5e1',
          callbacks: {
            label: ctx => `฿ ${ctx.parsed.y.toLocaleString()}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b' }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#64748b',
            callback: v => v >= 1000 ? (v / 1000) + 'k' : v
          }
        }
      }
    }
  });
}

function bindFinanceEvents(container) {
  container.querySelector('#btn-add-tx')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-modal', { detail: { modal: 'add-transaction' } }));
  });

  container.querySelectorAll('.tx-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentFilterType = e.currentTarget.getAttribute('data-filter');
      renderFinance(container);
    });
  });

  container.querySelector('#tx-cat-select')?.addEventListener('change', (e) => {
    currentCategory = e.target.value;
    renderFinance(container);
  });

  container.querySelector('#tx-search-input')?.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderFinance(container);
  });

  // Modern Decision Dialog for Deletion
  container.querySelectorAll('.btn-delete-tx').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const confirmed = await showConfirmDialog({
        title: 'ยืนยันการลบรายการเงิน',
        message: 'คุณแน่ใจว่าต้องการลบรายการธุรกรรมนี้ใช่หรือไม่? ข้อมูลนี้จะถูกนำออกจากระบบอย่างถาวร',
        confirmText: 'ลบรายการทันที',
        cancelText: 'ยกเลิก',
        type: 'danger',
        icon: 'trash-2'
      });

      if (confirmed) {
        state.deleteTransaction(id);
      }
    });
  });

  container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
    const txs = state.data.transactions;
    let csv = 'ID,Type,Title,Amount,Category,Date,Note\n';
    txs.forEach(t => {
      csv += `"${t.id}","${t.type}","${t.title.replace(/"/g, '""')}","${t.amount}","${t.category}","${t.date}","${(t.note || '').replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qovynt_finance_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('ส่งออกไฟล์ CSV สำเร็จ!', 'success');
  });
}
