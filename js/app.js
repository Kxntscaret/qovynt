// QOVYNT Main Application Controller
import { state } from './state.js';
import { auth } from './auth.js';
import { db } from './db.js';
import { setupModals, showConfirmDialog } from './modals.js';
import { formatThaiDateFull, getDynamicGreeting, showToast, playAudioFeedback } from './utils.js';
import { initParticles } from './particles.js?v=20261121_03';

// Import Views
import { renderOverview } from './views/overview.js?v=20261121_05';
import { renderFinance } from './views/finance.js?v=20261121_05';
import { renderTasks } from './views/tasks.js?v=20261121_05';
import { renderCalendar } from './views/calendar.js?v=20261121_05';
import { renderGoals } from './views/goals.js?v=20261121_05';
import { renderNotes } from './views/notes.js?v=20261121_05';
import { renderProjects } from './views/projects.js?v=20261121_05';
import { renderHabits } from './views/habits.js?v=20261121_05';
import { renderSettings } from './views/settings.js?v=20261121_05';
import { renderAuth } from './views/auth-view.js?v=20261121_05';

// Helper to safely trigger Lucide icon rendering across the entire document
export function refreshIcons(root = document.body) {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    try {
      window.lucide.createIcons({ root });
    } catch (e) {
      console.warn('Lucide icon refresh:', e);
    }
  }
}

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
    this.setupCursorGlow();
    initParticles();

    // Listen to reactive state changes
    state.subscribe(() => {
      this.updateHeader();
      this.renderCurrentView();
    });

    // Listen to Auth changes
    auth.subscribe((user) => {
      this.updateUserProfile(user);
      if (!user) {
        state.setView('auth');
      }
    });

    // Initialize state
    await state.init();

    // Enforce authentication: If not logged in, navigate straight to login screen!
    if (!auth.isAuthenticated()) {
      state.setView('auth');
    }

    refreshIcons();
    console.log('QOVYNT Application initialized successfully.');
  }

  setupCursorGlow() {
    const glowEl = document.getElementById('cursor-glow');
    if (!glowEl) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let isMoving = false;

    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isMoving) {
        glowEl.style.opacity = '1';
        isMoving = true;
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      glowEl.style.opacity = '0';
      isMoving = false;
    });

    function renderGlow() {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      glowEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      requestAnimationFrame(renderGlow);
    }

    requestAnimationFrame(renderGlow);
  }

  renderCurrentView() {
    if (!this.viewContainer) return;

    // Route guard: If user is not authenticated, only allow 'auth' view!
    if (!auth.isAuthenticated() && state.currentView !== 'auth') {
      state.setView('auth');
      return;
    }

    const view = state.currentView;

    // Completely Hide Header and Sidebar on Login page (User request: หน้า login ไม่ต้องมีพวกนี้)
    const sidebar = document.getElementById('sidebar');
    const header = document.querySelector('header');
    const mainWrap = this.viewContainer.parentElement;

    if (view === 'auth') {
      if (sidebar) sidebar.style.display = 'none';
      if (header) header.style.display = 'none';
      this.viewContainer.className = 'w-full min-h-screen p-0 m-0';
      if (mainWrap) {
        mainWrap.className = 'w-full min-h-screen p-0 m-0 relative';
      }
    } else {
      if (sidebar) sidebar.style.display = '';
      if (header) header.style.display = '';
      this.viewContainer.className = 'flex-1 px-4 sm:px-8 xl:px-12 py-6 max-w-[1720px] 2xl:max-w-[1850px] w-full mx-auto animate-fade-in';
      if (mainWrap) {
        mainWrap.className = 'flex-1 flex flex-col min-w-0 min-h-screen relative z-10';
      }
    }

    // Smooth subtle view transition (Zero reflow jank)
    this.viewContainer.classList.remove('animate-fade-in');
    requestAnimationFrame(() => {
      this.viewContainer.classList.add('animate-fade-in');
    });

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

    refreshIcons();
  }

  setupNavigation() {
    document.querySelectorAll('[data-view]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.getAttribute('data-view');
        state.setView(targetView);

        const sidebar = document.getElementById('sidebar');
        if (sidebar && window.innerWidth < 1024) {
          sidebar.classList.add('-translate-x-full');
        }
      });
    });

    // Glassmorphic Decision Dialog for Sidebar Logout
    document.getElementById('nav-logout')?.addEventListener('click', async (e) => {
      e.preventDefault();
      const confirmed = await showConfirmDialog({
        title: 'ยืนยันการออกจากระบบ',
        message: 'คุณต้องการออกจากระบบ QOVYNT ใช่หรือไม่? เซสชันปัจจุบันของคุณจะสิ้นสุดลง',
        confirmText: 'ออกจากระบบทันที',
        cancelText: 'อยู่ต่อในระบบ',
        type: 'warning',
        icon: 'log-out'
      });

      if (confirmed) {
        await auth.signOut();
        state.setView('auth');
      }
    });
  }

  setupHeader() {
    this.updateHeader();

    const userBtn = document.getElementById('header-user-btn');
    const userDropdown = document.getElementById('header-user-dropdown');
    const chevronIcon = document.getElementById('header-user-chevron');
    const notifBtn = document.getElementById('btn-notifications');
    const notifDropdown = document.getElementById('notifications-dropdown');
    const themeBtn = document.getElementById('btn-theme-toggle');

    // Theme Toggle Button
    themeBtn?.addEventListener('click', () => {
      playAudioFeedback('pop');
      showToast('โหมดการแสดงผล', 'คุณกำลังใช้งานธีม Cyber Dark Violet (ความคมชัดระดับพรีเมียม)', 'info');
    });

    // Toggle User Profile Dropdown Popup (Settings & Logout)
    userBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!auth.isAuthenticated()) {
        state.setView('auth');
        return;
      }
      if (notifDropdown) notifDropdown.classList.add('hidden');

      const isHidden = userDropdown?.classList.contains('hidden');
      if (isHidden) {
        userDropdown?.classList.remove('hidden');
        if (chevronIcon) chevronIcon.style.transform = 'rotate(180deg)';
      } else {
        userDropdown?.classList.add('hidden');
        if (chevronIcon) chevronIcon.style.transform = 'rotate(0deg)';
      }
    });

    // Dropdown Settings Button
    document.getElementById('dropdown-btn-settings')?.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown?.classList.add('hidden');
      if (chevronIcon) chevronIcon.style.transform = 'rotate(0deg)';
      state.setView('settings');
    });

    // Dropdown Database Button
    document.getElementById('dropdown-btn-database')?.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown?.classList.add('hidden');
      if (chevronIcon) chevronIcon.style.transform = 'rotate(0deg)';
      state.setView('settings');
      setTimeout(() => {
        const dbCard = document.querySelector('[data-card="database"]');
        if (dbCard) dbCard.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    });

    // Dropdown Theme Button
    document.getElementById('dropdown-btn-theme')?.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown?.classList.add('hidden');
      if (chevronIcon) chevronIcon.style.transform = 'rotate(0deg)';
      playAudioFeedback('pop');
      showToast('ธีมการแสดงผล', 'Cyber Dark Violet — แสงนีออนและ Glassmorphism เปิดใช้งานอยู่', 'info');
    });

    // Dropdown Logout Button (Decision Dialog)
    document.getElementById('dropdown-btn-logout')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      userDropdown?.classList.add('hidden');
      if (chevronIcon) chevronIcon.style.transform = 'rotate(0deg)';

      const confirmed = await showConfirmDialog({
        title: 'ยืนยันการออกจากระบบ',
        message: 'คุณต้องการออกจากระบบ QOVYNT ใช่หรือไม่? เซสชันปัจจุบันของคุณจะสิ้นสุดลง',
        confirmText: 'ออกจากระบบทันที',
        cancelText: 'อยู่ต่อในระบบ',
        type: 'warning',
        icon: 'log-out'
      });

      if (confirmed) {
        await auth.signOut();
        state.setView('auth');
      }
    });

    // Toggle Notifications Dropdown
    notifBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown?.classList.add('hidden');
      if (chevronIcon) chevronIcon.style.transform = 'rotate(0deg)';
      notifDropdown?.classList.toggle('hidden');
    });

    // Close Dropdowns on Click Outside
    document.addEventListener('click', (e) => {
      if (!userBtn?.contains(e.target) && !userDropdown?.contains(e.target)) {
        userDropdown?.classList.add('hidden');
        if (chevronIcon) chevronIcon.style.transform = 'rotate(0deg)';
      }
      if (!notifBtn?.contains(e.target) && !notifDropdown?.contains(e.target)) {
        notifDropdown?.classList.add('hidden');
      }
    });
  }

  updateHeader() {
    const greetingInfo = getDynamicGreeting(auth.getUser()?.name || state.data.profile?.name || 'คุณ');
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
    const dropdownNameEl = document.getElementById('dropdown-user-name');
    const dropdownRoleEl = document.getElementById('dropdown-user-role');
    const dropdownEmailEl = document.getElementById('dropdown-user-email');
    const logoutBtn = document.getElementById('nav-logout');

    if (user) {
      const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.email || user.name)}`;
      const roleText = user.provider === 'google' ? 'Google Account' : 'Verified Member';
      if (avatarEl) avatarEl.src = avatarUrl;
      if (nameEl) nameEl.textContent = user.name || 'คุณ';
      if (userRoleEl) userRoleEl.textContent = roleText;
      if (dropdownNameEl) dropdownNameEl.textContent = user.name || 'คุณ';
      if (dropdownRoleEl) dropdownRoleEl.textContent = roleText;
      if (dropdownEmailEl) dropdownEmailEl.textContent = user.email || 'user@example.com';
      if (logoutBtn) logoutBtn.classList.remove('hidden');
    } else {
      if (avatarEl) avatarEl.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=guest';
      if (nameEl) nameEl.textContent = 'เข้าสู่ระบบ';
      if (userRoleEl) userRoleEl.textContent = 'ยังไม่ได้ล็อกอิน';
      if (dropdownNameEl) dropdownNameEl.textContent = 'ยังไม่ได้ล็อกอิน';
      if (dropdownRoleEl) dropdownRoleEl.textContent = 'ยังไม่ได้ล็อกอิน';
      if (dropdownEmailEl) dropdownEmailEl.textContent = 'กรุณาเข้าสู่ระบบ';
      if (logoutBtn) logoutBtn.classList.add('hidden');
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
      const matchingTasks = state.data.tasks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 3);
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
