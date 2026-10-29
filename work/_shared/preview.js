/* Card preview mode (?static): use the stylesheet with vh resolved to a 900px screen. */
(function () {
  if (!/[?&]static\b/.test(location.search)) return;
  var l = document.querySelector('link[href="style.css"]');
  if (l) l.href = 'style-preview.css';
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[style*="vh"]').forEach(function (el) {
      el.setAttribute('style', el.getAttribute('style').replace(/(-?\d*\.?\d+)(?:s|d|l)?vh\b/g, function (_, n) { return (parseFloat(n) * 9) + 'px'; }));
    });
  });
})();
