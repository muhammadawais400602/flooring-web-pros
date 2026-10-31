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
    if (!ms) return; // screens showing a real screenshot have nothing to scroll
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
  // "All" shows each business once; trade filters show every card in that trade.
  const firstByName = new Map();
  cards.forEach((c) => {
    const name = c.querySelector('h3').textContent.trim();
    const first = firstByName.get(name);
    if (first) { c.dataset.dup = '1'; first._cats.push(c.dataset.cat); }
    else { firstByName.set(name, c); c._cats = [c.dataset.cat]; }
  });
  const setLabels = (all) => cards.forEach((c) => {
    const lab = c.querySelector('.work-cat'); if (!lab) return;
    lab.textContent = all && c._cats ? c._cats.join(' · ') : c.dataset.cat;
  });
  cards.forEach((c) => c.classList.toggle('hide', c.dataset.dup === '1'));
  setLabels(true);
  filters.forEach((f) => f.addEventListener('click', () => {
    const cat = f.dataset.cat;
    setLabels(cat === 'All');
    filters.forEach((x) => { const on = x === f; x.classList.toggle('active', on); x.setAttribute('aria-pressed', String(on)); });
    cards.forEach((c) => {
      const show = cat === 'All' ? c.dataset.dup !== '1' : c.dataset.cat === cat;
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

  /* ---------- More of our work: scroll distance per card, auto-scroll on touch ---------- */
  const workCards = [...document.querySelectorAll('.work-card')];
  const sizeWork = () => workCards.forEach((c) => {
    const sc = c.querySelector('.work-screen'), img = sc.querySelector('img');
    if (!img) return;
    const dist = Math.max(0, img.offsetHeight - sc.clientHeight);
    c.style.setProperty('--scroll', dist + 'px');
    c.style.setProperty('--dur', Math.max(6, dist / 110).toFixed(1) + 's');
  });
  workCards.forEach((c) => { const img = c.querySelector('img'); if (img && !img.complete) img.addEventListener('load', sizeWork); });
  addEventListener('resize', sizeWork); addEventListener('load', sizeWork); sizeWork();
  if (noHover && !reduce) {
    const wio = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('auto', e.isIntersecting)), { threshold: .4 });
    workCards.forEach((c) => wio.observe(c));
  }

  /* ---------- Live HTML design cards: scaled iframe preview + full-screen viewer ---------- */
  const liveCards = [...document.querySelectorAll('.work-live')];
  const sizeLive = (c) => {
    const sc = c.querySelector('.work-screen'), fr = c.querySelector('.live-frame'), ifr = fr.querySelector('iframe');
    let fh = 6000;
    try {
      const doc = ifr.contentDocument, win = ifr.contentWindow;
      const kids = [...doc.body.children].filter((el) => win.getComputedStyle(el).position !== 'fixed');
      const bottom = Math.max(0, ...kids.map((el) => el.getBoundingClientRect().bottom + win.scrollY));
      if (bottom > 200) fh = Math.ceil(bottom);
    } catch {}
    const k = sc.clientWidth / 1440;
    fr.style.setProperty('--k', k.toFixed(5));
    fr.style.setProperty('--fh', fh + 'px');
    const dist = Math.max(0, fh * k - sc.clientHeight);
    c.style.setProperty('--scroll', dist.toFixed(0) + 'px');
    c.style.setProperty('--dur', Math.max(6, dist / 110).toFixed(1) + 's');
    fr.style.setProperty('--scroll', dist.toFixed(0) + 'px');
  };
  const lio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    lio.unobserve(e.target);
    const ifr = e.target.querySelector('iframe');
    ifr.addEventListener('load', () => { sizeLive(e.target); setTimeout(() => sizeLive(e.target), 1500); setTimeout(() => sizeLive(e.target), 4000); });
    ifr.src = ifr.dataset.src;
  }), { rootMargin: '400px 0px' });
  liveCards.forEach((c) => { sizeLive(c); lio.observe(c); });
  addEventListener('resize', () => liveCards.forEach(sizeLive));
  if (noHover && !reduce) {
    const lao = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('auto', e.isIntersecting)), { threshold: .4 });
    liveCards.forEach((c) => lao.observe(c));
  }
  const lm = document.querySelector('.live-modal');
  if (lm) {
    const lmFrame = lm.querySelector('iframe'), lmViews = [...lm.querySelectorAll('.lm-views button')];
    document.querySelectorAll('.work-open[data-live]').forEach((b) => b.addEventListener('click', () => {
      lm.querySelector('.lm-title').textContent = b.dataset.alt;
      lmFrame.src = b.dataset.live + '?embed';
      lmViews.forEach((x, i) => x.classList.toggle('on', i === 0)); lmFrame.style.width = '100%';
      lm.showModal();
    }));
    lmViews.forEach((v) => v.addEventListener('click', () => { lmViews.forEach((x) => x.classList.toggle('on', x === v)); lmFrame.style.width = v.dataset.w; }));
    lm.querySelector('.lm-close').addEventListener('click', () => lm.close());
    lm.addEventListener('click', (e) => { if (e.target === lm) lm.close(); });
    lm.addEventListener('close', () => { lmFrame.src = 'about:blank'; });
  }
})();
