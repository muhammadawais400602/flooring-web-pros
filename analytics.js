/* Flooring WebPros — Google Analytics 4.
   gtag.js loads after the page has rendered (so it never slows the first paint),
   and these events are tracked:
   - generate_lead      the free-mockup form was sent successfully (no personal data)
   - whatsapp_click     any WhatsApp link, with where on the page it was clicked
   - mockup_cta_click   any "free mockup" button/link
   - portfolio_open     a live portfolio design opened in the popup
   Events that happen before gtag.js arrives are queued and sent once it loads. */
(() => {
  const GA_ID = 'G-XXXXXXXXXX'; // ← Measurement ID from Google Analytics → Admin → Data streams
  if (!/^G-[A-Z0-9]{6,}$/.test(GA_ID) || GA_ID === 'G-XXXXXXXXXX') return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);

  const load = () => {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
  };
  const later = () => ('requestIdleCallback' in window ? requestIdleCallback(load, { timeout: 3000 }) : setTimeout(load, 1500));
  if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });

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
