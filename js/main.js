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

   Две събития, всяко веднъж на посещение:

     interest   първото от: клик на телефон, имейл или Viber; клик към
                картата; клик към /zayavka/; 20 секунди видимо време,
                сумирано за целия сайт; превъртане до половината на
                страницата; втора отворена страница в посещението
     contact    само при кликовете горе (без таймера), с параметър method:
                phone | email | viber | maps | quote_form

   Контактът винаги пуска и интерес, ако още не е пуснат — иначе се получава
   абсурдът повече контакти, отколкото заинтересовани.

   Броенето е в localStorage, а не в sessionStorage: sessionStorage е на
   раздел и човек с два отворени таба щеше да даде два интереса. Посещението
   свършва след 30 минути без активност — толкова е и сесията при Google.
   Така един и същи човек не дава интерес втори път, докато обикаля сайта,
   но връщане след седмица се брои наново.

   Към Meta се праща направо от тук: fbq('trackCustom','Interest') и
   fbq('track','Contact',{method}). Затова в Tag Manager НЕ бива да има
   маркери за пиксела върху тези две събития — ще се броят двойно.
   Паралелно всяко събитие отива и в dataLayer, откъдето маркерите в GTM
   го подават на Google Analytics. */
(function () {
  var KEY = 'pt_poseshtenie';
  var PROZOREC = 30 * 60 * 1000;         // 30 минути без активност
  var CEL = 20000;                       // 20 секунди видимо време
  var pamet = null;                      // резерва, ако хранилището е блокирано

  function sesiya() {
    var st = null;
    try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!st || typeof st !== 'object') st = pamet;
    if (!st || typeof st !== 'object') st = {};
    if (st.t && Date.now() - st.t > PROZOREC) st = {};   // изтекло — ново посещение
    return st;
  }

  function zapishi(st) {
    st.t = Date.now();
    pamet = st;
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
  }

  /* Връща true само първия път в рамките на посещението. */
  function vednaj(name) {
    var st = sesiya();
    if (st[name]) { zapishi(st); return false; }        // активен е — удължаваме
    st[name] = 1; zapishi(st);
    return true;
  }

  function push(name, params) {
    (window.dataLayer = window.dataLayer || []).push(Object.assign({
      event: name,
      stranica: location.pathname,
      ustroystvo: matchMedia('(pointer:coarse)').matches ? 'mobilen' : 'desktop'
    }, params || {}));
  }

  /* Пикселът живее в маркер вътре в контейнера, а контейнерът се вдига при
     първо докосване на страницата. Тоест точно при първия клик fbq още го
     няма. Затова събитието чака в опашка и тръгва в мига, в който fbq се
     появи. Ако пикселът изобщо не дойде (блокиран), отказваме се след 30
     секунди, вместо да въртим таймер до безкрай. */
  var chakat = [], nabliudava = null;

  /* Не стига fbq да съществува — трябва да е минало и fbq('init'), иначе
     събитието тръгва без пиксел, към който да се отнесе. Проверяваме и
     двете състояния: вече зареден скрипт (getState) или init, който още
     чака в опашката на самия fbq. */
  function pikselGotov() {
    var f = window.fbq;
    if (typeof f !== 'function') return false;
    if (typeof f.callMethod === 'function') return true;   // fbevents.js е поел
    var q = f.queue || [];                                 // още чака в опашката,
    for (var i = 0; i < q.length; i++)                     // но init вече е подаден
      if (q[i] && q[i][0] === 'init') return true;
    return false;
  }

  function kamMeta(fn) {
    if (pikselGotov()) { fn(); return; }
    chakat.push(fn);
    if (nabliudava) return;
    var broi = 0;
    nabliudava = setInterval(function () {
      if (pikselGotov()) {
        clearInterval(nabliudava); nabliudava = null;
        while (chakat.length) chakat.shift()();
      } else if (++broi > 60) { clearInterval(nabliudava); nabliudava = null; chakat.length = 0; }
    }, 300);
  }

  /* Два отделни белега на събитие: единият казва „преброено е за Analytics“,
     другият — „доставено е до пиксела“. Метовият се записва чак в мига на
     самото извикване. Иначе клик към /zayavka/ сменя страницата, преди
     пикселът да е готов, събитието се губи, а записът вече го е отбелязал
     за изпратено и повече никой не опитва. */
  function kamGoogle(ime, params) {
    if (vednaj(ime)) push(ime, params);
  }

  var chakashti = {};
  function kamMetaVednaj(beleg, fn) {
    if (chakashti[beleg] || sesiya()[beleg]) return;     // вече чака на тази страница
    chakashti[beleg] = 1;
    kamMeta(function () {
      var st = sesiya();
      if (st[beleg]) return;                             // друг раздел е изпреварил
      st[beleg] = 1; zapishi(st);
      fn();
    });
  }

  /* Интересът е приключен само когато и Analytics го е преброил, и пикселът
     го е получил. Проверката на единия белег беше причината таймерът да не
     праща нищо към Meta, ако Analytics вече го е отчел по-рано. */
  function interesGotov() {
    var st = sesiya();
    return !!(st.interest && st.interest_fb);
  }

  function interest() {
    kamGoogle('interest');
    kamMetaVednaj('interest_fb', function () {
      window.fbq('trackCustom', 'Interest');
    });
  }

  function contact(method) {
    interest();
    kamGoogle('contact', { method: method });
    kamMetaVednaj('contact_fb', function () {
      window.fbq('track', 'Contact', { method: method });
    });
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

  /* ── 20 секунди видимо време, сумирано за целия сайт ──
     Натрупаното стои в записа на посещението, затова осем секунди на една
     страница и дванайсет на следващата правят двайсет. Скритият раздел не
     се брои: отворен и забравен прозорец не е интерес. */
  (function () {
    if (interesGotov()) return;
    var posledno = Date.now();
    document.addEventListener('visibilitychange', function () { posledno = Date.now(); });
    var taymer = setInterval(function () {
      var sega = Date.now(), delta = Math.min(sega - posledno, 2000);
      posledno = sega;                                  // таймерът в скрит раздел
      if (document.visibilityState !== 'visible') return;  // се забавя или спира,
      if (interesGotov()) { clearInterval(taymer); return; }   // затова има таван
      var st = sesiya();
      st.vidimo = (st.vidimo || 0) + delta;
      zapishi(st);
      if (st.vidimo >= CEL) { clearInterval(taymer); interest(); }
    }, 1000);
  })();

  /* ── половината от страницата ──
     Процентът сам по себе си не е надежден: на къса страница едно плъзване
     с пръст минава половината, а страница, която се побира в екрана, изобщо
     няма скрол. Затова искаме и двете — половината от превъртаемото и поне
     600 px изминати, — а страниците без достатъчно скрол ги оставяме на
     останалите сигнали. */
  (function () {
    var maks = 0;
    addEventListener('scroll', function () {
      var d = document.documentElement;
      var prevartaemo = d.scrollHeight - innerHeight;
      if (prevartaemo < 400) return;
      var y = window.scrollY || d.scrollTop || 0;
      if (y <= maks) return;
      maks = y;
      if (y >= prevartaemo * 0.5 && y >= 600) interest();
    }, { passive: true });
  })();

  /* ── втора страница в посещението ──
     Който отвори втора страница, не е случаен минувач. Това е единственият
     сигнал, който не зависи нито от дължината на страницата, нито от
     устройството, нито от това колко бързо чете човекът. Броят се различни
     адреси, за да не мине презареждане за втора страница. */
  (function () {
    var st = sesiya();
    if (!st.pati) st.pati = [];
    if (st.pati.indexOf(location.pathname) < 0 && st.pati.length < 3)
      st.pati.push(location.pathname);
    zapishi(st);
    if (st.pati.length >= 2) interest();
  })();

  /* ── заявката е изпратена ──
     „Благодарим“ се вижда само след успешно изпращане на формата и е noindex,
     тоест никой не идва там от търсачка. Това е истинската конверсия. */
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
