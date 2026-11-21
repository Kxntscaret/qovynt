// Settings View - Database Connection, Profile, GitHub Pages guide, Backup with Decision Dialogs
import { state } from '../state.js';
import { db } from '../db.js';
import { auth } from '../auth.js';
import { showToast } from '../utils.js';
import { showConfirmDialog } from '../modals.js';

export function renderSettings(container) {
  const profile = state.data.profile || {};
  const currentUrl = localStorage.getItem('qovynt_supabase_url') || '';
  const currentKey = localStorage.getItem('qovynt_supabase_key') || '';
  const isCloud = db.isCloudActive;

  container.innerHTML = `
    <div class="space-y-6 pb-12 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-800 stagger-item stagger-1">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2">
            <i data-lucide="settings" class="w-6 h-6 text-purple-400"></i>
            การตั้งค่าและฐานข้อมูล (Settings & Database)
          </h1>
          <p class="text-xs text-slate-400 mt-1">ตั้งค่าโปรไฟล์ ฐานข้อมูลคลาวด์ Supabase และการเผยแพร่ขึ้น GitHub Pages</p>
        </div>
      </div>

      <!-- Cloud Database (Supabase) Card -->
      <div class="glass-panel p-6 space-y-4 stagger-item stagger-2">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <i data-lucide="database" class="w-5 h-5"></i>
            </div>
            <div>
              <h2 class="text-base font-bold text-white">การเชื่อมต่อ Cloud Database & Google Login (Supabase)</h2>
              <p class="text-xs text-slate-400">เชื่อมต่อ Supabase เพื่อให้ทุกคนที่เข้าเว็บสามารถลงทะเบียนและล็อกอินด้วย Google ได้อย่างปลอดภัย</p>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-semibold ${isCloud ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}">
            ${isCloud ? '● เชื่อมต่อ Cloud สำเร็จ' : '○ ใช้งานโหมด Local Storage'}
          </span>
        </div>

        <div class="space-y-3 pt-2">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Supabase Project URL</label>
            <input 
              type="text" 
              id="setting-supabase-url" 
              placeholder="https://xxxxxxxx.supabase.co" 
              value="${currentUrl}"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Supabase Anon Public API Key</label>
            <input 
              type="password" 
              id="setting-supabase-key" 
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..." 
              value="${currentKey}"
              class="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <button id="btn-save-supabase" class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2">
              <i data-lucide="save" class="w-4 h-4"></i> บันทึกและเชื่อมต่อ
            </button>
            <button id="btn-clear-supabase" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors">
              เปลี่ยนเป็น Local Mode
            </button>
          </div>
        </div>

        <div class="mt-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
          <p class="font-semibold text-slate-200">💡 คำแนะนำการสร้างฐานข้อมูลใน Supabase ฟรี:</p>
          <p>1. สมัครบัญชีฟรีที่ <a href="https://supabase.com" target="_blank" class="text-purple-400 underline">supabase.com</a> และสร้างโปรเจกต์ใหม่</p>
          <p>2. ไปที่เมนู SQL Editor แล้วนำโค้ดจากไฟล์ <code class="text-purple-300">supabase_schema.sql</code> ไปวางแล้วกด Run</p>
          <p>3. ไปที่ Authentication -> Providers แล้วเปิดใช้งาน Google Login</p>
          <p>4. คัดลอก Project URL และ anon key มาใส่ในช่องด้านบนนี้</p>
        </div>
      </div>

      <!-- User Profile Settings -->
      <div class="glass-panel p-6 space-y-4 stagger-item stagger-3">
        <h2 class="text-base font-bold text-white flex items-center gap-2">
          <i data-lucide="user" class="w-5 h-5 text-purple-400"></i>
          ข้อมูลส่วนตัว (Profile)
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">ชื่อผู้ใช้งาน</label>
            <input 
              type="text" 
              id="setting-name" 
              value="${profile.name || ''}"
              class="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">เป้าหมายเงินออมต่อเดือน (บาท)</label>
            <input 
              type="number" 
              id="setting-savings-target" 
              value="${profile.monthlySavingsTarget || 10000}"
              class="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
        <button id="btn-save-profile" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-purple-600 text-white text-xs font-medium transition-colors">
          บันทึกข้อมูลส่วนตัว
        </button>
      </div>

      <!-- Backup & Restore -->
      <div class="glass-panel p-6 space-y-4 stagger-item stagger-4">
        <h2 class="text-base font-bold text-white flex items-center gap-2">
          <i data-lucide="hard-drive" class="w-5 h-5 text-purple-400"></i>
          การจัดการข้อมูลและการสำรองข้อมูล (Backup & Restore)
        </h2>
        <div class="flex flex-wrap items-center gap-3">
          <button id="btn-export-json" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-2 transition-all hover:scale-105">
            <i data-lucide="download" class="w-4 h-4"></i> สำรองข้อมูลทั้งหมด (Export JSON)
          </button>
          <label class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-105">
            <i data-lucide="upload" class="w-4 h-4"></i> กู้คืนข้อมูล (Import JSON)
            <input type="file" id="input-import-json" accept=".json" class="hidden" />
          </label>
          <button id="btn-reset-demo" class="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs border border-rose-500/30 flex items-center gap-2 ml-auto transition-all hover:scale-105">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i> รีเซ็ตข้อมูลเริ่มต้น
          </button>
        </div>
      </div>

      <!-- GitHub Pages Deployment Guide Card -->
      <div class="glass-panel p-6 space-y-3 border-purple-500/30 stagger-item stagger-5">
        <h2 class="text-base font-bold text-white flex items-center gap-2">
          <i data-lucide="github" class="w-5 h-5 text-purple-400"></i>
          วิธีนำขึ้น GitHub Pages ให้ทุกคนเข้าใช้งานได้ฟรี
        </h2>
        <div class="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>1. สร้าง Repository ใหม่บน GitHub เช่น ชื่อ <code class="text-purple-300">qovynt</code></p>
          <p>2. อัปโหลดไฟล์โปรเจกต์นี้ทั้งหมดขึ้นไปที่ branch <code class="text-purple-300">main</code></p>
          <p>3. ใน GitHub Repository ไปที่แท็บ <strong>Settings</strong> → <strong>Pages</strong></p>
          <p>4. ตรงหัวข้อ <em>Build and deployment</em> ให้เลือก Branch เป็น <strong>main</strong> และโฟลเดอร์ <strong>/ (root)</strong> แล้วกด <strong>Save</strong></p>
          <p>5. รอประมาณ 1 นาที เว็บจะเปิดให้ทุกคนเข้าใช้งานได้ทันทีที่โดเมน: <br/><strong class="text-cyan-400">https://&lt;ชื่อผู้ใช้-github&gt;.github.io/qovynt/</strong> 🎉</p>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }

  bindSettingsEvents(container);
}

function bindSettingsEvents(container) {
  container.querySelector('#btn-save-supabase')?.addEventListener('click', () => {
    const url = container.querySelector('#setting-supabase-url').value.trim();
    const key = container.querySelector('#setting-supabase-key').value.trim();
    localStorage.setItem('qovynt_supabase_url', url);
    localStorage.setItem('qovynt_supabase_key', key);
    db.initSupabase();
    showToast('บันทึกการตั้งค่า Supabase เรียบร้อย กำลังรีโหลด...', 'success');
    setTimeout(() => window.location.reload(), 1000);
  });

  container.querySelector('#btn-clear-supabase')?.addEventListener('click', () => {
    localStorage.removeItem('qovynt_supabase_url');
    localStorage.removeItem('qovynt_supabase_key');
    db.initSupabase();
    showToast('เปลี่ยนเป็นโหมด Local เรียบร้อย', 'info');
    setTimeout(() => window.location.reload(), 800);
  });

  container.querySelector('#btn-save-profile')?.addEventListener('click', async () => {
    const name = container.querySelector('#setting-name').value.trim();
    const target = Number(container.querySelector('#setting-savings-target').value);
    const profile = state.data.profile || {};
    profile.name = name;
    profile.monthlySavingsTarget = target;
    await db.saveProfile(profile);
    state.data.profile = profile;
    showToast('บันทึกข้อมูลส่วนตัวเรียบร้อย', 'success');
    state.notify();
  });

  container.querySelector('#btn-export-json')?.addEventListener('click', () => {
    const json = db.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qovynt_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('ส่งออกไฟล์สำรองข้อมูล JSON สำเร็จ!', 'success');
  });

  container.querySelector('#input-import-json')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const ok = db.importJSON(event.target.result);
      if (ok) {
        showToast('กู้คืนข้อมูลสำเร็จ! กำลังรีโหลด...', 'success');
        setTimeout(() => window.location.reload(), 800);
      } else {
        showToast('ไฟล์ JSON ไม่ถูกต้อง', 'error');
      }
    };
    reader.readAsText(file);
  });

  // Decision Dialog for Reset
  container.querySelector('#btn-reset-demo')?.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog({
      title: 'ยืนยันการรีเซ็ตข้อมูล',
      message: 'คุณแน่ใจว่าต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่? ข้อมูลทั้งหมดที่บันทึกไว้จะถูกล้างและไม่สามารถย้อนกลับได้',
      confirmText: 'ยืนยันรีเซ็ตข้อมูลทั้งหมด',
      cancelText: 'ยกเลิก',
      type: 'danger',
      icon: 'alert-triangle'
    });

    if (confirmed) {
      db.resetAll();
      showToast('รีเซ็ตข้อมูลเรียบร้อย กำลังรีโหลด...', 'info');
      setTimeout(() => window.location.reload(), 800);
    }
  });
}
