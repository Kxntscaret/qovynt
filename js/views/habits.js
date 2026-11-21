// Bonus Habits View - Daily Habits and Streak Tracker
import { state } from '../state.js';
import { showToast, playAudioFeedback } from '../utils.js';

export function renderHabits(container) {
  const habits = state.data.habits;

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2">
            <i data-lucide="zap" class="w-6 h-6 text-purple-400"></i>
            นิสัยและกิจวัตรประจำวัน (Habits)
          </h1>
          <p class="text-xs text-slate-400 mt-1">สร้างวินัยที่ดีในทุก ๆ วัน สะสม Streak ความสำเร็จอย่างต่อเนื่อง</p>
        </div>
      </div>

      <!-- Habits Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${habits.map(h => `
          <div class="glass-panel p-5 flex items-center justify-between gap-4 ${h.completedToday ? 'border-emerald-500/30 bg-emerald-500/5' : ''}">
            <div class="flex items-center gap-3.5">
              <button class="habit-toggle-btn w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${h.completedToday ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-purple-500'}" data-id="${h.id}">
                <i data-lucide="${h.completedToday ? 'check' : 'circle'}" class="w-5 h-5"></i>
              </button>
              <div>
                <div class="text-sm font-bold text-white ${h.completedToday ? 'text-emerald-300' : ''}">${h.title}</div>
                <div class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span class="text-amber-400 font-semibold flex items-center gap-1">
                    <i data-lucide="flame" class="w-3.5 h-3.5 fill-amber-400"></i>
                    ${h.streak} วันติดต่อกัน
                  </span>
                </div>
              </div>
            </div>

            <span class="text-xs px-2.5 py-1 rounded-full ${h.completedToday ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}">
              ${h.completedToday ? 'ทำแล้ววันนี้' : 'ยังไม่ได้ทำ'}
            </span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }

  container.querySelectorAll('.habit-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      state.toggleHabit(id);
    });
  });
}
