/* Flooring WebPros — Google Analytics 4.
   gtag.js loads on the first interaction (so it never slows the page), and these
   events are tracked:
   - generate_lead      the free-mockup form was sent successfully (no personal data)
   - whatsapp_click     any WhatsApp link, with where on the page it was clicked
   - mockup_cta_click   any "free mockup" button/link
   - portfolio_open     a live portfolio design opened in the popup
   Events that happen before gtag.js arrives are queued and sent once it loads. */
(() => {
  const GA_ID = 'G-629X7EK7T0'; // Measurement ID (Google Analytics → Admin → Data streams)
  if (!/^G-[A-Z0-9]{6,}$/.test(GA_ID) || GA_ID === 'G-XXXXXXXXXX') return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);

  // gtag.js is heavy, so it loads on the visitor's first interaction (scroll, tap, click,
  // mouse move or key press), or 8s after page load if there is none. Anything tracked
  // before then is queued in dataLayer and sent once it loads.
  let loaded = false;
  const INTENT = ['scroll', 'pointerdown', 'pointermove', 'touchstart', 'keydown', 'wheel'];
  const load = () => {
    if (loaded) return;
    loaded = true;
    INTENT.forEach((t) => removeEventListener(t, load));
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
  };
  INTENT.forEach((t) => addEventListener(t, load, { passive: true }));
  const fallback = () => setTimeout(load, 8000);
  if (document.readyState === 'complete') fallback(); else addEventListener('load', fallback, { once: true });

  // Where on the page a click happened
  const where = (el) =>
    el.closest('.site-header .header-actions') ? 'header' :
    el.closest('.mobile-nav') ? 'mobile_menu' :
    el.closest('.mobile-cta') ? 'sticky_bar' :
    el.closest('.footer') ? 'footer' :
    el.closest('.announce') ? 'announcement_bar' :
    el.closest('#mockup, .lead-form') ? 'contact_section' :
    el.closest('.post-cta, .post-aside') ? 'blog_post' :
    el.closest('.hero, .page-hero, .ab-hero, .pr-hero, .hw-hero, .fq-hero, .pf-hero, .wws-hero') ? 'page_hero' :
    'page_body';

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const wa = t.closest('a[href*="wa.me/"]');
    if (wa) gtag('event', 'whatsapp_click', { link_location: where(wa) });
    const cta = t.closest('a[href$="#mockup"]');
    if (cta) gtag('event', 'mockup_cta_click', { link_location: where(cta), link_text: (cta.textContent || '').trim().slice(0, 60) });
    const live = t.closest('[data-live]');
    if (live) gtag('event', 'portfolio_open', { design_name: live.dataset.alt || '' });
  }, true);

  // Fired by main.js after the lead form is accepted by /api/lead
  document.addEventListener('lead:submitted', (e) => {
    gtag('event', 'generate_lead', { form_name: 'free_mockup', trade: (e.detail && e.detail.trade) || '' });
  });
})();
