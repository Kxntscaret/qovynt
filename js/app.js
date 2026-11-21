// QOVYNT Main Application Controller
import { state } from './state.js';
import { auth } from './auth.js';
import { db } from './db.js';
import { setupModals } from './modals.js';
import { formatThaiDateFull, getDynamicGreeting, showToast, playAudioFeedback } from './utils.js';

// Import Views
import { renderOverview } from './views/overview.js';
import { renderFinance } from './views/finance.js';
import { renderTasks } from './views/tasks.js';
import { renderCalendar } from './views/calendar.js';
import { renderGoals } from './views/goals.js';
import { renderNotes } from './views/notes.js';
import { renderProjects } from './views/projects.js';
import { renderHabits } from './views/habits.js';
import { renderSettings } from './views/settings.js';
import { renderAuth } from './views/auth-view.js';

class Application {
  constructor() {
    this.viewContainer = null;
    this.currentTheme = localStorage.getItem('qovynt_theme') || 'dark';
  }

  async start() {
    this.viewContainer = document.getElementById('view-container');
    setupModals();
    this.setupNavigation();
    this.setupHeader();
    this.setupCommandPalette();
    this.setupMobileMenu();

    // Listen to reactive state changes
    state.subscribe(() => {
      this.updateHeader();
      this.renderCurrentView();
    });

    // Listen to Auth changes
    auth.subscribe((user) => {
      this.updateUserProfile(user);
    });

    // Initialize state
    await state.init();
    console.log('QOVYNT Application initialized successfully.');
  }

  renderCurrentView() {
    if (!this.viewContainer) return;
    const view = state.currentView;

    // Highlight active sidebar item
    document.querySelectorAll('.nav-item').forEach(el => {
      const target = el.getAttribute('data-view');
      if (target === view) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Route rendering
    switch (view) {
      case 'overview':
        renderOverview(this.viewContainer);
        break;
      case 'finance':
        renderFinance(this.viewContainer);
        break;
      case 'tasks':
        renderTasks(this.viewContainer);
        break;
      case 'calendar':
        renderCalendar(this.viewContainer);
        break;
      case 'goals':
        renderGoals(this.viewContainer);
        break;
      case 'notes':
        renderNotes(this.viewContainer);
        break;
      case 'projects':
        renderProjects(this.viewContainer);
        break;
      case 'habits':
        renderHabits(this.viewContainer);
        break;
      case 'settings':
        renderSettings(this.viewContainer);
        break;
      case 'auth':
        renderAuth(this.viewContainer);
        break;
      default:
        renderOverview(this.viewContainer);
        break;
    }
  }

  setupNavigation() {
    document.querySelectorAll('[data-view]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.getAttribute('data-view');
        state.setView(targetView);

        // Close mobile sidebar if open
        const sidebar = document.getElementById('sidebar');
        if (sidebar && window.innerWidth < 1024) {
          sidebar.classList.add('-translate-x-full');
        }
      });
    });

    // Logout button
    document.getElementById('nav-logout')?.addEventListener('click', async (e) => {
      e.preventDefault();
      if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        await auth.signOut();
        state.setView('auth');
      }
    });
  }

  setupHeader() {
    this.updateHeader();
    // Theme toggle button
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
      showToast('กำลังใช้งานธีม Cyber Dark Violet (ค่าเริ่มต้นที่ดีที่สุด)', 'info');
    });

    // Notification bell
    document.getElementById('btn-notifications')?.addEventListener('click', () => {
      showToast('ไม่มีการแจ้งเตือนใหม่ในขณะนี้', 'info');
    });

    // User profile pill click
    document.getElementById('header-user-btn')?.addEventListener('click', () => {
      if (!auth.isAuthenticated()) {
        state.setView('auth');
      } else {
        state.setView('settings');
      }
    });
  }

  updateHeader() {
    const greetingInfo = getDynamicGreeting(state.data.profile?.name || 'คุณ');
    const greetingEl = document.getElementById('header-greeting');
    const subtitleEl = document.getElementById('header-subtitle');
    const dateEl = document.getElementById('header-date');

    if (greetingEl) greetingEl.innerHTML = `${greetingInfo.title}`;
    if (subtitleEl) subtitleEl.textContent = greetingInfo.subtitle;
    if (dateEl) dateEl.textContent = formatThaiDateFull();
  }

  updateUserProfile(user) {
    const avatarEl = document.getElementById('header-user-avatar');
    const nameEl = document.getElementById('header-user-name');
    const userRoleEl = document.getElementById('header-user-role');

    if (user) {
      if (avatarEl) {
        avatarEl.src = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
      }
      if (nameEl) nameEl.textContent = user.name || 'คุณ';
      if (userRoleEl) userRoleEl.textContent = user.provider === 'google' ? 'Google User' : 'Pro Member';
    } else {
      if (avatarEl) avatarEl.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=guest';
      if (nameEl) nameEl.textContent = 'เข้าสู่ระบบ';
      if (userRoleEl) userRoleEl.textContent = 'Guest';
    }
  }

  setupCommandPalette() {
    const modal = document.getElementById('command-palette-modal');
    const input = document.getElementById('command-palette-input');
    const resultsContainer = document.getElementById('command-palette-results');
    const searchTrigger = document.getElementById('header-search-trigger');

    function openPalette() {
      if (!modal) return;
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      input.value = '';
      input.focus();
      renderPaletteResults('');
    }

    function closePalette() {
      if (!modal) return;
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
      }
      if (e.key === 'Escape' && !modal?.classList.contains('hidden')) {
        closePalette();
      }
    });

    searchTrigger?.addEventListener('click', openPalette);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closePalette();
    });

    input?.addEventListener('input', (e) => {
      renderPaletteResults(e.target.value);
    });

    function renderPaletteResults(query) {
      if (!resultsContainer) return;
      const q = query.toLowerCase().trim();

      const views = [
        { name: '1. ภาพรวมชีวิต (Overview)', view: 'overview', icon: 'layout-dashboard' },
        { name: '2. การเงินและรายรับ-รายจ่าย (Finance)', view: 'finance', icon: 'wallet' },
        { name: '3. งานที่ต้องทำ (Tasks)', view: 'tasks', icon: 'check-circle' },
        { name: '4. ปฏิทินส่วนตัว (Calendar)', view: 'calendar', icon: 'calendar' },
        { name: '5. เป้าหมายและความคืบหน้า (Goals)', view: 'goals', icon: 'target' },
        { name: '6. บันทึกส่วนตัว (Notes)', view: 'notes', icon: 'file-text' },
        { name: '7. โปรเจกต์ที่กำลังทำ (Projects)', view: 'projects', icon: 'folder-git-2' },
        { name: '8. กิจวัตรและนิสัย (Habits)', view: 'habits', icon: 'zap' },
        { name: 'การตั้งค่าและฐานข้อมูล (Settings)', view: 'settings', icon: 'settings' }
      ];

      const matchingViews = views.filter(v => v.name.toLowerCase().includes(q));

      // Match tasks
      const matchingTasks = state.data.tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 3);
      // Match notes
      const matchingNotes = state.data.notes.filter(n => n.title.toLowerCase().includes(q)).slice(0, 3);

      let html = '';

      if (matchingViews.length > 0) {
        html += `<div class="text-[10px] uppercase font-bold text-slate-500 px-3 py-1.5">ไปที่หน้า</div>`;
        html += matchingViews.map(v => `
          <div class="palette-item p-2.5 rounded-xl hover:bg-purple-600/20 hover:border-purple-500/50 border border-transparent transition-all flex items-center justify-between cursor-pointer" data-view="${v.view}">
            <div class="flex items-center gap-2.5 text-xs font-medium text-slate-200">
              <i data-lucide="${v.icon}" class="w-4 h-4 text-purple-400"></i>
              <span>${v.name}</span>
            </div>
            <span class="text-[10px] text-slate-500 font-mono">Jump</span>
          </div>
        `).join('');
      }

      if (matchingTasks.length > 0) {
        html += `<div class="text-[10px] uppercase font-bold text-slate-500 px-3 py-1.5 mt-2">งานที่ต้องทำ</div>`;
        html += matchingTasks.map(t => `
          <div class="palette-item p-2.5 rounded-xl hover:bg-purple-600/20 hover:border-purple-500/50 border border-transparent transition-all flex items-center justify-between cursor-pointer" data-view="tasks">
            <div class="flex items-center gap-2.5 text-xs font-medium text-slate-200">
              <i data-lucide="check-square" class="w-4 h-4 text-cyan-400"></i>
              <span class="truncate">${t.title}</span>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">${t.category}</span>
          </div>
        `).join('');
      }

      if (matchingNotes.length > 0) {
        html += `<div class="text-[10px] uppercase font-bold text-slate-500 px-3 py-1.5 mt-2">บันทึก</div>`;
        html += matchingNotes.map(n => `
          <div class="palette-item p-2.5 rounded-xl hover:bg-purple-600/20 hover:border-purple-500/50 border border-transparent transition-all flex items-center justify-between cursor-pointer" data-view="notes">
            <div class="flex items-center gap-2.5 text-xs font-medium text-slate-200">
              <i data-lucide="file-text" class="w-4 h-4 text-amber-400"></i>
              <span class="truncate">${n.title}</span>
            </div>
            <span class="text-[10px] text-slate-500">Note</span>
          </div>
        `).join('');
      }

      if (!html) {
        html = `<div class="text-center py-8 text-xs text-slate-400">ไม่พบผลลัพธ์สำหรับ "${query}"</div>`;
      }

      resultsContainer.innerHTML = html;
      if (window.lucide) {
        window.lucide.createIcons({ root: resultsContainer });
      }

      // Bind click
      resultsContainer.querySelectorAll('.palette-item').forEach(item => {
        item.addEventListener('click', () => {
          const v = item.getAttribute('data-view');
          if (v) state.setView(v);
          closePalette();
        });
      });
    }
  }

  setupMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-backdrop');

    btn?.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
      overlay.classList.toggle('hidden');
    });

    overlay?.addEventListener('click', () => {
      sidebar.classList.add('-translate-x-full');
      overlay.classList.add('hidden');
    });
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new Application();
  app.start();
});
