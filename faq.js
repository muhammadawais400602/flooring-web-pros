/* Flooring WebPros — FAQ page */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.fq-hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('ready')));

  const input = document.getElementById('fq-q');
  const count = document.querySelector('.fq-count');
  const items = [...document.querySelectorAll('.fq')];
  const groups = [...document.querySelectorAll('.fq-group')];
  const cats = [...document.querySelectorAll('.fq-cats a')];
  const empty = document.querySelector('.fq-empty');
  items.forEach((d) => { const s = d.querySelector('summary'), p = d.querySelector('.fq-a p'); d._q = s.textContent; d._a = p.textContent; });

  /* Smooth open/close */
  items.forEach((d) => {
    const s = d.querySelector('summary'), body = d.querySelector('.fq-a');
    s.addEventListener('click', (e) => {
      if (reduce) return;
      e.preventDefault();
      if (d.open) {
        const h = body.offsetHeight;
        body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 280, easing: 'ease' }).onfinish = () => (d.open = false);
      } else {
        d.open = true;
        const h = body.offsetHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
  });

  /* Search + topic filter */
  let cat = 'all';
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mark = (text, words) => {
    let out = esc(text);
    words.forEach((w) => { out = out.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>'); });
    return out;
  };
  const apply = () => {
    const words = input.value.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    let shown = 0;
    items.forEach((d) => {
      const g = d.closest('.fq-group').dataset.cat;
      const hay = (d._q + ' ' + d._a).toLowerCase();
      const ok = (cat === 'all' || cat === g) && words.every((w) => hay.includes(w));
      d.hidden = !ok;
      d.querySelector('summary').innerHTML = words.length ? mark(d._q, words) : esc(d._q);
      d.querySelector('.fq-a p').innerHTML = words.length ? mark(d._a, words) : esc(d._a);
      if (ok) shown++;
      if (words.length && ok && !d.open) d.open = shown <= 3;
      if (!words.length && d.dataset.autoOpened) { d.open = false; }
      if (words.length && ok && shown <= 3) d.dataset.autoOpened = '1';
    });
    if (!words.length) items.forEach((d) => delete d.dataset.autoOpened);
    groups.forEach((g) => (g.hidden = !g.querySelector('.fq:not([hidden])')));
    empty.hidden = shown > 0;
    count.textContent = `${shown} answer${shown === 1 ? '' : 's'}`;
  };
  let t; input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(apply, 120); typing = false; });
  document.querySelectorAll('.fq-try button').forEach((b) => b.addEventListener('click', () => {
    typing = false; input.value = b.textContent; apply();
    document.querySelector('.fq-main').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));
  cats.forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    cat = a.dataset.cat;
    cats.forEach((x) => x.classList.toggle('active', x === a));
    apply();
    const target = cat === 'all' ? document.querySelector('.fq-main') : document.getElementById(cat);
    const y = target.getBoundingClientRect().top + scrollY - (innerWidth >= 1000 ? 100 : 150);
    scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    a.parentElement.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' });
  }));

  /* Placeholder types example questions until the visitor types */
  let typing = !reduce;
  const examples = ['How much does it cost?', 'Do I own my website?', 'How fast can you launch?', 'Do I need good photos?', 'Is there a contract?'];
  (async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    await sleep(1200);
    for (let k = 0; typing; k++) {
      const ex = examples[k % examples.length];
      for (let i = 1; i <= ex.length && typing; i++) { input.placeholder = ex.slice(0, i); await sleep(55); }
      await sleep(1600);
      for (let i = ex.length; i >= 0 && typing; i--) { input.placeholder = ex.slice(0, i) || ' '; await sleep(25); }
      await sleep(300);
    }
    input.placeholder = 'Ask anything…';
  })();
  input.addEventListener('focus', () => { typing = false; input.placeholder = 'Ask anything…'; });

  /* Deep link: open + flash the question in the URL hash */
  if (location.hash) {
    const g = document.querySelector(location.hash);
    if (g && g.classList.contains('fq-group')) { const first = g.querySelector('.fq'); if (first) { first.open = true; first.classList.add('flash'); } }
  }

  /* Chat card: typing dots, then the answer */
  const chat = document.querySelector('.chat');
  if (chat) new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); setTimeout(() => chat.classList.add('done'), reduce ? 0 : 1600); } }).observe(chat);

  apply();
})();
