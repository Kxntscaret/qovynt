// 1. Overview Page View - Faithful, high-fidelity implementation with 7 Core Animations
import { state } from '../state.js';
import { formatMoney, formatThaiDateShort, formatThaiDateTime, triggerConfetti, animateCounter } from '../utils.js';
import { filterFinanceByDate } from './finance.js';

let financeLineChart = null;
let expenseDonutChart = null;
let currentTxTab = 'all';
let miniCalViewMonth = new Date().getMonth();
let miniCalViewYear = new Date().getFullYear();

// --- Sparkline & Percentage Helpers ---

// Generate a smooth SVG bezier path string from an array of values
function buildSparklinePath(values) {
  if (!values || values.length === 0 || values.every(v => v === 0)) {
    return 'M 5 15 L 95 15';
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || max || 1;
  const W = 90, H = 20, padX = 5, padY = 3;
  const pts = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * (W - padX * 2);
    const y = H - padY - ((v - min) / range) * (H - padY * 2);
    return { x, y };
  });
  let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const mx = (p0.x + p1.x) / 2;
    path += ` C ${mx.toFixed(1)} ${p0.y.toFixed(1)}, ${mx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return path;
}

// Calculate monthly income/expense totals and week-by-week sparkline points
function calcSparklineData(metrics) {
  const txs = state.data.transactions || [];
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  // Weekly buckets for sparkline (4 weeks this month)
  const incomeWeeks = [0, 0, 0, 0];
  const expenseWeeks = [0, 0, 0, 0];
  let incomeThisMonth = 0, expenseThisMonth = 0;

  txs.forEach(t => {
    const d = new Date(t.date);
    if (isNaN(d)) return;
    const amt = Number(t.amount) || 0;
    if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
      const week = Math.min(3, Math.floor((d.getDate() - 1) / 7));
      if (t.type === 'income') { incomeWeeks[week] += amt; incomeThisMonth += amt; }
      else { expenseWeeks[week] += amt; expenseThisMonth += amt; }
    }
  });

  // Calculate dynamic percentages based directly on real income and expense
  const totalInc = metrics?.totalIncome || incomeThisMonth;
  const totalExp = metrics?.totalExpense || expenseThisMonth;
  const netBal = Math.max(0, totalInc - totalExp);

  // Income savings rate: % of income that remains saved
  const savingsRate = totalInc > 0 ? Math.round((netBal / totalInc) * 100) : 0;

  // Expense rate: % of income spent
  const expenseRate = totalInc > 0 ? Math.round((totalExp / totalInc) * 100) : (totalExp > 0 ? 100 : 0);

  return {
    incomeWeeks, expenseWeeks,
    savingsRate, expenseRate,
    hasIncomeData: totalInc > 0,
    hasExpenseData: totalExp > 0
  };
}

// Helper to map category to realistic rich icon & palette matching MyLife reference
function getTxCategoryMeta(category, type) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('อาหาร') || cat.includes('ข้าว') || cat.includes('กิน') || cat.includes('food')) {
    return { icon: 'utensils', bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
  }
  if (cat.includes('ครอบครัว') || cat.includes('เงินเดือน') || cat.includes('รายรับ') || type === 'income') {
    return { icon: 'wallet', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
  }
  if (cat.includes('เดิน') || cat.includes('รถ') || cat.includes('travel') || cat.includes('bus')) {
    return { icon: 'bus', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  }
  if (cat.includes('ช้อป') || cat.includes('ซื้อ') || cat.includes('ของใช้') || cat.includes('shop')) {
    return { icon: 'shopping-bag', bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30' };
  }
  if (cat.includes('เน็ต') || cat.includes('บิล') || cat.includes('wifi') || cat.includes('เน็ตบ้าน')) {
    return { icon: 'wifi', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
  }
  return type === 'income' 
    ? { icon: 'arrow-down-left', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
    : { icon: 'arrow-up-right', bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
}

// Helper to map project title to rich icon badge matching MyLife reference
function getProjectMeta(p) {
  const title = (p.title || '').toLowerCase();
  if (title.includes('web') || title.includes('ui') || title.includes('site')) {
    return { icon: 'layout', bg: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' };
  }
  if (title.includes('study') || title.includes('track') || title.includes('เรียน')) {
    return { icon: 'book-open', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  }
  if (title.includes('game') || title.includes('เกม')) {
    return { icon: 'gamepad-2', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
  }
  return { icon: 'folder-git-2', bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
}

export function renderOverview(container) {
  const metrics = state.getFinancialMetrics();
  const spark = calcSparklineData(metrics);
  const tasks = state.data.tasks.slice(0, 5);
  const goals = state.data.goals.slice(0, 4);
  const projects = state.data.projects.slice(0, 3);
  const events = state.data.calendarEvents.slice(0, 5);
  const note = state.data.notes[0] || { title: 'บันทึกย่อ', content: 'ยังไม่มีบันทึก' };

  let recentTxs = state.data.transactions;
  if (currentTxTab === 'income') {
    recentTxs = recentTxs.filter(t => t.type === 'income');
  } else if (currentTxTab === 'expense') {
    recentTxs = recentTxs.filter(t => t.type === 'expense');
  }
  recentTxs = recentTxs.slice(0, 5);

  container.innerHTML = `
    <div class="space-y-6 pb-12">
      <!-- 4 Top Metric Stat Cards (Stagger Entrance & 4. Hover Float & 5. Number Count-up) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Income Card -->
        <div class="glass-panel glass-panel-hover p-5 relative overflow-hidden flex flex-col justify-between stagger-item stagger-1">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <i data-lucide="wallet" class="w-6 h-6"></i>
            </div>
            <div class="text-right">
              <span class="text-xs font-medium text-slate-400">รายรับเดือนนี้</span>
              <div id="metric-income-val" class="text-2xl font-bold text-white tracking-tight mt-1">฿ 0</div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-4 pt-2 border-t border-slate-800/60 text-xs">
            ${spark.hasIncomeData ? `
              <div class="flex items-center gap-1 text-emerald-400 font-medium">
                <i data-lucide="trending-up" class="w-3.5 h-3.5"></i>
                <span>+${spark.savingsRate}%</span>
                <span class="text-[10px] text-slate-400 font-normal">คงเหลือ</span>
              </div>
              <svg class="w-24 h-6 text-emerald-400" viewBox="0 0 100 25" fill="none">
                <path d="${buildSparklinePath(spark.incomeWeeks)}" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            ` : `
              <span class="text-slate-500 text-[11px]">ยังไม่มีรายการเดือนนี้</span>
              <svg class="w-20 h-4 text-slate-700" viewBox="0 0 100 20" fill="none">
                <line x1="0" y1="10" x2="100" y2="10" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4" />
              </svg>
            `}
          </div>
        </div>

        <!-- Expense Card -->
        <div class="glass-panel glass-panel-hover p-5 relative overflow-hidden flex flex-col justify-between stagger-item stagger-2">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <i data-lucide="receipt" class="w-6 h-6"></i>
            </div>
            <div class="text-right">
              <span class="text-xs font-medium text-slate-400">รายจ่ายเดือนนี้</span>
              <div id="metric-expense-val" class="text-2xl font-bold text-white tracking-tight mt-1">฿ 0</div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-4 pt-2 border-t border-slate-800/60 text-xs">
            ${spark.hasExpenseData ? `
              <div class="flex items-center gap-1 ${spark.expenseRate > 80 ? 'text-rose-400' : 'text-amber-400'} font-medium">
                <i data-lucide="receipt" class="w-3.5 h-3.5"></i>
                <span>${spark.expenseRate}%</span>
                <span class="text-[10px] text-slate-400 font-normal">ของรายรับ</span>
              </div>
              <svg class="w-24 h-6 text-rose-400" viewBox="0 0 100 25" fill="none">
                <path d="${buildSparklinePath(spark.expenseWeeks)}" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            ` : `
              <span class="text-slate-500 text-[11px]">ยังไม่มีรายการเดือนนี้</span>
              <svg class="w-20 h-4 text-slate-700" viewBox="0 0 100 20" fill="none">
                <line x1="0" y1="10" x2="100" y2="10" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4" />
              </svg>
            `}
          </div>
        </div>

        <!-- Net Balance Card (No Status Badge) -->
        <div class="glass-panel glass-panel-hover p-5 relative overflow-hidden flex flex-col justify-between stagger-item stagger-3">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <i data-lucide="credit-card" class="w-6 h-6"></i>
            </div>
            <div class="text-right">
              <span class="text-xs font-medium text-slate-400">เงินคงเหลือ</span>
              <div id="metric-balance-val" class="text-2xl font-bold text-white tracking-tight mt-1">฿ 0</div>
            </div>
          </div>
        </div>

        <!-- Savings Goal Card -->
        <div class="glass-panel glass-panel-hover p-5 relative overflow-hidden flex flex-col justify-between stagger-item stagger-4">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <i data-lucide="target" class="w-6 h-6"></i>
            </div>
            <div class="text-right">
              <span class="text-xs font-medium text-slate-400">เป้าหมายการออม</span>
              <div id="metric-savings-val" class="text-2xl font-bold text-white tracking-tight mt-1">0%</div>
            </div>
          </div>
          <div class="mt-4 pt-2 border-t border-slate-800/60">
            <div class="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>ความคืบหน้า</span>
              <span>${formatMoney(Math.max(0, metrics.balance))} / ${formatMoney(metrics.savingsTarget)}</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill bg-gradient-to-r from-purple-500 to-indigo-500" style="width: ${metrics.savingsPercent}%;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Dashboard Content Grid: 2 Columns (Main 8 cols, Right Widgets 4 cols) -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        <!-- Left & Center Column (8 Cols) -->
        <div class="xl:col-span-8 space-y-6">
          
          <!-- 5. Finance Overview Charts (Progressive Line Draw Animation) -->
          <div class="glass-panel glass-panel-hover p-5 stagger-item stagger-3">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-white text-base">ภาพรวมการเงิน</span>
                <span class="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
              </div>
              <div class="flex items-center gap-4 text-xs">
                <div class="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> รายรับ
                </div>
                <div class="flex items-center gap-1.5 text-rose-400 font-medium">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-400"></span> รายจ่าย
                </div>
                <select id="overview-chart-filter" class="bg-slate-900/80 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-purple-500">
                  <option value="month">เดือนนี้</option>
                  <option value="year">ปีนี้</option>
                </select>
              </div>
            </div>

            <!-- Chart Containers Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
              <!-- Line Chart (7 cols) -->
              <div class="lg:col-span-7 h-64 relative">
                <canvas id="overview-finance-line"></canvas>
              </div>

              <!-- Donut Chart & Category Breakdown (5 cols) -->
              <div class="lg:col-span-5 flex flex-col justify-center">
                <div class="text-xs font-medium text-slate-400 mb-2">สรุปค่าใช้จ่ายตามหมวดหมู่</div>
                <div class="relative flex items-center justify-center h-48" id="overview-donut-wrapper">
                  ${metrics.totalExpense > 0 ? `
                    <canvas id="overview-expense-donut"></canvas>
                    <div class="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                      <span class="text-xs font-bold text-white">${formatMoney(metrics.totalExpense)}</span>
                      <span class="text-[10px] text-slate-400">รวมรายจ่าย</span>
                    </div>
                  ` : `
                    <div class="flex flex-col items-center justify-center text-center gap-2 text-slate-500 text-xs py-6">
                      <div class="w-12 h-12 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400">
                        <i data-lucide="pie-chart" class="w-6 h-6"></i>
                      </div>
                      <span class="text-slate-400 font-medium">ยังไม่มีบันทึกรายจ่าย</span>
                      <span class="text-[11px] text-slate-600">เมื่อมีรายการ ระบบจะสรุปกราฟให้ที่นี่</span>
                    </div>
                  `}
                </div>
              </div>
            </div>
          </div>

          <!-- Mid Section: Recent Transactions & Goals side by side -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Recent Transactions Widget -->
            <div class="glass-panel glass-panel-hover p-5 flex flex-col justify-between stagger-item stagger-4">
              <div>
                <div class="flex items-center justify-between mb-4">
                  <span class="font-semibold text-white text-base">รายการล่าสุด</span>
                  <div class="flex items-center bg-slate-900/70 p-0.5 rounded-lg border border-slate-800 text-xs">
                    <button class="tx-tab-btn px-2.5 py-1 rounded-md transition-all ${currentTxTab === 'all' ? 'bg-purple-600 text-white font-medium shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'}" data-tab="all">ทั้งหมด</button>
                    <button class="tx-tab-btn px-2.5 py-1 rounded-md transition-all ${currentTxTab === 'income' ? 'bg-purple-600 text-white font-medium shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'}" data-tab="income">รายรับ</button>
                    <button class="tx-tab-btn px-2.5 py-1 rounded-md transition-all ${currentTxTab === 'expense' ? 'bg-purple-600 text-white font-medium shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'}" data-tab="expense">รายจ่าย</button>
                  </div>
                </div>

                <div class="space-y-3" id="overview-recent-txs-container">
                  ${recentTxs.length === 0 ? `
                    <div class="text-center py-6 text-slate-400 text-xs">ไม่มีรายการในหมวดนี้</div>
                  ` : recentTxs.map(tx => {
                    const isInc = tx.type === 'income';
                    const meta = getTxCategoryMeta(tx.category, tx.type);
                    return `
                      <div class="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/40 transition-all duration-200 hover:translate-x-1">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${meta.bg}">
                            <i data-lucide="${meta.icon}" class="w-4 h-4"></i>
                          </div>
                          <div>
                            <div class="text-xs font-medium text-white">${tx.title}</div>
                            <div class="text-[10px] text-slate-400">${tx.category} • ${formatThaiDateTime(tx.date)}</div>
                          </div>
                        </div>
                        <div class="text-xs font-semibold ${isInc ? 'text-emerald-400' : 'text-rose-400'}">
                          ${isInc ? '+' : '-'} ${formatMoney(tx.amount)}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-800/60">
                <button id="btn-view-all-txs" class="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors group">
                  <span>ดูประวัติทั้งหมด</span>
                  <i data-lucide="arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"></i>
                </button>
              </div>
            </div>

            <!-- My Goals Widget -->
            <div class="glass-panel glass-panel-hover p-5 flex flex-col justify-between stagger-item stagger-4">
              <div>
                <div class="flex items-center justify-between mb-4">
                  <span class="font-semibold text-white text-base">เป้าหมายของฉัน</span>
                  <button id="btn-view-all-goals" class="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 group">
                    <span>ดูทั้งหมด</span>
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"></i>
                  </button>
                </div>

                <div class="space-y-3.5">
                  ${goals.map(g => {
                    const isFinanceGoal = !g.unit || g.unit === '฿' || g.category === 'finance';
                    const effectiveCurrent = isFinanceGoal 
                      ? Math.max(g.current || 0, Math.max(0, metrics.balance))
                      : (g.current || 0);
                    const percent = Math.min(100, Math.round((effectiveCurrent / g.target) * 100));
                    const remaining = Math.max(0, g.target - effectiveCurrent);
                    const remainingText = remaining === 0 
                      ? 'สำเร็จตามเป้าหมายแล้ว! 🎉' 
                      : `เหลืออีก ${g.unit === '฿' || !g.unit ? '฿ ' + remaining.toLocaleString() : remaining + ' ' + g.unit}`;

                    return `
                      <div class="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 transition-all hover:scale-[1.01]">
                        <div class="flex items-center justify-between mb-1.5">
                          <div class="flex items-center gap-2.5">
                            <div class="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">
                              <i data-lucide="${g.icon || 'target'}" class="w-3.5 h-3.5"></i>
                            </div>
                            <span class="text-xs font-medium text-white">${g.title}</span>
                          </div>
                          <span class="text-xs font-bold text-purple-400">${percent}%</span>
                        </div>
                        <div class="progress-track mb-1">
                          <div class="progress-fill bg-gradient-to-r from-purple-500 to-cyan-400" style="width: ${percent}%;"></div>
                        </div>
                        <div class="flex justify-between items-center text-[10px] text-slate-400">
                          <span>${g.unit === '฿' || !g.unit ? '฿ ' + effectiveCurrent.toLocaleString() : effectiveCurrent + ' ' + g.unit} / ${g.unit === '฿' || !g.unit ? '฿ ' + g.target.toLocaleString() : g.target + ' ' + g.unit}</span>
                          <span>${remainingText}</span>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-800/60">
                <button id="btn-quick-add-goal" class="w-full py-1.5 rounded-lg border border-dashed border-slate-700 hover:border-purple-500/50 text-xs text-slate-400 hover:text-purple-300 transition-colors flex items-center justify-center gap-1.5">
                  <i data-lucide="plus" class="w-3.5 h-3.5"></i> ตั้งเป้าหมายใหม่
                </button>
              </div>
            </div>
          </div>

          <!-- Active Projects in Progress -->
          <div class="glass-panel glass-panel-hover p-5 stagger-item stagger-5">
            <div class="flex items-center justify-between mb-4">
              <span class="font-semibold text-white text-base">โปรเจกต์ที่กำลังทำ</span>
              <button id="btn-view-all-projects" class="text-xs text-purple-400 hover:text-purple-300 font-medium">ดูทั้งหมด →</button>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              ${projects.map(p => {
                const pMeta = getProjectMeta(p);
                return `
                  <div class="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1 group">
                    <div class="flex items-center gap-2.5 mb-2.5">
                      <div class="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${pMeta.bg}">
                        <i data-lucide="${pMeta.icon}" class="w-4 h-4"></i>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between">
                          <span class="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors truncate">${p.title}</span>
                          <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 shrink-0 ml-1">${p.stage}</span>
                        </div>
                      </div>
                    </div>
                    <div class="progress-track mb-2">
                      <div class="progress-fill bg-gradient-to-r from-indigo-500 to-purple-500" style="width: ${p.progress}%;"></div>
                    </div>
                    <div class="flex justify-between items-center text-[10px] text-slate-400">
                      <span>ความคืบหน้า</span>
                      <span class="font-bold text-slate-300">${p.progress}%</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

        </div>

        <!-- Right Side Widgets Column (4 Cols) -->
        <div class="xl:col-span-4 space-y-6">
          
          <!-- Mini Calendar Widget -->
          <div class="glass-panel glass-panel-hover p-5 stagger-item stagger-2">
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm font-semibold text-white" id="mini-cal-title">พฤศจิกายน 2569</span>
              <div class="flex items-center gap-1 text-slate-400">
                <button class="p-1 hover:text-white transition-colors" id="cal-prev-btn"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
                <button class="p-1 hover:text-white transition-colors" id="cal-next-btn"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
              </div>
            </div>
            <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-400 mb-2">
              <span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span>
            </div>
            <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium" id="mini-cal-days"></div>
          </div>

          <!-- Motivational Mountain Night Quote Card -->
          <div class="relative rounded-2xl overflow-hidden border border-purple-500/20 shadow-xl group cursor-pointer transition-transform duration-300 hover:-translate-y-1 stagger-item stagger-3">
            <img src="assets/night-mountains.svg" alt="Night Mountains" class="w-full h-36 object-cover transition-transform duration-700 group-hover:scale-105" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-4 flex flex-col justify-end">
              <p class="text-xs italic text-slate-200 font-medium">"การจัดการชีวิตที่ดี เริ่มจากการรู้จักตัวเอง"</p>
              <span class="text-[10px] text-purple-400 font-semibold mt-1">— QOVYNT</span>
            </div>
          </div>

          <!-- Quick Access Action Buttons (4. Hover Float & Micro Scale) -->
          <div class="glass-panel glass-panel-hover p-5 stagger-item stagger-4">
            <div class="text-xs font-semibold text-slate-400 mb-3 flex items-center justify-between">
              <span>Quick Access</span>
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-purple-400"></i>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <button id="quick-btn-tx" class="quick-action-btn">
                <div class="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <i data-lucide="wallet" class="w-4 h-4"></i>
                </div>
                <span class="text-xs font-medium text-white">เพิ่มรายรับ/จ่าย</span>
              </button>

              <button id="quick-btn-task" class="quick-action-btn">
                <div class="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <i data-lucide="check-square" class="w-4 h-4"></i>
                </div>
                <span class="text-xs font-medium text-white">สร้างงานใหม่</span>
              </button>

              <button id="quick-btn-note" class="quick-action-btn">
                <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <i data-lucide="file-text" class="w-4 h-4"></i>
                </div>
                <span class="text-xs font-medium text-white">เพิ่มบันทึก</span>
              </button>

              <button id="quick-btn-goal" class="quick-action-btn">
                <div class="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <i data-lucide="target" class="w-4 h-4"></i>
                </div>
                <span class="text-xs font-medium text-white">ตั้งเป้าหมาย</span>
              </button>
            </div>
          </div>

          <!-- Tasks Checklist Widget -->
          <div class="glass-panel glass-panel-hover p-5 stagger-item stagger-4">
            <div class="flex items-center justify-between mb-4">
              <span class="font-semibold text-white text-base">งานที่ต้องทำ (Tasks)</span>
              <button id="btn-view-all-tasks" class="text-xs text-purple-400 hover:text-purple-300 font-medium">ดูทั้งหมด →</button>
            </div>

            <div class="space-y-3">
              ${tasks.map(t => {
                const badgeClass = t.category === 'เรียน' ? 'badge-study' : t.category === 'สุขภาพ' ? 'badge-health' : t.category === 'การเงิน' ? 'badge-finance' : 'badge-work';
                return `
                  <div class="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-800/40 transition-colors">
                    <input type="checkbox" class="custom-checkbox mt-0.5" ${t.completed ? 'checked' : ''} data-task-id="${t.id}" />
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-medium text-white ${t.completed ? 'line-through text-slate-500' : ''}">${t.title}</div>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="badge-pill ${badgeClass}">${t.category}</span>
                        ${t.dueDate ? `<span class="text-[10px] text-slate-400">${t.dueDate}</span>` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Today's Schedule Agenda -->
          <div class="glass-panel glass-panel-hover p-5 stagger-item stagger-5">
            <div class="flex items-center justify-between mb-4">
              <span class="font-semibold text-white text-base">ปฏิทินวันนี้</span>
              <button id="btn-view-all-calendar" class="text-xs text-purple-400 hover:text-purple-300 font-medium">ดูทั้งหมด →</button>
            </div>

            <div class="space-y-3">
              ${events.map(ev => `
                <div class="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-purple-500/40 transition-colors">
                  <div class="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0"></div>
                  <div>
                    <div class="text-[10px] font-semibold text-purple-400">${ev.startTime} - ${ev.endTime}</div>
                    <div class="text-xs font-medium text-white mt-0.5">${ev.title}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Quick Sticky Note Widget -->
          <div class="glass-panel glass-panel-hover p-5 border-amber-500/20 bg-amber-500/5 stagger-item stagger-5">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <i data-lucide="sticky-note" class="w-4 h-4"></i>
                <span>บันทึกย่อ</span>
              </div>
              <button id="btn-edit-quick-note" class="text-slate-400 hover:text-white transition-colors">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
            </div>
            <div class="text-xs font-semibold text-white mb-1">${note.title}</div>
            <div class="text-xs text-slate-300 whitespace-pre-line leading-relaxed">${note.content}</div>
          </div>

        </div>

      </div>
    </div>
  `;

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons({ root: container });
    window.lucide.createIcons();
  }

  // 5. Trigger Number Count-Up Animations
  animateCounter(container.querySelector('#metric-income-val'), metrics.totalIncome, 1300, '฿ ');
  animateCounter(container.querySelector('#metric-expense-val'), metrics.totalExpense, 1300, '฿ ');
  animateCounter(container.querySelector('#metric-balance-val'), metrics.balance, 1300, '฿ ');
  animateCounter(container.querySelector('#metric-savings-val'), metrics.savingsPercent, 1300, '', '%');

  bindOverviewEvents(container, metrics);
  renderMiniCalendar();
  initOverviewCharts(metrics);
}

function renderMiniCalendar() {
  const container = document.getElementById('mini-cal-days');
  if (!container) return;

  const now = new Date();
  const todayDate = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  const viewMonth = miniCalViewMonth;
  const viewYear = miniCalViewYear;

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Build set of days that have events this month
  const eventDays = new Set();
  (state.data.calendarEvents || []).forEach(ev => {
    const d = new Date(ev.date || ev.start || ev.startDate || '');
    if (!isNaN(d) && d.getMonth() === viewMonth && d.getFullYear() === viewYear) {
      eventDays.add(d.getDate());
    }
  });

  // Update title
  const titleEl = document.getElementById('mini-cal-title');
  if (titleEl) {
    const monthNames = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    titleEl.textContent = `${monthNames[viewMonth]} ${viewYear + 543}`;
  }

  let html = '';
  for (let i = 0; i < firstDay; i++) {
    html += `<span class="py-1 text-slate-700"></span>`;
  }
  for (let d = 1; d <= totalDays; d++) {
    const isToday = d === todayDate && viewMonth === todayMonth && viewYear === todayYear;
    const hasEvent = eventDays.has(d);
    const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (isToday) {
      html += `
        <button type="button" class="mini-cal-day-cell relative py-1 w-7 h-7 mx-auto rounded-full bg-purple-600 text-white font-bold flex items-center justify-center shadow-lg shadow-purple-600/40 transition-transform hover:scale-110 cursor-pointer" data-date="${dateKey}" title="คลิกเพื่อดูรายการการเงินวันที่ ${d}">
          ${d}
          ${hasEvent ? '<span class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400"></span>' : ''}
        </button>
      `;
    } else {
      html += `
        <button type="button" class="mini-cal-day-cell relative py-1 w-7 h-7 mx-auto text-slate-400 hover:text-white hover:bg-purple-600/30 rounded-lg cursor-pointer transition-colors flex items-center justify-center" data-date="${dateKey}" title="คลิกเพื่อดูรายการการเงินวันที่ ${d}">
          ${d}
          ${hasEvent ? '<span class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400"></span>' : ''}
        </button>
      `;
    }
  }

  container.innerHTML = html;

  // Bind day clicks to filter finance
  container.querySelectorAll('.mini-cal-day-cell').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dateStr = e.currentTarget.getAttribute('data-date');
      if (dateStr) {
        filterFinanceByDate(dateStr);
      }
    });
  });
}

// 5. Finance Chart Progressive Line Drawing Animation
function initOverviewCharts(metrics) {
  if (financeLineChart) financeLineChart.destroy();
  if (expenseDonutChart) expenseDonutChart.destroy();

  const lineCanvas = document.getElementById('overview-finance-line');
  const donutCanvas = document.getElementById('overview-expense-donut');

  // Aggregate real transactions by day of current month
  const txs = state.data.transactions;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const incomeByDay = new Array(daysInMonth).fill(0);
  const expenseByDay = new Array(daysInMonth).fill(0);

  txs.forEach(t => {
    const d = new Date(t.date);
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return;
    const dayIdx = d.getDate() - 1;
    if (t.type === 'income') incomeByDay[dayIdx] += Number(t.amount) || 0;
    else expenseByDay[dayIdx] += Number(t.amount) || 0;
  });

  // Build cumulative arrays
  const incomeCum = [];
  const expenseCum = [];
  let runInc = 0, runExp = 0;
  incomeByDay.forEach((v, i) => {
    runInc += v; runExp += expenseByDay[i];
    incomeCum.push(runInc);
    expenseCum.push(runExp);
  });

  const hasLineData = runInc > 0 || runExp > 0;

  // Build sparse labels (every 5 days)
  const lineLabels = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return (day === 1 || day % 5 === 0) ? String(day) : '';
  });

  if (lineCanvas && window.Chart) {
    const ctx = lineCanvas.getContext('2d');

    if (!hasLineData) {
      lineCanvas.style.display = 'none';
      if (!lineCanvas.parentElement.querySelector('.chart-empty-state')) {
        const empty = document.createElement('div');
        empty.className = 'chart-empty-state flex flex-col items-center justify-center h-full gap-2 text-slate-600 text-xs';
        empty.innerHTML = `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/></svg><p>ยังไม่มีธุรกรรมเดือนนี้</p>`;
        lineCanvas.parentElement.appendChild(empty);
      }
    } else {
      lineCanvas.style.display = '';
      lineCanvas.parentElement.querySelector('.chart-empty-state')?.remove();
      financeLineChart = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: lineLabels,
          datasets: [
            {
              label: 'รายรับ',
              data: incomeCum,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderWidth: 2.5,
              tension: 0.4,
              fill: true,
              pointRadius: (ctx) => incomeCum[ctx.dataIndex] > 0 ? 3 : 0,
              pointHoverRadius: 6,
              pointBackgroundColor: '#10b981'
            },
            {
              label: 'รายจ่าย',
              data: expenseCum,
              borderColor: '#f43f5e',
              backgroundColor: 'rgba(244, 63, 94, 0.08)',
              borderWidth: 2.5,
              tension: 0.4,
              fill: true,
              pointRadius: (ctx) => expenseCum[ctx.dataIndex] > 0 ? 3 : 0,
              pointHoverRadius: 6,
              pointBackgroundColor: '#f43f5e'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1600,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e213e',
              borderColor: 'rgba(147, 130, 245, 0.2)',
              borderWidth: 1,
              titleColor: '#fff',
              bodyColor: '#cbd5e1',
              callbacks: {
                label: ctx => `${ctx.dataset.label}: ฿${ctx.parsed.y.toLocaleString()}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#64748b', font: { size: 10 } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.04)' },
              ticks: {
                color: '#64748b',
                font: { size: 10 },
                callback: value => value >= 1000 ? (value / 1000) + 'k' : value
              }
            }
          }
        }
      });
    }
  }

  if (donutCanvas && window.Chart && metrics.totalExpense > 0) {
    const ctx = donutCanvas.getContext('2d');
    const categories = Object.keys(metrics.categoryExpenses);
    const dataValues = Object.values(metrics.categoryExpenses);
    const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#64748b'];

    expenseDonutChart = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: dataValues,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1400,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e213e',
            borderColor: 'rgba(147, 130, 245, 0.2)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: '#cbd5e1',
            callbacks: {
              label: ctx => `${ctx.label}: ฿${ctx.parsed.toLocaleString()}`
            }
          }
        }
      }
    });
  }
}

function renderOverviewRecentTxs(container) {
  const listEl = container.querySelector('#overview-recent-txs-container');
  if (!listEl) return;
  let txs = state.data.transactions || [];
  if (currentTxTab === 'income') txs = txs.filter(t => t.type === 'income');
  else if (currentTxTab === 'expense') txs = txs.filter(t => t.type === 'expense');
  const recent = txs.slice(0, 5);

  if (recent.length === 0) {
    listEl.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs">ไม่มีรายการในหมวดนี้</div>`;
    return;
  }

  listEl.innerHTML = recent.map(tx => {
    const isInc = tx.type === 'income';
    const meta = getTxCategoryMeta(tx.category, tx.type);
    return `
      <div class="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/40 transition-all duration-200 hover:translate-x-1">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${meta.bg}">
            <i data-lucide="${meta.icon}" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="text-xs font-medium text-white">${tx.title}</div>
            <div class="text-[10px] text-slate-400">${tx.category} • ${formatThaiDateTime(tx.date)}</div>
          </div>
        </div>
        <div class="text-xs font-semibold ${isInc ? 'text-emerald-400' : 'text-rose-400'}">
          ${isInc ? '+' : '-'} ${formatMoney(tx.amount)}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) {
    window.lucide.createIcons({ root: listEl });
  }
}

function bindOverviewEvents(container, metrics) {
  container.querySelector('#btn-view-all-txs')?.addEventListener('click', () => state.setView('finance'));
  container.querySelector('#btn-view-all-goals')?.addEventListener('click', () => state.setView('goals'));
  container.querySelector('#btn-view-all-projects')?.addEventListener('click', () => state.setView('projects'));
  container.querySelector('#btn-view-all-tasks')?.addEventListener('click', () => state.setView('tasks'));
  container.querySelector('#btn-view-all-calendar')?.addEventListener('click', () => state.setView('calendar'));

  // Mini calendar navigation
  container.querySelector('#cal-prev-btn')?.addEventListener('click', () => {
    miniCalViewMonth--;
    if (miniCalViewMonth < 0) { miniCalViewMonth = 11; miniCalViewYear--; }
    renderMiniCalendar();
  });
  container.querySelector('#cal-next-btn')?.addEventListener('click', () => {
    miniCalViewMonth++;
    if (miniCalViewMonth > 11) { miniCalViewMonth = 0; miniCalViewYear++; }
    renderMiniCalendar();
  });

  container.querySelector('#quick-btn-tx')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-modal', { detail: { modal: 'add-transaction' } }));
  });
  container.querySelector('#quick-btn-task')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-modal', { detail: { modal: 'add-task' } }));
  });
  container.querySelector('#quick-btn-note')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-modal', { detail: { modal: 'add-note' } }));
  });
  container.querySelector('#quick-btn-goal')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-modal', { detail: { modal: 'add-goal' } }));
  });
  container.querySelector('#btn-quick-add-goal')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-modal', { detail: { modal: 'add-goal' } }));
  });

  container.querySelectorAll('.custom-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const taskId = e.target.getAttribute('data-task-id');
      state.toggleTask(taskId);
    });
  });

  container.querySelectorAll('.tx-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentTxTab = e.currentTarget.getAttribute('data-tab');
      // Update tab active styling smoothly without full page re-render
      container.querySelectorAll('.tx-tab-btn').forEach(b => {
        const isActive = b.getAttribute('data-tab') === currentTxTab;
        b.className = `tx-tab-btn px-2.5 py-1 rounded-md transition-all ${isActive ? 'bg-purple-600 text-white font-medium shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'}`;
      });
      renderOverviewRecentTxs(container);
    });
  });
}
