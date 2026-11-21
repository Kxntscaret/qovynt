// 3D Ambient Technology Particles for QOVYNT
export function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);
  let animationFrameId = null;
  let isRunning = true;

  // Particle configuration
  const PARTICLE_COUNT = Math.min(65, Math.floor((width * height) / 18000));
  const colors = [
    'rgba(168, 85, 247, ', // Purple
    'rgba(124, 58, 237, ', // Deep Purple
    'rgba(6, 182, 212, ',  // Cyan
    'rgba(192, 132, 252, ', // Lavender
    'rgba(244, 114, 182, '  // Pinkish violet
  ];

  class Particle3D {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.z = 0.3 + Math.random() * 1.2; // 3D depth layer
      this.vx = (Math.random() - 0.5) * 0.35 * this.z;
      this.vy = -(0.2 + Math.random() * 0.45) * this.z; // Slow upward drift
      this.radius = (1.0 + Math.random() * 1.8) * this.z;
      this.baseAlpha = (0.2 + Math.random() * 0.45) * Math.min(1, this.z);
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.pulseSpeed = 0.015 + Math.random() * 0.02;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update(mouseX, mouseY) {
      this.x += this.vx;
      this.y += this.vy;
      this.pulsePhase += this.pulseSpeed;

      // Mouse interactivity: gentle deflection
      if (mouseX !== null && mouseY !== null) {
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 130 * this.z;
        if (dist < maxDist && dist > 0) {
          const force = (1 - dist / maxDist) * 1.2 * this.z;
          this.x += (dx / dist) * force;
          this.y += (dy / dist) * force;
        }
      }

      // Wrap edges
      if (this.y < -20) {
        this.y = height + 10;
        this.x = Math.random() * width;
      }
      if (this.x < -20) this.x = width + 20;
      if (this.x > width + 20) this.x = -20;
    }

    draw() {
      const alpha = this.baseAlpha * (0.7 + 0.3 * Math.sin(this.pulsePhase));
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color + alpha + ')';
      ctx.shadowBlur = 8 * this.z;
      ctx.shadowColor = this.color + (alpha * 0.8) + ')';
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }
  }

  const particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle3D());

  let mouseX = null;
  let mouseY = null;
  let mouseTimeout = null;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    clearTimeout(mouseTimeout);
    mouseTimeout = setTimeout(() => {
      mouseX = null;
      mouseY = null;
    }, 2500);
  }, { passive: true });

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    isRunning = !document.hidden;
    if (isRunning && !animationFrameId) {
      loop();
    }
  });

  function loop() {
    if (!isRunning) {
      animationFrameId = null;
      return;
    }

    ctx.clearRect(0, 0, width, height);

    // Draw faint tech constellation connections
    const lineMaxDist = 80;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < lineMaxDist) {
          const lineAlpha = (1 - dist / lineMaxDist) * 0.12 * Math.min(p1.z, p2.z);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(168, 85, 247, ${lineAlpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
      particles[i].update(mouseX, mouseY);
      particles[i].draw();
    }

    animationFrameId = requestAnimationFrame(loop);
  }

  loop();
}
