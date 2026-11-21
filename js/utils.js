// Utility functions for QOVYNT

const THAI_DAYS = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export function getThaiBuddhistYear(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getFullYear() + 543;
}

export function formatThaiDateFull(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dayName = THAI_DAYS[d.getDay()];
  const dayNum = d.getDate();
  const monthName = THAI_MONTHS_FULL[d.getMonth()];
  const year = getThaiBuddhistYear(d);
  return `${dayName}ที่ ${dayNum} ${monthName} ${year}`;
}

export function formatThaiDateShort(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dayNum = d.getDate();
  const monthName = THAI_MONTHS_SHORT[d.getMonth()];
  const year = getThaiBuddhistYear(d);
  return `${dayNum} ${monthName} ${year}`;
}

export function formatThaiDateTime(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const shortDate = formatThaiDateShort(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${shortDate} ${hours}:${minutes}`;
}

export function formatMoney(amount, currency = '฿') {
  const num = Number(amount) || 0;
  return `${currency} ${num.toLocaleString('th-TH')}`;
}

export function getDynamicGreeting(name = 'คุณ') {
  const hour = new Date().getHours();
  let greeting = 'สวัสดี';
  let icon = '👋';
  let subtitle = 'ขอให้วันนี้เป็นวันที่ดีนะ เป็นกำลังใจให้เสมอ!';

  if (hour >= 5 && hour < 12) {
    greeting = 'สวัสดีตอนเช้า';
    icon = '🌅';
    subtitle = 'เริ่มต้นวันใหม่อย่างสดใส ก้าวไปสู่เป้าหมายด้วยกัน!';
  } else if (hour >= 12 && hour < 17) {
    greeting = 'สวัสดีตอนบ่าย';
    icon = '☀️';
    subtitle = 'ลุยงานช่วงบ่ายให้เต็มที่ อย่าลืมพักสายตาด้วยนะ!';
  } else if (hour >= 17 && hour < 21) {
    greeting = 'สวัสดีตอนเย็น';
    icon = '👋';
    subtitle = 'ขอให้วันนี้เป็นวันที่ดีนะ เป็นกำลังใจให้เสมอ!';
  } else {
    greeting = 'ราตรีสวัสดิ์';
    icon = '🌙';
    subtitle = 'พักผ่อนให้เพียงพอ ชาร์จพลังสำหรับวันพรุ่งนี้!';
  }

  return {
    title: `${greeting}, ${name} ${icon}`,
    subtitle
  };
}

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Toast Notification
export function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconName = 'info';
  let iconColor = 'text-cyan-400';
  if (type === 'success') {
    iconName = 'check-circle-2';
    iconColor = 'text-emerald-400';
    playAudioFeedback('success');
  } else if (type === 'error') {
    iconName = 'alert-triangle';
    iconColor = 'text-rose-400';
    playAudioFeedback('error');
  } else if (type === 'warning') {
    iconName = 'alert-circle';
    iconColor = 'text-amber-400';
  } else {
    playAudioFeedback('click');
  }

  toast.innerHTML = `
    <div class="${iconColor} shrink-0">
      <i data-lucide="${iconName}" class="w-5 h-5"></i>
    </div>
    <div class="text-sm font-medium text-slate-100 flex-1">${message}</div>
    <button class="text-slate-400 hover:text-white shrink-0 ml-2" onclick="this.parentElement.remove()">
      <i data-lucide="x" class="w-4 h-4"></i>
    </button>
  `;

  container.appendChild(toast);
  if (window.lucide) {
    window.lucide.createIcons({ root: toast });
  }

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// Subtle Audio Synthesizer (Zero external audio files needed!)
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

export function playAudioFeedback(type = 'click') {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'complete') {
      // High chord
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (e) {
    // Audio context not allowed without interaction or unsupported
  }
}

// Pure Canvas Confetti for Celebration
export function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  const particles = [];
  const colors = ['#7c3aed', '#06b6d4', '#10b981', '#f43f5e', '#fbbf24', '#ec4899', '#38bdf8'];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.8) * 16,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }

  let startTime = Date.now();
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - startTime;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Gravity
      p.rotation += p.rotSpeed;
      p.opacity = Math.max(0, 1 - (elapsed / 2500));

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    if (elapsed < 2500) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }

  playAudioFeedback('complete');
  animate();
}
