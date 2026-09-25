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
    veterinaria:{label:'Veterinaria', entry:'s-bridge', ready:true},
    comidas:{label:'Comidas', ready:false},
    inmobiliaria:{label:'Inmobiliaria', ready:false},
    servicios:{label:'Servicios / Asesoría', ready:false}
  };

  var ORDER = ['s-gate','s-know','s-before','s-change','s-idea','s-cat','s-bridge','c-welcome','c-home','c-toby','c-day','c-time','c-confirm','s-reveal1','s-reveal2','s-cases','s-close'];
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

  /* ---------- eventos ---------- */
  document.addEventListener('click', function(e){
    var el;
    if((el = e.target.closest('[data-cat]'))){
      var id = el.getAttribute('data-cat'), cat = CATEGORIES[id];
      state.category = id;
      track('exp_category',{category:id});
      if(cat && cat.ready){ go(cat.entry); }
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

  track('exp_start');
  go('s-gate');
})();
