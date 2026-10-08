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

  // Full scroll scenes (pinning, zooms, smooth scroll) only on desktop-class devices.
  // Phones and tablets get native scrolling with light, non-blocking reveals.
  const desktopQuery = '(min-width: 821px) and (hover: hover) and (pointer: fine)';
  const desktop = window.matchMedia(desktopQuery).matches;
  const scenes = motion && desktop;
  root.classList.add(scenes ? 'motion' : 'mobile');
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { if (window.matchMedia(desktopQuery).matches !== desktop) window.location.reload(); }, 250);
  });

  /* ---------- text splitting ---------- */
  const statement = $('[data-split]');
  if (statement) {
    statement.innerHTML = statement.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
  }

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (motion) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    if (scenes && window.Lenis) {
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
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (nav) {
      const solid = y > 40;
      nav.classList.toggle('is-solid', solid);
      if (solid && y > lastY + 6) nav.classList.add('is-hidden');
      else if (y < lastY - 6 || !solid) nav.classList.remove('is-hidden');
    }
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- copy email ---------- */
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy;
      const status = $('[data-copy-status]');
      let ok = false;
      try { await navigator.clipboard.writeText(value); ok = true; } catch (e) {
        const t = document.createElement('textarea');
        t.value = value; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select();
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        t.remove();
      }
      btn.textContent = ok ? 'Copied ✓' : 'Copy email';
      if (status) status.textContent = ok ? 'Email address copied — paste it into your mail app.' : `Copy this address: ${value}`;
      setTimeout(() => { btn.textContent = 'Copy email'; }, 2400);
    });
  });

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


  /* ---------- golden fire around the Premium offer ---------- */
  const startFire = () => {
    if (reduceMotion) return; // the CSS glow stays; flames are skipped
    $$('[data-fire]').forEach((canvas) => {
      const pill = canvas.parentElement.querySelector('.offer');
      if (!pill) return;
      const ctx = canvas.getContext('2d');
      let W = 0, H = 0, box = { x: 0, y: 0, w: 0, h: 0 }, parts = [], running = false, last = 0, acc = 0;

      const size = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const c = canvas.getBoundingClientRect(), p = pill.getBoundingClientRect();
        W = c.width; H = c.height;
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        box = { x: p.left - c.left, y: p.top - c.top, w: p.width, h: p.height };
        parts = [];
      };

      // flames start on the pill's outline: mostly the top edge and the rounded ends
      const spawn = () => {
        const r = box.h / 2, u = Math.random();
        let x, y, vx = 0;
        if (u < 0.58) {
          x = box.x + r + Math.random() * Math.max(0, box.w - 2 * r); y = box.y + 3;
        } else if (u < 0.96) {
          const side = Math.random() < 0.5 ? -1 : 1;
          const th = -Math.PI / 2 + Math.random() * Math.PI * 0.66;
          const cx = side > 0 ? box.x + box.w - r : box.x + r;
          x = cx + side * r * Math.cos(th); y = box.y + r + r * Math.sin(th);
          vx = side * Math.cos(th) * 14;
        } else {
          x = box.x + r + Math.random() * Math.max(0, box.w - 2 * r); y = box.y + box.h - 2;
        }
        const ember = Math.random() < 0.16;
        parts.push({
          x, y, vx: vx + (Math.random() - 0.5) * 8,
          vy: ember ? -(46 + Math.random() * 60) : -(24 + Math.random() * 38),
          age: 0, life: ember ? 0.9 + Math.random() * 0.9 : 0.6 + Math.random() * 0.6,
          r: ember ? 0.9 + Math.random() * 1.3 : 6 + Math.random() * 8, ph: Math.random() * 6.283, ember,
        });
      };

      const frame = (now) => {
        if (!running) return;
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        acc += dt * (box.w + box.h * 2) * 0.34;
        while (acc >= 1) { if (parts.length < 150) spawn(); acc -= 1; }
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = parts.length - 1; i >= 0; i--) {
          const q = parts[i];
          q.age += dt;
          const t = q.age / q.life;
          if (t >= 1) { parts.splice(i, 1); continue; }
          q.x += (q.vx + Math.sin(now / 240 + q.ph) * 9) * dt;
          q.y += q.vy * dt;
          // fade near the canvas edges so nothing is cut off
          const edge = Math.max(0, Math.min(1, q.y / 34, q.x / 24, (W - q.x) / 24));
          const a = (1 - t) * edge;
          if (q.ember) {
            ctx.fillStyle = `rgba(255, 214, 110, ${a * (0.5 + 0.5 * Math.sin(now / 70 + q.ph))})`;
            ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283); ctx.fill();
            continue;
          }
          const r = q.r * (1 - t * 0.7);
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
          g.addColorStop(0, `rgba(255, 248, 214, ${0.9 * a})`);
          g.addColorStop(0.35, `rgba(255, 206, 72, ${0.72 * a})`);
          g.addColorStop(0.7, `rgba(255, 128, 24, ${0.36 * a})`);
          g.addColorStop(1, 'rgba(255, 90, 10, 0)');
          ctx.save();
          ctx.translate(q.x, q.y); ctx.scale(1, 1.7);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill();
          ctx.restore();
        }
        ctx.globalCompositeOperation = 'source-over';
        requestAnimationFrame(frame);
      };

      size();
      window.addEventListener('resize', size);
      if (window.ResizeObserver) new ResizeObserver(size).observe(pill);
      new IntersectionObserver(([e]) => {
        const was = running;
        running = e.isIntersecting;
        if (running && !was) { last = performance.now(); requestAnimationFrame(frame); }
      }).observe(canvas);
    });
  };

  startPetals();
  startFire();

  /* ---------- scroll-driven scenes ---------- */
  if (motion) {
    const isWide = () => window.innerWidth > 1000;

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
    const tierEl = $('[data-col-tier]');
    const marquees = slides.map((s) => $('.slide-marquee', s));
    const parts = (s) => ({ flower: $('.slide-flower', s), copy: $$('.slide-copy > *', s), mq: $('.slide-marquee', s) });
    if (scenes) {
    gsap.set(slides, { visibility: 'visible' });
    gsap.set($$('.slide-flower', collection), { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    slides.forEach((s, i) => {
      if (i === 0) return;
      const p = parts(s);
      gsap.set(p.flower, { yPercent: 30, rotate: 18, scale: 0.55, opacity: 0 });
      gsap.set(p.copy, { opacity: 0, y: 40 });
      gsap.set(p.mq, { opacity: 0 });
    });
    }
    let current = -1;
    const setActive = (i) => {
      if (i === current) return;
      current = i;
      numEl.textContent = String(i + 1).padStart(2, '0');
      dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
      slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
      collection.style.backgroundColor = slides[i].dataset.tint;
      collection.dataset.tier = slides[i].dataset.tier;
      if (tierEl) tierEl.textContent = slides[i].dataset.tier;
    };
    setActive(0);
    if (!scenes) {
      // phones: native swipe carousel; keep the counter, dots and colour in step
      const strip = $('.collection-slides', collection);
      let raf = 0;
      strip.addEventListener('scroll', () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const t = strip.scrollLeft / Math.max(1, strip.clientWidth);
          setActive(clamp(Math.round(t), 0, n - 1));
          colBar.style.transform = `scaleX(${(t + 1) / n})`;
        });
      }, { passive: true });

      // gentle auto-play: glide to the next flower every few seconds, loop at the end,
      // pause while the visitor touches it, and only run while the section is on screen
      if (!reduceMotion) {
        const HOLD = 3200;      // time each flower stays
        const GLIDE = 1300;     // how long the slide takes
        let timer = 0, gliding = false, visible = false, resumeT = 0, userBusy = false;
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const glideTo = (index) => {
          const from = strip.scrollLeft;
          const to = index * strip.clientWidth;
          const start = performance.now();
          gliding = true;
          strip.style.scrollSnapType = 'none';
          const step = (now) => {
            if (userBusy) { gliding = false; strip.style.scrollSnapType = ''; return; }
            const t = Math.min(1, (now - start) / GLIDE);
            strip.scrollLeft = from + (to - from) * ease(t);
            if (t < 1) requestAnimationFrame(step);
            else { gliding = false; strip.style.scrollSnapType = ''; schedule(); }
          };
          requestAnimationFrame(step);
        };
        const schedule = () => {
          clearTimeout(timer);
          if (!visible || userBusy) return;
          timer = setTimeout(() => {
            if (!visible || userBusy || gliding) return;
            const i = Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth));
            glideTo(i >= n - 1 ? 0 : i + 1);
          }, HOLD);
        };
        const pause = () => {
          userBusy = true;
          clearTimeout(timer); clearTimeout(resumeT);
        };
        const resume = () => {
          clearTimeout(resumeT);
          resumeT = setTimeout(() => { userBusy = false; schedule(); }, 4000);
        };
        strip.addEventListener('touchstart', pause, { passive: true });
        strip.addEventListener('pointerdown', pause, { passive: true });
        strip.addEventListener('touchend', resume, { passive: true });
        strip.addEventListener('pointerup', resume, { passive: true });
        strip.addEventListener('touchcancel', resume, { passive: true });
        new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          if (visible) schedule(); else clearTimeout(timer);
        }, { threshold: 0.5 }).observe(strip);
        document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else schedule(); });
      }
    }
    if (scenes) {
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
    }

    /* garden path: each step plants a flower as you walk past it */
    $$('.path-step').forEach((step) => {
      const img = $('.planted img', step);
      const note = $('.plant-note', step);
      const text = $('.step-text', step);
      const side = step.dataset.side === 'left' ? -1 : 1;
      gsap.timeline({ scrollTrigger: scenes
        ? { trigger: step, start: 'top 82%', end: 'top 42%', scrub: 0.5 }
        : { trigger: step, start: 'top 78%', toggleActions: 'play none none none' } })
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
    if (scenes) {
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
    }

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
    if (scenes) $$('.waitlist-flower').forEach((f, i) => {
      gsap.fromTo(f, { y: 160 + i * 40, rotate: i % 2 ? 25 : -25 }, {
        y: -120 - i * 30, rotate: i % 2 ? -10 : 10, ease: 'none',
        scrollTrigger: { trigger: '.waitlist', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    gsap.from('.waitlist-inner > :not(.btn)', { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.waitlist-inner', start: 'top 82%' } });

    /* maker portrait parallax + entrance */
    if (scenes) gsap.fromTo('[data-maker-photo] img', { yPercent: -2.5 }, { yPercent: 2.5, ease: 'none', scrollTrigger: { trigger: '.maker', start: 'top bottom', end: 'bottom top', scrub: true } });
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
  // lawn spots in the bed picture (x%, y% of the flower's base), checked against the art so
  // nothing lands on the path, rocks or fence. Spots near the top show their note below.
  const spots = [[31.3, 67.8], [74.5, 62.2], [71.3, 94.4], [85.3, 43.3], [67, 23.3], [11.9, 97.8], [92.9, 88.9], [89.6, 18.9]];
  const used = new Map(); // spot index -> element
  let nextSpot = 0;
  let planted = 0;

  const plant = (flower, text) => {
    let idx = -1;
    for (let k = 0; k < spots.length; k++) {
      const cand = (nextSpot + k) % spots.length;
      if (!used.has(cand)) { idx = cand; break; }
    }
    if (idx === -1) {
      // every spot taken: replace the oldest flower
      idx = nextSpot % spots.length;
      const old = used.get(idx);
      old.classList.add('is-leaving');
      setTimeout(() => old.remove(), 420);
    }
    nextSpot = idx + 1;
    const [x, y] = spots[idx];
    const el = document.createElement('div');
    el.className = 'bed-flower' + (y < 35 ? ' note-below' : '');
    el.style.left = x + '%';
    el.style.top = y + '%';
    el.style.zIndex = String(Math.round(y));
    const img = document.createElement('img');
    img.alt = '';
    img.src = `assets/flowers/${flower}.webp`;
    const note = document.createElement('span');
    note.className = 'plant-note';
    note.textContent = text + ' ';
    const heart = document.createElement('b');
    heart.textContent = '♥';
    note.appendChild(heart);
    el.append(img, note);
    row.appendChild(el);
    used.set(idx, el);
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
