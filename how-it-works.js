/* Flooring WebPros — How It Works page */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  const hero = document.querySelector('.hw-hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('ready')));

  /* Scroll road: line fills as you scroll */
  const road = document.querySelector('.road');
  const line = road.querySelector('.road-line');
  let queued = false;
  const onScroll = () => {
    queued = false;
    const r = road.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.55 - r.top) / r.height));
    line.style.setProperty('--p', p.toFixed(4));
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll); onScroll();

  /* Per-step scenes */
  const scenes = {
    call: async (s) => {
      const t = s.querySelector('.v-timer');
      for (let sec = 0; sec <= 15 * 60; sec += 15) {   // 15 minutes, fast-forward
        t.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
        await wait(40);
      }
    },
    build: async (s) => {
      const items = [...s.querySelectorAll('.v-build li')];
      const pct = s.querySelector('.v-pct'), bar = s.querySelector('.v-prog');
      for (let i = 0; i <= 100; i += 2) {
        pct.textContent = i + '%'; bar.style.setProperty('--w', i + '%');
        const done = Math.floor((i / 100) * items.length);
        items.forEach((li, k) => li.classList.toggle('done', k < done || i === 100));
        await wait(55);
      }
    },
    launch: async (s) => { await wait(1300); s.querySelector('.v-launch').classList.add('live'); },
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    e.target.classList.add('in');
    const fn = scenes[e.target.id]; if (fn) fn(e.target);
  }), { threshold: 0.35 });
  road.querySelectorAll('.stop').forEach((s) => io.observe(s));

  /* Readiness checklist */
  const boxes = [...document.querySelectorAll('.ready-list input')];
  const ringWrap = document.querySelector('.ring-wrap');
  const ringVal = ringWrap.querySelector('.ring-val');
  const n = ringWrap.querySelector('.ring-n');
  const msg = document.querySelector('.ready-msg');
  const KEY = 'fwp-ready';
  try { const saved = JSON.parse(localStorage.getItem(KEY) || '[]'); boxes.forEach((b, i) => (b.checked = !!saved[i])); } catch {}
  const update = () => {
    const c = boxes.filter((b) => b.checked).length, total = boxes.length;
    ringVal.style.strokeDashoffset = 327 * (1 - c / total);
    n.textContent = `${c}/${total}`;
    ringWrap.classList.toggle('full', c === total);
    msg.innerHTML = c === 0 ? 'Tick what you have to see how close you are.'
      : c === total ? 'You’re ready. <a href="/#mockup">Book your free call →</a>'
      : c >= 4 ? 'Almost there — we can help with the rest.'
      : 'Good start. We’ll fill in the gaps together.';
    try { localStorage.setItem(KEY, JSON.stringify(boxes.map((b) => b.checked))); } catch {}
  };
  boxes.forEach((b) => b.addEventListener('change', update));
  update();
})();
