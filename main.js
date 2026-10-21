/* Flooring WebPros — homepage behaviour */
(() => {
  document.documentElement.classList.remove('no-js');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Header: solid after hero start, mobile menu ---------- */
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

  /* ---------- Hero: scroll-scrubbed image sequence on canvas ---------- */
  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('.hero-canvas');
  const ctx = canvas.getContext('2d');
  const stages = [...document.querySelectorAll('.stage')];
  const bar = document.querySelector('.hero-progress span');
  const FRAMES = 132;
  const portrait = matchMedia('(max-aspect-ratio: 1/1)').matches;
  const dir = portrait ? 'frames-m' : 'frames';
  const src = (i) => `${dir}/f${String(i + 1).padStart(3, '0')}.webp`;
  const images = new Array(FRAMES);
  let current = 0;      // frame drawn (smoothed)
  let target = 0;       // frame wanted by scroll
  let drawn = -1;

  function loadFrame(i) {
    if (images[i]) return images[i];
    const img = new Image();
    img.decoding = 'async';
    img.src = src(i);
    img.onload = () => { if (Math.round(current) === i || drawn === -1) draw(true); };
    images[i] = img;
    return img;
  }

  // Load coarse first (every 8th frame) so scrubbing works early, then fill the gaps.
  function preload() {
    const order = [];
    for (let step of [8, 4, 2, 1]) for (let i = 0; i < FRAMES; i += step) if (!order.includes(i)) order.push(i);
    let k = 0;
    const next = () => {
      const batch = order.slice(k, k + 6);
      k += 6;
      if (!batch.length) return;
      let left = batch.length;
      batch.forEach((i) => {
        const img = loadFrame(i);
        const done = () => { if (--left === 0) next(); };
        if (img.complete) done(); else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
      });
    };
    next();
  }

  function nearestLoaded(i) {
    for (let d = 0; d < FRAMES; d++) {
      const a = images[i - d], b = images[i + d];
      if (a && a.complete && a.naturalWidth) return a;
      if (b && b.complete && b.naturalWidth) return b;
    }
    return null;
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    draw(true);
  }

  function draw(force) {
    const i = Math.round(current);
    if (!force && i === drawn) return;
    const img = nearestLoaded(i);
    if (!img) return;
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    drawn = i;
  }

  function heroProgress() {
    const r = hero.getBoundingClientRect();
    const total = r.height - innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  }

  function updateStages(p) {
    const fade = 0.07;
    stages.forEach((el) => {
      const a = parseFloat(el.dataset.in), b = parseFloat(el.dataset.out);
      const inP = a === 0 ? 1 : clamp((p - a) / fade);
      const outP = clamp((b - p) / fade);
      const o = Math.min(inP, outP);
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translateY(${((1 - inP) * 30 - (1 - outP) * 30).toFixed(1)}px)`;
      el.classList.toggle('on', o > 0.02);
    });
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
  }

  if (!reduceMotion) {
    loadFrame(0);
    preload();
    resize();
    addEventListener('resize', resize);
    const tick = () => {
      const p = heroProgress();
      target = p * (FRAMES - 1);
      current += (target - current) * 0.18;
      if (Math.abs(target - current) < 0.05) current = target;
      draw(false);
      updateStages(p);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Who we serve: card photo fills section background on hover ---------- */
  const tradeSection = document.querySelector('.trade-section');
  if (tradeSection) {
    const bgWrap = tradeSection.querySelector('.trade-bg');
    const cards = [...tradeSection.querySelectorAll('.trade[data-bg]')];
    const layers = new Map();
    cards.forEach((card) => {
      const url = card.dataset.bg;
      card.style.setProperty('--bg', `url('${url}')`);
      const layer = document.createElement('div');
      layer.className = 'trade-bg-layer';
      layer.style.backgroundImage = `url('${url}')`;
      bgWrap.appendChild(layer);
      layers.set(card, layer);
    });
    let hideTimer;
    const stackMq = matchMedia('(max-width: 559px)');
    const show = (card) => {
      clearTimeout(hideTimer);
      layers.forEach((l, c) => { l.classList.toggle('on', c === card); c.classList.toggle('active', c === card); });
      tradeSection.classList.add('has-bg');
    };
    const hide = () => {
      hideTimer = setTimeout(() => {
        layers.forEach((l, c) => { l.classList.remove('on'); c.classList.remove('active'); });
        tradeSection.classList.remove('has-bg');
      }, 80);
    };
    cards.forEach((card) => {
      card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !stackMq.matches) show(card); });
      card.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !stackMq.matches) hide(); });
      card.addEventListener('focus', () => { if (!stackMq.matches) show(card); });
      card.addEventListener('blur', () => { if (!stackMq.matches) hide(); });
    });

    /* Phones: stacked cards. Background follows the card on top; covered cards shrink and darken. */
    const allCards = [...tradeSection.querySelectorAll('.trade')];
    allCards.forEach((c, i) => c.style.setProperty('--i', i));
    let stackQueued = false, stackActive = null;
    const updateStack = () => {
      stackQueued = false;
      if (!stackMq.matches) {
        allCards.forEach((c) => { c.style.removeProperty('--s'); c.style.removeProperty('--b'); });
        return;
      }
      const sr = tradeSection.getBoundingClientRect();
      if (sr.bottom < 0 || sr.top > innerHeight) return;
      const rects = allCards.map((c) => c.getBoundingClientRect());
      const stick = allCards.map((c) => parseFloat(getComputedStyle(c).top) || 0);
      allCards.forEach((c, i) => {
        let depth = 0;
        for (let j = i + 1; j < allCards.length; j++) depth += clamp(1 - (rects[j].top - stick[j]) / rects[i].height);
        c.style.setProperty('--s', Math.max(0.82, 1 - depth * 0.05).toFixed(4));
        c.style.setProperty('--b', Math.max(0.55, 1 - depth * 0.15).toFixed(4));
      });
      let top = null;
      allCards.forEach((c, i) => { if (rects[i].top < innerHeight * 0.45) top = c; });
      const next = top && layers.has(top) ? top : null;
      if (next === stackActive) return;
      stackActive = next;
      if (next) show(next); else hide();
    };
    const queueStack = () => { if (!stackQueued) { stackQueued = true; requestAnimationFrame(updateStack); } };
    addEventListener('scroll', queueStack, { passive: true });
    addEventListener('resize', queueStack);
    stackMq.addEventListener('change', () => { stackActive = null; hide(); queueStack(); });
    queueStack();
  }

  /* ---------- Header colour + sticky mobile CTA ---------- */
  const mobileCta = document.querySelector('.mobile-cta');
  const finalSection = document.getElementById('mockup');
  const onScroll = () => {
    const heroEnd = reduceMotion ? innerHeight * 0.6 : hero.offsetTop + hero.offsetHeight - innerHeight * 1.05;
    header.classList.toggle('solid', scrollY > heroEnd);
    const fr = finalSection.getBoundingClientRect();
    const inFinal = fr.top < innerHeight && fr.bottom > 0;
    mobileCta.classList.toggle('show', scrollY > heroEnd + innerHeight * 0.5 && !inFinal);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 60}ms`;
    io.observe(el);
  });

  /* ---------- Count-up stats ---------- */
  const countIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIo.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
      if (reduceMotion) return;
      const t0 = performance.now(), dur = 1200;
      const step = (t) => {
        const k = clamp((t - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suf;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach((el) => countIo.observe(el));

  /* ---------- Cost estimator demo ---------- */
  const size = document.getElementById('est-size');
  const sizeOut = document.getElementById('est-size-out');
  const price = document.getElementById('est-price');
  const chips = [...document.querySelectorAll('.chips button')];
  const toast = document.querySelector('.lead-toast');
  const toastText = toast.querySelector('.lead-text');
  const money = (n) => '$' + (Math.round(n / 10) * 10).toLocaleString('en-US');
  let active = chips[0];
  const updateEstimate = () => {
    const sq = +size.value;
    sizeOut.textContent = sq.toLocaleString('en-US');
    price.textContent = `${money(sq * +active.dataset.lo)} – ${money(sq * +active.dataset.hi)}`;
  };
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => x.setAttribute('aria-checked', String(x === c)));
    active = c;
    updateEstimate();
  }));
  // Arrow keys move between radio chips
  document.querySelector('.chips').addEventListener('keydown', (e) => {
    const i = chips.indexOf(document.activeElement);
    if (i < 0 || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const n = chips[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : chips.length - 1)) % chips.length];
    n.focus(); n.click();
  });
  size.addEventListener('input', updateEstimate);
  updateEstimate();
  let toastTimer;
  document.getElementById('est-cta').addEventListener('click', () => {
    toastText.textContent = `${(+size.value).toLocaleString('en-US')} sq ft ${active.dataset.type}, Austin TX`;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3800);
  });
  // Show the sample notification once when the phone scrolls into view
  const phoneIo = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      phoneIo.disconnect();
      setTimeout(() => { toast.classList.add('show'); toastTimer = setTimeout(() => toast.classList.remove('show'), 3800); }, 900);
    }
  }, { threshold: 0.6 });
  phoneIo.observe(document.querySelector('.phone'));

  /* ---------- Lead form ---------- */
  const form = document.querySelector('.lead-form');
  const status = form.querySelector('.form-status');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('input, select').forEach((f) => {
      const bad = !f.checkValidity();
      f.closest('.field').classList.toggle('invalid', bad);
      f.setAttribute('aria-invalid', String(bad));
      if (bad && ok) { f.focus(); ok = false; }
    });
    status.className = 'form-status';
    if (!ok) { status.classList.add('err'); status.textContent = 'Please fill in the highlighted fields.'; return; }

    const endpoint = form.dataset.endpoint;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      if (endpoint) {
        const res = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
        if (!res.ok) throw new Error(String(res.status));
      }
      status.classList.add('ok');
      status.textContent = "Got it! We'll call within 1 business day to start your free mockup.";
      form.reset();
    } catch {
      status.classList.add('err');
      status.textContent = 'Something went wrong. Please call us instead.';
    } finally {
      btn.disabled = false;
    }
  });
})();
