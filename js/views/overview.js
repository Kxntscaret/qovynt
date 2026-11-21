// 1. Overview Page View - Faithful, high-fidelity implementation of the design reference
import { state } from '../state.js';
import { formatMoney, formatThaiDateShort, formatThaiDateTime, triggerConfetti } from '../utils.js';

let financeLineChart = null;
let expenseDonutChart = null;
let currentTxTab = 'all'; // 'all', 'income', 'expense'

export function renderOverview(container) {
  const metrics = state.getFinancialMetrics();
  const tasks = state.data.tasks.slice(0, 5);
  const goals = state.data.goals.slice(0, 4);
  const projects = state.data.projects.slice(0, 3);
  const events = state.data.calendarEvents.slice(0, 5);
  const note = state.data.notes[0] || { title: 'บันทึกย่อ', content: 'ยังไม่มีบันทึก' };

  // Filter recent transactions
  let recentTxs = state.data.transactions;
  if (currentTxTab === 'income') {
    recentTxs = recentTxs.filter(t => t.type === 'income');
  } else if (currentTxTab === 'expense') {
    recentTxs = recentTxs.filter(t => t.type === 'expense');
  }
  recentTxs = recentTxs.slice(0, 5);

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- 4 Top Metric Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Income Card -->
        <div class="glass-panel glass-panel-hover p-5 relative overflow-hidden flex flex-col justify-between">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <i data-lucide="wallet" class="w-6 h-6"></i>
            </div>
            <div class="text-right">
              <span class="text-xs font-medium text-slate-400">รายรับเดือนนี้</span>
              <div class="text-2xl font-bold text-white tracking-tight mt-1">${formatMoney(metrics.totalIncome)}</div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-4 pt-2 border-t border-slate-800/60 text-xs">
            <div class="flex items-center gap-1 text-emerald-400 font-medium">
              <i data-lucide="trending-up" class="w-3.5 h-3.5"></i>
              <span>+12%</span>
            </div>
            <!-- Sparkline SVG -->
            <svg class="w-24 h-6 text-emerald-400" viewBox="0 0 100 25" fill="none">
              <path d="M0 20 Q 25 15, 50 18 T 100 5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <!-- Expense Card -->
        <div class="glass-panel glass-panel-hover p-5 relative overflow-hidden flex flex-col justify-between">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <i data-lucide="receipt" class="w-6 h-6"></i>
            </div>
            <div class="text-right">
              <span class="text-xs font-medium text-slate-400">รายจ่ายเดือนนี้</span>
              <div class="text-2xl font-bold text-white tracking-tight mt-1">${formatMoney(metrics.totalExpense)}</div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-4 pt-2 border-t border-slate-800/60 text-xs">
            <div class="flex items-center gap-1 text-rose-400 font-medium">
              <i data-lucide="trending-down" class="w-3.5 h-3.5"></i>
              <span>-8%</span>
            </div>
            <!-- Sparkline SVG -->
            <svg class="w-24 h-6 text-rose-400" viewBox="0 0 100 25" fill="none">
              <path d="M0 8 Q 30 22, 60 12 T 100 20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <!-- Net Balance Card -->
        <div class="glass-panel glass-panel-hover p-5 relative overflow-hidden flex flex-col justify-between">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <i data-lucide="credit-card" class="w-6 h-6"></i>
            </div>
            <div class="text-right">
              <span class="text-xs font-medium text-slate-400">เงินคงเหลือ</span>
              <div class="text-2xl font-bold ${metrics.balance >= 0 ? 'text-white' : 'text-rose-400'} tracking-tight mt-1">${formatMoney(metrics.balance)}</div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-4 pt-2 border-t border-slate-800/60 text-xs">
            <span class="text-slate-400">สถานะการเงิน</span>
            <span class="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">${metrics.balance >= 0 ? 'สภาพคล่องดี' : 'เกินงบประมาณ'}</span>
          </div>
        </div>

        <!-- Savings Goal Card -->
        <div class="glass-panel glass-panel-hover p-5 relative overflow-hidden flex flex-col justify-between">
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <i data-lucide="target" class="w-6 h-6"></i>
            </div>
            <div class="text-right">
              <span class="text-xs font-medium text-slate-400">เป้าหมายการออม</span>
              <div class="text-2xl font-bold text-white tracking-tight mt-1">${metrics.savingsPercent}%</div>
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
          
          <!-- Finance Overview Charts (Line + Donut) -->
          <div class="glass-panel p-5">
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
                <div class="relative flex items-center justify-center h-48">
                  <canvas id="overview-expense-donut"></canvas>
                  <div class="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                    <span class="text-xs font-bold text-white">${formatMoney(metrics.totalExpense)}</span>
                    <span class="text-[10px] text-slate-400">รวมรายจ่าย</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mid Section: Recent Transactions & Goals side by side -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Recent Transactions Widget -->
            <div class="glass-panel p-5 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-4">
                  <span class="font-semibold text-white text-base">รายการล่าสุด</span>
                  <!-- Tabs -->
                  <div class="flex items-center bg-slate-900/70 p-0.5 rounded-lg border border-slate-800 text-xs">
                    <button class="tx-tab-btn px-2.5 py-1 rounded-md transition-all ${currentTxTab === 'all' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-white'}" data-tab="all">ทั้งหมด</button>
                    <button class="tx-tab-btn px-2.5 py-1 rounded-md transition-all ${currentTxTab === 'income' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-white'}" data-tab="income">รายรับ</button>
                    <button class="tx-tab-btn px-2.5 py-1 rounded-md transition-all ${currentTxTab === 'expense' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-white'}" data-tab="expense">รายจ่าย</button>
                  </div>
                </div>

                <!-- Transaction Rows -->
                <div class="space-y-3">
                  ${recentTxs.length === 0 ? `
                    <div class="text-center py-6 text-slate-400 text-xs">ไม่มีรายการในหมวดนี้</div>
                  ` : recentTxs.map(tx => {
                    const isInc = tx.type === 'income';
                    const iconName = isInc ? 'arrow-down-left' : 'arrow-up-right';
                    const iconBg = isInc ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30';
                    return `
                      <div class="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/40 transition-colors">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}">
                            <i data-lucide="${iconName}" class="w-4 h-4"></i>
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
                <button id="btn-view-all-txs" class="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors">
                  ดูประวัติทั้งหมด →
                </button>
              </div>
            </div>

            <!-- My Goals Widget -->
            <div class="glass-panel p-5 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-4">
                  <span class="font-semibold text-white text-base">เป้าหมายของฉัน</span>
                  <button id="btn-view-all-goals" class="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1">
                    ดูทั้งหมด →
                  </button>
                </div>

                <div class="space-y-3.5">
                  ${goals.map(g => {
                    const percent = Math.min(100, Math.round((g.current / g.target) * 100));
                    return `
                      <div class="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 transition-all">
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
                        <div class="text-[10px] text-slate-400 text-right">${g.remainingText}</div>
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
          <div class="glass-panel p-5">
            <div class="flex items-center justify-between mb-4">
              <span class="font-semibold text-white text-base">โปรเจกต์ที่กำลังทำ</span>
              <button id="btn-view-all-projects" class="text-xs text-purple-400 hover:text-purple-300 font-medium">ดูทั้งหมด →</button>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              ${projects.map(p => `
                <div class="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-purple-500/40 transition-all group">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">${p.title}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">${p.stage}</span>
                  </div>
                  <div class="progress-track mb-2">
                    <div class="progress-fill bg-gradient-to-r from-indigo-500 to-purple-500" style="width: ${p.progress}%;"></div>
                  </div>
                  <div class="flex justify-between items-center text-[10px] text-slate-400">
                    <span>ความคืบหน้า</span>
                    <span class="font-bold text-slate-300">${p.progress}%</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- Right Side Widgets Column (4 Cols) -->
        <div class="xl:col-span-4 space-y-6">
          
          <!-- Mini Calendar Widget -->
          <div class="glass-panel p-5">
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm font-semibold text-white" id="mini-cal-title">พฤศจิกายน 2569</span>
              <div class="flex items-center gap-1 text-slate-400">
                <button class="p-1 hover:text-white transition-colors" id="cal-prev-btn"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>
                <button class="p-1 hover:text-white transition-colors" id="cal-next-btn"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>
              </div>
            </div>
            <!-- Weekday headers -->
            <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-400 mb-2">
              <span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span>
            </div>
            <!-- Days grid -->
            <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium" id="mini-cal-days">
              <!-- Rendered via JS -->
            </div>
          </div>

          <!-- Motivational Mountain Night Quote Card -->
          <div class="relative rounded-2xl overflow-hidden border border-purple-500/20 shadow-xl group">
            <img src="assets/night-mountains.svg" alt="Night Mountains" class="w-full h-36 object-cover transition-transform duration-700 group-hover:scale-105" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-4 flex flex-col justify-end">
              <p class="text-xs italic text-slate-200 font-medium">"การจัดการชีวิตที่ดี เริ่มจากการรู้จักตัวเอง"</p>
              <span class="text-[10px] text-purple-400 font-semibold mt-1">— QOVYNT</span>
            </div>
          </div>

          <!-- Quick Access Action Buttons (2x2 Grid) -->
          <div class="glass-panel p-5">
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
          <div class="glass-panel p-5">
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
          <div class="glass-panel p-5">
            <div class="flex items-center justify-between mb-4">
              <span class="font-semibold text-white text-base">ปฏิทินวันนี้</span>
              <button id="btn-view-all-calendar" class="text-xs text-purple-400 hover:text-purple-300 font-medium">ดูทั้งหมด →</button>
            </div>

            <div class="space-y-3">
              ${events.map(ev => `
                <div class="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
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
          <div class="glass-panel p-5 border-amber-500/20 bg-amber-500/5">
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

  // Initialize Icons
  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }

  // Bind Listeners
  bindOverviewEvents(container, metrics);
  renderMiniCalendar();
  initOverviewCharts(metrics);
}

function renderMiniCalendar() {
  const container = document.getElementById('mini-cal-days');
  if (!container) return;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const todayDate = now.getDate();

  // First day of month
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  // Total days in month
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  let html = '';
  // Empty slots
  for (let i = 0; i < firstDay; i++) {
    html += `<span class="py-1 text-slate-700"></span>`;
  }
  // Days
  for (let d = 1; d <= totalDays; d++) {
    const isToday = d === todayDate;
    if (isToday) {
      html += `
        <span class="py-1 w-7 h-7 mx-auto rounded-full bg-purple-600 text-white font-bold flex items-center justify-center shadow-lg shadow-purple-600/40">
          ${d}
        </span>
      `;
    } else {
      html += `
        <span class="py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors flex items-center justify-center">
          ${d}
        </span>
      `;
    }
  }

  container.innerHTML = html;
}

function initOverviewCharts(metrics) {
  // Destroy existing charts if reloading
  if (financeLineChart) financeLineChart.destroy();
  if (expenseDonutChart) expenseDonutChart.destroy();

  const lineCanvas = document.getElementById('overview-finance-line');
  const donutCanvas = document.getElementById('overview-expense-donut');

  if (lineCanvas && window.Chart) {
    const ctx = lineCanvas.getContext('2d');
    financeLineChart = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: ['1', '5', '10', '15', '20', '25', '30'],
        datasets: [
          {
            label: 'รายรับ',
            data: [3000, 3000, 4500, 14000, 14000, 17000, 17000],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: '#10b981'
          },
          {
            label: 'รายจ่าย',
            data: [600, 1490, 2690, 3040, 3680, 5250, 5250],
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.08)',
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: '#f43f5e'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e213e',
            borderColor: 'rgba(147, 130, 245, 0.2)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: '#cbd5e1'
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

  if (donutCanvas && window.Chart) {
    const ctx = donutCanvas.getContext('2d');
    const categories = Object.keys(metrics.categoryExpenses);
    const dataValues = Object.values(metrics.categoryExpenses);
    const colors = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#64748b'];

    expenseDonutChart = new window.Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories.length ? categories : ['อาหาร', 'เดินทาง', 'ช้อปปิ้ง', 'การเรียน', 'บันเทิง', 'อื่น ๆ'],
        datasets: [{
          data: dataValues.length ? dataValues : [1680, 945, 788, 630, 525, 682],
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e213e',
            borderColor: 'rgba(147, 130, 245, 0.2)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: '#cbd5e1'
          }
        }
      }
    });
  }
}

function bindOverviewEvents(container, metrics) {
  // Navigation button binds
  container.querySelector('#btn-view-all-txs')?.addEventListener('click', () => state.setView('finance'));
  container.querySelector('#btn-view-all-goals')?.addEventListener('click', () => state.setView('goals'));
  container.querySelector('#btn-view-all-projects')?.addEventListener('click', () => state.setView('projects'));
  container.querySelector('#btn-view-all-tasks')?.addEventListener('click', () => state.setView('tasks'));
  container.querySelector('#btn-view-all-calendar')?.addEventListener('click', () => state.setView('calendar'));

  // Quick Action buttons
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

  // Task Checkboxes
  container.querySelectorAll('.custom-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const taskId = e.target.getAttribute('data-task-id');
      state.toggleTask(taskId);
    });
  });

  // Transaction Tabs
  container.querySelectorAll('.tx-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentTxTab = e.currentTarget.getAttribute('data-tab');
      renderOverview(container);
    });
  });
}
