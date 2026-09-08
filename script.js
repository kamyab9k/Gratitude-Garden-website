(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const progress = document.querySelector('.progress span');
  const header = document.querySelector('[data-header]');
  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const current = window.scrollY || window.pageYOffset;
    if (progress) progress.style.width = (max > 0 ? (current / max) * 100 : 0) + '%';
    if (header) header.classList.toggle('is-scrolled', current > 18);
  };
  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });

  const items = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -40px' });
    items.forEach((item) => observer.observe(item));
  }

  const art = document.querySelector('[data-parallax]');
  if (art && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    let frame;
    let x = 0;
    let y = 0;
    art.addEventListener('pointermove', (event) => {
      const box = art.getBoundingClientRect();
      x = ((event.clientX - box.left) / box.width - .5) * 10;
      y = ((event.clientY - box.top) / box.height - .5) * 10;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        art.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        frame = null;
      });
    });
    art.addEventListener('pointerleave', () => { art.style.transform = ''; });
  }
})();
