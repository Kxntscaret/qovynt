// Modal dialog controller for QOVYNT
import { state } from './state.js';
import { showToast, formatMoney } from './utils.js';

export function setupModals() {
  const overlay = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-content');

  function openModal(html) {
    modalContent.innerHTML = html;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (window.lucide) {
      window.lucide.createIcons({ root: modalContent });
    }
  }

  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
      modalContent.innerHTML = '';
    }, 200);
  }

  // Close on backdrop or escape
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeModal();
    }
  });

  // Global event listener to open modals
  window.addEventListener('open-modal', (e) => {
    const detail = e.detail || {};
    const type = detail.modal;

    if (type === 'add-transaction') {
      const now = new Date();
      const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

      openModal(`
        <div class="glass-panel p-6 rounded-2xl w-full max-w-md border border-purple-500/40 animate-modal-pop">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="wallet" class="w-5 h-5 text-purple-400"></i> บันทึกรายรับ-รายจ่าย
            </h3>
            <button class="modal-close-btn text-slate-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <form id="form-add-tx" class="space-y-3.5">
            <!-- Type Selector -->
            <div class="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <label class="flex items-center justify-center gap-1.5 py-1.5 rounded-lg cursor-pointer text-xs font-semibold text-rose-300 has-[:checked]:bg-rose-600 has-[:checked]:text-white transition-all">
                <input type="radio" name="tx-type" value="expense" checked class="hidden" />
                <i data-lucide="arrow-up-right" class="w-4 h-4"></i> รายจ่าย
              </label>
              <label class="flex items-center justify-center gap-1.5 py-1.5 rounded-lg cursor-pointer text-xs font-semibold text-emerald-300 has-[:checked]:bg-emerald-600 has-[:checked]:text-white transition-all">
                <input type="radio" name="tx-type" value="income" class="hidden" />
                <i data-lucide="arrow-down-left" class="w-4 h-4"></i> รายรับ
              </label>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">ชื่อรายการ</label>
              <input type="text" id="tx-title" required placeholder="เช่น ค่าอาหาร, เงินเดือน, ค่าเน็ต" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">จำนวนเงิน (บาท)</label>
                <input type="number" id="tx-amount" required step="0.01" min="0" placeholder="0.00" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">หมวดหมู่</label>
                <select id="tx-category" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500">
                  <option value="อาหาร">อาหาร</option>
                  <option value="เดินทาง">เดินทาง</option>
                  <option value="ช้อปปิ้ง">ช้อปปิ้ง</option>
                  <option value="การเรียน">การเรียน</option>
                  <option value="บันเทิง">บันเทิง</option>
                  <option value="เงินเดือน">เงินเดือน</option>
                  <option value="เงินจากครอบครัว">เงินจากครอบครัว</option>
                  <option value="งานพิเศษ/ฟรีแลนซ์">งานพิเศษ/ฟรีแลนซ์</option>
                  <option value="อื่น ๆ">อื่น ๆ</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">วันและเวลาที่ทำรายการ</label>
              <input type="datetime-local" id="tx-datetime" value="${localISO}" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">บันทึกเพิ่มเติม (ถ้ามี)</label>
              <input type="text" id="tx-note" placeholder="รายละเอียดหรือสถานที่..." class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
            </div>

            <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all mt-2">
              บันทึกรายการ
            </button>
          </form>
        </div>
      `);

      document.getElementById('form-add-tx')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const type = document.querySelector('input[name="tx-type"]:checked').value;
        const title = document.getElementById('tx-title').value.trim();
        const amount = Number(document.getElementById('tx-amount').value);
        const category = document.getElementById('tx-category').value;
        const date = document.getElementById('tx-datetime').value || new Date().toISOString();
        const note = document.getElementById('tx-note').value.trim();

        state.addTransaction({ type, title, amount, category, date, note });
        closeModal();
      });
    }

    else if (type === 'add-task') {
      const todayISO = new Date().toISOString().slice(0, 10);
      openModal(`
        <div class="glass-panel p-6 rounded-2xl w-full max-w-md border border-purple-500/40 animate-modal-pop">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="check-square" class="w-5 h-5 text-purple-400"></i> สร้างงานใหม่ (New Task)
            </h3>
            <button class="modal-close-btn text-slate-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <form id="form-add-task" class="space-y-3.5">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">ชื่องานที่ต้องทำ</label>
              <input type="text" id="task-title" required placeholder="เช่น ส่งรายงานวิชาคอมพิวเตอร์..." class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">หมวดหมู่</label>
                <select id="task-category" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500">
                  <option value="เรียน">เรียน</option>
                  <option value="สุขภาพ">สุขภาพ</option>
                  <option value="พัฒนาตัวเอง">พัฒนาตัวเอง</option>
                  <option value="การเงิน">การเงิน</option>
                  <option value="งาน">งาน</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">ความสำคัญ</label>
                <select id="task-priority" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500">
                  <option value="high">สำคัญสูง</option>
                  <option value="medium" selected>ปานกลาง</option>
                  <option value="low">ทั่วไป</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">กำหนดส่ง (Due Date)</label>
              <input type="date" id="task-due" value="${todayISO}" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
            </div>

            <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all mt-2">
              เพิ่มงาน
            </button>
          </form>
        </div>
      `);

      document.getElementById('form-add-task')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const title = document.getElementById('task-title').value.trim();
        const category = document.getElementById('task-category').value;
        const priority = document.getElementById('task-priority').value;
        const dueDate = document.getElementById('task-due').value;

        state.addTask({ title, category, priority, dueDate, status: 'todo', completed: false });
        closeModal();
      });
    }

    else if (type === 'add-calendar') {
      const defaultDate = detail.defaultDate || new Date().toISOString().slice(0, 10);
      openModal(`
        <div class="glass-panel p-6 rounded-2xl w-full max-w-md border border-purple-500/40 animate-modal-pop">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="calendar" class="w-5 h-5 text-purple-400"></i> เพิ่มนัดหมาย / กิจกรรม
            </h3>
            <button class="modal-close-btn text-slate-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <form id="form-add-calendar" class="space-y-3.5">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">ชื่องาน / กิจกรรม</label>
              <input type="text" id="ev-title" required placeholder="เช่น ส่งรายงาน, ประชุมทีม, ออกกำลังกาย" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">วันที่</label>
              <input type="date" id="ev-date" value="${defaultDate}" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">เวลาเริ่ม</label>
                <input type="time" id="ev-start" value="09:00" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">เวลาสิ้นสุด</label>
                <input type="time" id="ev-end" value="10:00" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">หมวดหมู่</label>
                <input type="text" id="ev-cat" placeholder="เรียน, ทำงาน, สุขภาพ" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">ธีมสี</label>
                <select id="ev-color" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500">
                  <option value="purple">ม่วง (Purple)</option>
                  <option value="cyan">ฟ้า (Cyan)</option>
                  <option value="green">เขียว (Green)</option>
                  <option value="rose">ชมพู (Rose)</option>
                  <option value="amber">ส้ม (Amber)</option>
                </select>
              </div>
            </div>

            <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all mt-2">
              บันทึกกิจกรรม
            </button>
          </form>
        </div>
      `);

      document.getElementById('form-add-calendar')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const title = document.getElementById('ev-title').value.trim();
        const date = document.getElementById('ev-date').value;
        const startTime = document.getElementById('ev-start').value;
        const endTime = document.getElementById('ev-end').value;
        const category = document.getElementById('ev-cat').value.trim() || 'ทั่วไป';
        const color = document.getElementById('ev-color').value;

        state.addCalendarEvent({ title, date, startTime, endTime, category, color });
        closeModal();
      });
    }

    else if (type === 'add-goal') {
      openModal(`
        <div class="glass-panel p-6 rounded-2xl w-full max-w-md border border-purple-500/40 animate-modal-pop">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="target" class="w-5 h-5 text-purple-400"></i> ตั้งเป้าหมายใหม่ (New Goal)
            </h3>
            <button class="modal-close-btn text-slate-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <form id="form-add-goal" class="space-y-3.5">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">ชื่อเป้าหมาย</label>
              <input type="text" id="goal-title" required placeholder="เช่น ซื้อโน้ตบุ๊กใหม่, วิ่งมาราธอน" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">ปัจจุบัน</label>
                <input type="number" id="goal-current" value="0" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">เป้าหมาย</label>
                <input type="number" id="goal-target" required value="100" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">หน่วย</label>
                <input type="text" id="goal-unit" value="฿" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">หมวดหมู่</label>
                <select id="goal-category" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500">
                  <option value="finance">การเงิน</option>
                  <option value="health">สุขภาพ</option>
                  <option value="learning">การเรียนรู้</option>
                  <option value="personal">ส่วนตัว</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">ไอคอน</label>
                <select id="goal-icon" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500">
                  <option value="target">เป้าหมาย</option>
                  <option value="laptop">โน้ตบุ๊ก</option>
                  <option value="piggy-bank">กระปุกออมสิน</option>
                  <option value="dumbbell">ดัมเบล/กีฬา</option>
                  <option value="book-open">หนังสือ</option>
                </select>
              </div>
            </div>

            <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all mt-2">
              สร้างเป้าหมาย
            </button>
          </form>
        </div>
      `);

      document.getElementById('form-add-goal')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const title = document.getElementById('goal-title').value.trim();
        const current = Number(document.getElementById('goal-current').value);
        const target = Number(document.getElementById('goal-target').value);
        const unit = document.getElementById('goal-unit').value.trim() || 'หน่วย';
        const category = document.getElementById('goal-category').value;
        const icon = document.getElementById('goal-icon').value;
        const remaining = Math.max(0, target - current);
        const remainingText = `เหลืออีก ${unit === '฿' ? '฿ ' + remaining.toLocaleString() : remaining + ' ' + unit}`;

        state.addGoal({ title, current, target, unit, category, icon, remainingText });
        closeModal();
      });
    }

    else if (type === 'add-note') {
      openModal(`
        <div class="glass-panel p-6 rounded-2xl w-full max-w-md border border-purple-500/40 animate-modal-pop">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="file-text" class="w-5 h-5 text-purple-400"></i> เขียนบันทึกใหม่ (New Note)
            </h3>
            <button class="modal-close-btn text-slate-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <form id="form-add-note" class="space-y-3.5">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">หัวข้อบันทึก</label>
              <input type="text" id="note-title" required placeholder="เช่น ไอเดียพัฒนาเว็บไซต์..." class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">เนื้อหา</label>
              <textarea id="note-content" required rows="5" placeholder="เขียนรายละเอียด..." class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 resize-none"></textarea>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">สีการ์ด</label>
              <select id="note-color" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500">
                <option value="purple">ม่วง (Purple)</option>
                <option value="amber">ส้ม / เหลือง (Amber)</option>
                <option value="cyan">ฟ้า (Cyan)</option>
                <option value="emerald">เขียว (Emerald)</option>
              </select>
            </div>

            <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all mt-2">
              บันทึกโน้ต
            </button>
          </form>
        </div>
      `);

      document.getElementById('form-add-note')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const title = document.getElementById('note-title').value.trim();
        const content = document.getElementById('note-content').value.trim();
        const color = document.getElementById('note-color').value;

        state.addNote({ title, content, color, isPinned: false });
        closeModal();
      });
    }

    else if (type === 'add-project') {
      openModal(`
        <div class="glass-panel p-6 rounded-2xl w-full max-w-md border border-purple-500/40 animate-modal-pop">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="folder-plus" class="w-5 h-5 text-purple-400"></i> สร้างโปรเจกต์ใหม่ (New Project)
            </h3>
            <button class="modal-close-btn text-slate-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <form id="form-add-project" class="space-y-3.5">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">ชื่อโปรเจกต์</label>
              <input type="text" id="proj-title" required placeholder="เช่น Personal Website, Mobile App" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">ขั้นตอนปัจจุบัน (Stage)</label>
                <input type="text" id="proj-stage" value="วางแผน" placeholder="เช่น พัฒนา UI, เขียนโค้ด" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-300 mb-1">ความคืบหน้าเริ่มต้น (%)</label>
                <input type="number" id="proj-progress" min="0" max="100" value="10" class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">รายละเอียดโปรเจกต์</label>
              <textarea id="proj-desc" rows="3" placeholder="เป้าหมายของโปรเจกต์..." class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 resize-none"></textarea>
            </div>

            <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all mt-2">
              สร้างโปรเจกต์
            </button>
          </form>
        </div>
      `);

      document.getElementById('form-add-project')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const title = document.getElementById('proj-title').value.trim();
        const stage = document.getElementById('proj-stage').value.trim();
        const progress = Number(document.getElementById('proj-progress').value);
        const description = document.getElementById('proj-desc').value.trim();

        state.addProject({ title, stage, progress, description, category: 'General' });
        closeModal();
      });
    }

    // Bind close button
    modalContent.querySelector('.modal-close-btn')?.addEventListener('click', closeModal);
  });
}
