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
