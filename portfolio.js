/* Flooring WebPros — Portfolio page */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const noHover = matchMedia('(hover: none)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Hero: deal the fan in, tilt with the mouse ---------- */
  const hero = document.querySelector('.pf-hero');
  const fan = hero.querySelector('.pf-fan-in');
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('ready')));
  if (!reduce) hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = hero.getBoundingClientRect();
    fan.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    fan.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  });

  /* ---------- How far each mini site can scroll ---------- */
  const setScroll = (root) => root.querySelectorAll('.pf-screen').forEach((sc) => {
    const ms = sc.querySelector('.ms');
    const host = sc.closest('.pf-card, .fan-card, .pf-m-laptop, .pf-m-phone') || sc;
    host.style.setProperty('--scroll', Math.max(0, ms.offsetHeight - sc.clientHeight) + 'px');
  });
  const refresh = () => setScroll(document);
  addEventListener('load', refresh); addEventListener('resize', refresh); refresh();

  /* ---------- Count-ups ---------- */
  const countUp = (el) => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) return;
    const t0 = performance.now();
    const step = (t) => { const k = clamp((t - t0) / 1400); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suf; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { cio.unobserve(e.target); countUp(e.target); } }), { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));

  /* ---------- Touch screens: cards auto-scroll while in view ---------- */
  const cards = [...document.querySelectorAll('.pf-card')];


  /* ---------- Filters ---------- */
  const filters = [...document.querySelectorAll('.pf-filter')];
  filters.forEach((f) => f.addEventListener('click', () => {
    const cat = f.dataset.cat;
    filters.forEach((x) => { const on = x === f; x.classList.toggle('active', on); x.setAttribute('aria-pressed', String(on)); });
    cards.forEach((c) => {
      const show = cat === 'All' || c.dataset.cat === cat;
      c.classList.toggle('hide', !show);
      c.classList.remove('pop');
      if (show) { c.classList.add('in'); void c.offsetWidth; c.classList.add('pop'); }
    });
    refresh(); if (typeof sizeWork === 'function') requestAnimationFrame(sizeWork);
  }));

  /* ---------- Old vs new slider ---------- */
  const vs = document.querySelector('.vs');
  if (vs) {
    const range = vs.querySelector('.ba-range');
    range.addEventListener('input', () => { vs.dataset.touched = '1'; vs.style.setProperty('--pos', range.value + '%'); });
    const sweep = async () => {
      const path = [50, 82, 18, 50];
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i], b = path[i + 1], t0 = performance.now(), dur = 1200;
        await new Promise((res) => {
          const step = (t) => {
            if (vs.dataset.touched) return res();
            const k = clamp((t - t0) / dur), ez = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
            vs.style.setProperty('--pos', (a + (b - a) * ez) + '%');
            k < 1 ? requestAnimationFrame(step) : res();
          };
          requestAnimationFrame(step);
        });
      }
    };
    const vio = new IntersectionObserver((es) => { if (es[0].isIntersecting) { vio.disconnect(); if (!reduce) setTimeout(sweep, 500); } }, { threshold: .5 });
    vio.observe(vs);
  }

  /* ---------- Timeline ---------- */
  const tl = document.querySelector('.pf-time');
  if (tl) { const tio = new IntersectionObserver((es) => { if (es[0].isIntersecting) { tio.disconnect(); tl.classList.add('in'); } }, { threshold: .4 }); tio.observe(tl); }

  /* ---------- Featured project: auto-scroll the full-page design, open full view ---------- */
  const feat = document.querySelector('.feat-screen');
  if (feat) {
    const img = feat.querySelector('img');
    const size = () => {
      const dist = Math.max(0, img.offsetHeight - feat.clientHeight);
      feat.style.setProperty('--scroll', dist + 'px');
      feat.style.setProperty('--dur', Math.max(12, dist / 70).toFixed(1) + 's');
    };
    img.complete ? size() : img.addEventListener('load', size);
    addEventListener('resize', size);
    const fm = document.querySelector('.feat-modal');
    const fmImg = fm.querySelector('img');
    const openFull = (src, alt) => {
      fmImg.src = src; fmImg.alt = alt;
      const fit = () => { fm.style.width = `min(${Math.round(Math.max(320, fmImg.naturalWidth * 1.35))}px, 100% - 24px)`; };
      fmImg.complete ? fit() : fmImg.addEventListener('load', fit, { once: true });
      fm.showModal(); fm.scrollTop = 0;
    };
    document.querySelectorAll('.feat-open, .feat-open-2').forEach((b) => b.addEventListener('click', () => openFull('/images/portfolio/silvan-hardwood.webp', 'Silvan Hardwood full homepage design')));
    document.querySelectorAll('.work-open').forEach((b) => b.addEventListener('click', () => openFull(b.dataset.src, b.dataset.alt)));
    fm.querySelector('.pf-close').addEventListener('click', () => fm.close());
    fm.addEventListener('click', (e) => { if (e.target === fm) fm.close(); });
  }

  /* ---------- More of our work: scroll distance per card, auto-scroll on touch ---------- */
  const workCards = [...document.querySelectorAll('.work-card')];
  const sizeWork = () => workCards.forEach((c) => {
    const sc = c.querySelector('.work-screen'), img = sc.querySelector('img');
    const dist = Math.max(0, img.offsetHeight - sc.clientHeight);
    c.style.setProperty('--scroll', dist + 'px');
    c.style.setProperty('--dur', Math.max(6, dist / 110).toFixed(1) + 's');
  });
  workCards.forEach((c) => { const img = c.querySelector('img'); if (!img.complete) img.addEventListener('load', sizeWork); });
  addEventListener('resize', sizeWork); addEventListener('load', sizeWork); sizeWork();
  if (noHover && !reduce) {
    const wio = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('auto', e.isIntersecting)), { threshold: .4 });
    workCards.forEach((c) => wio.observe(c));
  }
})();
