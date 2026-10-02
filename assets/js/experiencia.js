/* ============================================================
   EXPERIENCIA — motor de navegación de experiencia.html
   Cada pantalla es una <section class="scr" id="...">; go(id) la muestra.
   La categoría se elige una sola vez (state.category). Veterinaria es la
   única rama completa; Comidas / Inmobiliaria / Servicios quedan como
   ramas propias por agregar (mismo patrón: sus pantallas c-* / e-* y una
   entrada en CATEGORIES.<id>.entry).
   ============================================================ */
(function(){
  'use strict';
  var $ = function(s,r){ return (r||document).querySelector(s); };
  var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };

  var CATEGORIES = {
    veterinaria:{label:'Veterinaria', entry:'s-bridge', welcome:'c-welcome', track:'entra_clinica', ready:true},
    comidas:{label:'Comidas', entry:'s-bridge', welcome:'n-welcome', track:'entra_cafe', ready:true},
    inmobiliaria:{label:'Inmobiliaria', ready:false},
    servicios:{label:'Servicios / Asesoría', ready:false}
  };

  var ORDER = ['s-gate','s-know','s-before','s-change','s-idea','s-cat','s-bridge','c-welcome','c-home','c-toby','c-day','c-time','c-confirm','n-welcome','n-home','n-menu','n-cart','n-order-done','s-reveal1','s-reveal2','s-cases','s-close'];
  var HOOKS = {};
  var state = {category:null, current:'s-gate', prev:null, date:null, time:null, month:null, topic:null, bookingFrom:'c-home'};

  /* ---------- navegación ---------- */
  function go(id){
    var target = document.getElementById(id);
    if(!target) return;
    state.prev = state.current;
    state.current = id;
    $$('.scr').forEach(function(s){ s.classList.remove('on'); });
    target.classList.add('on');
    document.body.classList.toggle('in-clinic', id.indexOf('c-')===0);
    document.body.classList.toggle('in-cafe', id.indexOf('n-')===0);
    if(HOOKS[id]) HOOKS[id]();
    var idx = ORDER.indexOf(id);
    if(idx>=0) $('#expProgress').style.width = Math.round((idx/(ORDER.length-1))*100)+'%';
    window.scrollTo(0,0);
    track('exp_step',{step:id});
  }
  function track(name,data){
    try{
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({event:name}, data||{}));
      var log = JSON.parse(sessionStorage.getItem('exp_log')||'[]');
      log.push({e:name, d:data||{}, t:Date.now()});
      sessionStorage.setItem('exp_log', JSON.stringify(log.slice(-80)));
    }catch(e){}
  }
  function toast(msg){
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText='position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#151515;color:#fff;padding:12px 18px;border-radius:999px;font-size:13px;z-index:80;box-shadow:0 12px 30px rgba(0,0,0,.25);max-width:90vw;text-align:center';
    document.body.appendChild(t);
    setTimeout(function(){ t.remove(); }, 2600);
  }

  /* ---------- perfil de mascota ---------- */
  function setTab(name){
    $$('#petTabs button').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-tab')===name); });
    $$('.c-tabpane').forEach(function(p){ p.classList.toggle('on', p.id==='tab-'+name); });
  }

  /* ---------- agenda ---------- */
  var DAYS_ES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  var MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  var SLOTS = [['8:00 a. m.',8],['9:00 a. m.',9],['10:00 a. m.',10],['11:00 a. m.',11],['2:00 p. m.',14],['3:00 p. m.',15],['4:00 p. m.',16],['5:00 p. m.',17]];

  function startOfDay(d){ return new Date(d.getFullYear(),d.getMonth(),d.getDate()); }
  function fmtDate(d){ return DAYS_ES[d.getDay()]+', '+d.getDate()+' de '+MONTHS_ES[d.getMonth()]; }

  function renderCalendar(){
    var m = state.month, today = startOfDay(new Date());
    $('#monthLabel').textContent = MONTHS_ES[m.getMonth()]+' '+m.getFullYear();
    var first = new Date(m.getFullYear(), m.getMonth(), 1);
    var lead = (first.getDay()+6)%7;
    var count = new Date(m.getFullYear(), m.getMonth()+1, 0).getDate();
    var html = '';
    for(var i=0;i<lead;i++) html += '<button class="blank" disabled></button>';
    for(var d=1; d<=count; d++){
      var cur = new Date(m.getFullYear(), m.getMonth(), d);
      var off = cur<=today || cur.getDay()===0;
      var sel = state.date && +state.date===+cur;
      html += '<button data-day="'+d+'"'+(off?' disabled':'')+(sel?' class="sel"':'')+'>'+d+'</button>';
    }
    $('#calDays').innerHTML = html;
    $('#dayNext').disabled = !state.date;
  }
  function renderSlots(){
    $('#timeDayLabel').textContent = state.date ? fmtDate(state.date) : '';
    $('#slots').innerHTML = SLOTS.map(function(s){
      return '<button data-slot="'+s[1]+'"'+(state.time && state.time[1]===s[1]?' class="sel"':'')+'>'+s[0]+'</button>';
    }).join('');
    $('#timeNext').disabled = !state.time;
  }
  function startBooking(){
    state.bookingFrom = state.current;
    state.date = null; state.time = null;
    var t = startOfDay(new Date()); t.setDate(t.getDate()+1);
    state.month = new Date(t.getFullYear(), t.getMonth(), 1);
    renderCalendar();
    go('c-day');
  }
  function downloadIcs(){
    var d = state.date, h = state.time ? state.time[1] : 9;
    function p(n){ return (n<10?'0':'')+n; }
    var ds = d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'T'+p(h)+'0000';
    var de = d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'T'+p(h)+'3000';
    var ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Experiencia//ES','BEGIN:VEVENT','DTSTART:'+ds,'DTEND:'+de,'SUMMARY:Control de Toby · Clínica Patitas Felices','LOCATION:Cra. 15 # 93-21\\, Bogotá','END:VEVENT','END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));
    a.download = 'cita-toby.ics';
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- resultado genérico ---------- */
  function showResult(title, sub){
    $('#rTitle').textContent = title;
    $('#rSub').textContent = sub;
    go('c-result');
  }

  /* ---------- traspaso al formulario real de contacto (index.html) ---------- */
  function handoff(){
    var idea = ($('#idea').value||'').trim();
    var cat = state.category && CATEGORIES[state.category] ? CATEGORIES[state.category].label : '';
    try{
      sessionStorage.setItem('exp_handoff', JSON.stringify({businessType:cat, goal:idea}));
    }catch(e){}
    track('exp_handoff',{category:state.category||null, hasIdea:!!idea});
    window.location.href = 'index.html#diagnostico';
  }

  /* ---------- acciones ---------- */
  var ACTS = {
    startBooking:startBooking,
    backFromBooking:function(){ go(state.bookingFrom||'c-home'); },
    openPet:function(){ setTab('resumen'); go('c-toby'); },
    openPetSoon:function(el){ toast('En esta demostración solo está disponible el perfil de Toby.'); },
    codeGo:function(){
      var v = ($('#petCode').value||'').trim().toUpperCase();
      if(v==='TOBY774'){ $('#codeHint').hidden = true; setTab('resumen'); go('c-toby'); }
      else { $('#codeHint').hidden = false; }
    },
    tabHistorial:function(){ setTab('historial'); var t=$('#petTabs'); if(t) t.scrollIntoView({behavior:'smooth',block:'center'}); },
    monthPrev:function(){
      var now = new Date(), prev = new Date(state.month.getFullYear(), state.month.getMonth()-1, 1);
      if(prev >= new Date(now.getFullYear(), now.getMonth(), 1)){ state.month = prev; renderCalendar(); }
    },
    monthNext:function(){
      var now = new Date(), next = new Date(state.month.getFullYear(), state.month.getMonth()+1, 1);
      if(next <= new Date(now.getFullYear(), now.getMonth()+3, 1)){ state.month = next; renderCalendar(); }
    },
    dayNext:function(){ if(state.date){ renderSlots(); go('c-time'); } },
    confirmBooking:function(){
      if(!state.date || !state.time) return;
      $('#cfDate').textContent = fmtDate(state.date);
      $('#cfTime').textContent = state.time[0];
      go('c-confirm');
    },
    downloadIcs:downloadIcs,
    sendResult:function(el){ showResult(el.getAttribute('data-title'), el.getAttribute('data-sub')); },
    sendQuestion:function(){
      showResult('Pregunta enviada', 'Recibimos tu pregunta sobre "'+state.topic+'". El equipo te responde por WhatsApp en pocos minutos.');
    },
    finish:function(){ go('s-reveal1'); },
    handoff:handoff
  };

  /* ============================================================
     AL NATURAL (Comidas) — menú real, pedido, reserva, evento
     ============================================================ */
  var IMG = 'assets/experiencia/al-natural/';
  var CATALOG = [
    {id:'cappuccino', name:'Cappuccino', price:5000, tab:'cafes', img:'cafe-wide.jpg', desc:'Espresso, leche vaporizada y espuma.'},
    {id:'pastel-pollo', name:'Pastel de pollo', price:3000, tab:'comer', img:'pastel-pollo.jpg', desc:'Pastel de hojaldre relleno de pollo.'},
    {id:'pastel-mixto', name:'Pastel mixto', price:3000, tab:'comer', img:'pastel-mixto.jpg', desc:'Pollo y carne en un mismo pastel.'},
    {id:'carne-picante', name:'Carne picante', price:3000, tab:'comer', img:'carne-picante.jpg', desc:'Hojaldre relleno de carne con un toque picante.'},
    {id:'cochinito', name:'Cochinito', price:3000, tab:'comer', img:'cochinito.jpg', desc:'Hojaldre en forma de cochinito, para acompañar el café.'},
    {id:'rollo-canela', name:'Rollo de canela en hojaldre', price:5500, tab:'dulce', img:'rollo-canela.jpg', desc:'Rollo de hojaldre con canela.'},
    {id:'rollo-arandano', name:'Rollo + dulce de arándano', price:6500, tab:'dulce', img:'rollo-arandano.jpg', desc:'Rollo de hojaldre con dulce de arándano.'},
    {id:'rollo-mora', name:'Rollo + dulce de mora', price:6500, tab:'dulce', img:'rollo-mora.jpg', desc:'Rollo de hojaldre con dulce de mora.'},
    {id:'explosion', name:'Explosión de hojaldre', price:12000, tab:'dulce', img:'explosion.jpg', desc:'Postre de hojaldre para compartir.'},
    {id:'oblea', name:'Oblea cuchareable', price:7000, tab:'dulce', img:'oblea.jpg', desc:'Oblea para comer con cuchara. Tamaño pequeño.'},
    {id:'fresa-cremosa', name:'Fresa cremosa', price:7000, tab:'dulce', img:'fresa-cremosa.jpg', desc:'Postre cremoso con fresa.'},
    {id:'helado-arandano', name:'Helado de arándanos', price:3000, tab:'dulce', img:'helado-arandano.jpg', desc:'Helado artesanal de arándanos.'},
    {id:'helado-mora', name:'Helado de mora', price:2000, tab:'dulce', img:'helado-mora.jpg', desc:'Helado artesanal de mora.'},
    {id:'jugo-agua', name:'Jugo natural en agua', price:4000, tab:'bebidas', img:'jugo-agua.jpg', desc:'Jugo natural de fruta en agua, 12 oz.'},
    {id:'jugo-leche', name:'Jugo natural en leche', price:5000, tab:'bebidas', img:'jugo-leche.jpg', desc:'Jugo natural de fruta en leche, 16 oz.'},
    {id:'jugo-naranja', name:'Jugo de naranja', price:4000, tab:'bebidas', img:'jugo-naranja.jpg', desc:'Jugo de naranja, 12 oz.'},
    {id:'soda-frutal', name:'Soda frutal', price:4500, tab:'bebidas', img:'soda-frutal.jpg', desc:'Soda con sabor a fruta.'},
    {id:'yogurt-1800', name:'Yogurt artesanal 1,8 L', price:16500, tab:'bebidas', img:'yogurt-artesanal.jpg', desc:'Yogurt artesanal para llevar a casa.'}
  ];
  function prod(id){ return CATALOG.filter(function(p){ return p.id===id; })[0]; }
  function money(n){ return '$'+n.toLocaleString('es-CO'); }
  var N = {tab:'todos', q:'', cart:{}, item:null, qty:1, mode:'En el café', month:null, date:null, time:null, people:2, evPeople:20, evType:'Reunión empresarial', nq:null};

  function cartCount(){ var c=0; Object.keys(N.cart).forEach(function(k){ c+=N.cart[k]; }); return c; }
  function cartTotal(){ var t=0; Object.keys(N.cart).forEach(function(k){ t+=N.cart[k]*prod(k).price; }); return t; }

  function renderMenu(){
    var q = N.q.trim().toLowerCase();
    var list = CATALOG.filter(function(p){
      return (N.tab==='todos' || p.tab===N.tab) && (!q || (p.name+' '+p.desc).toLowerCase().indexOf(q)>=0);
    });
    $('#nGrid').innerHTML = list.map(function(p){
      return '<button class="n-prod" data-item="'+p.id+'"><img src="'+IMG+p.img+'" alt="'+p.name+'" loading="lazy"><div><span><b>'+p.name+'</b></span><em>'+money(p.price)+'</em></div></button>';
    }).join('');
    $('#nEmpty').hidden = list.length>0;
    updateCartBar();
  }
  function updateCartBar(){
    var c = cartCount();
    $('#nCartBar').hidden = c===0 || state.current!=='n-menu';
    $('#nCartCount').textContent = c;
    $('#nCartTotal').textContent = money(cartTotal());
  }
  function openItem(id){
    var p = prod(id); if(!p) return;
    N.item = id; N.qty = 1;
    $('#itImg').src = IMG+p.img; $('#itImg').alt = p.name;
    $('#itName').textContent = p.name; $('#itPrice').textContent = money(p.price);
    $('#itDesc').textContent = p.desc; $('#itQty').textContent = 1;
    var also = CATALOG.filter(function(x){ return x.id!==id && x.tab!==p.tab; }).slice(0,2);
    $('#itAlso').innerHTML = also.map(function(x){
      return '<button data-item="'+x.id+'"><img src="'+IMG+x.img+'" alt=""><span><b>'+x.name+'</b><small>'+money(x.price)+'</small></span></button>';
    }).join('');
    go('n-item');
  }
  function renderCart(){
    var ids = Object.keys(N.cart);
    $('#cartEmpty').hidden = ids.length>0;
    $('#cartLines').innerHTML = ids.map(function(id){
      var p = prod(id), q = N.cart[id];
      return '<div class="n-line"><img src="'+IMG+p.img+'" alt=""><div><b>'+p.name+'</b><small>'+money(p.price)+' c/u</small></div>'+
        '<div class="n-step"><button data-cartminus="'+id+'" aria-label="Menos">−</button><b>'+q+'</b><button data-cartplus="'+id+'" aria-label="Más">+</button></div>'+
        '<em>'+money(p.price*q)+'</em></div>';
    }).join('');
    $('#cartSubtotal').textContent = money(cartTotal());
    $('#cartGo').disabled = ids.length===0;
    $$('#nModes button').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-mode')===N.mode); });
  }

  /* reserva de mesa */
  function nRenderCal(){
    var m = N.month, today = startOfDay(new Date());
    $('#nMonthLabel').textContent = MONTHS_ES[m.getMonth()]+' '+m.getFullYear();
    var first = new Date(m.getFullYear(), m.getMonth(), 1), lead = (first.getDay()+6)%7;
    var count = new Date(m.getFullYear(), m.getMonth()+1, 0).getDate(), html='';
    for(var i=0;i<lead;i++) html += '<button class="blank" disabled></button>';
    for(var d=1; d<=count; d++){
      var cur = new Date(m.getFullYear(), m.getMonth(), d);
      var off = cur<=today;
      var sel = N.date && +N.date===+cur;
      html += '<button data-nday="'+d+'"'+(off?' disabled':'')+(sel?' class="sel"':'')+'>'+d+'</button>';
    }
    $('#nDays').innerHTML = html;
    $('#nSlots').innerHTML = SLOTS.map(function(s){
      return '<button data-nslot="'+s[1]+'"'+(N.time && N.time[1]===s[1]?' class="sel"':'')+'>'+s[0]+'</button>';
    }).join('');
    $('#nPeople').textContent = N.people;
    $('#nBookGo').disabled = !(N.date && N.time);
  }
  function nIcs(){
    var d = N.date, h = N.time ? N.time[1] : 9;
    function p(n){ return (n<10?'0':'')+n; }
    var ds = d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'T'+p(h)+'0000';
    var de = d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'T'+p(h+1)+'0000';
    var ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Experiencia//ES','BEGIN:VEVENT','DTSTART:'+ds,'DTEND:'+de,'SUMMARY:Mesa para '+N.people+' · Al Natural Café','LOCATION:Al Natural Café\\, Tunja','END:VEVENT','END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));
    a.download = 'reserva-al-natural.ics';
    document.body.appendChild(a); a.click(); a.remove();
  }
  function nResult(title, sub){
    $('#nrTitle').textContent = title; $('#nrSub').textContent = sub; go('n-result');
  }

  var NACTS = {
    nQtyMinus:function(){ if(N.qty>1){ N.qty--; $('#itQty').textContent = N.qty; } },
    nQtyPlus:function(){ if(N.qty<20){ N.qty++; $('#itQty').textContent = N.qty; } },
    nAddItem:function(){
      N.cart[N.item] = (N.cart[N.item]||0) + N.qty;
      toast(N.qty+' × '+prod(N.item).name+' agregado al pedido');
      go('n-menu'); renderMenu();
    },
    nClear:function(){ N.cart = {}; renderCart(); },
    nConfirmOrder:function(){
      if(!cartCount()){ toast('Tu pedido está vacío.'); return; }
      var num = 'AN-'+(100+Math.floor(Math.random()*900));
      var eta = N.mode==='Programado' ? 'Para la fecha y hora que elijas' : 'Listo en 10–15 minutos';
      $('#odSub').textContent = 'Pedido '+num+' · '+eta+'.';
      $('#odDetail').innerHTML = Object.keys(N.cart).map(function(id){
        return '<div><span>'+N.cart[id]+' × '+prod(id).name+'</span><b>'+money(prod(id).price*N.cart[id])+'</b></div>';
      }).join('') + '<div><span>Modalidad</span><b>'+N.mode+'</b></div><div><span>Total</span><b>'+money(cartTotal())+'</b></div>';
      N.cart = {};
      go('n-order-done');
    },
    nStartBook:function(){
      N.date = null; N.time = null; N.people = 2;
      var t = startOfDay(new Date()); t.setDate(t.getDate()+1);
      N.month = new Date(t.getFullYear(), t.getMonth(), 1);
      nRenderCal(); go('n-book');
    },
    nMonthPrev:function(){
      var now = new Date(), prev = new Date(N.month.getFullYear(), N.month.getMonth()-1, 1);
      if(prev >= new Date(now.getFullYear(), now.getMonth(), 1)){ N.month = prev; nRenderCal(); }
    },
    nMonthNext:function(){
      var now = new Date(), next = new Date(N.month.getFullYear(), N.month.getMonth()+1, 1);
      if(next <= new Date(now.getFullYear(), now.getMonth()+3, 1)){ N.month = next; nRenderCal(); }
    },
    nPeopleMinus:function(){ if(N.people>1){ N.people--; $('#nPeople').textContent = N.people; } },
    nPeoplePlus:function(){ if(N.people<12){ N.people++; $('#nPeople').textContent = N.people; } },
    nConfirmBook:function(){
      if(!N.date || !N.time) return;
      $('#bdDate').textContent = fmtDate(N.date); $('#bdTime').textContent = N.time[0];
      $('#bdPeople').textContent = N.people+(N.people===1?' persona':' personas');
      go('n-book-done');
    },
    nIcs:nIcs,
    nEvMinus:function(){ if(N.evPeople>5){ N.evPeople-=5; $('#nEvPeople').textContent = N.evPeople; } },
    nEvPlus:function(){ if(N.evPeople<300){ N.evPeople+=5; $('#nEvPeople').textContent = N.evPeople; } },
    nSendEvent:function(){
      nResult('Solicitud enviada', 'Recibimos tu solicitud de cotización: '+N.evType.toLowerCase()+' para '+N.evPeople+' personas. Te respondemos muy pronto con la propuesta.');
    },
    nCodeGo:function(){
      var v = ($('#nCode').value||'').trim().toUpperCase();
      if(v==='ANA001'){ $('#nCodeHint').hidden = true; go('n-client'); } else { $('#nCodeHint').hidden = false; }
    },
    nUsual:function(){
      N.cart = {'pastel-pollo':1,'jugo-agua':1}; N.mode = 'Para llevar';
      renderCart(); go('n-cart');
    },
    nSendQuestion:function(){
      nResult('Pregunta enviada', 'Recibimos tu pregunta sobre "'+N.nq+'". Te respondemos por WhatsApp en pocos minutos.');
    }
  };
  Object.keys(NACTS).forEach(function(k){ ACTS[k] = NACTS[k]; });

  document.addEventListener('click', function(e){
    var el;
    if((el = e.target.closest('[data-item]'))){ openItem(el.getAttribute('data-item')); return; }
    if((el = e.target.closest('[data-ntab]'))){
      N.tab = el.getAttribute('data-ntab');
      $$('#nTabs button').forEach(function(b){ b.classList.toggle('on', b===el); });
      renderMenu(); return;
    }
    if((el = e.target.closest('[data-cartplus]'))){ N.cart[el.getAttribute('data-cartplus')]++; renderCart(); return; }
    if((el = e.target.closest('[data-cartminus]'))){
      var id = el.getAttribute('data-cartminus'); N.cart[id]--; if(N.cart[id]<=0) delete N.cart[id]; renderCart(); return;
    }
    if((el = e.target.closest('[data-mode]'))){ N.mode = el.getAttribute('data-mode'); renderCart(); return; }
    if((el = e.target.closest('[data-nday]'))){
      N.date = new Date(N.month.getFullYear(), N.month.getMonth(), +el.getAttribute('data-nday')); nRenderCal(); return;
    }
    if((el = e.target.closest('[data-nslot]'))){
      var h = +el.getAttribute('data-nslot');
      N.time = SLOTS.filter(function(s){ return s[1]===h; })[0]; nRenderCal(); return;
    }
    if((el = e.target.closest('[data-etype]'))){
      N.evType = el.getAttribute('data-etype');
      $$('#nEventTypes button').forEach(function(b){ b.classList.toggle('on', b===el); }); return;
    }
    if((el = e.target.closest('[data-nq]'))){
      N.nq = el.getAttribute('data-nq');
      $$('#nqChips button').forEach(function(b){ b.classList.toggle('on', b===el); });
      $('#nqSend').disabled = false; return;
    }
  }, true);
  $('#nSearch').addEventListener('input', function(){ N.q = this.value; renderMenu(); });
  renderMenu();


  HOOKS['n-cart'] = renderCart;
  HOOKS['n-menu'] = renderMenu;

  /* ---------- eventos ---------- */
  document.addEventListener('click', function(e){
    var el;
    if((el = e.target.closest('[data-cat]'))){
      var id = el.getAttribute('data-cat'), cat = CATEGORIES[id];
      state.category = id;
      track('exp_category',{category:id});
      if(cat && cat.ready){
        $('#bridgeEyebrow').textContent = cat.label;
        var bg = $('#bridgeGo'); bg.setAttribute('data-go', cat.welcome); bg.setAttribute('data-track', cat.track);
        go(cat.entry);
      }
      else { $('#catNote').hidden = false; }
      return;
    }
    if((el = e.target.closest('[data-tab]'))){ setTab(el.getAttribute('data-tab')); return; }
    if((el = e.target.closest('[data-day]'))){
      state.date = new Date(state.month.getFullYear(), state.month.getMonth(), +el.getAttribute('data-day'));
      state.time = null;
      renderCalendar();
      return;
    }
    if((el = e.target.closest('[data-slot]'))){
      var h = +el.getAttribute('data-slot');
      state.time = SLOTS.filter(function(s){ return s[1]===h; })[0];
      renderSlots();
      return;
    }
    if((el = e.target.closest('[data-q]'))){
      state.topic = el.getAttribute('data-q');
      $$('#qChips button').forEach(function(b){ b.classList.toggle('on', b===el); });
      $('#qSend').disabled = false;
      return;
    }
    if((el = e.target.closest('[data-act]'))){
      var fn = ACTS[el.getAttribute('data-act')];
      if(fn) fn(el);
      return;
    }
    if((el = e.target.closest('[data-go]'))){
      if(el.getAttribute('data-track')) track(el.getAttribute('data-track'));
      go(el.getAttribute('data-go'));
      return;
    }
    if((el = e.target.closest('[data-track]'))){ track(el.getAttribute('data-track')); }
  });

  document.addEventListener('keydown', function(e){
    if(e.key==='Enter' && e.target && e.target.id==='petCode'){ ACTS.codeGo(); }
  });

  /* Enlaces directos desde la home: experiencia.html?exp=veterinaria | comidas
     entran de una vez al negocio elegido (la categoria ya viene decidida). */
  /* La X vuelve a la home en la misma parte de "Pruebalo", en la pestaña del negocio que se estaba viviendo
     (si se llego desde la home, history.back() conserva ademas la posicion exacta del scroll). */
  var exitLink = document.querySelector('.exp-exit');
  if(exitLink){
    exitLink.addEventListener('click', function(e){
      var tabs = {veterinaria:'vet', comidas:'food'}, tab = tabs[state.category] || '';
      var fromHome = false;
      try {
        var ref = document.referrer ? new URL(document.referrer) : null;
        fromHome = !!ref && ref.origin === location.origin && /\/(index\.html)?$/.test(ref.pathname) && history.length > 1;
      } catch(err){}
      track('exp_exit', {from: state.current});
      if(tab){ try { sessionStorage.setItem('home_tab', tab); } catch(err){} }
      if(fromHome){ e.preventDefault(); history.back(); return; }
      exitLink.setAttribute('href', 'index.html' + (tab ? '?tab=' + tab : '') + '#experiencias');
    });
  }

  var qs = new URLSearchParams(location.search), deep = CATEGORIES[qs.get('exp')];
  track('exp_start', deep ? {entry:qs.get('exp')} : undefined);
  if(deep && deep.ready){
    state.category = qs.get('exp');
    go(deep.welcome);
  } else {
    go('s-gate');
  }
})();
