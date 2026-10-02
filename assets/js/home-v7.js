/* home-v7.js — pestañas de "Pruébalo": cada tipo de negocio muestra su experiencia y su foto. */
(function () {
  var tabs = document.querySelectorAll('.dc-tabs [data-tab]');
  if (!tabs.length) return;
  var picks = document.querySelectorAll('.dc-pick[data-panel]');
  var panels = document.querySelectorAll('.tp[data-panel]');

  function show(key) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === key;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    picks.forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-panel') === key); });
    panels.forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-panel') === key); });
    if (typeof trackEvent === 'function') trackEvent('home_tab', { tab: key });
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var key = t.getAttribute('data-tab');
      show(key);
      try { sessionStorage.setItem('home_tab', key); } catch (e) {}
    });
  });

  // Al volver de una experiencia (X) se muestra la pestaña del negocio que se estaba viviendo.
  var wanted = null;
  try { wanted = new URLSearchParams(location.search).get('tab') || sessionStorage.getItem('home_tab'); } catch (e) {}
  if (wanted && document.querySelector('.dc-tabs [data-tab="' + wanted + '"]')) show(wanted);
})();


/* Menú móvil, barra fija "Hablemos / WhatsApp" y teclado en las pestañas. */
(function () {
  var menu = document.querySelector('.dc-menu'), nav = document.getElementById('dcNav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.textContent = open ? 'Cerrar' : 'Menú';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.textContent = 'Menú'; }
    });
  }

  var bar = document.getElementById('dcSticky'), end = document.getElementById('diagnostico');
  if (bar && end && 'IntersectionObserver' in window) {
    var pastHero = false, atEnd = false;
    var sync = function () {
      var show = pastHero && !atEnd;
      bar.classList.toggle('show', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
      bar.querySelectorAll('a').forEach(function (a) { a.tabIndex = show ? 0 : -1; });
    };
    var hero = document.querySelector('.dc-hero');
    new IntersectionObserver(function (en) { pastHero = !en[0].isIntersecting; sync(); }).observe(hero);
    new IntersectionObserver(function (en) { atEnd = en[0].isIntersecting; sync(); }, { threshold: 0.15 }).observe(end);
  }

  var list = document.querySelector('.dc-tabs');
  if (list) {
    list.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var tabs = Array.prototype.slice.call(list.querySelectorAll('[data-tab]'));
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      n.focus(); n.click(); e.preventDefault();
    });
  }
})();
