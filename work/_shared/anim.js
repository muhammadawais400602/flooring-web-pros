/* Flooring WebPros — light animation layer for portfolio designs */
(() => {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const embedded = window.top !== window || params.has('embed');
  if (embedded) root.classList.add('wa-embed');
  if (params.has('static')) root.classList.add('wa-static');

  // Demo page: "#" links shouldn't jump to top
  document.addEventListener('click', (e) => { const a = e.target.closest('a[href="#"]'); if (a) e.preventDefault(); });

  // Back to portfolio pill when opened directly
  if (!embedded) {
    const back = document.createElement('a');
    back.className = 'wa-back'; back.href = '/portfolio#work'; back.textContent = '← Flooring WebPros portfolio';
    document.body.appendChild(back);
  }

  // Hero image slow zoom
  const heroImg = document.querySelector('main section img, main img');
  if (heroImg) { heroImg.classList.add('wa-hero-img'); heroImg.parentElement.style.overflow = 'hidden'; }

  // Cards: lift on hover, images zoom inside their frames
  document.querySelectorAll('main article, main [class*="rounded"][class*="shadow"], main [class*="group"]').forEach((el) => {
    if (el.closest('header, footer') || el.querySelector('form') || el.offsetHeight > 900) return;
    el.classList.add('wa-lift');
    const img = el.querySelector('img'); if (img && img.parentElement) img.parentElement.classList.add('wa-zoomwrap');
  });

  // Reveal on scroll: blocks inside each section, staggered
  const targets = [];
  document.querySelectorAll('main section').forEach((sec, si) => {
    if (si === 0) return;              // hero stays put
    const inner = sec.firstElementChild && sec.firstElementChild.children.length ? sec.firstElementChild : sec;
    [...inner.children].forEach((block) => {
      const kids = block.children.length > 1 && block.children.length <= 8 && getComputedStyle(block).display.includes('grid') ? [...block.children] : [block];
      kids.forEach((k, i) => { k.classList.add('wa-reveal'); k.style.setProperty('--wa-d', `${Math.min(i, 6) * 90}ms`); targets.push(k); });
    });
  });
  if (root.classList.contains('wa-static') || !('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('wa-in')); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('wa-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  targets.forEach((t) => io.observe(t));
})();
