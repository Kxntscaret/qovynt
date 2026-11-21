// 4. Calendar View - Full personal calendar with interactive month grid and day agenda
import { state } from '../state.js';
import { formatThaiDateFull, formatThaiDateShort, getThaiBuddhistYear, showToast } from '../utils.js';

let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth(); // 0-11
let selectedDateStr = new Date().toISOString().slice(0, 10);

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export function renderCalendar(container) {
  const events = state.data.calendarEvents;
  const selectedEvents = events.filter(e => e.date === selectedDateStr);

  container.innerHTML = `
    <div class="space-y-6 animate-fade-in pb-12">
      <!-- Calendar Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2">
            <i data-lucide="calendar" class="w-6 h-6 text-purple-400"></i>
            ปฏิทินส่วนตัว (Calendar)
          </h1>
          <p class="text-xs text-slate-400 mt-1">วางแผนตารางเวลา นัดหมาย และกิจกรรมสำคัญของคุณในแต่ละวัน</p>
        </div>
        <div class="flex items-center gap-2.5">
          <button id="btn-today-cal" class="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium border border-slate-700 transition-colors">
            วันนี้
          </button>
          <button id="btn-add-event" class="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2">
            <i data-lucide="plus" class="w-4 h-4"></i> เพิ่มกิจกรรม
          </button>
        </div>
      </div>

      <!-- Main Layout: 2 Columns (Calendar 8 cols, Day Agenda 4 cols) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Monthly Grid (8 cols) -->
        <div class="lg:col-span-8 glass-panel p-6">
          <!-- Month Controls -->
          <div class="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
            <div class="text-lg font-bold text-white flex items-center gap-2">
              <span id="cal-month-name">${THAI_MONTHS[viewMonth]} ${viewYear + 543}</span>
            </div>
            <div class="flex items-center gap-2">
              <button id="btn-prev-month" class="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white transition-colors">
                <i data-lucide="chevron-left" class="w-4 h-4"></i>
              </button>
              <button id="btn-next-month" class="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white transition-colors">
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Weekday Headers -->
          <div class="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 mb-3">
            <span class="text-rose-400">อาทิตย์</span>
            <span>จันทร์</span>
            <span>อังคาร</span>
            <span>พุธ</span>
            <span>พฤหัสฯ</span>
            <span>ศุกร์</span>
            <span class="text-purple-400">เสาร์</span>
          </div>

          <!-- Days Grid -->
          <div class="grid grid-cols-7 gap-2" id="full-cal-days">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- Selected Day Agenda (4 cols) -->
        <div class="lg:col-span-4 space-y-6">
          <div class="glass-panel p-5">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <span class="text-xs text-slate-400">กำหนดการวันที่</span>
                <div class="text-sm font-bold text-white mt-0.5" id="agenda-date-title">${formatThaiDateFull(new Date(selectedDateStr))}</div>
              </div>
              <span class="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                ${selectedEvents.length} รายการ
              </span>
            </div>

            <!-- Event Cards -->
            <div class="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              ${selectedEvents.length === 0 ? `
                <div class="py-12 text-center text-slate-400 text-xs">
                  <i data-lucide="calendar-x" class="w-8 h-8 mx-auto text-slate-600 mb-2"></i>
                  ไม่มีนัดหมายในวันนี้
                  <button id="btn-add-for-day" class="mt-3 block mx-auto text-purple-400 hover:underline">
                    + เพิ่มกิจกรรมสำหรับวันนี้
                  </button>
                </div>
              ` : selectedEvents.map(ev => {
                const colorBorder = ev.color === 'rose' ? 'border-rose-500/40 text-rose-400' : ev.color === 'cyan' ? 'border-cyan-500/40 text-cyan-400' : ev.color === 'green' ? 'border-emerald-500/40 text-emerald-400' : 'border-purple-500/40 text-purple-400';
                return `
                  <div class="p-3.5 rounded-xl bg-slate-900/60 border ${colorBorder} hover:bg-slate-800/50 transition-all flex items-start justify-between gap-3 group">
                    <div>
                      <div class="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <i data-lucide="clock" class="w-3 h-3"></i>
                        ${ev.startTime} - ${ev.endTime}
                      </div>
                      <div class="text-xs font-semibold text-white mt-1">${ev.title}</div>
                      ${ev.category ? `<span class="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">${ev.category}</span>` : ''}
                    </div>
                    <button class="btn-delete-event opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-all p-1" data-id="${ev.id}">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }

  buildMonthGrid();
  bindCalendarEvents(container);
}

function buildMonthGrid() {
  const container = document.getElementById('full-cal-days');
  if (!container) return;

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const events = state.data.calendarEvents;

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
  const todayDate = today.getDate();

  let html = '';
  // Empty offset days
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="min-h-[80px] p-1.5 rounded-xl bg-slate-900/20 border border-slate-900/40 opacity-40"></div>`;
  }

  // Days
  for (let d = 1; d <= totalDays; d++) {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const dateKey = `${viewYear}-${monthStr}-${dayStr}`;

    const isToday = isCurrentMonth && d === todayDate;
    const isSelected = selectedDateStr === dateKey;

    // Events on this day
    const dayEvents = events.filter(e => e.date === dateKey);

    html += `
      <div 
        class="cal-day-cell min-h-[80px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${isSelected ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20' : isToday ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/40'}" 
        data-date="${dateKey}"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold ${isToday ? 'w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold' : isSelected ? 'text-purple-300 font-bold' : 'text-slate-300'}">
            ${d}
          </span>
          ${dayEvents.length > 0 ? `
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          ` : ''}
        </div>

        <div class="space-y-1 mt-1 overflow-hidden">
          ${dayEvents.slice(0, 2).map(e => `
            <div class="text-[9px] truncate px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium">
              ${e.startTime} ${e.title}
            </div>
          `).join('')}
          ${dayEvents.length > 2 ? `
            <div class="text-[8px] text-slate-400 text-right">+${dayEvents.length - 2} นัด</div>
          ` : ''}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  // Add click to days
  container.querySelectorAll('.cal-day-cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
      selectedDateStr = e.currentTarget.getAttribute('data-date');
      const root = document.getElementById('view-container');
      if (root) renderCalendar(root);
    });
  });
}

function bindCalendarEvents(container) {
  container.querySelector('#btn-prev-month')?.addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear--;
    }
    renderCalendar(container);
  });

  container.querySelector('#btn-next-month')?.addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear++;
    }
    renderCalendar(container);
  });

  container.querySelector('#btn-today-cal')?.addEventListener('click', () => {
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    selectedDateStr = now.toISOString().slice(0, 10);
    renderCalendar(container);
  });

  container.querySelector('#btn-add-event')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-modal', { detail: { modal: 'add-calendar', defaultDate: selectedDateStr } }));
  });

  container.querySelector('#btn-add-for-day')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-modal', { detail: { modal: 'add-calendar', defaultDate: selectedDateStr } }));
  });

  container.querySelectorAll('.btn-delete-event').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      state.deleteCalendarEvent(id);
    });
  });
}
