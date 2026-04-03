// Intersection Observer para animaciones de scroll
export function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Stagger children si tiene data-stagger
          const stagger = (entry.target as HTMLElement).dataset.stagger;
          if (stagger) {
            const children = entry.target.querySelectorAll('.stagger-child');
            children.forEach((child, i) => {
              (child as HTMLElement).style.animationDelay = `${i * parseInt(stagger)}ms`;
              child.classList.add('animate-fade-in-up');
            });
          }
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach((el) => {
    observer.observe(el);
  });
}

// Contador animado para números
export function animateCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  counters.forEach((el) => {
    const target = parseInt((el as HTMLElement).dataset.counter || '0');
    const duration = 1500;
    const step = target / (duration / 16);
    let current = 0;

    const update = () => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toString();
      if (current < target) requestAnimationFrame(update);
    };

    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { update(); obs.disconnect(); }
    });
    obs.observe(el);
  });
}

// Efecto de partículas en el hero
export function initParticles(containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'absolute rounded-full bg-white/20 pointer-events-none';
    const size = Math.random() * 6 + 2;
    particle.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: particle ${Math.random() * 4 + 3}s ease-in-out infinite;
      animation-delay: ${Math.random() * 4}s;
    `;
    container.appendChild(particle);
  }
}

// Efecto de typing
export function typeWriter(el: HTMLElement, text: string, speed = 50) {
  el.textContent = '';
  let i = 0;
  const type = () => {
    if (i < text.length) {
      el.textContent += text.charAt(i++);
      setTimeout(type, speed);
    }
  };
  type();
}

// Tilt 3D en cards
export function initTilt(selector = '[data-tilt]') {
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
      el.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) scale(1.02)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
      el.style.transition = 'transform .4s ease';
    });
  });
}
