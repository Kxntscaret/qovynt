// 100% Real Production Login & Registration View (No Demo Accounts)
import { auth } from '../auth.js';
import { db } from '../db.js';
import { state } from '../state.js';
import { showToast } from '../utils.js';

let authMode = 'login'; // 'login' or 'register'
let showPassword = false;

export function renderAuth(container) {
  const isCloud = db.isCloudActive;

  container.innerHTML = `
    <div class="min-h-[85vh] flex items-center justify-center py-12 px-4 animate-fade-in relative z-20">
      <div class="glass-panel p-8 sm:p-10 rounded-3xl w-full max-w-md border border-purple-500/30 relative overflow-hidden shadow-2xl backdrop-blur-3xl">
        <!-- Ambient background glows -->
        <div class="absolute -top-24 -left-24 w-52 h-52 bg-purple-600/25 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -right-24 w-52 h-52 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Brand Emblem & Greeting -->
        <div class="text-center mb-7">
          <div class="w-16 h-16 mx-auto mb-3.5 transition-transform duration-300 hover:scale-110">
            <img src="assets/qovynt-logo.svg" alt="QOVYNT" class="w-full h-full drop-shadow-xl" />
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-white tracking-wider">QOVYNT</h1>
          <p class="text-xs text-purple-300 font-medium mt-1">The Autonomous Life Operating System</p>
          <p class="text-[11px] text-slate-400 mt-0.5">เข้าสู่ระบบเพื่อจัดการข้อมูลส่วนตัวของคุณอย่างปลอดภัย</p>
        </div>

        <!-- Google OAuth Real Sign In Button -->
        <button id="auth-btn-google" class="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-95 mb-5 group">
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span class="group-hover:text-black">ดำเนินการต่อด้วยบัญชี Google</span>
        </button>

        <!-- Divider -->
        <div class="flex items-center gap-3 my-5">
          <div class="h-px bg-slate-800 flex-1"></div>
          <span class="text-[11px] text-slate-500 font-medium uppercase tracking-wider">หรือใช้อีเมลของคุณ</span>
          <div class="h-px bg-slate-800 flex-1"></div>
        </div>

        <!-- Auth Tabs (Login / Register) -->
        <div class="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 mb-5 text-xs">
          <button id="auth-tab-login" class="flex-1 py-2 rounded-xl text-center font-semibold transition-all ${authMode === 'login' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'}">
            เข้าสู่ระบบ
          </button>
          <button id="auth-tab-register" class="flex-1 py-2 rounded-xl text-center font-semibold transition-all ${authMode === 'register' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'}">
            สร้างบัญชีใหม่
          </button>
        </div>

        <!-- Real Auth Form -->
        <form id="auth-form" class="space-y-4">
          ${authMode === 'register' ? `
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1.5">ชื่อ-นามสกุล หรือชื่อเล่น</label>
              <div class="relative">
                <i data-lucide="user" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                <input 
                  type="text" 
                  id="auth-name" 
                  required
                  placeholder="เช่น Poom Supakorn" 
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          ` : ''}

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">อีเมล (Email)</label>
            <div class="relative">
              <i data-lucide="mail" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input 
                type="email" 
                id="auth-email" 
                required
                placeholder="name@example.com" 
                class="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-medium text-slate-300">รหัสผ่าน (Password)</label>
              ${authMode === 'login' ? `
                <a href="javascript:void(0)" id="btn-forgot-pass" class="text-[11px] text-purple-400 hover:text-purple-300 transition-colors">ลืมรหัสผ่าน?</a>
              ` : ''}
            </div>
            <div class="relative">
              <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input 
                type="${showPassword ? 'text' : 'password'}" 
                id="auth-password" 
                required
                minlength="6"
                placeholder="อย่างน้อย 6 ตัวอักษร" 
                class="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button type="button" id="btn-toggle-password" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                <i data-lucide="${showPassword ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          ${authMode === 'login' ? `
            <div class="flex items-center gap-2 pt-1">
              <input type="checkbox" id="auth-remember" checked class="custom-checkbox w-4 h-4" />
              <label for="auth-remember" class="text-xs text-slate-400 select-none cursor-pointer">จดจำการเข้าสู่ระบบไว้บนอุปกรณ์นี้</label>
            </div>
          ` : ''}

          <button type="submit" id="auth-submit-btn" class="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-95 mt-3 flex items-center justify-center gap-2">
            <span>${authMode === 'login' ? 'เข้าสู่ระบบ QOVYNT' : 'สร้างบัญชีและเริ่มต้นใช้งาน'}</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </form>

        <!-- Security Badge Notice -->
        <div class="mt-7 pt-5 border-t border-slate-800/80 text-center">
          <div class="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>ระบบความปลอดภัยระดับสากล บัญชีและการเข้าถึงเป็นส่วนตัว 100%</span>
          </div>
          <p class="text-[10px] text-slate-500 mt-1">
            ${isCloud ? '● เชื่อมต่อฐานข้อมูล Supabase PostgreSQL Cloud' : '● ระบบตรวจสอบสิทธิ์ความปลอดภัยในตัวพร้อมเชื่อมโยง Cloud Database'}
          </p>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }

  bindAuthEvents(container);
}

function bindAuthEvents(container) {
  // Toggle Password Visibility
  container.querySelector('#btn-toggle-password')?.addEventListener('click', () => {
    showPassword = !showPassword;
    const input = container.querySelector('#auth-password');
    if (input) {
      input.type = showPassword ? 'text' : 'password';
    }
    const iconBtn = container.querySelector('#btn-toggle-password');
    if (iconBtn) {
      iconBtn.innerHTML = `<i data-lucide="${showPassword ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>`;
      if (window.lucide) window.lucide.createIcons({ root: iconBtn });
    }
  });

  // Switch Tabs
  container.querySelector('#auth-tab-login')?.addEventListener('click', () => {
    authMode = 'login';
    renderAuth(container);
  });
  container.querySelector('#auth-tab-register')?.addEventListener('click', () => {
    authMode = 'register';
    renderAuth(container);
  });

  // Google OAuth Sign In
  container.querySelector('#auth-btn-google')?.addEventListener('click', async () => {
    const ok = await auth.signInWithGoogle();
    if (ok) {
      state.setView('overview');
    }
  });

  // Form Submit
  container.querySelector('#auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = container.querySelector('#auth-email').value.trim();
    const password = container.querySelector('#auth-password').value;
    const submitBtn = container.querySelector('#auth-submit-btn');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-75');
    }

    try {
      if (authMode === 'login') {
        const ok = await auth.signInWithPassword(email, password);
        if (ok) state.setView('overview');
      } else {
        const name = container.querySelector('#auth-name')?.value.trim() || '';
        const ok = await auth.signUp(email, password, name);
        if (ok) state.setView('overview');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-75');
      }
    }
  });

  // Forgot password notice
  container.querySelector('#btn-forgot-pass')?.addEventListener('click', () => {
    showToast('กรุณาติดต่อผู้ดูแลระบบหรือใช้อีเมลยืนยันผ่าน Supabase เพื่อรีเซ็ตรหัสผ่าน', 'info');
  });
}
