/* Flooring WebPros — Who We Serve page */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hero: rotate trade word + background photo ---------- */
  const hero = document.querySelector('.wws-hero');
  const bgs = [...hero.querySelectorAll('.wws-bg img')];
  const rot = hero.querySelector('.rot');
  const pills = [...hero.querySelectorAll('.wws-pill')];
  const DUR = 3000;
  pills.forEach((p) => { const im = new Image(); im.src = p.dataset.img; p.style.setProperty('--dur', DUR + 'ms'); });
  let idx = 0, layer = 0, timer = null;
  const show = (i, first) => {
    idx = i;
    const p = pills[i];
    layer = 1 - layer;
    bgs[layer].src = p.dataset.img;
    bgs[layer].classList.add('on'); bgs[1 - layer].classList.remove('on');
    pills.forEach((x) => { x.classList.remove('active'); });
    void p.offsetWidth; p.classList.add('active');
    if (first || reduce) { rot.textContent = p.dataset.word; return; }
    rot.classList.add('out');
    setTimeout(() => {
      rot.textContent = p.dataset.word;
      rot.classList.remove('out'); rot.classList.add('enter');
      void rot.offsetWidth; rot.classList.remove('enter');
    }, 420);
  };
  const start = () => { stop(); if (!reduce) timer = setInterval(() => show((idx + 1) % pills.length), DUR); };
  const stop = () => { clearInterval(timer); timer = null; };
  show(0, true); start();
  new IntersectionObserver((e) => (e[0].isIntersecting ? start() : stop())).observe(hero);
  pills.forEach((p, i) => p.addEventListener('mouseenter', () => { show(i); start(); }));

  /* ---------- Scroll story: pinned browser follows the trade in view ---------- */
  const steps = [...document.querySelectorAll('.story-step')];
  const screens = new Map([...document.querySelectorAll('.story-screen')].map((s) => [s.dataset.trade, s]));
  const rail = [...document.querySelectorAll('.story-rail i')];
  const countEl = document.querySelector('.story-count b');
  const nameEl = document.querySelector('.story-name');
  const searchEl = document.querySelector('.story-search');
  const urlEl = document.querySelector('.story-url');
  let current = null, clearPrev;
  const activate = (step) => {
    const id = step.dataset.trade;
    if (id === current) return;
    const next = screens.get(id), prevEl = current && screens.get(current);
    clearTimeout(clearPrev);
    screens.forEach((s) => { if (s !== next && s !== prevEl) s.classList.remove('on', 'prev'); });
    if (prevEl) { prevEl.classList.remove('on'); prevEl.classList.add('prev'); clearPrev = setTimeout(() => prevEl.classList.remove('prev'), 1000); }
    next.classList.add('on');
    current = id;
    const i = steps.indexOf(step);
    steps.forEach((s) => s.classList.toggle('on', s === step));
    rail.forEach((r, k) => { r.classList.toggle('on', k === i); r.classList.toggle('done', k < i); });
    if (countEl) countEl.textContent = String(i + 1).padStart(2, '0');
    nameEl.textContent = step.dataset.name;
    urlEl.textContent = next.dataset.name || '';
    searchEl.style.opacity = 0;
    setTimeout(() => { searchEl.textContent = step.dataset.search; searchEl.style.opacity = 1; }, 250);
  };
  activate(steps[0]);
  const sio = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) activate(e.target); });
  }, { rootMargin: '-48% 0px -48% 0px' });
  steps.forEach((s) => sio.observe(s));

  /* ---------- Niche marquee: duplicate for seamless loop ---------- */
  document.querySelectorAll('.niche-track').forEach((t) => t.append(...[...t.children].map((n) => n.cloneNode(true))));
})();
