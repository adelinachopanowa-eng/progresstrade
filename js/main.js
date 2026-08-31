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
            if (window.ptKanal) window.ptKanal('zapitvane', 'zapitvane', { forma: f.getAttribute('data-forma') || 'zayavka' });
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


/* ── Измерване: фуния от посещение до контакт ──────────────────────────────

   Стъпките са вложени: всяка по-долна включва принудително по-горната.
   Иначе се получават абсурди — повече опити за контакт, отколкото заинтересовани.

     1. session_start        Google, вградено
     2. ангажирана сесия     Google, вградено (10 сек / 2 стр. / конверсия)
     3. interes              наше, веднъж на посещение
     4. kontakt_opit         наше, веднъж на посещение
     5. по канал             zapitvane, telefon_unikalen, viber_unikalen,
                             upatvane_unikalno, imeyl_unikalen

   Диагностика извън фунията (не се дедуплицира, показва кой бутон работи):
     telefon_klik, nomer_kopiran, viber_klik, imeyl_klik, upatvane_klik, adres_kopiran
     nomer_viden — знаменателят: колко души изобщо са видели номера

   Уникалността е в прозорец от 30 минути без активност — толкова е и сесията
   при Google. Паметта на раздела не става: който затвори и се върне след 5 минути,
   за Google е същата сесия, а за нас щеше да е нов човек. */
(function () {
  var TEL = '877775577';                 // без код на държава и водеща нула
  var ADRES = 'иван георгов';
  var PROZOREC = 30 * 60 * 1000;         // 30 минути
  var KLYUCH = 'pt_ev';

  function pratiI(name, params) {
    if (typeof gtag !== 'function') return;
    gtag('event', name, Object.assign({
      stranica: location.pathname,
      ustroystvo: matchMedia('(pointer:coarse)').matches ? 'mobilen' : 'desktop',
      transport_type: 'beacon'
    }, params || {}));
  }
  window.ptTrack = pratiI;
  window.ptKanal = function (name, kanal, params) { kanalUnikalen(name, kanal, params); };

  /* Веднъж на посещение. Връща true само първия път в рамките на прозореца. */
  function vednaj(name) {
    var now = Date.now(), st = {};
    try { st = JSON.parse(localStorage.getItem(KLYUCH) || '{}'); } catch (e) { st = {}; }
    if (st.t && now - st.t > PROZOREC) st = {};   // прозорецът е изтекъл — нова сесия
    st.t = now;
    if (st[name]) { save(st); return false; }
    st[name] = 1; save(st); return true;
    function save(o) { try { localStorage.setItem(KLYUCH, JSON.stringify(o)); } catch (e) {} }
  }

  function interes(povod) {
    if (vednaj('interes')) pratiI('interes', { povod: povod });
  }
  function kontakt(kanal) {
    interes('kontakt');                            // контактът винаги значи интерес
    if (vednaj('kontakt_opit')) pratiI('kontakt_opit', { kanal: kanal });
  }
  function kanalUnikalen(name, kanal, params) {
    kontakt(kanal);
    if (vednaj(name)) pratiI(name, params);
  }

  /* ── кликове ── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a) {
      var href = a.getAttribute('href') || '';
      var mqsto = a.getAttribute('data-tel') || 'stranica';
      if (href.indexOf('tel:') === 0) {
        pratiI('telefon_klik', { mqsto: mqsto });
        kanalUnikalen('telefon_unikalen', 'telefon', { mqsto: mqsto });
      } else if (href.indexOf('viber:') === 0) {
        pratiI('viber_klik', { mqsto: mqsto });
        kanalUnikalen('viber_unikalen', 'viber', { mqsto: mqsto });
      } else if (href.indexOf('mailto:') === 0) {
        pratiI('imeyl_klik', { mqsto: mqsto });
        kanalUnikalen('imeyl_unikalen', 'imeyl', { mqsto: mqsto });
      } else if (href.indexOf('maps.app.goo.gl') > -1 || href.indexOf('google.com/maps') > -1) {
        pratiI('upatvane_klik', { mqsto: mqsto });
        kanalUnikalen('upatvane_unikalno', 'upatvane', { mqsto: mqsto });
      }
      return;
    }
    /* Отваряне на въпрос от ЧЗВ — човекът има конкретен въпрос. */
    var s = e.target.closest && e.target.closest('.faq-item summary');
    if (s && !s.parentElement.open) interes('chzv');
  }, { passive: true });

  /* ── копиране на номера или адреса ── */
  document.addEventListener('copy', function () {
    var sel = (window.getSelection() + '');
    if (sel.replace(/\D/g, '').indexOf(TEL) > -1) {
      pratiI('nomer_kopiran');
      kanalUnikalen('telefon_unikalen', 'telefon', { mqsto: 'kopirane' });
    } else if (sel.toLowerCase().indexOf(ADRES) > -1) {
      pratiI('adres_kopiran');
      kontakt('adres');
    }
  });

  /* ── видян ли е изобщо номерът ──
     Без този знаменател telefon_klik не значи нищо: 5 клика при 50 души,
     видели номера, е друго нещо от 5 клика при 500. Праща се веднъж на
     посещение, при поне половин секунда в полезрението. */
  if ('IntersectionObserver' in window) {
    var teli = document.querySelectorAll('a[href^="tel:"]');
    if (teli.length) {
      var tajmer = null;
      var vio = new IntersectionObserver(function (entries) {
        var vidim = entries.some(function (e) { return e.isIntersecting; });
        if (vidim && !tajmer) {
          tajmer = setTimeout(function () {
            if (vednaj('nomer_viden')) pratiI('nomer_viden', { broi: teli.length });
            vio.disconnect();
          }, 500);
        } else if (!vidim && tajmer) {
          clearTimeout(tajmer); tajmer = null;
        }
      }, { threshold: 0.5 });
      [].forEach.call(teli, function (el) { vio.observe(el); });
    }
  }

  /* ── калкулаторът: човекът смята парите си ── */
  document.querySelectorAll('.calc select, .calc input').forEach(function (el) {
    el.addEventListener('change', function () { interes('kalkulator'); }, { once: true });
  });

  /* ── страници с цена: скрол до 60% и втора такава страница ── */
  var cenova = /^\/(ceni|izkupuvane\/[^/]+)\/$/.test(location.pathname);
  if (cenova) {
    var broi = 0;
    try { broi = +(sessionStorage.getItem('pt_cen') || 0); } catch (e) {}
    try { sessionStorage.setItem('pt_cen', broi + 1); } catch (e) {}
    if (broi + 1 >= 2) interes('vtora_cenova');
    var skrol = false;
    addEventListener('scroll', function () {
      if (skrol) return;
      var d = document.documentElement;
      var p = (scrollY + innerHeight) / d.scrollHeight;
      if (p >= 0.6) { skrol = true; interes('skrol_cena'); }
    }, { passive: true });
  }

  /* ── задържане над 10 секунди; таймерът спира при скрит раздел ── */
  var spent = 0, last = Date.now(), fired = false, t = setInterval(function () {
    if (document.visibilityState === 'visible') spent += Date.now() - last;
    last = Date.now();
    if (!fired && spent >= 10000) { fired = true; clearInterval(t); pratiI('zadarzhane_10s'); }
  }, 1000);
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
    if (window.ptTrack) window.ptTrack('otpusk_lenta');
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
    if (window.ptTrack) window.ptTrack(vOtpusk ? 'otpusk_izvestie' : 'izvan_rabotno_vreme');
  }
})();
