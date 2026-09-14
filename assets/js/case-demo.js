// Demo interactivo de cada caso (Hojaldito / Al Natural / SENA): mini
// prototipo pantalla por pantalla dentro de un frame tipo navegador. Elegir
// un camino marca la opción y avanza pantalla por pantalla (como alguien
// recorriendo el producto real) hasta una confirmación final; "elegir otro
// camino" vuelve al punto de partida.
// Compartido entre index.html (modales de caso) y cada trabajo/*/index.html
// (la experiencia embebida dentro del caso completo) para no duplicar el
// contenido de los recorridos en dos archivos.
var CASE_DEMOS = {
  hojaldre: {
    choices: [
      { path:'tienda', label:'Vender en mi negocio', desc:'Tengo un establecimiento y quiero incorporar Hojaldito a mi oferta.' },
      { path:'socio', label:'Ser Socio Ganador', desc:'Puedo abrir nuevas oportunidades y conseguir otros puntos de distribución.' }
    ],
    paths: {
      tienda: {
        screens: [
          { label:'Catálogo mayorista', desc:'Precios por volumen y disponibilidad según tu zona.' },
          { label:'Calcula tu margen', desc:'Simulador de ganancia según cuánto quieras vender.' },
          { label:'Confirma pedido', desc:'Cantidad, ciudad y datos de contacto.' }
        ],
        success:{ title:'✓ Pedido enviado', text:'Hojaldito recibe negocio, cantidad y ciudad, listo para coordinar la entrega.' }
      },
      socio: {
        screens: [
          { label:'Zona disponible', desc:'Mapa de zonas libres para abrir un nuevo punto.' },
          { label:'Comisión estimada', desc:'Cálculo de comisión según el volumen proyectado.' },
          { label:'Agenda llamada', desc:'Elige un horario para hablar con el equipo comercial.' }
        ],
        success:{ title:'✓ Solicitud enviada', text:'Hojaldito recibe zona, contacto y disponibilidad, listo para agendar la llamada.' }
      }
    }
  },
  'al-natural': {
    choices: [
      { path:'despensa', label:'Quiero armar mi despensa', desc:'Estoy comprando desde la web, sin haber visitado el local.' },
      { path:'qr', label:'Estoy en el local, vi el QR', desc:'Ya estoy en el establecimiento y quiero pedir o reservar.' }
    ],
    paths: {
      despensa: {
        screens: [
          { label:'Pregunta', desc:'"¿Qué quieres lograr hoy?" — arma tu despensa.' },
          { label:'Respuesta', desc:'Eliges qué tipo de productos buscas.' },
          { label:'Producto disponible', desc:'Solo se muestra lo que hay en inventario ahora mismo.' },
          { label:'Agregar', desc:'Se suma al pedido sin salir de la conversación.' }
        ],
        success:{ title:'✓ Pedido armado', text:'6 productos disponibles añadidos, solo lo que Al Natural puede entregar hoy.' }
      },
      qr: {
        screens: [
          { label:'Escanea QR', desc:'El código está en la mesa del local.' },
          { label:'Ver la carta', desc:'Mismo catálogo que la tienda online, adaptado a estar ahí.' },
          { label:'Pedir o reservar', desc:'Sin llamar a un mesero ni escribir por WhatsApp.' }
        ],
        success:{ title:'✓ Pedido enviado a cocina', text:'Mesa 4: el mismo sistema que usa la tienda online, ahora desde el local.' }
      }
    }
  },
  sena: {
    choices: [
      { path:'producto', label:'Busco un producto', desc:'Quiero encontrar algo puntual que produzca un Centro cercano.' },
      { path:'organizacion', label:'Represento una organización', desc:'Busco un volumen mayor o una alianza con un Centro.' }
    ],
    paths: {
      producto: {
        screens: [
          { label:'Descubre oferta cercana', desc:'Ubicación aproximada para mostrar Centros cerca.' },
          { label:'Personaliza por ubicación', desc:'Filtra por lo que produce cada Centro.' },
          { label:'Elige Centro', desc:'Selecciona el Centro que tiene lo que buscas.' }
        ],
        success:{ title:'✓ Solicitud enviada', text:'El Centro de Formación Agroindustrial recibe la solicitud y coordina la entrega directamente.' }
      },
      organizacion: {
        screens: [
          { label:'Busca oferta por volumen', desc:'Filtra por capacidad de producción, no solo por producto.' },
          { label:'Contacta al Centro', desc:'Envía los detalles de lo que necesita tu organización.' },
          { label:'Coordina entrega', desc:'El Centro responde directamente, sin pasar por un intermediario.' }
        ],
        success:{ title:'✓ Solicitud enviada', text:'El Centro recibe el contacto y coordina la alianza directamente, sin pasar por un catálogo genérico.' }
      }
    }
  }
};

function caseDemoSwap(demoEl, html){
  var screen = demoEl.querySelector('[data-demo-screen]');
  if (!screen) return;
  screen.classList.add('fade');
  setTimeout(function(){
    screen.innerHTML = html;
    screen.classList.remove('fade');
  }, 180);
}

function caseDemoProgressHTML(total, current){
  var out = '<div class="demo-progress">';
  for (var i = 0; i < total; i++) {
    out += '<span class="' + (i < current ? 'done' : i === current ? 'active' : '') + '"><i></i></span>';
  }
  return out + '</div>';
}

function renderCaseDemoChoices(demoEl, cfg){
  var html = '<div class="demo-choice-list">';
  cfg.choices.forEach(function(c){
    html += '<button type="button" class="demo-choice" data-demo-path="' + c.path + '"><strong>' + c.label + '</strong><small>' + c.desc + '</small></button>';
  });
  html += '</div>';
  caseDemoSwap(demoEl, html);
  var back = demoEl.querySelector('.demo-restart');
  if (back) back.hidden = true;
}

function renderCaseDemoScreen(demoEl, cfg, path, idx){
  var screens = cfg.paths[path].screens;
  if (idx >= screens.length) { renderCaseDemoSuccess(demoEl, cfg, path); return; }
  var s = screens[idx];
  var isLast = idx === screens.length - 1;
  var html = caseDemoProgressHTML(screens.length, idx);
  html += '<div class="demo-step-label">Paso ' + (idx + 1) + ' de ' + screens.length + '</div>';
  html += '<h4 class="demo-screen-title">' + s.label + '</h4>';
  html += '<p class="demo-screen-desc">' + s.desc + '</p>';
  html += '<button type="button" class="demo-continue" data-demo-next="' + path + '" data-demo-idx="' + (idx + 1) + '">' + (isLast ? 'Ver confirmación' : 'Continuar') + ' →</button>';
  caseDemoSwap(demoEl, html);
}

function renderCaseDemoSuccess(demoEl, cfg, path){
  var s = cfg.paths[path].success;
  var html = '<div class="success-card"><strong>' + s.title + '</strong><p>' + s.text + '</p></div>';
  caseDemoSwap(demoEl, html);
  var back = demoEl.querySelector('.demo-restart');
  if (back) back.hidden = false;
}

document.querySelectorAll('[data-case-demo]').forEach(function(demoEl){
  var url = demoEl.querySelector('.demo-url');
  if (url) url.textContent = demoEl.dataset.demoUrl || '';
  var cfg = CASE_DEMOS[demoEl.dataset.caseDemo];
  if (cfg) renderCaseDemoChoices(demoEl, cfg);
});

document.addEventListener('click', function(e){
  const pick = e.target.closest('.demo-choice[data-demo-path]');
  if (pick) {
    const demoEl = pick.closest('[data-case-demo]');
    if (!demoEl) return;
    const cfg = CASE_DEMOS[demoEl.dataset.caseDemo];
    if (!cfg) return;
    pick.classList.add('is-selected');
    demoEl.querySelectorAll('.demo-choice').forEach(function(b){ b.disabled = true; });
    const path = pick.dataset.demoPath;
    setTimeout(function(){ renderCaseDemoScreen(demoEl, cfg, path, 0); }, 260);
    return;
  }
  const next = e.target.closest('[data-demo-next]');
  if (next) {
    const demoEl = next.closest('[data-case-demo]');
    if (!demoEl) return;
    const cfg = CASE_DEMOS[demoEl.dataset.caseDemo];
    if (!cfg) return;
    renderCaseDemoScreen(demoEl, cfg, next.dataset.demoNext, parseInt(next.dataset.demoIdx, 10) || 0);
    return;
  }
  const back = e.target.closest('[data-demo-back]');
  if (back) {
    const demoEl = back.closest('[data-case-demo]');
    if (!demoEl) return;
    const cfg = CASE_DEMOS[demoEl.dataset.caseDemo];
    if (!cfg) return;
    renderCaseDemoChoices(demoEl, cfg);
  }
});
