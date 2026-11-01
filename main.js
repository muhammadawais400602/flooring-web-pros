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

  /* ---------- Lazy media: images and CSS backgrounds below the fold load about a screen before they're needed ---------- */
  const lazyIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    if (el.dataset.srcset) el.srcset = el.dataset.srcset;
    if (el.dataset.src) el.src = el.dataset.src;
    if (el.dataset.lazyBg) el.style.setProperty('--img', `url('${el.dataset.lazyBg}')`);
    lazyIO.unobserve(el);
  }), { rootMargin: '900px 0px' });
  const lazyObserve = (root) => root.querySelectorAll('[data-src], [data-lazy-bg]').forEach((el) => lazyIO.observe(el));
  lazyObserve(document);

  /* ---------- Portfolio marquee: two rows drift opposite ways, scroll speeds them up ---------- */
  const mq = document.querySelector('.mq');
  if (mq) {
    if (reduceMotion) mq.classList.add('static');
    else {
      const rows = [...mq.querySelectorAll('.mq-row')].map((row) => {
        const clone = row.firstElementChild.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.inert = true;
        clone.querySelectorAll('button').forEach((b) => b.tabIndex = -1);
        row.appendChild(clone);
        lazyObserve(clone);
        const st = { row, dir: +row.dataset.dir || 1, x: 0, speed: 1, hold: false };
        row.addEventListener('mouseenter', () => { st.hold = true; });
        row.addEventListener('mouseleave', () => { st.hold = false; });
        row.addEventListener('focusin', () => { st.hold = true; });
        row.addEventListener('focusout', () => { st.hold = false; });
        return st;
      });
      let visible = false, raf = 0, last = 0, lastY = scrollY, boost = 0;
      const step = (now) => {
        const dt = last ? Math.min(64, now - last) : 16; last = now;
        boost = boost * 0.9 + Math.min(60, Math.abs(scrollY - lastY)) * 0.3; lastY = scrollY;
        rows.forEach((st) => {
          st.speed += ((st.hold ? 0 : 1) - st.speed) * 0.08;
          const w = st.row.firstElementChild.offsetWidth;
          if (!w) return;
          st.x -= st.dir * (0.04 * dt + boost) * st.speed;
          st.x = ((st.x % w) - w) % w;
          st.row.style.transform = `translate3d(${st.x}px,0,0)`;
        });
        raf = visible ? requestAnimationFrame(step) : 0;
      };
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) { last = 0; raf = requestAnimationFrame(step); }
      }).observe(mq);
    }
  }

  /* ---------- Live design popup (same as /portfolio) ---------- */
  const lm = document.querySelector('.live-modal');
  if (lm) {
    const lmFrame = lm.querySelector('iframe'), lmViews = [...lm.querySelectorAll('.lm-views button')];
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-live]');
      if (!b) return;
      e.preventDefault();
      lm.querySelector('.lm-title').textContent = b.dataset.alt;
      lmFrame.src = b.dataset.live + '?embed';
      lmViews.forEach((x, i) => x.classList.toggle('on', i === 0)); lmFrame.style.width = '100%';
      lm.showModal();
    });
    lmViews.forEach((v) => v.addEventListener('click', () => { lmViews.forEach((x) => x.classList.toggle('on', x === v)); lmFrame.style.width = v.dataset.w; }));
    lm.querySelector('.lm-close').addEventListener('click', () => lm.close());
    lm.addEventListener('click', (e) => { if (e.target === lm) lm.close(); });
    lm.addEventListener('close', () => { lmFrame.src = 'about:blank'; });
  }

  /* ---------- Hero: scroll-scrubbed image sequence on canvas ----------
     Smoothness: frames are pre-decoded off the main thread (createImageBitmap),
     neighbouring frames are cross-faded for sub-frame motion, the canvas never
     renders above the frames' own resolution, and the loop only runs while the
     hero is on screen and something changed. */
  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('.hero-canvas');
  // Created on first draw: an opaque context would cover the CSS first-frame poster until frames are decoded
  let ctx = null;
  const stages = [...document.querySelectorAll('.stage')];
  const bar = document.querySelector('.hero-progress span');
  const FRAMES = 132;
  const portrait = matchMedia('(max-aspect-ratio: 1/1)').matches;
  const dir = portrait ? 'frames-m' : 'frames';
  const SRC_W = portrait ? 600 : 1280;
  const src = (i) => `${dir}/f${String(i + 1).padStart(3, '0')}.webp`;
  const frames = new Array(FRAMES).fill(null);   // decoded, ready-to-draw bitmaps
  let current = 0, target = 0, drawnAt = -1, lastP = -1, rect = null, needsDraw = true;

  const decode = async (i) => {
    try {
      if ('createImageBitmap' in window) {
        const blob = await (await fetch(src(i))).blob();
        frames[i] = await createImageBitmap(blob);
      } else {
        const img = new Image(); img.src = src(i); await img.decode(); frames[i] = img;
      }
    } catch { /* leave empty; nearest frame is used */ }
    needsDraw = true;
  };

  // Coarse first (every 8th frame), then fill gaps, 6 at a time
  const preload = async () => {
    const order = [], seen = new Set();
    for (const step of [8, 4, 2, 1]) for (let i = 0; i < FRAMES; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    let k = 0;
    const worker = async () => { while (k < order.length) await decode(order[k++]); };
    await Promise.all(Array.from({ length: 6 }, worker));
  };

  const nearest = (i, dirn) => {
    for (let d = 0; d < FRAMES; d++) {
      const a = frames[i - d * dirn], b = frames[i + d * dirn];
      if (a) return a; if (b) return b;
    }
    return null;
  };

  const resize = () => {
    // Never render more pixels than the frames contain (cover-scaled)
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    const coverScale = Math.max(cssW / SRC_W, cssH / (SRC_W * 9 / 16));
    const dpr = Math.min(devicePixelRatio || 1, 2, Math.max(1, 1 / coverScale * 1.25));
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    rect = null; needsDraw = true;
  };

  const draw = () => {
    const i = Math.floor(current), f = current - i;
    const a = frames[i] || nearest(i, -1);
    if (!a) return;
    const cw = canvas.width, ch = canvas.height;
    if (!rect) {
      const s = Math.max(cw / a.width, ch / a.height);
      const w = a.width * s, h = a.height * s;
      rect = [(cw - w) / 2, (ch - h) / 2, w, h];
    }
    if (!ctx) ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    ctx.globalAlpha = 1;
    ctx.drawImage(a, rect[0], rect[1], rect[2], rect[3]);
    const b = f > 0.02 && i + 1 < FRAMES ? frames[i + 1] : null;
    if (b) { ctx.globalAlpha = f; ctx.drawImage(b, rect[0], rect[1], rect[2], rect[3]); ctx.globalAlpha = 1; }
    drawnAt = current;
  };

  const heroProgress = () => {
    const r = hero.getBoundingClientRect();
    const total = r.height - innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  };

  const updateStages = (p) => {
    const fade = 0.07;
    stages.forEach((el) => {
      const a = parseFloat(el.dataset.in), b = parseFloat(el.dataset.out);
      const inP = a === 0 ? 1 : clamp((p - a) / fade);
      const outP = clamp((b - p) / fade);
      const o = Math.min(inP, outP);
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translate3d(0, ${((1 - inP) * 30 - (1 - outP) * 30).toFixed(1)}px, 0)`;
      el.classList.toggle('on', o > 0.02);
    });
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
    document.documentElement.classList.add('hero-ready');
  };

  if (!reduceMotion) {
    // The 132 frames download after the page has rendered: on the visitor's first scroll/touch,
    // or 3s after load, whichever comes first. Until then the canvas shows frame 1 via CSS.
    let framesStarted = false;
    const startFrames = () => {
      if (framesStarted) return;
      framesStarted = true;
      INTENT.forEach((t) => removeEventListener(t, startFrames));
      decode(0).then(() => { resize(); draw(); preload(); });
    };
    const INTENT = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'];
    INTENT.forEach((t) => addEventListener(t, startFrames, { passive: true }));
    const afterLoad = () => setTimeout(startFrames, 3000);
    if (document.readyState === 'complete') afterLoad(); else addEventListener('load', afterLoad, { once: true });
    addEventListener('resize', resize);
    let heroVisible = true, running = false, last = performance.now();
    new IntersectionObserver((e) => { heroVisible = e[0].isIntersecting; if (heroVisible) kick(); }).observe(hero);
    const tick = (now) => {
      const dt = Math.min(64, now - last); last = now;
      const p = heroProgress();
      target = p * (FRAMES - 1);
      // Frame-rate independent easing: same feel at 60Hz and 120Hz
      current += (target - current) * (1 - Math.exp(-dt / 90));
      if (Math.abs(target - current) < 0.01) current = target;
      if (needsDraw || Math.abs(current - drawnAt) > 0.004) { draw(); needsDraw = false; }
      if (Math.abs(p - lastP) > 0.0002) { updateStages(p); lastP = p; }
      if (heroVisible && (current !== target || needsDraw)) requestAnimationFrame(tick);
      else running = false;
    };
    const kick = () => { if (!running && heroVisible) { running = true; last = performance.now(); requestAnimationFrame(tick); } };
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', kick);
    // keep drawing as new frames finish decoding
    setInterval(() => { if (needsDraw) kick(); }, 250);
    kick();
  }

  /* ---------- Who we serve: card photo fills section background on hover ---------- */
  const tradeSection = document.querySelector('.trade-section');
  if (tradeSection) {
    const bgWrap = tradeSection.querySelector('.trade-bg');
    const cards = [...tradeSection.querySelectorAll('.trade[data-bg]')];
    const layers = new Map();
    cards.forEach((card) => {
      const layer = document.createElement('div');
      layer.className = 'trade-bg-layer';
      bgWrap.appendChild(layer);
      layers.set(card, layer);
    });
    // Load the trade photos only when the section gets close, so they don't compete with the hero
    const loadTradePhotos = () => cards.forEach((card) => {
      const url = card.dataset.bg;
      card.style.setProperty('--bg', `url('${url}')`);
      layers.get(card).style.backgroundImage = `url('${url}')`;
    });
    const tio = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { loadTradePhotos(); tio.disconnect(); } }, { rootMargin: '1200px 0px' });
    tio.observe(tradeSection);
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
    const COLS = 2; // phones show two cards per row
    allCards.forEach((c, i) => c.style.setProperty('--r', Math.floor(i / COLS)));
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
        // only cards in the same column slide over this one
        for (let j = i + COLS; j < allCards.length; j += COLS) depth += clamp(1 - (rects[j].top - stick[j]) / rects[i].height);
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

  /* ---------- Cost estimator example ---------- */
  const size = document.getElementById('est-size');
  const sizeOut = document.getElementById('est-size-out');
  const price = document.getElementById('est-price');
  const chips = [...document.querySelectorAll('.chips button')];
  const toast = document.querySelector('.lead-toast');
  const toastText = toast.querySelector('.lead-text');
  const money = (n) => String(Math.round(n / 10) * 10);
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
    form.querySelectorAll('.field input, .field select').forEach((f) => {
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
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || String(data.success) === 'false') throw new Error(data.message || String(res.status));
      }
      status.classList.add('ok');
      status.textContent = "Got it! We'll message you on WhatsApp within 1 business day.";
      // For analytics (analytics.js): only the trade is shared, never contact details
      document.dispatchEvent(new CustomEvent('lead:submitted', { detail: { trade: form.elements.trade ? form.elements.trade.value : '' } }));
      form.reset();
    } catch {
      status.classList.add('err');
      status.textContent = 'Something went wrong. Please email us at info@flooringwebpros.com.';
    } finally {
      btn.disabled = false;
    }
  });
})();
