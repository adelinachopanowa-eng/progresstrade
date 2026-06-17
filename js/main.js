function toggleMenu() {
  var open = document.getElementById('mobile-menu').classList.toggle('open');
  var h = document.getElementById('hamburger');
  if (h) h.setAttribute('aria-expanded', open ? 'true' : 'false');
}


const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = '';
        link.style.fontWeight = '';
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.style.color = 'var(--green)';
          link.style.fontWeight = '700';
        }
      });
    }
  });
}, { rootMargin: '-50% 0px -50% 0px' });
sections.forEach(s => observer.observe(s));

/* Премиум: фино изплуване на елементите при скрол */
(function () {
  if (!('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js-reveal');
  var sel = '.section-label,.section-label-dark,.section-title,.section-title-dark,.section-body,.section-body-dark,.service-card,.advantage,.step-card,.price-card,.client-logo,.faq-item,.feature-img,.about-img,.checklist,.prices-disclaimer';
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  [].forEach.call(document.querySelectorAll(sel), function (el) {
    el.classList.add('reveal');
    var idx = [].indexOf.call(el.parentElement.children, el);
    el.style.transitionDelay = (Math.min(idx, 6) * 60) + 'ms';
    io.observe(el);
  });
})();
