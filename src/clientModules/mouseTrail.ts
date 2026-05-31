export {};

function startMouseTrail() {
  let lastMoveSpawn = 0;
  let lastMouseX = window.innerWidth / 2;
  let lastMouseY = window.innerHeight / 2;
  let isMoving = false;
  let stopTimer: number | undefined;

  const moveSpawnGap = 38; // 移动时粒子数量，越大越少
  const idleSpawnGap = 150; // 静止时粒子数量，大约是移动的一半
  const maxParticles = 45;

  const container = document.createElement('div');
  container.className = 'mc-glass-particle-container';
  document.body.appendChild(container);

  function spawnParticle(x: number, y: number, idle = false) {
    const particles = container.querySelectorAll('.mc-glass-particle');

    if (particles.length >= maxParticles) {
      particles[0]?.remove();
    }

    const particle = document.createElement('span');
    particle.className = 'mc-glass-particle';

    const angle = Math.random() * Math.PI * 2;

    // idle 时离鼠标稍微远一点，更不挡视线
    const startRadius = idle
      ? 35 + Math.random() * 5
      : 22 + Math.random() * 20;

    const driftRadius = idle
      ? 20 + Math.random() * 15
      : 15 + Math.random() * 15;

    const startX = x + Math.cos(angle) * startRadius;
    const startY = y + Math.sin(angle) * startRadius + 8;

    const driftX = Math.cos(angle) * driftRadius;
    const driftY = idle ? Math.sin(angle) * driftRadius - 5 : Math.sin(angle) * driftRadius - 1;

    const size = idle
      ? 6 + Math.random() * 6
      : 7 + Math.random() * 7;

    const duration = idle
      ? 900 + Math.random() * 300
      : 700 + Math.random() * 220;

    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.setProperty('--dx', `${driftX}px`);
    particle.style.setProperty('--dy', `${driftY}px`);
    particle.style.animationDuration = `${duration}ms`;

    if (idle) {
      particle.classList.add('mc-glass-particle-idle');
    }

    container.appendChild(particle);

    particle.addEventListener(
      'animationend',
      () => {
        particle.remove();
      },
      {once: true},
    );
  }

  window.addEventListener(
    'mousemove',
    (event) => {
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
      isMoving = true;

      if (stopTimer !== undefined) {
        window.clearTimeout(stopTimer);
      }

      stopTimer = window.setTimeout(() => {
        isMoving = false;
      }, 120);

      const now = performance.now();

      if (now - lastMoveSpawn < moveSpawnGap) return;
      lastMoveSpawn = now;

      spawnParticle(lastMouseX, lastMouseY, false);
    },
    {passive: true},
  );

  window.setInterval(() => {
    if (isMoving) return;
    spawnParticle(lastMouseX, lastMouseY, true);
  }, idleSpawnGap);
}

if (typeof window !== 'undefined') {
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (!reducedMotion && !coarsePointer) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startMouseTrail);
    } else {
      startMouseTrail();
    }
  }
}