/* Flooring WebPros — blog index: filter articles by topic */
(() => {
  const btns = [...document.querySelectorAll('.blog-filter')];
  const cards = [...document.querySelectorAll('.post-grid .post-card')];
  const empty = document.querySelector('.blog-empty');
  btns.forEach((b) => b.addEventListener('click', () => {
    const cat = b.dataset.cat;
    btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    let shown = 0;
    cards.forEach((c) => { const on = cat === 'all' || c.dataset.cat === cat; c.hidden = !on; if (on) { shown++; c.classList.add('in'); } });
    if (empty) empty.hidden = shown > 0;
  }));
})();
