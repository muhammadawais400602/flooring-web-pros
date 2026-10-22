/* Flooring WebPros — inner pages: mobile menu, reveal on scroll, sticky mobile CTA */
(() => {
  document.documentElement.classList.remove('no-js');
  const header = document.querySelector('.site-header');
  const menuBtn = document.querySelector('.menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const setMenu = (open) => {
    header.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!header.classList.contains('open')));
  mobileNav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 60}ms`; io.observe(el); });

  const cta = document.querySelector('.mobile-cta');
  const footer = document.querySelector('.footer');
  const onScroll = () => {
    const nearEnd = footer.getBoundingClientRect().top < innerHeight;
    cta.classList.toggle('show', scrollY > innerHeight * 0.6 && !nearEnd);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Tilt cards (mouse only) ---------- */
  document.querySelectorAll('.tilt-grid .card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 14).toFixed(2) + 'deg');
      card.style.setProperty('--rx', (((e.clientY - r.top) / r.height - .5) * -14).toFixed(2) + 'deg');
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  });
})();
