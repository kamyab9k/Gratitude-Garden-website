(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const motion = hasGSAP && !reduceMotion;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  if (motion) root.classList.add('motion');

  /* ---------- text splitting ---------- */
  $$('.hero-word').forEach((w) => {
    w.setAttribute('aria-hidden', 'true');
    w.innerHTML = [...w.textContent].map((c) => `<span class="ch">${c}</span>`).join('');
  });
  const statement = $('[data-split]');
  if (statement) {
    statement.innerHTML = statement.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
  }

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (motion) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.6 });
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- nav + progress ---------- */
  const nav = $('[data-nav]');
  const bar = $('[data-scroll-bar]');
  const firstSection = $('.statement');
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (nav && firstSection) {
      const solid = firstSection.getBoundingClientRect().top < 90;
      nav.classList.toggle('is-solid', solid);
      if (solid && y > lastY + 6) nav.classList.add('is-hidden');
      else if (y < lastY - 6 || !solid) nav.classList.remove('is-hidden');
    }
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    $$('.btn-primary, .btn-light').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px');
        btn.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px');
      });
      btn.addEventListener('pointerleave', () => { btn.style.setProperty('--mx', '0px'); btn.style.setProperty('--my', '0px'); });
    });
  }

  /* ---------- falling blossom petals (hero) ---------- */
  const startPetals = () => {
    const canvas = $('[data-petals]');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    const colors = ['#f6b9c6', '#fbd3db', '#f09cb0', '#ffe3e8'];
    let w, h, petals = [], running = true, last = performance.now();
    const make = (initial) => ({
      x: rand(0, w), y: initial ? rand(-h, h) : rand(-60, -10), r: rand(5, 11),
      vy: rand(22, 50), vx: rand(-6, 22), rot: rand(0, 6.28), vr: rand(-1.4, 1.4), flip: rand(0, 6.28), vf: rand(1.5, 3.5),
      c: colors[(Math.random() * colors.length) | 0],
    });
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      petals = Array.from({ length: Math.round(clamp(w / 50, 12, 30)) }, () => make(true));
    };
    const frame = (now) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, w, h);
      const sway = Math.sin(now / 2200) * 14;
      for (const p of petals) {
        p.y += p.vy * dt; p.x += (p.vx + sway) * dt; p.rot += p.vr * dt; p.flip += p.vf * dt;
        if (p.y > h + 20 || p.x > w + 40 || p.x < -40) Object.assign(p, make(false));
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.abs(Math.cos(p.flip)) * 0.8 + 0.2);
        ctx.fillStyle = p.c; ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(0, -p.r);
        ctx.bezierCurveTo(p.r, -p.r * 0.6, p.r * 0.8, p.r * 0.7, 0, p.r);
        ctx.bezierCurveTo(-p.r * 0.8, p.r * 0.7, -p.r, -p.r * 0.6, 0, -p.r);
        ctx.fill(); ctx.restore();
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
  };

  /* ---------- loader ---------- */
  const loader = $('[data-loader]');
  const heroImg = $('[data-hero-bg]');
  const imgReady = (img) => new Promise((res) => {
    if (!img || (img.complete && img.naturalWidth)) return res();
    img.addEventListener('load', res, { once: true });
    img.addEventListener('error', res, { once: true });
  });
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const timeout = (ms) => new Promise((r) => setTimeout(r, ms));

  const heroIntro = () => {
    if (!motion) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo('.hero-stage', { clipPath: 'inset(12% 9% 12% 9% round 32px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.6, ease: 'expo.inOut' })
      .from('[data-hero-bg]', { scale: 1.35, duration: 2.2 }, 0)
      .from('[data-hero-canopy]', { yPercent: -40, opacity: 0, duration: 1.8 }, 0.5)
      .from('[data-hero-tl]', { yPercent: 50, duration: 1.8 }, 0.55)
      .from('[data-hero-tr]', { yPercent: 50, duration: 1.8 }, 0.6)
      .from('.hero-word .ch', { yPercent: 110, opacity: 0, rotate: 6, duration: 1.4, stagger: 0.035 }, 0.75)
      .from('[data-hero-kicker]', { opacity: 0, y: 16, duration: 1 }, 1.0)
      .from('[data-hero-foot] p', { opacity: 0, y: 24, duration: 1 }, 1.2)
      .from('[data-hero-foot] .btn', { opacity: 0, duration: 1 }, 1.3)
      .from('.hero-scroll', { opacity: 0, duration: 1 }, 1.4);
  };

  const finishLoading = () => {
    body.classList.remove('is-loading');
    if (lenis) lenis.start();
    startPetals();
    heroIntro();
    try { sessionStorage.setItem('gg-seen', '1'); } catch (e) { /* storage blocked */ }
  };

  if (loader && motion) {
    body.classList.add('is-loading');
    if (lenis) lenis.stop();
    window.scrollTo(0, 0);
    let seen = false;
    try { seen = sessionStorage.getItem('gg-seen') === '1'; } catch (e) { /* storage blocked */ }
    const counter = $('[data-count]', loader);
    const line = $('[data-loader-line]', loader);
    const state = { v: 0 };
    const count = gsap.to(state, {
      v: 100, duration: seen ? 0.7 : 1.9, ease: 'power2.inOut',
      onUpdate: () => {
        counter.textContent = Math.round(state.v);
        line.style.transform = `scaleX(${state.v / 100})`;
      },
    });
    gsap.to('.loader-flower', { scale: 1, opacity: 1, duration: seen ? 0.7 : 1.9, ease: 'power2.inOut' });
    Promise.race([
      Promise.all([count.then(), imgReady(heroImg), fontsReady]),
      timeout(4000),
    ]).then(() => {
      gsap.timeline({ onComplete: () => loader.remove() })
        .to('.loader-flower', { scale: 2.2, opacity: 0, duration: 0.7, ease: 'power2.in' })
        .to('.loader-row, .loader-line', { opacity: 0, y: -20, duration: 0.5, ease: 'power2.in' }, 0)
        .to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 0.35)
        .add(finishLoading, 0.55);
    });
  } else {
    if (loader) loader.remove();
    startPetals();
  }

  /* ---------- scroll-driven scenes ---------- */
  if (motion) {
    const isWide = () => window.innerWidth > 1000;

    /* hero: walk into the garden */
    const chars = $$('.hero-word .ch');
    const mid = (chars.length - 1) / 2;
    gsap.set('[data-hero-tr]', { scaleX: -1 });
    gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=130%', scrub: 0.6, pin: '.hero-stage', anticipatePin: 1 },
      defaults: { ease: 'none' },
    })
      .to('[data-hero-bg]', { scale: 1.7, yPercent: 6, duration: 1 }, 0)
      .to('[data-hero-canopy]', { x: () => -window.innerWidth * 0.25, y: () => -window.innerHeight * 0.55, scale: 1.5, duration: 1 }, 0)
      .to('[data-hero-tl]', { x: () => -window.innerWidth * 0.45, y: () => window.innerHeight * 0.2, scale: 1.4, duration: 1 }, 0)
      .to('[data-hero-tr]', { x: () => window.innerWidth * 0.45, y: () => window.innerHeight * 0.2, scaleX: -1.4, scaleY: 1.4, duration: 1 }, 0)
      .to('[data-hero-tint]', { opacity: 1, duration: 0.35 }, 0.12)
      .to(chars, { x: (i) => (i - mid) * window.innerWidth * 0.018, opacity: 0, duration: 0.45, stagger: { each: 0.01, from: 'center' } }, 0.02)
      .to('[data-hero-kicker], [data-hero-foot], .hero-scroll', { opacity: 0, duration: 0.25 }, 0)
      .fromTo('[data-hero-second]', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.3 }, 0.32);

    /* statement: words light up as you read */
    gsap.fromTo('.statement-text .w', { opacity: 0.12 }, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: '.statement', start: 'top 72%', end: 'bottom 62%', scrub: true },
    });

    /* flower collection: pinned, one flower per scroll step */
    const collection = $('[data-collection]');
    const slides = $$('.flower-slide', collection);
    const n = slides.length;
    const numEl = $('[data-col-num]');
    const dots = $$('.collection-dots i');
    const colBar = $('[data-col-bar]');
    const marquees = slides.map((s) => $('.slide-marquee', s));
    const parts = (s) => ({ flower: $('.slide-flower', s), copy: $$('.slide-copy > *', s), mq: $('.slide-marquee', s) });
    gsap.set(slides, { visibility: 'visible' });
    gsap.set($$('.slide-flower', collection), { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    slides.forEach((s, i) => {
      if (i === 0) return;
      const p = parts(s);
      gsap.set(p.flower, { yPercent: 30, rotate: 18, scale: 0.55, opacity: 0 });
      gsap.set(p.copy, { opacity: 0, y: 40 });
      gsap.set(p.mq, { opacity: 0 });
    });
    let current = -1;
    const setActive = (i) => {
      if (i === current) return;
      current = i;
      numEl.textContent = String(i + 1).padStart(2, '0');
      dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
      collection.style.backgroundColor = slides[i].dataset.tint;
    };
    setActive(0);
    const colTl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: collection, start: 'top top', end: () => '+=' + (n - 1) * window.innerHeight * 0.9,
        pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (self) => {
          const t = self.progress * (n - 1);
          setActive(clamp(Math.round(t), 0, n - 1));
          colBar.style.transform = `scaleX(${(t + 1) / n})`;
          marquees.forEach((m, k) => { m.style.transform = `translate(${-28 - (t - k) * 22}%, -50%)`; });
        },
      },
    });
    for (let i = 1; i < n; i++) {
      const out = parts(slides[i - 1]);
      const inn = parts(slides[i]);
      const at = i - 1 + 0.2;
      colTl
        .to(out.flower, { yPercent: -150, rotate: -22, scale: 0.6, opacity: 0, duration: 0.6 }, at)
        .to(out.copy, { opacity: 0, y: -40, duration: 0.35, stagger: 0.03 }, at)
        .to(out.mq, { opacity: 0, duration: 0.4 }, at)
        .to(inn.flower, { yPercent: -50, rotate: 0, scale: 1, opacity: 1, duration: 0.6 }, at + 0.05)
        .to(inn.copy, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04 }, at + 0.2)
        .to(inn.mq, { opacity: 1, duration: 0.4 }, at + 0.1);
    }
    colTl.to({}, { duration: 0.01 }, n - 1);

    /* garden path: each step plants a flower as you walk past it */
    $$('.path-step').forEach((step) => {
      const img = $('.planted img', step);
      const note = $('.plant-note', step);
      const text = $('.step-text', step);
      const side = step.dataset.side === 'left' ? -1 : 1;
      gsap.timeline({ scrollTrigger: { trigger: step, start: 'top 82%', end: 'top 42%', scrub: 0.5 } })
        .fromTo(img, { scale: 0, rotate: -14 * side }, { scale: 1, rotate: 0, ease: 'back.out(1.6)', duration: 0.6 }, 0)
        .fromTo(note, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, ease: 'back.out(2)', duration: 0.35 }, 0.4)
        .fromTo(text, { opacity: 0, x: isWide() ? 50 * side : 0, y: isWide() ? 0 : 30 }, { opacity: 1, x: 0, y: 0, ease: 'power2.out', duration: 0.6 }, 0.1);
    });
    gsap.fromTo('.path-intro h2', { y: 60, opacity: 0 }, { y: 0, opacity: 1, ease: 'power2.out', scrollTrigger: { trigger: '.path-intro', start: 'top 85%', end: 'top 45%', scrub: 0.5 } });

    /* research numbers */
    $$('.fact').forEach((fact, i) => {
      const num = $('[data-countup]', fact);
      const target = +num.dataset.countup;
      const obj = { v: 0 };
      num.textContent = '0';
      gsap.from(fact, { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', delay: i * 0.12, scrollTrigger: { trigger: '.facts-grid', start: 'top 80%' } });
      gsap.to(obj, {
        v: target, duration: 1.6, ease: 'power3.out', delay: 0.2 + i * 0.12,
        onUpdate: () => { num.textContent = Math.round(obj.v); },
        scrollTrigger: { trigger: '.facts-grid', start: 'top 80%' },
      });
    });

    /* more: horizontal scroll */
    const track = $('[data-more-track]');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const hTween = gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: { trigger: '.more', start: 'top top', end: () => '+=' + distance(), pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 },
    });
    $$('.more-panel').forEach((panel, i) => {
      gsap.fromTo($('img', panel), { rotate: i % 2 ? 10 : -10, scale: 0.86, y: 30 }, {
        rotate: i % 2 ? -6 : 6, scale: 1, y: -20, ease: 'none',
        scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true },
      });
    });

    /* waitlist marquee reacts to scroll speed */
    const marquee = $('[data-marquee]');
    const loop = gsap.to(marquee, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      trigger: '.waitlist', start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity();
        gsap.to(loop, { timeScale: (v < 0 ? -1 : 1) * (1 + Math.min(Math.abs(v) / 250, 8)), duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: v < 0 ? -1 : 1, duration: 1.2, delay: 0.2, overwrite: false });
      },
    });
    $$('.waitlist-flower').forEach((f, i) => {
      gsap.fromTo(f, { y: 160 + i * 40, rotate: i % 2 ? 25 : -25 }, {
        y: -120 - i * 30, rotate: i % 2 ? -10 : 10, ease: 'none',
        scrollTrigger: { trigger: '.waitlist', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    gsap.from('.waitlist-inner > :not(.btn)', { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.waitlist-inner', start: 'top 82%' } });

    /* maker portrait parallax + entrance */
    gsap.fromTo('[data-maker-photo] img', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.maker', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('[data-maker-photo]', { clipPath: 'inset(30% 20% 30% 20% round 28px)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.maker', start: 'top 75%' } });
    gsap.from('.maker-copy > *', { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: '.maker-copy', start: 'top 80%' } });

    /* section headings */
    $$('.facts-head h2, .plant-head h2, .more-intro h2').forEach((h) => {
      gsap.from(h, { y: 60, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
    });

    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* ---------- plant your own ---------- */
  const row = $('[data-row]');
  const form = $('[data-plant-form]');
  const countEl = $('[data-bed-count]');
  if (!row || !form) return;
  const input = $('#gratitude', form);
  // spots where flowers sit in the bed: [x%, y% of the flower's base]
  const spots = [[16, 62], [38, 86], [60, 58], [84, 82], [28, 40], [72, 36], [50, 95]];
  const maxFlowers = () => (window.innerWidth < 640 ? 4 : 7);
  let spotIndex = 0;
  let planted = 0;

  const plant = (flower, text) => {
    const existing = $$('.bed-flower:not(.is-leaving)', row);
    if (existing.length >= maxFlowers()) {
      const old = existing[0];
      old.classList.add('is-leaving');
      setTimeout(() => old.remove(), 420);
    }
    const [x, y] = spots[spotIndex++ % Math.min(spots.length, maxFlowers())];
    const el = document.createElement('div');
    el.className = 'bed-flower';
    el.style.left = x + '%';
    el.style.top = y + '%';
    el.style.zIndex = String(Math.round(y));
    el.innerHTML = '<span class="plant-note"></span><img alt="" />';
    const note = $('.plant-note', el);
    note.textContent = text + ' ';
    const heart = document.createElement('b');
    heart.textContent = '♥';
    note.appendChild(heart);
    const img = $('img', el);
    img.src = `assets/flowers/${flower}.webp`;
    row.appendChild(el);
  };

  const updateCount = () => {
    if (!countEl) return;
    countEl.textContent = planted === 0
      ? 'A few gratitudes to start you off.'
      : planted === 1
        ? 'Your first flower. Imagine a whole year of these.'
        : `You planted ${planted}. Imagine a whole year of these.`;
  };

  let seeded = false;
  const seed = () => {
    if (seeded) return;
    seeded = true;
    [['daisy', 'listened to my whole day'], ['gerbera', 'you make me laugh'], ['sunflower', 'our sunday walks']]
      .forEach(([f, t], i) => setTimeout(() => plant(f, t), i * 280));
    updateCount();
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { seed(); io.disconnect(); } }, { threshold: 0.3 });
    io.observe($('[data-bed]'));
  } else seed();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim().replace(/\s+/g, ' ');
    if (!text) { input.focus(); return; }
    const flower = (new FormData(form).get('flower')) || 'rose';
    seed();
    plant(String(flower), text);
    planted++;
    updateCount();
    input.value = '';
  });
})();
