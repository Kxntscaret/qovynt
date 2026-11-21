// 3. Tasks View - Comprehensive Task Management with Decision Dialogs
import { state } from '../state.js';
import { showToast } from '../utils.js';
import { showConfirmDialog } from '../modals.js';

let taskViewMode = 'list';
let selectedCategory = 'all';

export function renderTasks(container) {
  let tasks = state.data.tasks;
  if (selectedCategory !== 'all') {
    tasks = tasks.filter(t => t.category === selectedCategory);
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed).length;

  container.innerHTML = `
    <div class="space-y-6 pb-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 stagger-item stagger-1">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2">
            <i data-lucide="check-circle" class="w-6 h-6 text-purple-400"></i>
            งานที่ต้องทำ (Tasks)
          </h1>
          <p class="text-xs text-slate-400 mt-1">จัดการรายการงานที่ต้องทำให้เสร็จ ลำดับความสำคัญ และกำหนดส่ง</p>
        </div>
        <div class="flex items-center gap-2.5">
          <div class="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-700 text-xs">
            <button id="view-list-btn" class="px-3 py-1.5 rounded-lg transition-all ${taskViewMode === 'list' ? 'bg-purple-600 text-white font-medium shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'} flex items-center gap-1.5">
              <i data-lucide="list" class="w-3.5 h-3.5"></i> รายการ
            </button>
            <button id="view-kanban-btn" class="px-3 py-1.5 rounded-lg transition-all ${taskViewMode === 'kanban' ? 'bg-purple-600 text-white font-medium shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'} flex items-center gap-1.5">
              <i data-lucide="columns-3" class="w-3.5 h-3.5"></i> Kanban
            </button>
          </div>

          <button id="btn-add-task" class="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all hover:scale-105 flex items-center gap-2">
            <i data-lucide="plus" class="w-4 h-4"></i> เพิ่มงานใหม่
          </button>
        </div>
      </div>

      <!-- Quick Metrics Bar -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="glass-panel glass-panel-hover p-4 flex items-center justify-between stagger-item stagger-1">
          <div>
            <span class="text-xs text-slate-400">งานทั้งหมด</span>
            <div class="text-xl font-bold text-white mt-0.5">${tasks.length} งาน</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <i data-lucide="layers" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="glass-panel glass-panel-hover p-4 flex items-center justify-between stagger-item stagger-2">
          <div>
            <span class="text-xs text-slate-400">รอดำเนินการ</span>
            <div class="text-xl font-bold text-amber-400 mt-0.5">${pendingCount} งาน</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <i data-lucide="clock" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="glass-panel glass-panel-hover p-4 flex items-center justify-between stagger-item stagger-3">
          <div>
            <span class="text-xs text-slate-400">เสร็จสิ้นแล้ว</span>
            <div class="text-xl font-bold text-emerald-400 mt-0.5">${completedCount} งาน</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <i data-lucide="check-check" class="w-5 h-5"></i>
          </div>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs stagger-item stagger-2">
        ${['all', 'เรียน', 'สุขภาพ', 'พัฒนาตัวเอง', 'การเงิน', 'งาน'].map(cat => `
          <button class="cat-pill-btn px-3 py-1.5 rounded-xl border transition-all ${selectedCategory === cat ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-semibold shadow-md shadow-purple-600/20' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'}" data-cat="${cat}">
            ${cat === 'all' ? 'ทุกหมวดหมู่' : cat}
          </button>
        `).join('')}
      </div>

      <!-- Task Content -->
      <div class="stagger-item stagger-3">
        ${taskViewMode === 'list' ? renderListView(tasks) : renderKanbanView(tasks)}
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }

  bindTaskEvents(container);
}

function renderListView(tasks) {
  return `
    <div class="glass-panel overflow-hidden">
      <div class="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <span class="text-sm font-semibold text-white">รายการงาน</span>
        <span class="text-xs text-slate-400">คลิกที่ช่องเพื่อทำเครื่องหมายว่าเสร็จแล้ว</span>
      </div>
      <div class="divide-y divide-slate-800/60">
        ${tasks.length === 0 ? `
          <div class="p-8 text-center text-slate-400 text-xs">ไม่มีงานในหมวดหมู่นี้</div>
        ` : tasks.map(t => {
          const badgeClass = t.category === 'เรียน' ? 'badge-study' : t.category === 'สุขภาพ' ? 'badge-health' : t.category === 'การเงิน' ? 'badge-finance' : 'badge-work';
          const priorityColor = t.priority === 'high' ? 'text-rose-400 bg-rose-500/10' : t.priority === 'medium' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-800';
          return `
            <div class="p-4 hover:bg-slate-800/30 transition-all duration-200 hover:translate-x-1 flex items-center justify-between gap-4 group">
              <div class="flex items-center gap-3.5 flex-1 min-w-0">
                <input type="checkbox" class="custom-checkbox task-check" ${t.completed ? 'checked' : ''} data-id="${t.id}" />
                <div class="min-w-0">
                  <div class="text-sm font-medium ${t.completed ? 'line-through text-slate-500' : 'text-white'} transition-colors">${t.title}</div>
                  <div class="flex flex-wrap items-center gap-2 mt-1">
                    <span class="badge-pill ${badgeClass}">${t.category}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full ${priorityColor}">ความสำคัญ: ${t.priority === 'high' ? 'สูง' : t.priority === 'medium' ? 'ปานกลาง' : 'ทั่วไป'}</span>
                    ${t.dueDate ? `<span class="text-[11px] text-slate-400 flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> กำหนดส่ง: ${t.dueDate}</span>` : ''}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button class="btn-delete-task text-slate-500 hover:text-rose-400 transition-all p-1.5" data-id="${t.id}" title="ลบงานนี้">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderKanbanView(tasks) {
  const todoTasks = tasks.filter(t => !t.completed && t.status !== 'in_progress');
  const inProgressTasks = tasks.filter(t => !t.completed && t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.completed);

  return `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="glass-panel p-4 flex flex-col gap-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <span class="text-sm font-bold text-white flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            ยังไม่เริ่ม (${todoTasks.length})
          </span>
        </div>
        <div class="space-y-3 min-h-[300px]">
          ${todoTasks.map(t => renderKanbanCard(t)).join('')}
        </div>
      </div>

      <div class="glass-panel p-4 flex flex-col gap-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <span class="text-sm font-bold text-cyan-400 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            กำลังทำ (${inProgressTasks.length})
          </span>
        </div>
        <div class="space-y-3 min-h-[300px]">
          ${inProgressTasks.map(t => renderKanbanCard(t)).join('')}
        </div>
      </div>

      <div class="glass-panel p-4 flex flex-col gap-3">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <span class="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            เสร็จแล้ว (${doneTasks.length})
          </span>
        </div>
        <div class="space-y-3 min-h-[300px]">
          ${doneTasks.map(t => renderKanbanCard(t)).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderKanbanCard(t) {
  const badgeClass = t.category === 'เรียน' ? 'badge-study' : t.category === 'สุขภาพ' ? 'badge-health' : t.category === 'การเงิน' ? 'badge-finance' : 'badge-work';
  return `
    <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 transition-all duration-200 hover:-translate-y-1 space-y-2">
      <div class="flex items-start justify-between gap-2">
        <span class="text-xs font-semibold ${t.completed ? 'line-through text-slate-500' : 'text-white'}">${t.title}</span>
        <button class="btn-delete-task text-slate-500 hover:text-rose-400 transition-colors" data-id="${t.id}">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
      <div class="flex items-center justify-between pt-1 text-[10px]">
        <span class="badge-pill ${badgeClass}">${t.category}</span>
        <button class="kanban-toggle-btn text-purple-400 hover:text-purple-300 font-medium" data-id="${t.id}">
          ${t.completed ? 'ย้อนกลับ' : 'เสร็จสิ้น ✓'}
        </button>
      </div>
    </div>
  `;
}

function bindTaskEvents(container) {
  container.querySelector('#btn-add-task')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-modal', { detail: { modal: 'add-task' } }));
  });

  container.querySelector('#view-list-btn')?.addEventListener('click', () => {
    taskViewMode = 'list';
    renderTasks(container);
  });
  container.querySelector('#view-kanban-btn')?.addEventListener('click', () => {
    taskViewMode = 'kanban';
    renderTasks(container);
  });

  container.querySelectorAll('.cat-pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      selectedCategory = e.currentTarget.getAttribute('data-cat');
      renderTasks(container);
    });
  });

  container.querySelectorAll('.task-check').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-id');
      state.toggleTask(id);
    });
  });

  container.querySelectorAll('.kanban-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      state.toggleTask(id);
    });
  });

  // Decision Dialog for Deleting Task
  container.querySelectorAll('.btn-delete-task').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const confirmed = await showConfirmDialog({
        title: 'ยืนยันการลบงาน',
        message: 'คุณแน่ใจว่าต้องการลบงานนี้ใช่หรือไม่? ข้อมูลงานจะถูกนำออกจากรายการทันที',
        confirmText: 'ลบงานนี้',
        cancelText: 'ยกเลิก',
        type: 'danger',
        icon: 'trash-2'
      });

      if (confirmed) {
        state.deleteTask(id);
      }
    });
  });
}
