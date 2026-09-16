[9/16/2026 10:48 AM] Camellia: /* Vanilla JS. Tally's own embed script owns all waitlist popup behavior.
   Real hrefs remain available if the third-party script cannot load. */
(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const story = $('.growth-story');
  const steps = [...document.querySelectorAll('.growth-step')];

  const clamp = (number, min = 0, max = 1) =>
    Math.min(max, Math.max(min, number));

  const range = (progress, start, end) =>
    clamp((progress - start) / (end - start));

  let frame = 0;
  let observer;

  const update = () => {
    frame = 0;

    const scroll = window.scrollY;
    const total = document.documentElement.scrollHeight - innerHeight;

    $('.reading-progress').style.transform =
      scaleX(${total > 0 ? clamp(scroll / total) : 0});

    $('[data-header]').classList.toggle('is-scrolled', scroll > 12);

    if (
      !document.documentElement.classList.contains('motion-enabled')
    ) {
      return;
    }

    const rect = story.getBoundingClientRect();
    const top = innerWidth <= 760 ? 73 : 80;
    const stickyHeight = $('.growth-sticky').getBoundingClientRect().height;

    const progress = clamp(
      (top - rect.top) / Math.max(1, rect.height - stickyHeight)
    );

    story.style.setProperty('--roots', range(progress, 0.07, 0.35));
    story.style.setProperty('--stem', range(progress, 0.12, 0.68));
    story.style.setProperty('--leaf', range(progress, 0.3, 0.57));
    story.style.setProperty('--leaf2', range(progress, 0.43, 0.69));
    story.style.setProperty('--bloom', range(progress, 0.65, 0.93));

    story.style.setProperty(
      '--seed',
      1 - range(progress, 0.24, 0.42)
    );

    story.style.setProperty(
      '--seed-y',
      -85 * (1 - range(progress, 0, 0.13))
    );

    story.style.setProperty(
      '--drops',
      Math.sin(range(progress, 0.31, 0.65) * Math.PI)
    );

    story.style.setProperty(
      '--drop-y',
      range(progress, 0.31, 0.65) * 75
    );

    const active = progress < 0.32 ? 0 : progress < 0.68 ? 1 : 2;

    steps.forEach((element, index) => {
      element.classList.toggle('active', index === active);
      element.setAttribute('aria-hidden', String(index !== active));
    });

    $('.growth-track span').style.transform = scaleX(${progress});
  };

  const schedule = () => {
    if (!frame) {
      frame = requestAnimationFrame(update);
    }
  };

  const configureMotion = () => {
    // Short landscape screens use the fully readable, unpinned presentation.
    const enabled = !motion.matches && innerHeight >= 620;

    document.documentElement.classList.toggle(
      'motion-enabled',
      enabled
    );

    observer?.disconnect();

    document.querySelectorAll('.reveal').forEach((element) => {
      element.classList.remove('pending');
    });

    if (enabled && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.remove('pending');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08 }
      );

      document.querySelectorAll('.reveal').forEach((element) => {
        if (element.getBoundingClientRect().top > innerHeight) {
          element.classList.add('pending');
          observer.observe(element);
        }
      });
    }

    if (!enabled) {
      steps.forEach((element) => {
        element.removeAttribute('aria-hidden');
      });
    }

    schedule();
  };

  window.addEventListener('scroll', schedule, { passive: true });

  window.addEventListener('resize', configureMotion, {
    passive: true
  });

  motion.addEventListener('change', configureMotion);

  configureMotion();

  const art = $('.hero-art');

  art.addEventListener('pointermove', (event) => {
    if (
      motion.matches ||
      !window.matchMedia('(pointer:fine)').matches ||
      innerWidth <= 760
    ) {
      return;
    }
[9/16/2026 10:48 AM] Camellia: const rect = art.getBoundingClientRect();

    art.style.setProperty(
      '--pointer-x',
      ${((event.clientX - rect.left) / rect.width - 0.5) * 10}px
    );

    art.style.setProperty(
      '--pointer-y',
      ${((event.clientY - rect.top) / rect.height - 0.5) * 10}px
    );
  });

  art.addEventListener('pointerleave', () => {
    art.style.setProperty('--pointer-x', '0px');
    art.style.setProperty('--pointer-y', '0px');
  });

  const messages = {
    birthday: [
      'Another year of wonderful you.',
      'A birthday bouquet, with love'
    ],
    anniversary: [
      'My favourite thing is still us.',
      'An anniversary bouquet, with love'
    ],
    valentine: [
      'You, in every season.',
      'A Valentine’s bouquet, with love'
    ]
  };

  let bloomTimer;

  document
    .querySelectorAll('[data-occasion][type="button"]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.occasion;

        document
          .querySelectorAll('.occasion-tabs button')
          .forEach((element) => {
            const selected = element === button;

            element.classList.toggle('selected', selected);
            element.setAttribute('aria-pressed', String(selected));
          });

        const scene = $('.bouquet-scene');

        scene.dataset.occasion = key;

        $('#gift-message').textContent = messages[key][0];
        $('.gift-tag small').textContent = messages[key][1];

        scene.classList.remove('bloom-again');
        clearTimeout(bloomTimer);

        // Restart this brief, user-triggered animation
        // without a continuous JavaScript loop.
        if (!motion.matches) {
          void scene.offsetWidth;

          scene.classList.add('bloom-again');

          bloomTimer = setTimeout(() => {
            scene.classList.remove('bloom-again');
          }, 850);
        }
      });
    });

  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle(
      'motion-paused',
      document.hidden
    );
  });
})();
