/* ============================================================
   LA EXPERIENCIA — motor del recorrido interactivo de entrada.
   Arquitectura: cada categoria de negocio es un arbol de datos
   independiente (EXP_CATEGORIES.<id>.flows). El motor (goto/render)
   es generico — agregar Comidas, Inmobiliaria o Servicios despues
   solo requiere escribir su arbol de flows, sin tocar el motor.
   Solo Veterinaria esta completo en esta primera version.
   ============================================================ */
(function(){
  'use strict';
  var overlay = document.getElementById('expOverlay');
  if(!overlay) return;

  var state = { screen:'gate', category:null, ctx:{} };

  /* ---------------- categorias ---------------- */
  var CATEGORIES = [
    {id:'veterinaria', icon:'🐾', label:'Veterinaria', asClient:'de una veterinaria', ready:true},
    {id:'comidas', icon:'🍽️', label:'Comidas', asClient:'de un negocio de comidas', ready:false},
    {id:'inmobiliaria', icon:'🏠', label:'Inmobiliaria', asClient:'de una inmobiliaria', ready:false},
    {id:'servicios', icon:'📋', label:'Servicios / Asesoría', asClient:'de un negocio de servicios', ready:false}
  ];
  function catById(id){ return CATEGORIES.filter(function(c){return c.id===id})[0]; }

  /* ---------------- pantallas compartidas (no dependen de categoria) ---------------- */
  var SCREENS = {};

  SCREENS['gate'] = {
    layout:'wide',
    render:function(){
      return wideScreen({
        title:'Hola, me alegra que estés aquí.',
        sub:'¿Qué quieres hacer?',
        options:[
          opt({label:'Vivir la experiencia', sub:'Entra como cliente real de un negocio.', go:'intro-question', primary:true}),
          opt({label:'Conocer el sitio', sub:'Explora el trabajo de Daniel Cárdenas.', action:'dismiss'})
        ]
      });
    }
  };

  SCREENS['intro-question'] = {
    layout:'wide',
    render:function(){
      return wideScreen({
        kicker:'Antes de empezar',
        title:'¿Sabes qué es una experiencia?',
        options:[
          opt({label:'Sí', go:'category-picker'}),
          opt({label:'No', go:'story-1'})
        ]
      });
    }
  };

  SCREENS['story-1'] = {
    layout:'wide',
    render:function(){
      return wideScreen({
        kicker:'Antes',
        title:'Los negocios tradicionalmente tenían esto:',
        extra:
          '<div class="exp-flow-visual"><span>Página</span><i>→</i><span>Servicios</span><i>→</i><span>Información</span><i>→</i><span>Contacto</span></div>' +
          '<p class="exp-sub">El cliente tenía que: buscar → leer → entender → preguntar → decidir.</p>',
        options:[ opt({label:'Continuar →', go:'story-2', primary:true}) ]
      });
    }
  };

  SCREENS['story-2'] = {
    layout:'wide',
    render:function(){
      return wideScreen({
        kicker:'Ahora',
        title:'Las personas llegan con una necesidad.',
        sub:'No necesariamente quieren leer todo el negocio. Quieren conseguir algo. La experiencia debe guiarlas.',
        extra:
          '<p class="exp-note">Ahora las personas esperan algo diferente. No necesitan aprender cómo funciona tu negocio — necesitan conseguir lo que vinieron a buscar.</p>',
        options:[ opt({label:'Vamos a vivirlo →', go:'category-picker', primary:true}) ]
      });
    }
  };

  SCREENS['category-picker'] = {
    layout:'wide',
    render:function(){
      var grid = '<div class="exp-cat-grid">' + CATEGORIES.map(function(c){
        return '<button type="button" class="exp-cat' + (c.ready?'':' is-soon') + '" data-exp-cat="' + c.id + '"><i>' + c.icon + '</i><strong>' + c.label + '</strong></button>';
      }).join('') + '</div>';
      return wideScreen({
        kicker:'Tu turno',
        title:'¿Qué negocio se parece más al tuyo?',
        extra:grid
      });
    }
  };

  SCREENS['coming-soon'] = {
    layout:'wide',
    render:function(){
      return wideScreen({
        kicker:'Por ahora',
        title:'Esta experiencia la estamos construyendo.',
        sub:'Vive la de Veterinaria — ya funciona completa, de principio a fin.',
        options:[
          opt({label:'Probar Veterinaria →', go:'__cat_veterinaria', primary:true}),
          opt({label:'Conocer el sitio', action:'dismiss'})
        ]
      });
    }
  };

  SCREENS['transition'] = {
    layout:'wide',
    render:function(){
      var cat = catById(state.category);
      var phrase = cat ? cat.asClient : 'de ese negocio';
      return wideScreen({
        title:'Perfecto. Ahora vas a entrar como cliente <em>' + phrase + '</em>.',
        sub:'Mira cómo cambia el recorrido.',
        extra:
          '<div class="exp-compare">' +
            '<div class="exp-compare-col is-before"><b>Antes</b><ul><li>Inicio</li><li>Servicios</li><li>Nosotros</li><li>Contacto</li></ul></div>' +
            '<div class="exp-compare-col is-after"><b>Ahora</b>' +
              '<span class="exp-pill">Lo que necesitas</span><span class="exp-pill">En segundos</span><span class="exp-pill">Sin explicaciones</span>' +
            '</div>' +
          '</div>',
        options:[ opt({label:'Entrar →', go:'client-home', primary:true}) ]
      });
    }
  };

  SCREENS['revelation'] = {
    layout:'wide',
    render:function(){
      return wideScreen({
        title:'¿Te diste cuenta de lo que acabas de hacer?',
        options:[ opt({label:'Sí, continuar →', go:'revelation-2', primary:true}) ]
      });
    }
  };

  SCREENS['revelation-2'] = {
    layout:'wide',
    render:function(){
      return wideScreen({
        title:'Acabas de vivir una experiencia diseñada para un cliente real.',
        sub:'No diseñé una página. Diseñé el camino que acabas de recorrer.',
        extra:
          '<div class="exp-method">Entender<i>→</i>Detectar<i>→</i>Diseñar<i>→</i>Construir<i>→</i>Mejorar</div>' +
          '<p class="exp-brand-line">Diseño lo que pasa entre tu negocio y tus clientes.</p>',
        options:[ opt({label:'Ver casos reales →', go:'cases', primary:true}) ]
      });
    }
  };

  SCREENS['cases'] = {
    layout:'wide',
    render:function(){
      var cases = [
        {href:'trabajo/hojaldito/', name:'Hojaldito', line:'Del interés a una oportunidad comercial.'},
        {href:'trabajo/al-natural/', name:'Al Natural', line:'Del descubrimiento a la compra.'},
        {href:'trabajo/sena-vitrina/', name:'SENA Vitrina', line:'De la oferta a la solicitud.'},
        {href:'index.html#casos', name:'Brice', line:'De una necesidad a una reserva.'}
      ];
      var list = '<div class="exp-cases">' + cases.map(function(c){
        return '<a class="exp-case" href="' + c.href + '" target="_blank" rel="noopener"><span><strong>' + c.name + '</strong><span>' + c.line + '</span></span><b>→</b></a>';
      }).join('') + '</div>';
      return wideScreen({
        kicker:'Evidencia',
        title:'Esto ya pasó con negocios reales.',
        extra:list,
        options:[ opt({label:'Continuar →', go:'reposition', primary:true}) ]
      });
    }
  };

  SCREENS['reposition'] = {
    layout:'wide',
    render:function(){
      return wideScreen({
        title:'Ahora imagina esto en tu negocio.',
        sub:'Tu cliente llega. ¿Qué debería poder hacer sin que tú tengas que explicárselo?',
        extra:
          '<textarea class="exp-textarea" id="expClientsWant" placeholder="Quiero que mis clientes puedan...">' + (state.ctx.clientsWant||'') + '</textarea>' +
          '<button type="button" class="exp-btn exp-btn-primary" data-exp-action="handoff">Quiero hablar con Daniel <span>→</span></button>'
      });
    }
  };

  /* ---------------- helpers de render ---------------- */
  function esc(s){ return (s||'').replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function opt(o){
    var cls = 'exp-opt' + (o.primary?' exp-opt-primary':'');
    var attr = o.go ? ' data-exp-go="' + o.go + '"' : (o.action ? ' data-exp-action="' + o.action + '"' : '');
    return '<button type="button" class="' + cls + '"' + attr + '><span><strong>' + o.label + '</strong>' + (o.sub?('<span>'+o.sub+'</span>'):'') + '</span><b>→</b></button>';
  }
  function wideScreen(o){
    return '' +
      '<div class="exp-frame exp-wide">' +
        (o.kicker ? '<p class="exp-kicker">' + o.kicker + '</p>' : '') +
        '<h1 class="exp-title">' + o.title + '</h1>' +
        (o.sub ? '<p class="exp-sub">' + o.sub + '</p>' : '') +
        (o.extra || '') +
        (o.options ? '<div class="exp-options">' + o.options.join('') + '</div>' : '') +
      '</div>';
  }
  function phoneScreen(inner, headLabel, headStatus){
    return '' +
      '<div class="exp-frame exp-phone-wrap"><div class="exp-phone">' +
        '<div class="exp-phone-head"><span class="exp-phone-dot"></span><div><strong>' + (headLabel||'') + '</strong><small>' + (headStatus||'en línea') + '</small></div></div>' +
        '<div class="exp-phone-body">' + inner + '</div>' +
      '</div></div>';
  }
  function phoneChoice(o){
    var attr = o.go ? ' data-exp-go="' + o.go + '"' : (o.action ? ' data-exp-action="' + o.action + '"' : '');
    return '<button type="button" class="exp-phone-choice"' + attr + '><span class="exp-emoji">' + o.icon + '</span><span>' + o.label + '</span><b>→</b></button>';
  }

  /* ---------------- Veterinaria — arbol completo ---------------- */
  var VET_BRAND = 'Clínica Huellas';
  var VET_INFO = [
    ['Historial','Sin novedades recientes'],
    ['Alimentación','Croqueta adulto · ración media'],
    ['Medicamentos','Ninguno activo'],
    ['Vacunas','Al día · próxima en 4 meses'],
    ['Próxima cita','No tiene agendada']
  ];

  SCREENS['client-home'] = {
    layout:'phone',
    render:function(){
      var inner =
        '<p class="exp-phone-greeting">Hola 👋<br>¿En qué podemos ayudarte?</p>' +
        '<div class="exp-phone-choices">' +
          phoneChoice({icon:'🐾', label:'Quiero saber sobre mi mascota', go:'pet-select'}) +
          phoneChoice({icon:'📅', label:'Quiero agendar', go:'agendar-motivo'}) +
          phoneChoice({icon:'🩺', label:'Tengo una pregunta', go:'pregunta'}) +
          phoneChoice({icon:'🚨', label:'Tengo una emergencia', go:'emergencia'}) +
          phoneChoice({icon:'👋', label:'Ya soy cliente', go:'client-id'}) +
          phoneChoice({icon:'ℹ️', label:'Quiero conocerlos', go:'conocerlos'}) +
        '</div>';
      return phoneScreen(inner, VET_BRAND);
    }
  };

  SCREENS['pet-select'] = {
    layout:'phone',
    render:function(){
      var inner =
        '<p class="exp-phone-kicker">Identificar mascota</p>' +
        '<p class="exp-phone-greeting" style="font-size:17px">¿De quién quieres consultar información?</p>' +
        '<div class="exp-phone-choices">' + phoneChoice({icon:'🐶', label:'Toby', go:'pet-hub'}) + '</div>';
      return phoneScreen(inner, VET_BRAND);
    }
  };

  SCREENS['client-id'] = {
    layout:'phone',
    render:function(){
      var inner =
        '<p class="exp-phone-kicker">Ya soy cliente</p>' +
        '<p class="exp-phone-greeting" style="font-size:17px">Perfecto. Identifiquemos a tu mascota.</p>' +
        '<input class="exp-phone-input" id="expPetId" placeholder="Ej. TOBY774">' +
        '<p class="exp-phone-hint">Escribe cualquier código — esto es una demostración.</p>' +
        '<button type="button" class="exp-btn exp-btn-primary" data-exp-action="petIdGo">Continuar <span>→</span></button>';
      return phoneScreen(inner, VET_BRAND);
    }
  };

  SCREENS['pet-hub'] = {
    layout:'phone',
    render:function(){
      var rows = VET_INFO.map(function(r){ return '<div class="exp-phone-card-row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('');
      var inner =
        '<p class="exp-phone-greeting">Hola, Toby 👋</p>' +
        '<div class="exp-phone-card">' + rows + '</div>' +
        '<p class="exp-phone-kicker">¿Qué quieres hacer?</p>' +
        '<div class="exp-phone-choices">' +
          phoneChoice({icon:'🍖', label:'Pedir su comida', action:'petAction:food'}) +
          phoneChoice({icon:'💊', label:'Pedir medicamento', action:'petAction:med'}) +
          phoneChoice({icon:'📅', label:'Agendar control', action:'petAction:control'}) +
          phoneChoice({icon:'🚨', label:'Tengo una emergencia', go:'emergencia'}) +
        '</div>';
      return phoneScreen(inner, VET_BRAND);
    }
  };

  var AGENDAR_MOTIVOS = ['Control general','Vacunación','Consulta por síntoma','Otro'];
  SCREENS['agendar-motivo'] = {
    layout:'phone',
    render:function(){
      var inner =
        '<p class="exp-phone-kicker">Agendar · motivo</p>' +
        '<p class="exp-phone-greeting" style="font-size:17px">¿Cuál es el motivo de la cita?</p>' +
        '<div class="exp-phone-choices">' + AGENDAR_MOTIVOS.map(function(m){
          return phoneChoice({icon:'📝', label:m, action:'agendarMotivo:'+m});
        }).join('') + '</div>';
      return phoneScreen(inner, VET_BRAND);
    }
  };

  var AGENDAR_DIAS = ['Esta semana','La próxima semana','Lo antes posible'];
  SCREENS['agendar-disponibilidad'] = {
    layout:'phone',
    render:function(){
      var inner =
        '<p class="exp-phone-kicker">Agendar · disponibilidad</p>' +
        '<p class="exp-phone-greeting" style="font-size:17px">¿Qué día te queda mejor?</p>' +
        '<div class="exp-phone-choices">' + AGENDAR_DIAS.map(function(d){
          return phoneChoice({icon:'🗓️', label:d, action:'agendarDia:'+d});
        }).join('') + '</div>';
      return phoneScreen(inner, VET_BRAND);
    }
  };

  var AGENDAR_HORAS = ['9:00 a. m.','11:00 a. m.','2:00 p. m.','4:00 p. m.'];
  SCREENS['agendar-horario'] = {
    layout:'phone',
    render:function(){
      var inner =
        '<p class="exp-phone-kicker">Agendar · horario</p>' +
        '<p class="exp-phone-greeting" style="font-size:17px">Elige un horario disponible</p>' +
        '<div class="exp-phone-choices">' + AGENDAR_HORAS.map(function(h){
          return phoneChoice({icon:'⏰', label:h, action:'agendarHora:'+h});
        }).join('') + '</div>';
      return phoneScreen(inner, VET_BRAND);
    }
  };

  var PREGUNTA_TEMAS = ['Precios','Un servicio','Mi mascota','Otro'];
  SCREENS['pregunta'] = {
    layout:'phone',
    render:function(){
      var inner =
        '<p class="exp-phone-kicker">Tengo una pregunta</p>' +
        '<p class="exp-phone-greeting" style="font-size:17px">¿Sobre qué es tu pregunta?</p>' +
        '<div class="exp-phone-choices">' + PREGUNTA_TEMAS.map(function(t){
          return phoneChoice({icon:'💬', label:t, action:'preguntaTema:'+t});
        }).join('') + '</div>';
      return phoneScreen(inner, VET_BRAND);
    }
  };

  SCREENS['emergencia'] = {
    layout:'phone',
    render:function(){
      var inner =
        '<p class="exp-phone-kicker">Emergencia</p>' +
        '<p class="exp-phone-greeting" style="font-size:19px">Esto se atiende de inmediato.</p>' +
        '<p style="font-size:12.5px;color:#b9b4a9;line-height:1.6;margin:0 0 16px">Cuéntanos qué pasa y te conectamos ahora mismo con el equipo de turno.</p>' +
        '<div class="exp-phone-choices">' +
          phoneChoice({icon:'📞', label:'Llamar ahora', action:'emergencia:llamar'}) +
          phoneChoice({icon:'💬', label:'Escribir por WhatsApp', action:'emergencia:whatsapp'}) +
        '</div>';
      return phoneScreen(inner, VET_BRAND, 'urgente');
    }
  };

  SCREENS['conocerlos'] = {
    layout:'phone',
    render:function(){
      var inner =
        '<p class="exp-phone-kicker">Sobre nosotros</p>' +
        '<p class="exp-phone-greeting" style="font-size:18px">Somos un equipo de veterinarios enfocado en que tu mascota (y tú) tengan menos vueltas que dar.</p>' +
        '<div class="exp-phone-card">' +
          '<div class="exp-phone-card-row"><span>Equipo</span><b>4 veterinarios</b></div>' +
          '<div class="exp-phone-card-row"><span>Ubicación</span><b>A 10 min de ti</b></div>' +
          '<div class="exp-phone-card-row"><span>Servicios</span><b>Consulta, vacunación, urgencias</b></div>' +
        '</div>' +
        '<button type="button" class="exp-btn exp-btn-primary" data-exp-go="agendar-motivo">Quiero agendar <span>→</span></button>';
      return phoneScreen(inner, VET_BRAND);
    }
  };

  SCREENS['result'] = {
    layout:'phone',
    render:function(){
      var r = state.ctx.result || {title:'Listo', sub:'Tu solicitud fue enviada.'};
      var inner =
        '<div class="exp-phone-result">' +
          '<div class="exp-phone-check">✓</div>' +
          '<h3>' + r.title + '</h3>' +
          '<p>' + r.sub + '</p>' +
        '</div>' +
        '<div class="exp-phone-foot"><button type="button" class="exp-btn exp-btn-primary" data-exp-go="revelation">Continuar <span>→</span></button></div>';
      return phoneScreen(inner, VET_BRAND);
    }
  };

  /* ---------------- acciones especificas (no son solo navegacion) ---------------- */
  var ACTIONS = {
    dismiss: function(){ leaveTo('index.html'); },

    selectCategoryFromComing: function(){},

    petIdGo: function(){ goto('pet-hub'); },

    'petAction:food': function(){ showResult('Pedido enviado', 'Tu pedido de alimento para Toby fue enviado a la clínica. Te avisarán cuando esté listo para recoger.'); },
    'petAction:med': function(){ showResult('Pedido enviado', 'El medicamento de Toby quedó solicitado. La clínica te confirma disponibilidad por WhatsApp.'); },
    'petAction:control': function(){ state.ctx.motivo='Control de Toby'; goto('agendar-disponibilidad'); },

    'emergencia:llamar': function(){ showResult('Te conectamos con el equipo', 'Un miembro del equipo de turno te contacta de inmediato.'); },
    'emergencia:whatsapp': function(){ showResult('Solicitud enviada', 'Tu emergencia fue enviada por WhatsApp. El equipo de turno te responde en el momento.'); },

    handoff: function(){ handoffToContact(); }
  };
  // motivo / dia / hora de agendar y tema de pregunta se resuelven dinamicamente:
  AGENDAR_MOTIVOS.forEach(function(m){ ACTIONS['agendarMotivo:'+m] = function(){ state.ctx.motivo=m; goto('agendar-disponibilidad'); }; });
  AGENDAR_DIAS.forEach(function(d){ ACTIONS['agendarDia:'+d] = function(){ state.ctx.dia=d; goto('agendar-horario'); }; });
  AGENDAR_HORAS.forEach(function(h){ ACTIONS['agendarHora:'+h] = function(){
    var motivo = state.ctx.motivo || 'tu cita';
    showResult('Cita confirmada ✓', motivo + ' · ' + (state.ctx.dia||'') + ' · ' + h + ' — queda pendiente de confirmación por WhatsApp.');
  }; });
  PREGUNTA_TEMAS.forEach(function(t){ ACTIONS['preguntaTema:'+t] = function(){
    showResult('Solicitud enviada', 'Te conectamos con el equipo sobre "' + t + '". Te responden muy pronto.');
  }; });

  function showResult(title, sub){ state.ctx.result = {title:title, sub:sub}; goto('result'); }

  /* ---------------- handoff al formulario de contacto real ----------------
     experiencia.html es una pagina aparte de index.html, asi que el traspaso
     de contexto (categoria + lo que escribio) viaja por sessionStorage; el
     receptor vive en home.js (busca "exp_handoff" al cargar index.html). */
  function handoffToContact(){
    var ta = document.getElementById('expClientsWant');
    if(ta) state.ctx.clientsWant = ta.value;
    var cat = catById(state.category);
    try{
      sessionStorage.setItem('exp_handoff', JSON.stringify({
        businessType: cat ? cat.label : '',
        goal: state.ctx.clientsWant || ''
      }));
    }catch(e){}
    leaveTo('index.html#diagnostico');
  }

  /* ---------------- router ---------------- */
  function goto(id){
    if(id && id.indexOf('__cat_')===0){
      state.category = id.replace('__cat_','');
      id = 'transition';
    }
    state.screen = id;
    render();
  }
  function render(){
    var screen = SCREENS[state.screen];
    if(!screen){ return; }
    overlay.innerHTML = '<button type="button" class="exp-close" data-exp-action="dismiss" aria-label="Salir">✕</button>' + screen.render();
  }

  overlay.addEventListener('click', function(e){
    var goEl = e.target.closest('[data-exp-go]');
    if(goEl){ goto(goEl.getAttribute('data-exp-go')); return; }
    var catEl = e.target.closest('[data-exp-cat]');
    if(catEl){
      var cat = catById(catEl.getAttribute('data-exp-cat'));
      if(cat && cat.ready){ state.category = cat.id; goto('transition'); }
      else { state.category = catEl.getAttribute('data-exp-cat'); goto('coming-soon'); }
      return;
    }
    var actionEl = e.target.closest('[data-exp-action]');
    if(actionEl){
      var name = actionEl.getAttribute('data-exp-action');
      if(ACTIONS[name]) ACTIONS[name]();
      return;
    }
  });

  /* ---------------- apertura / salida ----------------
     experiencia.html vive sola: "salir" siempre significa volver al
     sitio principal, no solo ocultar el overlay. */
  function openExperience(){
    state = { screen:'gate', category:null, ctx:{} };
    document.body.classList.add('exp-open');
    render();
  }
  function leaveTo(url){
    overlay.classList.add('exp-leaving');
    setTimeout(function(){ window.location.href = url; }, 260);
  }

  /* ---------------- arranque ---------------- */
  openExperience();

  window.addEventListener('keydown', function(e){
    if(e.key==='Escape') leaveTo('index.html');
  });
})();
