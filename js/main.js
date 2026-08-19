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

/* Премиум: свиване/елевация на навигацията при скрол */
(function () {
  var nav = document.querySelector('.nav');
  if (!nav) return;
  var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 12); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* Форма за заявка: AJAX изпращане към Formspree, със задържане на сайта */
(function () {
  var forms = document.querySelectorAll('form.qform');
  if (!forms.length) return;
  forms.forEach(function (f) {
    f.addEventListener('submit', function (e) {
      if (!f.action || f.action.indexOf('formspree') === -1) return; // друг action — нормален submit
      e.preventDefault();
      var btn = f.querySelector('button[type=submit]');
      if (btn) { btn.disabled = true; btn.dataset.t = btn.textContent; btn.textContent = 'Изпращане…'; }
      fetch(f.action, { method: 'POST', body: new FormData(f), headers: { 'Accept': 'application/json' } })
        .then(function (r) {
          if (r.ok) {
            if (window.ptTrack) window.ptTrack('zapitvane', { forma: f.getAttribute('data-forma') || 'zayavka' });
            window.location.href = '/blagodarim/';
          }
          else { throw new Error('bad'); }
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.t || 'Изпрати заявка'; }
          var n = f.querySelector('.form-note');
          if (n) { n.innerHTML = 'Възникна проблем при изпращането. Моля, обадете се на <a href="tel:+359877775577" style="color:var(--green);font-weight:700;">0877 77 55 77</a> или пишете на progresstradesofia@gmail.com.'; n.style.color = '#b00020'; }
        });
    });
  });
})();

/* Мобилно меню: затваряне при клик на връзка и при Escape */
(function () {
  var mm = document.getElementById('mobile-menu'), h = document.getElementById('hamburger');
  if (!mm) return;
  function close() { mm.classList.remove('open'); if (h) h.setAttribute('aria-expanded', 'false'); }
  mm.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();


/* ── Измерване ─────────────────────────────────────────────────────────────
   Събития, по които се вижда кое на сайта носи клиенти:
     obazhdane      клик на телефонен номер
     viber          клик на Viber
     imeyl          клик на имейл
     upatvane       клик за упътване в Google Maps
     zapitvane      успешно изпратена заявка (не просто натиснат бутон)
     zadarzhane_10s посетителят е останал поне 10 секунди
   Параметърът „mqsto" казва откъде е дошъл кликът, „stranica" — от коя страница. */
window.ptTrack = function (name, params) {
  if (typeof gtag === 'function') {
    gtag('event', name, Object.assign({ stranica: location.pathname }, params || {}));
  }
};
(function () {
  function mqsto(a) {
    if (a.closest('.call-fab')) return 'plavasht-buton';
    if (a.closest('.nav') || a.closest('.topbar')) return 'gorna-lenta';
    if (a.closest('.mobile-menu')) return 'menu';
    if (a.closest('.footer')) return 'futar';
    if (a.closest('.hero-actions') || a.closest('.page-hero')) return 'hero';
    return 'stranica';
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('tel:') === 0) window.ptTrack('obazhdane', { mqsto: mqsto(a) });
    else if (href.indexOf('viber:') === 0) window.ptTrack('viber', { mqsto: mqsto(a) });
    else if (href.indexOf('mailto:') === 0) window.ptTrack('imeyl', { mqsto: mqsto(a) });
    else if (href.indexOf('maps.app.goo.gl') > -1 || href.indexOf('google.com/maps') > -1)
      window.ptTrack('upatvane', { mqsto: mqsto(a) });
  }, { passive: true });

  /* Задържане над 10 секунди. Таймерът спира, ако разделът мине на заден план,
     за да не се броят отворени и забравени табове. */
  var spent = 0, last = Date.now(), fired = false, t = setInterval(function () {
    if (document.visibilityState === 'visible') spent += Date.now() - last;
    last = Date.now();
    if (!fired && spent >= 10000) { fired = true; clearInterval(t); window.ptTrack('zadarzhane_10s'); }
  }, 1000);
})();

/* ── Работно време ─────────────────────────────────────────────────────────
   Пон–Пет 9:00–17:00 по българско време. Извън него показваме честно
   известие и насочваме към Viber и заявка, вместо да каним към обаждане,
   на което няма кой да отговори. Часът се чете за София, не по часовника
   на устройството — иначе клиент от друга часова зона вижда грешно. */
(function () {
  var notes = document.querySelectorAll('[data-closed-note]');
  if (!notes.length) return;
  var d;
  try {
    d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Sofia' }));
  } catch (e) { d = new Date(); }
  var den = d.getDay(), chas = d.getHours() + d.getMinutes() / 60;
  var otvoreno = den >= 1 && den <= 5 && chas >= 9 && chas < 17;
  if (!otvoreno) {
    notes.forEach(function (n) { n.classList.add('on'); });
    if (window.ptTrack) window.ptTrack('izvan_rabotno_vreme');
  }
})();
