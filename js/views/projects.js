// 7. Projects View - Active Projects & Milestones Tracker with Decision Dialogs
import { state } from '../state.js';
import { triggerConfetti, showToast } from '../utils.js';
import { showConfirmDialog } from '../modals.js';

export function renderProjects(container) {
  const projects = state.data.projects;
  const avgProgress = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length) 
    : 0;

  container.innerHTML = `
    <div class="space-y-6 pb-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 stagger-item stagger-1">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2">
            <i data-lucide="folder-git-2" class="w-6 h-6 text-purple-400"></i>
            โปรเจกต์ที่กำลังทำ (Projects)
          </h1>
          <p class="text-xs text-slate-400 mt-1">บริหารจัดการโปรเจกต์ส่วนตัว ติดตามขั้นตอนการพัฒนา และระดับความสำเร็จ</p>
        </div>
        <button id="btn-add-project" class="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all hover:scale-105 flex items-center gap-2">
          <i data-lucide="plus" class="w-4 h-4"></i> สร้างโปรเจกต์ใหม่
        </button>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="glass-panel glass-panel-hover p-4 flex items-center justify-between stagger-item stagger-1">
          <div>
            <span class="text-xs text-slate-400">โปรเจกต์ทั้งหมด</span>
            <div class="text-xl font-bold text-white mt-0.5">${projects.length} โปรเจกต์</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <i data-lucide="briefcase" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="glass-panel glass-panel-hover p-4 flex items-center justify-between stagger-item stagger-2">
          <div>
            <span class="text-xs text-slate-400">ความคืบหน้าเฉลี่ย</span>
            <div class="text-xl font-bold text-cyan-400 mt-0.5">${avgProgress}%</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <i data-lucide="trending-up" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="glass-panel glass-panel-hover p-4 flex items-center justify-between stagger-item stagger-3">
          <div>
            <span class="text-xs text-slate-400">กำลังดำเนินการ (Active)</span>
            <div class="text-xl font-bold text-emerald-400 mt-0.5">${projects.filter(p => p.progress < 100).length} โปรเจกต์</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <i data-lucide="activity" class="w-5 h-5"></i>
          </div>
        </div>
      </div>

      <!-- Projects Grid Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-item stagger-3">
        ${projects.map(p => `
          <div class="glass-panel glass-panel-hover p-5 flex flex-col justify-between space-y-4 group">
            <div>
              <div class="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 font-medium">${p.category || 'Development'}</span>
                  <h3 class="text-base font-bold text-white group-hover:text-purple-300 transition-colors mt-1.5">${p.title}</h3>
                </div>
                <span class="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold shrink-0">
                  ${p.stage}
                </span>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed mb-4">${p.description || 'ไม่มีคำอธิบายเพิ่มเติม'}</p>

              <div>
                <div class="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                  <span>ความคืบหน้า</span>
                  <span class="text-white font-bold">${p.progress}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill bg-gradient-to-r from-purple-500 to-indigo-500" style="width: ${p.progress}%;"></div>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <button class="btn-adjust-progress px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-all hover:scale-105" data-id="${p.id}" data-delta="-10">-10%</button>
                <button class="btn-adjust-progress px-2 py-1 rounded-lg bg-slate-800 hover:bg-purple-600 text-xs text-slate-300 hover:text-white transition-all hover:scale-105" data-id="${p.id}" data-delta="10">+10%</button>
              </div>
              <button class="btn-delete-project text-slate-500 hover:text-rose-400 transition-colors p-1" data-id="${p.id}" title="ลบโปรเจกต์">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }

  bindProjectsEvents(container);
}

function bindProjectsEvents(container) {
  container.querySelector('#btn-add-project')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-modal', { detail: { modal: 'add-project' } }));
  });

  container.querySelectorAll('.btn-adjust-progress').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const delta = Number(e.currentTarget.getAttribute('data-delta'));
      const proj = state.data.projects.find(p => p.id === id);
      if (proj) {
        proj.progress = Math.min(100, Math.max(0, (proj.progress || 0) + delta));
        if (proj.progress === 100) {
          triggerConfetti();
        }
        state.updateProject(proj);
      }
    });
  });

  // Decision Dialog for Deleting Project
  container.querySelectorAll('.btn-delete-project').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const confirmed = await showConfirmDialog({
        title: 'ยืนยันการลบโปรเจกต์',
        message: 'คุณต้องการลบโปรเจกต์นี้ใช่หรือไม่? บันทึกงานและความคืบหน้าทั้งหมดจะถูกนำออก',
        confirmText: 'ลบโปรเจกต์',
        cancelText: 'ยกเลิก',
        type: 'danger',
        icon: 'trash-2'
      });

      if (confirmed) {
        state.deleteProject(id);
      }
    });
  });
}
