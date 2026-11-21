// QOVYNT — SYSTEM BOOT SEQUENCE
// Futuristic cinematic first-load experience

export class BootSequence {
  constructor() {
    this.overlay = document.getElementById('boot-intro-overlay');
    this.canvas = document.getElementById('boot-particles-canvas');
    this.logoWrap = document.getElementById('boot-logo-wrap');
    this.logoGlow = document.querySelector('.boot-logo-glow');
    this.brandChars = document.querySelectorAll('.boot-char');
    this.tagline = document.getElementById('boot-tagline');
    this.progressWrap = document.getElementById('boot-progress-wrap');
    this.progressBar = document.getElementById('boot-progress-bar');
    this.statusText = document.getElementById('boot-status-text');
    this.progressPct = document.getElementById('boot-progress-pct');

    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.currentProgress = 0;
    this.particles = [];
    this.animId = null;
    this.phase = 0; // 1: Init, 2: Logo, 3: Loading, 4: Exit
  }

  shouldRun() {
    return Boolean(this.overlay);
  }

  // Fast-path bypass
  bypass() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
      this.overlay.remove();
    }
  }

  async run(onAppInit) {
    if (!this.shouldRun()) {
      this.bypass();
      if (onAppInit) await onAppInit();
      return;
    }

    if (this.isReducedMotion) {
      // Respect accessibility preference: fast and minimal
      if (onAppInit) await onAppInit();
      this.markComplete();
      this.overlay?.classList.add('boot-fade-out');
      setTimeout(() => this.bypass(), 250);
      return;
    }

    // Initialize Canvas Particles
    this.initParticles();

    // PHASE 1 — SYSTEM INITIALIZATION (~700ms)
    this.phase = 1;
    this.overlay.classList.add('boot-phase-1');
    await this.wait(700);

    // PHASE 2 — LOGO REVEAL (~1200ms)
    this.phase = 2;
    this.overlay.classList.add('boot-phase-2');
    if (this.logoWrap) this.logoWrap.classList.add('boot-active');
    if (this.logoGlow) this.logoGlow.classList.add('boot-active');
    
    // Stagger character reveal
    this.brandChars.forEach((ch, idx) => {
      setTimeout(() => ch.classList.add('boot-active'), idx * 75);
    });

    // Tagline reveal
    setTimeout(() => {
      if (this.tagline) this.tagline.classList.add('boot-active');
    }, 450);

    await this.wait(1200);

    // PHASE 3 — LOADING SEQUENCE (Binds to real data init)
    this.phase = 3;
    if (this.progressWrap) this.progressWrap.classList.add('boot-active');

    // Run actual app initialization with progress hook
    let initCompleted = false;
    const initPromise = (async () => {
      if (onAppInit) {
        await onAppInit((realPct) => {
          this.setProgress(realPct);
        });
      }
      initCompleted = true;
    })();

    // Ensure progress shows active state
    this.setProgress(Math.max(this.currentProgress, 25));
    await Promise.race([initPromise, this.wait(400)]);
    this.setProgress(Math.max(this.currentProgress, 60));
    await initPromise;
    this.setProgress(100);

    if (this.statusText) {
      this.statusText.innerHTML = `
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        SYSTEM READY
      `;
      this.statusText.classList.remove('text-purple-300');
      this.statusText.classList.add('text-emerald-300');
    }

    await this.wait(400);

    // PHASE 4 — TRANSITION TO LOGIN / APP
    this.phase = 4;
    this.markComplete();

    // Trigger subtle purple light sweep
    const sweep = document.createElement('div');
    sweep.className = 'boot-transition-sweep';
    this.overlay.appendChild(sweep);

    this.overlay.classList.add('boot-fade-out');

    // Stop particles loop
    if (this.animId) cancelAnimationFrame(this.animId);

    // Clean up DOM after transition
    setTimeout(() => {
      this.bypass();
    }, 650);
  }

  setProgress(pct) {
    this.currentProgress = Math.min(100, Math.max(this.currentProgress, pct));
    if (this.progressBar) {
      this.progressBar.style.width = `${this.currentProgress}%`;
    }
    if (this.progressPct) {
      this.progressPct.textContent = `${this.currentProgress}%`;
    }
  }

  markComplete() {
    // Allow intro to play every time on reload as requested
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  initParticles() {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    let w = (this.canvas.width = window.innerWidth);
    let h = (this.canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      w = this.canvas.width = window.innerWidth;
      h = this.canvas.height = window.innerHeight;
    }, { passive: true });

    const count = 40;
    const colors = ['rgba(168, 85, 247, ', 'rgba(56, 189, 248, ', 'rgba(129, 140, 248, '];

    this.particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: 0.8 + Math.random() * 1.5,
      alpha: 0.15 + Math.random() * 0.45,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulse: Math.random() * Math.PI
    }));

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      const centerX = w / 2;
      const centerY = h / 2;

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.pulse += 0.02;

        // In Phase 3: subtle pull toward center logo
        if (this.phase === 3) {
          const dx = centerX - p.x;
          const dy = centerY - p.y;
          p.vx += dx * 0.00008;
          p.vy += dy * 0.00008;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const currentAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + currentAlpha + ')';
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color + '0.5)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      this.animId = requestAnimationFrame(render);
    };

    render();
  }
}
