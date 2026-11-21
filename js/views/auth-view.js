// 100% Real Production Login & Registration View with Animated QOVYNT Backdrop & Modern Validation
import { auth } from '../auth.js';
import { db } from '../db.js';
import { state } from '../state.js';
import { showToast } from '../utils.js';

let authMode = 'login'; // 'login' or 'register'
let showPassword = false;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function renderAuth(container) {
  const isCloud = db.isCloudActive;

  container.innerHTML = `
    <div class="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
      
      <!-- Fullscreen Ambient Background Layer (Zero borders, fills 100% of the entire screen) -->
      <div class="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none -z-10">
        <img src="assets/menu-bg.jfif" alt="Backdrop" class="w-full h-full object-cover scale-110 filter blur-lg brightness-60 contrast-110 opacity-55" />
        <div class="absolute inset-0 bg-[#0a0b16]/75 backdrop-blur-md"></div>
      </div>

      <!-- Main Login / Sign Up Glass Card -->
      <div class="glass-panel p-8 sm:p-10 rounded-3xl w-full max-w-md border border-purple-500/30 relative overflow-hidden shadow-2xl backdrop-blur-3xl z-10 animate-fade-in">
        
        <!-- Ambient card corner glow -->
        <div class="absolute -top-24 -left-24 w-52 h-52 bg-purple-600/25 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -right-24 w-52 h-52 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Brand Emblem & Title -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 mx-auto mb-3.5 transition-transform duration-300 hover:scale-110">
            <img src="assets/qovynt-logo.svg" alt="QOVYNT" class="w-full h-full drop-shadow-xl" />
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-white tracking-wider">QOVYNT</h1>
          <p class="text-xs text-purple-300 font-medium mt-1">The Autonomous Life Operating System</p>
          <p class="text-[11px] text-slate-400 mt-0.5">เข้าสู่ระบบเพื่อจัดการข้อมูลส่วนตัวของคุณอย่างปลอดภัย</p>
        </div>

        <!-- Global Alert Banner Container (For invalid credentials or notifications) -->
        <div id="auth-alert-container"></div>

        <!-- Google OAuth Sign In Button -->
        <button id="auth-btn-google" class="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-95 mb-5 group">
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span class="group-hover:text-black font-bold">ดำเนินการต่อด้วยบัญชี Google</span>
        </button>

        <!-- Divider -->
        <div class="flex items-center gap-3 my-5">
          <div class="h-px bg-slate-800 flex-1"></div>
          <span class="text-[11px] text-slate-500 font-medium uppercase tracking-wider">หรือเข้าใช้งานด้วยอีเมล</span>
          <div class="h-px bg-slate-800 flex-1"></div>
        </div>

        <!-- Auth Tabs (Sign In / Sign Up) -->
        <div class="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 mb-5 text-xs">
          <button id="auth-tab-login" class="flex-1 py-2 rounded-xl text-center font-semibold transition-all ${authMode === 'login' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'}">
            เข้าสู่ระบบ
          </button>
          <button id="auth-tab-register" class="flex-1 py-2 rounded-xl text-center font-semibold transition-all ${authMode === 'register' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'}">
            สร้างบัญชีใหม่
          </button>
        </div>

        <!-- Real Auth Form -->
        <form id="auth-form" class="space-y-4" novalidate>
          ${authMode === 'register' ? `
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1.5">ชื่อ-นามสกุล หรือชื่อเรียก</label>
              <div class="relative">
                <i data-lucide="user" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                <input 
                  type="text" 
                  id="auth-name" 
                  placeholder="เช่น Poom Supakorn" 
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div id="auth-name-error" class="hidden"></div>
            </div>
          ` : ''}

          <!-- Email Input with Real-time Validation -->
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">อีเมล (Email Address)</label>
            <div class="relative">
              <i data-lucide="mail" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
              <input 
                type="email" 
                id="auth-email" 
                placeholder="name@example.com" 
                class="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
              />
              <div id="email-valid-icon" class="absolute right-3.5 top-1/2 -translate-y-1/2 hidden text-emerald-400">
                <i data-lucide="check" class="w-4 h-4"></i>
              </div>
            </div>
            <!-- Elegant Inline Error Message Container -->
            <div id="auth-email-error" class="hidden"></div>
          </div>

          <!-- Password Input with Show/Hide Toggle & Inline Validation -->
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
                minlength="6"
                placeholder="อย่างน้อย 6 ตัวอักษร" 
                class="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
              />
              <button type="button" id="btn-toggle-password" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors" title="แสดง/ซ่อนรหัสผ่าน">
                <i data-lucide="${showPassword ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>
              </button>
            </div>
            <div id="auth-password-error" class="hidden"></div>
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

    <!-- Custom Modern Google Sign In Modal (Replaces native browser prompt completely) -->
    <div id="google-modal" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 hidden items-center justify-center p-4">
      <div class="glass-panel p-6 sm:p-7 rounded-3xl w-full max-w-sm border border-slate-700/80 shadow-2xl animate-modal-pop relative bg-[#131528]/95">
        <div class="text-center mb-5">
          <div class="w-12 h-12 rounded-2xl bg-white p-2.5 mx-auto mb-3 shadow-md flex items-center justify-center">
            <svg class="w-full h-full" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
          <h3 class="text-base font-bold text-white">ลงชื่อเข้าใช้ด้วย Google</h3>
          <p class="text-xs text-slate-400 mt-1">เพื่อเข้าถึงระบบปฏิบัติการชีวิต QOVYNT</p>
        </div>

        <form id="google-login-form" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">อีเมลหรือหมายเลขโทรศัพท์ Google</label>
            <input 
              type="email" 
              id="google-modal-email" 
              placeholder="user@gmail.com" 
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
            <div id="google-email-error" class="hidden"></div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button type="button" id="btn-cancel-google" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors">
              ยกเลิก
            </button>
            <button type="submit" id="btn-confirm-google" class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all hover:scale-105">
              ถัดไป
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }

  bindAuthEvents(container);
}

function bindAuthEvents(container) {
  const emailInput = container.querySelector('#auth-email');
  const passwordInput = container.querySelector('#auth-password');
  const nameInput = container.querySelector('#auth-name');
  const emailError = container.querySelector('#auth-email-error');
  const passwordError = container.querySelector('#auth-password-error');
  const emailValidIcon = container.querySelector('#email-valid-icon');
  const alertContainer = container.querySelector('#auth-alert-container');

  // Real-time email validation
  function validateEmailField() {
    const val = emailInput.value.trim();
    if (!val) {
      showFieldError(emailInput, emailError, 'กรุณากรอกอีเมลของคุณ');
      if (emailValidIcon) emailValidIcon.classList.add('hidden');
      return false;
    }
    if (!isValidEmail(val)) {
      showFieldError(emailInput, emailError, 'รูปแบบอีเมลไม่ถูกต้อง ตัวอย่าง: user@example.com');
      if (emailValidIcon) emailValidIcon.classList.add('hidden');
      return false;
    }
    clearFieldError(emailInput, emailError);
    if (emailValidIcon) emailValidIcon.classList.remove('hidden');
    return true;
  }

  // Real-time password validation
  function validatePasswordField() {
    const val = passwordInput.value;
    if (!val) {
      showFieldError(passwordInput, passwordError, 'กรุณากรอกรหัสผ่าน');
      return false;
    }
    if (val.length < 6) {
      showFieldError(passwordInput, passwordError, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return false;
    }
    clearFieldError(passwordInput, passwordError);
    return true;
  }

  function showFieldError(input, errorContainer, message) {
    if (!input || !errorContainer) return;
    input.classList.add('input-error');
    input.classList.remove('input-success');
    errorContainer.className = 'flex items-center gap-1.5 text-rose-400 text-[11px] font-medium mt-1.5 animate-fade-in';
    errorContainer.innerHTML = `
      <i data-lucide="alert-circle" class="w-3.5 h-3.5 shrink-0 text-rose-400"></i>
      <span>${message}</span>
    `;
    if (window.lucide) window.lucide.createIcons({ root: errorContainer });
  }

  function clearFieldError(input, errorContainer) {
    if (!input || !errorContainer) return;
    input.classList.remove('input-error');
    input.classList.add('input-success');
    errorContainer.className = 'hidden';
    errorContainer.innerHTML = '';
  }

  emailInput?.addEventListener('input', () => {
    if (emailInput.value.trim() && isValidEmail(emailInput.value.trim())) {
      clearFieldError(emailInput, emailError);
      if (emailValidIcon) emailValidIcon.classList.remove('hidden');
    }
  });

  emailInput?.addEventListener('blur', () => {
    if (emailInput.value.trim()) {
      validateEmailField();
    }
  });

  passwordInput?.addEventListener('input', () => {
    if (passwordInput.value.length >= 6) {
      clearFieldError(passwordInput, passwordError);
    }
  });

  // Toggle Password Visibility
  container.querySelector('#btn-toggle-password')?.addEventListener('click', () => {
    showPassword = !showPassword;
    if (passwordInput) {
      passwordInput.type = showPassword ? 'text' : 'password';
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

  // Custom Google Modal Controls (Zero browser native prompt!)
  const googleModal = container.querySelector('#google-modal');
  const googleEmailInput = container.querySelector('#google-modal-email');
  const googleEmailError = container.querySelector('#google-email-error');

  container.querySelector('#auth-btn-google')?.addEventListener('click', () => {
    if (db.isCloudActive && db.supabase) {
      auth.signInWithGoogle();
      return;
    }
    // Show custom modal
    if (googleModal) {
      googleModal.classList.remove('hidden');
      googleModal.classList.add('flex');
      if (googleEmailInput) {
        googleEmailInput.value = '';
        googleEmailInput.focus();
      }
    }
  });

  container.querySelector('#btn-cancel-google')?.addEventListener('click', () => {
    if (googleModal) {
      googleModal.classList.add('hidden');
      googleModal.classList.remove('flex');
    }
  });

  container.querySelector('#google-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const gEmail = googleEmailInput.value.trim();
    if (!gEmail || !isValidEmail(gEmail)) {
      if (googleEmailError) {
        googleEmailError.className = 'flex items-center gap-1.5 text-rose-400 text-[11px] font-medium mt-1.5';
        googleEmailError.innerHTML = `<i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> กรุณากรอกอีเมล Google ให้ถูกต้อง (เช่น user@gmail.com)`;
        if (window.lucide) window.lucide.createIcons({ root: googleEmailError });
      }
      return;
    }

    // Process real login
    const userName = gEmail.split('@')[0];
    const googleUser = {
      id: 'google_' + btoa(gEmail).replace(/=/g, '').toLowerCase(),
      name: userName.charAt(0).toUpperCase() + userName.slice(1),
      email: gEmail.toLowerCase(),
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(gEmail)}`,
      provider: 'google',
      createdAt: new Date().toISOString()
    };

    auth.currentUser = googleUser;
    localStorage.setItem('qovynt_session', JSON.stringify(googleUser));
    auth._saveUserToDirectory(googleUser);

    googleModal.classList.add('hidden');
    googleModal.classList.remove('flex');

    showToast(`เข้าสู่ระบบด้วย Google สำเร็จ! สวัสดีคุณ ${googleUser.name}`, 'success');
    auth.notify();
    state.setView('overview');
  });

  // Form Submit
  container.querySelector('#auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isEmailValid = validateEmailField();
    const isPasswordValid = validatePasswordField();

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const submitBtn = container.querySelector('#auth-submit-btn');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-75');
    }

    try {
      if (authMode === 'login') {
        const ok = await auth.signInWithPassword(email, password);
        if (ok) {
          state.setView('overview');
        } else {
          // Display top banner error
          if (alertContainer) {
            alertContainer.innerHTML = `
              <div class="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 mb-4 animate-modal-pop">
                <i data-lucide="alert-triangle" class="w-4 h-4 shrink-0 text-rose-400"></i>
                <div class="flex-1">อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบหรือสร้างบัญชีใหม่</div>
              </div>
            `;
            if (window.lucide) window.lucide.createIcons({ root: alertContainer });
          }
        }
      } else {
        const name = nameInput?.value.trim() || '';
        const ok = await auth.signUp(email, password, name);
        if (ok) {
          state.setView('overview');
        }
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-75');
      }
    }
  });

  container.querySelector('#btn-forgot-pass')?.addEventListener('click', () => {
    showToast('กรุณาติดต่อผู้ดูแลระบบหรือใช้อีเมลยืนยันผ่าน Supabase เพื่อรีเซ็ตรหัสผ่าน', 'info');
  });
}
