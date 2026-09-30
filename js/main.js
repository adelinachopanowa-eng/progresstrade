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


/* ── Измерване: интерес и контакт ──────────────────────────────────────────

   Две събития, всяко веднъж на сесия (sessionStorage, тоест на раздел):

     interest   първото от: клик на телефон, имейл или Viber; клик към
                картата; клик към /zayavka/; 20 секунди видимо на страницата
     contact    само при кликовете горе (без таймера), с параметър method:
                phone | email | viber | maps | quote_form

   Контактът винаги пуска и интерес, ако още не е пуснат — иначе се получава
   абсурдът повече контакти, отколкото заинтересовани.

   Сайтът не праща нищо сам. Бута в dataLayer; маркерите в Tag Manager
   решават кое отива към Meta и кое към Google Analytics. Събития, пуснати
   преди контейнерът да се е вдигнал, го чакат в масива. */
(function () {
  var KEY = 'pt_';
  var pamet = {};                        // резерва, ако хранилището е блокирано

  function push(name, params) {
    (window.dataLayer = window.dataLayer || []).push(Object.assign({
      event: name,
      stranica: location.pathname,
      ustroystvo: matchMedia('(pointer:coarse)').matches ? 'mobilen' : 'desktop'
    }, params || {}));
  }

  /* Връща true само първия път в рамките на сесията на раздела. */
  function vednaj(name) {
    if (pamet[name]) return false;
    try {
      if (sessionStorage.getItem(KEY + name)) { pamet[name] = 1; return false; }
      sessionStorage.setItem(KEY + name, '1');
    } catch (e) { /* частен режим: пазим поне в паметта на страницата */ }
    pamet[name] = 1;
    return true;
  }

  function interest() {
    if (vednaj('interest')) push('interest');
  }

  function contact(method) {
    interest();
    if (vednaj('contact')) push('contact', { method: method });
  }

  /* ── кликове ──
     capture, за да се брои дори ако друг обработчик спре събитието. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('tel:') === 0) contact('phone');
    else if (href.indexOf('mailto:') === 0) contact('email');
    else if (href.indexOf('viber:') === 0) contact('viber');
    else if (href.indexOf('maps.app.goo.gl') > -1 || href.indexOf('google.com/maps') > -1) contact('maps');
    else if (a.host === location.host && /^\/zayavka\/?$/.test(a.pathname)) contact('quote_form');
  }, { passive: true, capture: true });

  /* Кликът към /zayavka/ напуска страницата и заявката на пиксела може да не
     успее. Затова същото се проверява и при зареждане на самата страница —
     дедупликацията гарантира, че се брои веднъж. Изисква се идване от сайта:
     който влиза направо от реклама или търсене, не е кликал нищо. */
  if (/^\/zayavka\/?$/.test(location.pathname) &&
      document.referrer.indexOf(location.origin) === 0) contact('quote_form');

  /* ── 20 секунди видимо на страницата ──
     Скритият раздел не се брои: отворен и забравен прозорец не е интерес. */
  var vidimo = 0, posledno = Date.now();
  var taymer = setInterval(function () {
    if (document.visibilityState === 'visible') vidimo += Date.now() - posledno;
    posledno = Date.now();
    if (vidimo >= 20000) { clearInterval(taymer); interest(); }
  }, 1000);

  /* ── заявката е изпратена ──
     „Благодарим“ се вижда само след успешно изпращане на формата и е noindex,
     тоест никой не идва там от търсачка. Това е истинската конверсия и не се
     дедуплицира със сесията на interest/contact. */
  if (location.pathname.indexOf('/blagodarim') === 0 && vednaj('zayavka'))
    push('zayavka_izpratena');
})();

/* ── Работно време и отпуск ─────────────────────────────────────────────────
   Пон–Пет 9:00–17:00 по българско време. Извън него показваме честно
   известие и насочваме към Viber и заявка, вместо да каним към обаждане,
   на което няма кой да отговори. Часът се чете за София, не по часовника
   на устройството — иначе клиент от друга часова зона вижда грешно.

   ОТПУСК: датите по-долу са единственото, което се пипа. Лентата в хедъра
   се показва само в този период и изчезва сама след последния ден, затова
   не остава да виси стар текст, ако някой забрави да я махне. Разметката
   стои скрита в HTML — ако скриптът не се изпълни, лентата просто не се
   показва, вместо да лъже. За да се спре напълно, се изтриват двата реда
   с датите. */
(function () {
  var OTPUSK_OT = '2026-08-31';       // първи ден включително
  var OTPUSK_DO = '2026-09-04';       // последен ден включително

  var d;
  try {
    d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Sofia' }));
  } catch (e) { d = new Date(); }

  function iso(x) {
    return x.getFullYear() + '-' +
      ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2);
  }
  var dnes = iso(d);
  var vOtpusk = OTPUSK_OT && OTPUSK_DO && dnes >= OTPUSK_OT && dnes <= OTPUSK_DO;

  if (vOtpusk) {
    var bar = document.querySelector('[data-vacation]');
    if (bar) bar.classList.add('on');
  }

  var notes = document.querySelectorAll('[data-closed-note]');
  if (!notes.length) return;
  var den = d.getDay(), chas = d.getHours() + d.getMinutes() / 60;
  var otvoreno = !vOtpusk && den >= 1 && den <= 5 && chas >= 9 && chas < 17;
  if (!otvoreno) {
    if (vOtpusk) {
      notes.forEach(function (n) {
        var t = n.querySelector('span') || n;
        t.textContent = 'В годишен отпуск сме до 4 септември. Оставете заявка или ' +
          'пишете на Viber — отговаряме веднага след това.';
      });
    }
    notes.forEach(function (n) { n.classList.add('on'); });
  }
})();
