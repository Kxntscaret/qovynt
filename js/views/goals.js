// 5. Goals View - Goals and Milestones Tracker with Celebration effects and Decision Dialogs
import { state } from '../state.js';
import { formatMoney, triggerConfetti, showToast } from '../utils.js';
import { showConfirmDialog } from '../modals.js';

export function renderGoals(container) {
  const metrics = state.getFinancialMetrics();
  const goals = state.data.goals;
  const completedGoals = goals.filter(g => {
    const isFinanceGoal = !g.unit || g.unit === '฿' || g.category === 'finance';
    const effectiveCurrent = isFinanceGoal ? Math.max(g.current || 0, Math.max(0, metrics.balance)) : (g.current || 0);
    return effectiveCurrent >= g.target;
  }).length;

  container.innerHTML = `
    <div class="space-y-6 pb-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 stagger-item stagger-1">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2">
            <i data-lucide="target" class="w-6 h-6 text-purple-400"></i>
            เป้าหมายและความคืบหน้า (Goals)
          </h1>
          <p class="text-xs text-slate-400 mt-1">ตั้งเป้าหมายชีวิต ติดตามความคืบหน้า และเฉลิมฉลองทุกความสำเร็จ</p>
        </div>
        <button id="btn-add-goal" class="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all hover:scale-105 flex items-center gap-2">
          <i data-lucide="plus" class="w-4 h-4"></i> ตั้งเป้าหมายใหม่
        </button>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="glass-panel glass-panel-hover p-4 flex items-center justify-between stagger-item stagger-1">
          <div>
            <span class="text-xs text-slate-400">เป้าหมายทั้งหมด</span>
            <div class="text-xl font-bold text-white mt-0.5">${goals.length} เป้าหมาย</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <i data-lucide="flag" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="glass-panel glass-panel-hover p-4 flex items-center justify-between stagger-item stagger-2">
          <div>
            <span class="text-xs text-slate-400">กำลังดำเนินการ</span>
            <div class="text-xl font-bold text-cyan-400 mt-0.5">${goals.length - completedGoals} เป้าหมาย</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <i data-lucide="compass" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="glass-panel glass-panel-hover p-4 flex items-center justify-between stagger-item stagger-3">
          <div>
            <span class="text-xs text-slate-400">บรรลุเป้าหมายแล้ว</span>
            <div class="text-xl font-bold text-emerald-400 mt-0.5">${completedGoals} เป้าหมาย</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <i data-lucide="trophy" class="w-5 h-5"></i>
          </div>
        </div>
      </div>

      <!-- Goals Grid Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-item stagger-3">
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
          const isDone = percent >= 100;
          return `
            <div class="glass-panel glass-panel-hover p-5 flex flex-col justify-between space-y-4 relative overflow-hidden group">
              ${isDone ? `
                <div class="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl pointer-events-none"></div>
              ` : ''}

              <div>
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <i data-lucide="${g.icon || 'target'}" class="w-5 h-5"></i>
                    </div>
                    <div>
                      <h3 class="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">${g.title}</h3>
                      <span class="text-[11px] text-slate-400">${remainingText}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-base font-extrabold ${isDone ? 'text-emerald-400' : 'text-purple-400'}">${percent}%</span>
                    <button class="btn-delete-goal block ml-auto mt-1 text-slate-500 hover:text-rose-400 transition-colors p-1" data-id="${g.id}">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </div>

                <div class="mt-4">
                  <div class="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                    <span>${g.unit === '฿' || !g.unit ? formatMoney(effectiveCurrent) : `${effectiveCurrent} ${g.unit}`}</span>
                    <span>${g.unit === '฿' || !g.unit ? formatMoney(g.target) : `${g.target} ${g.unit}`}</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill ${isDone ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-purple-500 to-cyan-400'}" style="width: ${percent}%;"></div>
                  </div>
                </div>
              </div>

              <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span class="text-xs text-slate-400">บันทึกความคืบหน้า:</span>
                <div class="flex items-center gap-1.5">
                  <button class="btn-add-progress px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white text-xs font-medium transition-colors" data-id="${g.id}" data-amount="${g.unit === '฿' ? '500' : '1'}">
                    +${g.unit === '฿' ? '฿500' : '1 ' + g.unit}
                  </button>
                  <button class="btn-add-progress px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white text-xs font-medium transition-colors" data-id="${g.id}" data-amount="${g.unit === '฿' ? '1000' : '5'}">
                    +${g.unit === '฿' ? '฿1,000' : '5 ' + g.unit}
                  </button>
                  ${isDone ? `
                    <button class="btn-celebrate px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-colors flex items-center gap-1">
                      <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> สำเร็จแล้ว!
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }

  bindGoalsEvents(container);
}

function bindGoalsEvents(container) {
  container.querySelector('#btn-add-goal')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-modal', { detail: { modal: 'add-goal' } }));
  });

  container.querySelectorAll('.btn-add-progress').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const amt = Number(e.currentTarget.getAttribute('data-amount'));
      state.updateGoalProgress(id, amt);

      const goal = state.data.goals.find(g => g.id === id);
      if (goal && goal.current >= goal.target) {
        triggerConfetti();
      }
    });
  });

  container.querySelectorAll('.btn-celebrate').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerConfetti();
    });
  });

  // Decision Dialog for Deleting Goal
  container.querySelectorAll('.btn-delete-goal').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const confirmed = await showConfirmDialog({
        title: 'ยืนยันการลบเป้าหมาย',
        message: 'คุณต้องการยกเลิกเป้าหมายนี้ใช่หรือไม่? บันทึกความคืบหน้าทั้งหมดจะถูกลบออก',
        confirmText: 'ลบเป้าหมาย',
        cancelText: 'ยกเลิก',
        type: 'danger',
        icon: 'trash-2'
      });

      if (confirmed) {
        state.deleteGoal(id);
      }
    });
  });
}
