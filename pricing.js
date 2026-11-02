/* Flooring WebPros — Pricing page */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = (n) => String(Math.round(n));
  const cents = (n) => String(Math.round(n));
  const tween = (from, to, dur, fn) => {
    if (reduce) return fn(to);
    const t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); fn(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  /* Hero: print the receipt */
  const hero = document.querySelector('.pr-hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('ready')));

  /* Monthly / first-year toggle */
  const toggle = document.querySelector('.pr-toggle');
  const tbtns = [...toggle.querySelectorAll('button')];
  const pill = toggle.querySelector('.pr-toggle-pill');
  const prices = [...document.querySelectorAll('.pr-price')];
  const placePill = (b) => { pill.style.setProperty('--pl', b.offsetLeft + 'px'); pill.style.setProperty('--pw', b.offsetWidth + 'px'); };
  let view = 'monthly';
  const render = (animate) => prices.forEach((p) => {
    const big = p.querySelector('.pr-big'), sub = p.querySelector('.pr-sub');
    const m = +p.dataset.month, year = 12 * m;
    const from = parseFloat(big.textContent.replace(/[^\d]/g, '')) || 0;
    const to = view === 'monthly' ? m : year;
    if (animate) tween(from, to, 700, (v) => (big.textContent = cents(v))); else big.textContent = cents(to);
    sub.textContent = view === 'monthly' ? 'per month' : `per year (${cents(m)} × 12)`;
  });
  tbtns.forEach((b) => b.addEventListener('click', () => {
    view = b.dataset.view;
    tbtns.forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    placePill(b); render(true);
  }));
  const initPill = () => placePill(toggle.querySelector('button.on'));
  addEventListener('load', initPill); addEventListener('resize', initPill); initPill();
  render(false);

  /* Payback calculator */
  const job = document.getElementById('job');
  const jobOut = document.getElementById('job-out');
  const pbtns = [...document.querySelectorAll('.calc-plans button')];
  let cost = 720, shownX = 0;
  const calc = () => {
    const v = +job.value, x = v / cost;
    jobOut.textContent = money(v);
    const max = Math.max(v, cost);
    document.querySelector('.cb-cost').style.setProperty('--w', (cost / max * 100) + '%');
    document.querySelector('.cb-job').style.setProperty('--w', (v / max * 100) + '%');
    document.querySelector('.cb-cost-v').textContent = money(cost);
    document.querySelector('.cb-job-v').textContent = money(v);
    const fmt = (n) => (n >= 10 ? Math.round(n) : n.toFixed(1));
    const from = shownX; shownX = x;
    tween(from, x, 400, (n) => { document.querySelector('.calc-x').textContent = fmt(n) + '×'; });
    document.querySelector('.calc-x2').textContent = fmt(x);
    document.querySelector('.calc-result span').firstChild.textContent = x >= 1 ? 'One extra job pays for your first year ' : 'Just a couple of extra jobs pay for your first year — one covers ';
  };
  job.addEventListener('input', calc);
  pbtns.forEach((b) => b.addEventListener('click', () => {
    cost = +b.dataset.cost;
    pbtns.forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    calc();
  }));
  calc();

  /* Animate-in: table checks and comparison bars */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .25 });
  document.querySelectorAll('.pr-table, .vsb').forEach((el) => io.observe(el));
  // stagger checkmarks row by row
  document.querySelectorAll('.pr-table tbody tr').forEach((tr, i) => tr.querySelectorAll('.yes').forEach((td) => (td.style.cssText = `--d:${i * 40}ms`)));
})();
