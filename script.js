(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- page-load sequence ---------- */
  const start = () => requestAnimationFrame(() => root.classList.add('is-loaded'));
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 600))]).then(start);
  } else start();

  /* ---------- nav + progress ---------- */
  const nav = document.querySelector('[data-nav]');
  const bar = document.querySelector('.scroll-stem span');
  let lastY = window.scrollY;

  /* ---------- scroll tour ---------- */
  const tour = document.querySelector('[data-tour]');
  const camera = document.querySelector('[data-camera]');
  const ring = document.querySelector('[data-ring]');
  const steps = [...document.querySelectorAll('.tour-step')];
  const dots = [...document.querySelectorAll('.tour-dots i')];
  // focus points in the app screenshot (fractions of width / height), zoom, and whether to ring it
  const stops = [
    { x: 0.5, y: 0.5, s: 1, ring: false },        // whole garden
    { x: 0.207, y: 0.39, s: 2.5, ring: true },    // an empty plot
    { x: 0.496, y: 0.828, s: 2.1, ring: true },   // Plant New Gratitude
    { x: 0.425, y: 0.42, s: 2.3, ring: true, rx: 0.425, ry: 0.375 },    // "You make me laugh"
    { x: 0.5, y: 0.42, s: 1.12, ring: false },    // the full garden
  ];
  let activeStep = -1;

  const setStep = (i) => {
    if (i === activeStep) return;
    activeStep = i;
    steps.forEach((el, n) => {
      el.classList.toggle('is-active', n === i);
      el.classList.toggle('is-past', n < i);
    });
    dots.forEach((d, n) => d.classList.toggle('is-active', n === i));
  };

  const renderTour = () => {
    if (!tour || !camera) return;
    const rect = tour.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const p = clamp(-rect.top / total, 0, 1);
    const t = p * (stops.length - 1);
    const i = Math.min(Math.floor(t), stops.length - 2);
    const raw = t - i;
    const f = reduceMotion ? Math.round(raw) : smooth(clamp((raw - 0.3) / 0.7, 0, 1));
    const a = stops[i];
    const b = stops[i + 1];
    const fx = lerp(a.x, b.x, f);
    const fy = lerp(a.y, b.y, f);
    const s = lerp(a.s, b.s, f);

    const W = camera.offsetWidth;
    const Hi = camera.offsetHeight;
    const H = camera.parentElement.offsetHeight;
    const tx = clamp(W / 2 - fx * W * s, W - W * s, 0);
    const ty = clamp(H / 2 - fy * Hi * s, H - Hi * s, 0);
    camera.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;

    const at = raw < 0.3 ? a : f > 0.97 ? b : null;
    if (ring) {
      if (at && at.ring) {
        ring.style.left = (at.rx ?? at.x) * 100 + '%';
        ring.style.top = (at.ry ?? at.y) * 100 + '%';
        ring.style.transform = `scale(${1 / s})`;
        ring.classList.add('is-on');
      } else ring.classList.remove('is-on');
    }
    setStep(raw < 0.65 ? i : i + 1);
  };

  /* ---------- waitlist vine + parallax ---------- */
  const vine = document.querySelector('.waitlist-vine path');
  let vineLen = 0;
  if (vine) {
    vineLen = vine.getTotalLength();
    vine.style.setProperty('--len', vineLen);
    vine.style.setProperty('--off', vineLen);
  }
  const insideImg = document.querySelector('.inside-media img');

  const onScroll = () => {
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 20);
      nav.classList.toggle('is-hidden', y > window.innerHeight * 0.9 && y > lastY + 4);
      if (y < lastY - 4) nav.classList.remove('is-hidden');
    }
    lastY = y;
    renderTour();

    if (vine) {
      const r = vine.ownerSVGElement.parentElement.getBoundingClientRect();
      const p = clamp((window.innerHeight - r.top) / (window.innerHeight + r.height * 0.5), 0, 1);
      vine.style.setProperty('--off', vineLen * (1 - p));
    }
    if (insideImg && !reduceMotion) {
      const r = insideImg.getBoundingClientRect();
      const c = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      insideImg.style.setProperty('--py', (c * -40).toFixed(1) + 'px');
    }
  };

  let ticking = false;
  const requestScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  };
  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll);
  onScroll();

  /* ---------- gentle reveals ---------- */
  const revealEls = document.querySelectorAll('.plant-head, .inside-media, .inside-copy, .creator');
  if ('IntersectionObserver' in window && !reduceMotion) {
    revealEls.forEach((el) => el.setAttribute('data-reveal', ''));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.18 });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- hero tilt ---------- */
  const tilt = document.querySelector('[data-tilt]');
  if (tilt && finePointer && !reduceMotion) {
    const hero = tilt.closest('.hero');
    hero.addEventListener('pointermove', (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      tilt.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 6}deg) translate(${x * 12}px, ${y * 8}px)`;
    });
    hero.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * 0.2).toFixed(1) + 'px');
        btn.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px');
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.setProperty('--bx', '0px');
        btn.style.setProperty('--by', '0px');
      });
    });
  }

  /* ---------- falling blossom petals ---------- */
  const canvas = document.querySelector('.petals');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const colors = ['#f2a7b5', '#f7c4cd', '#eb8fa2', '#fbd9de'];
    let w, h, dpr, petals = [], running = true, last = 0;

    const make = (initial) => ({
      x: rand(0, w),
      y: initial ? rand(-h, h) : rand(-60, -10),
      r: rand(5, 10),
      vy: rand(18, 42),
      vx: rand(-10, 14),
      rot: rand(0, Math.PI * 2),
      vr: rand(-1.2, 1.2),
      flip: rand(0, Math.PI * 2),
      vf: rand(1.5, 3.2),
      c: colors[(Math.random() * colors.length) | 0],
    });

    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(clamp(w / 55, 10, 26));
      petals = Array.from({ length: count }, () => make(true));
    };

    const draw = (p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.abs(Math.cos(p.flip)) * 0.8 + 0.2);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.bezierCurveTo(p.r, -p.r * 0.6, p.r * 0.8, p.r * 0.7, 0, p.r);
      ctx.bezierCurveTo(-p.r * 0.8, p.r * 0.7, -p.r, -p.r * 0.6, 0, -p.r);
      ctx.fill();
      ctx.restore();
    };

    const frame = (now) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000 || 0, 0.05);
      last = now;
      ctx.clearRect(0, 0, w, h);
      const sway = Math.sin(now / 2400) * 12;
      for (const p of petals) {
        p.y += p.vy * dt;
        p.x += (p.vx + sway) * dt;
        p.rot += p.vr * dt;
        p.flip += p.vf * dt;
        if (p.y > h + 20 || p.x < -40 || p.x > w + 40) Object.assign(p, make(false));
        draw(p);
      }
      requestAnimationFrame(frame);
    };

    size();
    window.addEventListener('resize', size);
    new IntersectionObserver(([e]) => {
      const was = running;
      running = e.isIntersecting;
      if (running && !was) { last = performance.now(); requestAnimationFrame(frame); }
    }).observe(canvas);
    requestAnimationFrame(frame);
  }

  /* ---------- plant-a-gratitude demo ---------- */
  const row = document.querySelector('[data-row]');
  const form = document.querySelector('[data-plant-form]');
  const input = form && form.querySelector('input');
  const countEl = document.querySelector('[data-count]');
  if (!row || !form) return;

  const palettes = [
    { petal: '#f2a7b5', deep: '#e07b92' },
    { petal: '#b8a0ea', deep: '#9479d6' },
    { petal: '#f5c543', deep: '#e3a92a' },
    { petal: '#ffffff', deep: '#f1d9de' },
    { petal: '#f48a7f', deep: '#d9655c' },
  ];
  const kinds = ['blossom', 'daisy', 'tulip'];
  let planted = 0;
  let kindIndex = 0;
  let colorIndex = 0;

  const headSVG = (kind, c) => {
    if (kind === 'daisy') {
      let petals = '';
      for (let i = 0; i < 12; i++) {
        petals += `<ellipse cx="60" cy="38" rx="6.5" ry="19" fill="${c.petal}" stroke="${c.deep}" stroke-width="1" transform="rotate(${i * 30} 60 58)"/>`;
      }
      return `${petals}<circle cx="60" cy="58" r="11" fill="#f5c543"/><circle cx="57" cy="55" r="3" fill="#fff" opacity=".5"/>`;
    }
    if (kind === 'tulip') {
      return `<path d="M38 50 C 36 76, 50 86, 60 86 C 70 86, 84 76, 82 50 L 72 60 L 60 38 L 48 60 Z" fill="${c.deep}"/>
        <path d="M44 54 C 44 76, 54 84, 60 84 C 66 84, 76 76, 76 54 L 67 62 L 60 44 L 53 62 Z" fill="${c.petal}"/>
        <path d="M60 44 L 54 66 C 56 76, 64 76, 66 66 Z" fill="${c.deep}" opacity=".35"/>`;
    }
    let petals = '';
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * Math.PI / 180;
      petals += `<circle cx="${(60 + Math.cos(a) * 17).toFixed(1)}" cy="${(58 + Math.sin(a) * 17).toFixed(1)}" r="15" fill="${c.petal}" stroke="${c.deep}" stroke-width="1.2"/>`;
    }
    return `${petals}<circle cx="60" cy="58" r="9" fill="#f5c543"/><circle cx="60" cy="58" r="4" fill="#e3a92a"/>`;
  };

  const flowerSVG = (kind, c, height) => {
    const top = 200 - height;
    const bend = rand(-10, 10).toFixed(1);
    return `<svg viewBox="0 ${top - 20} 120 ${height + 20}" aria-hidden="true">
      <path class="stem" d="M60 200 C ${60 + +bend} ${200 - height * 0.4}, ${60 - +bend} ${200 - height * 0.7}, 60 ${top + 58}" fill="none" stroke="#5f8a3a" stroke-width="5" stroke-linecap="round" pathLength="200"/>
      <path class="leaf leaf-l" d="M58 ${200 - height * 0.32} C 40 ${200 - height * 0.38}, 30 ${200 - height * 0.5}, 28 ${200 - height * 0.56} C 42 ${200 - height * 0.56}, 54 ${200 - height * 0.46}, 58 ${200 - height * 0.32} Z" fill="#8ba65a"/>
      <path class="leaf leaf-r" d="M62 ${200 - height * 0.5} C 78 ${200 - height * 0.54}, 88 ${200 - height * 0.66}, 92 ${200 - height * 0.72} C 78 ${200 - height * 0.72}, 66 ${200 - height * 0.64}, 62 ${200 - height * 0.5} Z" fill="#7a9a4a"/>
      <g transform="translate(0 ${top})"><g class="head-sway"><g class="head">${headSVG(kind, c)}</g></g></g>
    </svg>`;
  };

  const maxFlowers = () => (window.innerWidth < 640 ? 3 : window.innerWidth < 960 ? 4 : 5);

  const burst = (flower, color) => {
    if (reduceMotion) return;
    const bed = row.parentElement;
    const br = bed.getBoundingClientRect();
    const fr = flower.querySelector('svg').getBoundingClientRect();
    const cx = fr.left + fr.width / 2 - br.left;
    const cy = fr.top + fr.height * 0.25 - br.top;
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span');
      s.className = 'burst';
      s.style.left = cx + 'px';
      s.style.top = cy + 'px';
      s.style.background = i % 3 ? color : '#f5c543';
      bed.appendChild(s);
      const a = rand(0, Math.PI * 2);
      const d = rand(40, 110);
      s.animate([
        { transform: 'translate(-50%, -50%) rotate(0deg) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 60}px) rotate(${rand(-360, 360)}deg) scale(.4)`, opacity: 0 },
      ], { duration: rand(900, 1500), delay: 900, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }).onfinish = () => s.remove();
    }
  };

  const plant = (text, { celebrate = true } = {}) => {
    const kind = kinds[kindIndex++ % kinds.length];
    const c = palettes[colorIndex++ % palettes.length];
    const height = Math.round(rand(120, 175));
    const el = document.createElement('div');
    el.className = 'flower';
    el.style.setProperty('--r', rand(-4, 4).toFixed(1) + 'deg');
    el.innerHTML = `<p class="flower-note"></p>${flowerSVG(kind, c, height)}`;
    el.querySelector('.flower-note').textContent = text;

    const existing = row.querySelectorAll('.flower:not(.is-leaving)');
    if (existing.length >= maxFlowers()) {
      const old = existing[0];
      old.classList.add('is-leaving');
      setTimeout(() => old.remove(), 400);
    }
    // place new flowers in a random spot so the bed looks planted, not stacked
    const kids = row.querySelectorAll('.flower:not(.is-leaving)');
    const pos = Math.floor(Math.random() * (kids.length + 1));
    row.insertBefore(el, kids[pos] || null);

    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-grown')));
    if (celebrate) burst(el, c.petal === '#ffffff' ? '#f2a7b5' : c.petal);
  };

  const updateCount = () => {
    if (!countEl) return;
    countEl.textContent = planted === 0
      ? 'A few your future selves might write.'
      : planted === 1
        ? 'You planted your first one. Imagine a whole year of these.'
        : `You planted ${planted}. Imagine a whole year of these.`;
  };

  const seeds = ['your support', 'you make me laugh', 'our little adventures', 'you’re my peace', 'your kindness'];
  let seeded = false;
  const seed = () => {
    if (seeded) return;
    seeded = true;
    seeds.slice(0, maxFlowers()).forEach((t, i) => setTimeout(() => plant(t, { celebrate: false }), i * 260));
    updateCount();
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { seed(); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(row.parentElement);
  } else seed();

  const submit = (text) => {
    const clean = text.trim().replace(/\s+/g, ' ');
    if (!clean) { input.focus(); return; }
    seed();
    plant(clean);
    planted++;
    updateCount();
    input.value = '';
  };

  // decorative flowers along the bottom of the waitlist band
  const wbed = document.querySelector('[data-waitlist-bed]');
  if (wbed) {
    const n = window.innerWidth < 640 ? 5 : 9;
    for (let i = 0; i < n; i++) {
      const f = document.createElement('div');
      f.className = 'flower';
      f.innerHTML = flowerSVG(kinds[i % 3], palettes[(i * 2) % palettes.length], Math.round(rand(110, 170)));
      f.querySelectorAll('.flower-note').forEach((x) => x.remove());
      f.style.transitionDelay = i * 0.08 + 's';
      f.querySelectorAll('.stem, .leaf, .head').forEach((x) => { x.style.transitionDelay = `calc(${i * 0.09}s + ${getComputedStyle(x).transitionDelay})`; });
      wbed.appendChild(f);
    }
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { wbed.querySelectorAll('.flower').forEach((f) => f.classList.add('is-grown')); io.disconnect(); }
      }, { threshold: 0.3 });
      io.observe(wbed.parentElement);
    } else wbed.querySelectorAll('.flower').forEach((f) => f.classList.add('is-grown'));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit(input.value);
  });
  document.querySelectorAll('[data-idea]').forEach((b) => {
    b.addEventListener('click', () => submit(b.dataset.idea));
  });
})();
