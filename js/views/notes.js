// 6. Notes View - Personal Notes with Decision Dialogs
import { state } from '../state.js';
import { formatThaiDateTime, showToast } from '../utils.js';
import { showConfirmDialog } from '../modals.js';

let noteSearchQuery = '';

export function renderNotes(container) {
  let notes = state.data.notes;
  if (noteSearchQuery.trim()) {
    const q = noteSearchQuery.toLowerCase();
    notes = notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }

  notes.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  container.innerHTML = `
    <div class="space-y-6 pb-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 stagger-item stagger-1">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2">
            <i data-lucide="file-text" class="w-6 h-6 text-purple-400"></i>
            บันทึกส่วนตัว (Notes)
          </h1>
          <p class="text-xs text-slate-400 mt-1">จดบันทึกไอเดีย สิ่งที่ได้เรียนรู้ และข้อมูลสำคัญไว้อย่างเป็นระเบียบ</p>
        </div>
        <button id="btn-add-note" class="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all hover:scale-105 flex items-center gap-2">
          <i data-lucide="plus" class="w-4 h-4"></i> เพิ่มบันทึกใหม่
        </button>
      </div>

      <!-- Search & Stats Bar -->
      <div class="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3 stagger-item stagger-2">
        <div class="relative w-full sm:w-80">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
          <input 
            type="text" 
            id="notes-search-input" 
            placeholder="ค้นหาบันทึกหรือไอเดีย..." 
            value="${noteSearchQuery}"
            autocomplete="off"
            spellcheck="false"
            class="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div class="text-xs text-slate-400">
          ทั้งหมด <span id="notes-count" class="font-bold text-white">${notes.length}</span> รายการ
        </div>
      </div>

      <!-- Notes Masonry Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-item stagger-3" id="notes-grid-container">
        ${notes.length === 0 ? `
          <div class="col-span-full py-16 text-center text-slate-400 text-xs">
            <i data-lucide="file-question" class="w-10 h-10 mx-auto text-slate-600 mb-2"></i>
            ไม่พบบันทึกที่ตรงกับคำค้นหา
          </div>
        ` : notes.map(n => {
          const colorClass = n.color === 'amber' ? 'border-amber-500/30 bg-amber-500/5' : n.color === 'cyan' ? 'border-cyan-500/30 bg-cyan-500/5' : n.color === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-purple-500/30 bg-purple-500/5';
          return `
            <div class="glass-panel glass-panel-hover p-5 rounded-2xl border ${colorClass} flex flex-col justify-between space-y-4 relative group transition-all">
              ${n.isPinned ? `
                <div class="absolute top-3.5 right-3.5 text-amber-400" title="ปักหมุดไว้">
                  <i data-lucide="pin" class="w-4 h-4 fill-amber-400"></i>
                </div>
              ` : ''}

              <div>
                <div class="flex items-center gap-2 mb-2 pr-6">
                  <i data-lucide="sticky-note" class="w-4 h-4 text-purple-400 shrink-0"></i>
                  <h3 class="text-sm font-bold text-white truncate">${n.title}</h3>
                </div>
                <div class="text-xs text-slate-300 leading-relaxed whitespace-pre-line line-clamp-6">
                  ${n.content}
                </div>
              </div>

              <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>${formatThaiDateTime(n.updatedAt)}</span>
                <div class="flex items-center gap-2">
                  <button class="btn-delete-note text-slate-500 hover:text-rose-400 transition-all p-1" data-id="${n.id}" title="ลบบันทึก">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
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

  bindNotesEvents(container);
}

function renderNotesGrid(container) {
  const gridEl = container.querySelector('#notes-grid-container');
  const countEl = container.querySelector('#notes-count');
  if (!gridEl) return;

  let notes = state.data.notes || [];
  if (noteSearchQuery.trim()) {
    const q = noteSearchQuery.toLowerCase();
    notes = notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }
  notes.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  if (countEl) countEl.textContent = notes.length;

  if (notes.length === 0) {
    gridEl.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400 text-xs">
        <i data-lucide="file-question" class="w-10 h-10 mx-auto text-slate-600 mb-2"></i>
        ไม่พบบันทึกที่ตรงกับคำค้นหา
      </div>
    `;
  } else {
    gridEl.innerHTML = notes.map(n => {
      const colorClass = n.color === 'amber' ? 'border-amber-500/30 bg-amber-500/5' : n.color === 'cyan' ? 'border-cyan-500/30 bg-cyan-500/5' : n.color === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-purple-500/30 bg-purple-500/5';
      return `
        <div class="glass-panel glass-panel-hover p-5 rounded-2xl border ${colorClass} flex flex-col justify-between space-y-4 relative group transition-all">
          ${n.isPinned ? `
            <div class="absolute top-3.5 right-3.5 text-amber-400" title="ปักหมุดไว้">
              <i data-lucide="pin" class="w-4 h-4 fill-amber-400"></i>
            </div>
          ` : ''}

          <div>
            <div class="flex items-center gap-2 mb-2 pr-6">
              <i data-lucide="sticky-note" class="w-4 h-4 text-purple-400 shrink-0"></i>
              <h3 class="text-sm font-bold text-white truncate">${n.title}</h3>
            </div>
            <div class="text-xs text-slate-300 leading-relaxed whitespace-pre-line line-clamp-6">
              ${n.content}
            </div>
          </div>

          <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>${formatThaiDateTime(n.updatedAt)}</span>
            <div class="flex items-center gap-2">
              <button class="btn-delete-note text-slate-500 hover:text-rose-400 transition-all p-1" data-id="${n.id}" title="ลบบันทึก">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Re-bind delete note buttons inside grid
  gridEl.querySelectorAll('.btn-delete-note').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const confirmed = await showConfirmDialog({
        title: 'ยืนยันการลบบันทึก',
        message: 'คุณแน่ใจว่าต้องการลบบันทึกข้อความนี้ใช่หรือไม่?',
        confirmText: 'ลบบันทึก',
        cancelText: 'ยกเลิก',
        type: 'danger',
        icon: 'trash-2'
      });

      if (confirmed) {
        state.deleteNote(id);
      }
    });
  });

  if (window.lucide) {
    window.lucide.createIcons({ root: gridEl });
  }
}

function bindNotesEvents(container) {
  container.querySelector('#btn-add-note')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-modal', { detail: { modal: 'add-note' } }));
  });

  container.querySelector('#notes-search-input')?.addEventListener('input', (e) => {
    noteSearchQuery = e.target.value;
    renderNotesGrid(container);
  });

  // Decision Dialog for Deleting Note (initial render bindings)
  container.querySelectorAll('.btn-delete-note').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const confirmed = await showConfirmDialog({
        title: 'ยืนยันการลบบันทึก',
        message: 'คุณแน่ใจว่าต้องการลบบันทึกข้อความนี้ใช่หรือไม่?',
        confirmText: 'ลบบันทึก',
        cancelText: 'ยกเลิก',
        type: 'danger',
        icon: 'trash-2'
      });

      if (confirmed) {
        state.deleteNote(id);
      }
    });
  });
}
