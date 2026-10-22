/* Flooring WebPros — Services page animations */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- Hero: split headline into words, play oak frames on canvas ---------- */
  const hero = document.querySelector('.svc-hero');
  const h1 = hero.querySelector('.split-words');
  let wi = 0;
  const wrapWords = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', wi++);
          w.appendChild(s); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) {
        const w = document.createElement('span'); w.className = 'w';
        const s = document.createElement('span'); s.style.setProperty('--i', wi++);
        n.replaceWith(w); s.appendChild(n); w.appendChild(s);
      }
    });
  };
  h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
  wrapWords(h1);
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('ready')));

  const canvas = hero.querySelector('.svc-hero-canvas');
  const ctx = canvas.getContext('2d');
  const portrait = matchMedia('(max-aspect-ratio: 1/1)').matches;
  const dir = portrait ? '/frames-m' : '/frames';
  const IDS = []; for (let i = 1; i <= 132; i += 2) IDS.push(i);   // every 2nd frame: 66 images
  const imgs = IDS.map(() => null);
  const load = (k) => {
    if (imgs[k]) return imgs[k];
    const im = new Image(); im.decoding = 'async';
    im.src = `${dir}/f${String(IDS[k]).padStart(3, '0')}.webp`;
    imgs[k] = im; return im;
  };
  const sizeCanvas = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
  };
  const drawImg = (im) => {
    if (!im || !im.complete || !im.naturalWidth) return false;
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
    return true;
  };
  sizeCanvas(); addEventListener('resize', () => { sizeCanvas(); drawImg(imgs[frame]); });
  let frame = 0, dirn = 1;
  const first = load(0); first.onload = () => drawImg(first);
  if (!reduce) {
    // load in order, then ping-pong through loaded frames
    let k = 1; const loadNext = () => { if (k >= IDS.length) return; const im = load(k++); im.onload = im.onerror = loadNext; };
    for (let n = 0; n < 4; n++) loadNext();
    let last = 0, heroVisible = true;
    new IntersectionObserver((e) => { heroVisible = e[0].isIntersecting; }).observe(hero);
    const tick = (t) => {
      if (heroVisible && t - last > 83) {   // ~12 fps
        const nxt = frame + dirn;
        if (nxt < 0 || nxt >= IDS.length) dirn *= -1;
        const cand = frame + dirn;
        if (imgs[cand] && imgs[cand].complete && imgs[cand].naturalWidth) { frame = cand; drawImg(imgs[frame]); }
        last = t;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Marquee: duplicate track for a seamless loop ---------- */
  const track = document.querySelector('.marquee-track');
  if (track) track.append(...[...track.children].map((n) => n.cloneNode(true)));

  /* ---------- Typing helper ---------- */
  const typeInto = async (el, text, speed = 45) => {
    el.textContent = ''; el.classList.add('typing');
    for (const ch of text) { el.textContent += ch; await wait(speed + Math.random() * 40); }
    el.classList.remove('typing');
  };

  /* ---------- Count-up ---------- */
  const countUp = (el) => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = end + suf; return; }
    const t0 = performance.now();
    const step = (t) => { const k = clamp((t - t0) / 1400); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suf; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  /* ---------- Per-service scenes (run when the visual scrolls into view) ---------- */
  const scenes = {
    'local-seo': async (sec) => {
      const target = sec.querySelector('.type-target');
      const items = [...sec.querySelectorAll('.mk-results li')];
      const you = sec.querySelector('.mk-results li.you');
      const list = sec.querySelector('.mk-results');
      items.forEach((li, i) => li.style.setProperty('--r', i));
      list.classList.remove('done');
      await typeInto(target, target.dataset.type, reduce ? 0 : 45);
      await wait(500);
      let r = 1; items.forEach((li) => { if (li !== you) li.style.setProperty('--r', r++); });
      you.style.setProperty('--r', 0);
      await wait(1000); list.classList.add('done');
    },
    'lead-capture': async (sec) => {
      const fields = [...sec.querySelectorAll('.mk-form .type-target')];
      const btn = sec.querySelector('.mk-submit');
      const toast = sec.querySelector('.mk-toast');
      while (sec.classList.contains('play')) {
        toast.classList.remove('show'); fields.forEach((f) => (f.textContent = ''));
        await wait(500);
        for (const f of fields) await typeInto(f, f.dataset.type, reduce ? 0 : 55);
        btn.classList.add('press'); await wait(220); btn.classList.remove('press');
        await wait(300); toast.classList.add('show');
        await wait(4200);
        if (reduce) break;
      }
    },
    galleries: async (sec) => {
      const ba = sec.querySelector('.ba');
      if (ba.dataset.touched || reduce) return;
      const path = [50, 18, 82, 50];
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i], b = path[i + 1], t0 = performance.now(), dur = 1100;
        await new Promise((res) => {
          const step = (t) => {
            if (ba.dataset.touched) return res();
            const k = clamp((t - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
            ba.style.setProperty('--pos', (a + (b - a) * e) + '%');
            k < 1 ? requestAnimationFrame(step) : res();
          };
          requestAnimationFrame(step);
        });
      }
    },
  };

  /* Before/after slider input */
  document.querySelectorAll('.ba').forEach((ba) => {
    const range = ba.querySelector('.ba-range');
    range.addEventListener('input', () => { ba.dataset.touched = '1'; ba.style.setProperty('--pos', range.value + '%'); });
  });

  /* ---------- Observe service rows ---------- */
  const secs = [...document.querySelectorAll('.svc')];
  const started = new WeakSet();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const sec = e.target;
      if (e.isIntersecting) {
        sec.classList.add('in', 'play');
        if (!started.has(sec)) {
          started.add(sec);
          sec.querySelectorAll('[data-count]').forEach(countUp);
          const fn = scenes[sec.id]; if (fn) fn(sec);
        } else if (sec.id === 'lead-capture' && !sec.dataset.looping) {
          scenes['lead-capture'](sec);
        }
      } else {
        sec.classList.remove('play');
      }
    });
  }, { threshold: 0.3 });
  secs.forEach((s) => io.observe(s));
  // lead loop guard so only one loop runs
  const lead = document.getElementById('lead-capture');
  if (lead) {
    const orig = scenes['lead-capture'];
    scenes['lead-capture'] = async (sec) => { if (sec.dataset.looping) return; sec.dataset.looping = '1'; await orig(sec); delete sec.dataset.looping; };
  }

  /* ---------- Other count-ups outside service rows ---------- */
  const cio = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { cio.unobserve(e.target); countUp(e.target); } }), { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach((el) => { if (!el.closest('.svc')) cio.observe(el); });

  /* ---------- Scroll: hero parallax, jump bar spy + progress, depth layers, final CTA ---------- */
  const inner = hero.querySelector('.svc-hero-inner');
  const jump = document.querySelector('.jump');
  const chips = [...jump.querySelectorAll('a')];
  const list = document.querySelector('.svc-list');
  const visuals = [...document.querySelectorAll('.svc-visual')];
  const finalPhoto = document.querySelector('.final-photo');
  let queued = false;
  const onScroll = () => {
    queued = false;
    const vh = innerHeight;
    if (!reduce) {
      const hr = hero.getBoundingClientRect();
      const p = clamp(-hr.top / hr.height);
      inner.style.setProperty('--hy', (p * 120).toFixed(1) + 'px');
      inner.style.setProperty('--ho', (1 - p * 1.3).toFixed(3));
      visuals.forEach((v) => {
        const r = v.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        v.style.setProperty('--py', (((r.top + r.height / 2) - vh / 2) * 0.12).toFixed(1) + 'px');
      });
      if (finalPhoto) {
        const r = finalPhoto.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh) finalPhoto.style.setProperty('--fy', ((r.top - vh / 2) * -0.15).toFixed(1) + 'px');
      }
    }
    const lr = list.getBoundingClientRect();
    jump.style.setProperty('--p', clamp((vh * 0.4 - lr.top) / lr.height).toFixed(4));
    let active = null;
    secs.forEach((s) => { if (s.getBoundingClientRect().top < vh * 0.45) active = s.id; });
    chips.forEach((c) => {
      const on = c.getAttribute('href') === '#' + active;
      if (on && !c.classList.contains('active')) { const bar = c.parentElement; bar.scrollTo({ left: c.offsetLeft - bar.clientWidth / 2 + c.offsetWidth / 2, behavior: 'smooth' }); }
      c.classList.toggle('active', on);
    });
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
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
