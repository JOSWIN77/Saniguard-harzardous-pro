// SaniGuard - Advanced Interactive Animation & Physics Engine

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initSpotlightFollower();
  init3DCardTilt();
  initClickParticleBurst();
  initAmbientParticles();
  initScrollAnimations();
  initMobileNav();
  highlightActiveNav();
  initMetricCounters();
  initAudioFX();
  initHelmet3DInteractive();
});

// -------------------------------------------------------------
// 1. Mouse Spotlight Cursor Follower
// -------------------------------------------------------------
function initSpotlightFollower() {
  let spotlight = document.getElementById('cursor-spotlight');
  if (!spotlight) {
    spotlight = document.createElement('div');
    spotlight.id = 'cursor-spotlight';
    document.body.appendChild(spotlight);
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    document.documentElement.style.setProperty('--mouse-x', `${mouseX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${mouseY}px`);
  });

  function render() {
    currentX += (mouseX - currentX) * 0.12;
    currentY += (mouseY - currentY) * 0.12;
    spotlight.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    requestAnimationFrame(render);
  }
  render();
}

// -------------------------------------------------------------
// 2. 3D Card Physics Tilt with Dynamic Lighting
// -------------------------------------------------------------
function init3DCardTilt() {
  const cards = document.querySelectorAll('.card-tilt-3d');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -7;
      const rotateY = ((x - centerX) / centerX) * 7;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });
}

// -------------------------------------------------------------
// 3. Interactive Click Particle Energy Bursts
// -------------------------------------------------------------
function initClickParticleBurst() {
  document.addEventListener('click', (e) => {
    // Only burst on buttons, links, or hotspots
    const target = e.target.closest('button, a, .hotspot-btn, .sim-btn');
    if (!target) return;

    createSparkBurst(e.clientX, e.clientY);
  });
}

function createSparkBurst(x, y) {
  const count = 10;
  for (let i = 0; i < count; i++) {
    const spark = document.createElement('div');
    spark.style.position = 'fixed';
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.width = `${Math.random() * 4 + 2}px`;
    spark.style.height = spark.style.width;
    spark.style.borderRadius = '50%';
    spark.style.backgroundColor = Math.random() > 0.5 ? '#f59e0b' : '#22d3ee';
    spark.style.boxShadow = `0 0 8px ${spark.style.backgroundColor}`;
    spark.style.pointerEvents = 'none';
    spark.style.zIndex = '9999';
    document.body.appendChild(spark);

    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 60 + 30;
    const destX = Math.cos(angle) * velocity;
    const destY = Math.sin(angle) * velocity;

    spark.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${destX}px, ${destY}px) scale(0)`, opacity: 0 }
    ], {
      duration: Math.random() * 400 + 300,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'forwards'
    }).onfinish = () => spark.remove();
  }
}

// -------------------------------------------------------------
// 4. Interactive 3D Helmet View on Mouse Move
// -------------------------------------------------------------
function initHelmet3DInteractive() {
  const helmetContainer = document.querySelector('.helmet-interactive-view');
  if (!helmetContainer) return;

  helmetContainer.addEventListener('mousemove', (e) => {
    const rect = helmetContainer.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotY = (x / rect.width) * 16;
    const rotX = -(y / rect.height) * 16;

    const svg = helmetContainer.querySelector('svg');
    if (svg) {
      svg.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
      svg.style.transition = 'transform 0.1s ease-out';
    }
  });

  helmetContainer.addEventListener('mouseleave', () => {
    const svg = helmetContainer.querySelector('svg');
    if (svg) {
      svg.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)';
      svg.style.transition = 'transform 0.4s ease';
    }
  });
}

// -------------------------------------------------------------
// 5. Ambient Background Particle Canvas
// -------------------------------------------------------------
function initAmbientParticles() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.min(45, Math.floor(width / 35));

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.8 + 0.5,
      color: Math.random() > 0.6 ? '#f59e0b' : '#06b6d4',
      alpha: Math.random() * 0.3 + 0.05
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 110) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(245, 158, 11, ${(1 - dist / 110) * 0.06})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    for (let p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    requestAnimationFrame(draw);
  }

  draw();
}

// -------------------------------------------------------------
// 6. Web Audio Synthesizer
// -------------------------------------------------------------
let audioCtx = null;
let soundEnabled = true;

function initAudioFX() {
  const soundToggle = document.getElementById('sound-toggle-btn');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundToggle.classList.toggle('text-amber-400', soundEnabled);
      soundToggle.classList.toggle('text-slate-500', !soundEnabled);
      playBeep(soundEnabled ? 800 : 300, 0.05);
    });
  }
}

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

window.playBeep = function(freq = 600, duration = 0.05, type = 'sine') {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
};

window.playAlarmSound = function() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now + i * 0.14);
      osc.frequency.exponentialRampToValueAtTime(450, now + i * 0.14 + 0.1);
      gain.gain.setValueAtTime(0.04, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.1);
    }
  } catch (e) {}
};

// -------------------------------------------------------------
// 7. Scroll Staggered Animations
// -------------------------------------------------------------
function initScrollAnimations() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
}

// -------------------------------------------------------------
// 8. Active Nav Highlighter
// -------------------------------------------------------------
function highlightActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('text-white', 'font-semibold', 'bg-white/10');
      link.classList.remove('text-slate-400');
    }
  });
}

function initMobileNav() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (btn && menu) {
    btn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }
}

// -------------------------------------------------------------
// 9. Metric Number Counters with Flash
// -------------------------------------------------------------
function initMetricCounters() {
  const counters = document.querySelectorAll('.counter-val');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-target'));
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        let start = 0;
        const duration = 1200;
        const startTime = performance.now();

        function update(now) {
          const progress = Math.min(1, (now - startTime) / duration);
          const ease = 1 - Math.pow(1 - progress, 3);
          const current = (start + (target - start) * ease).toFixed(decimals);
          el.innerText = `${prefix}${current}${suffix}`;
          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            el.innerText = `${prefix}${target.toFixed(decimals)}${suffix}`;
            el.classList.add('text-amber-400');
          }
        }
        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  counters.forEach(c => observer.observe(c));
}
