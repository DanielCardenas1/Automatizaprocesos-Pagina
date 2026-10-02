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
    t.addEventListener('click', function () { show(t.getAttribute('data-tab')); });
  });
})();
