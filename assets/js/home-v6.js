/* ============================================================
   home-v6.js — lo minimo que necesita la homepage nueva:
   analitica basica, captura de leads (Web3Forms), el flujo de contacto
   de #diagnostico y la entrega de contexto desde experiencia.html.
   (Extraido de home.js, que sigue siendo el motor de la home anterior.)
   ============================================================ */
// Respeta la preferencia de "reducir movimiento": sin ella el scroll es suave; con ella, directo.
const SCROLL_SUAVE = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'auto' : 'smooth';
function trackEvent(name, data) {
  data = data || {};
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(Object.assign({ event: name, ts: new Date().toISOString() }, data));
  try {
    const log = JSON.parse(localStorage.getItem('ap_events') || '[]');
    log.push(Object.assign({ event: name, ts: new Date().toISOString() }, data));
    localStorage.setItem('ap_events', JSON.stringify(log.slice(-300)));
  } catch (e) {}
}
trackEvent('visita');
trackEvent('page_view');

// Web3Forms entrega cada lead a daniel@danielcardenas.co (ver configuracion de la clave).
const WEB3FORMS_ACCESS_KEY = '9b941d91-076c-4b07-bbac-3d8ec2abb159';

(function capturarCanalTrafico() {
  try {
    const src = new URLSearchParams(location.search).get('utm_source');
    if (src) sessionStorage.setItem('canal_trafico', src);
  } catch (e) {}
})();

function saveLead(lead) {
  let canalTrafico = 'directo';
  try { canalTrafico = sessionStorage.getItem('canal_trafico') || 'directo'; } catch (e) {}
  const conFecha = Object.assign({ fecha: new Date().toISOString(), canal_trafico: canalTrafico }, lead);
  // Devuelve una promesa que dice si el servicio confirmó el envío (true) o no (false).
  return new Promise(function (resolve) {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(function () { if (ctl) ctl.abort(); resolve(false); }, 10000);
    const fin = function (ok) { clearTimeout(timer); resolve(ok); };
    try {
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: ctl ? ctl.signal : undefined,
        body: JSON.stringify(Object.assign({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: conFecha.email_subject || 'Nuevo lead | Daniel Cárdenas',
          from_name: 'Contacto danielcardenas.co'
        }, conFecha))
      }).then(function (r) {
        return r.json().then(function (j) { fin(!!(r.ok && j && j.success)); }, function () { fin(r.ok); });
      }).catch(function () { fin(false); });
    } catch (e) { fin(false); }
  });
}

/* Formulario de contacto: 3 pasos cortos que se contestan tocando. El brief completo lo hace Daniel en la primera reunión,
   no el visitante. Solo son obligatorios: tipo de negocio (o la pregunta), nombre, WhatsApp y el consentimiento. */
(function(){
  const $=id=>document.getElementById(id);
  const screens={start:$('contactScreenStart'),similar:$('contactScreenSimilar'),question:$('contactScreenQuestion'),data:$('contactScreenData'),success:$('contactScreenSuccess')};
  if(!screens.start)return;
  const WA='573118262315';
  const SERVICIOS={diagnostico:'Diagnóstico y asesoría',diseno:'Diseño e implementación',acompanamiento:'Acompañamiento y optimización'};
  const state={mode:null,business:'',goals:[],when:'asap',service:'',origin:''};
  // Contexto de procedencia: ?servicio=diagnostico|diseno|acompanamiento y ?origen=pagina-de-donde-llegas (solo letras, números y guiones).
  try{ const q=new URLSearchParams(location.search); const sv=q.get('servicio'); if(sv && SERVICIOS[sv]) state.service=sv; state.origin=(q.get('origen')||'').toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,60); }catch(e){}
  const hint=$('contactStepHint');
  const hints={start:'Paso 1 de 3 · Elige una opción',similar:'Paso 2 de 3 · Toca lo que más se parezca',question:'Paso 2 de 3 · Escribe tu pregunta',data:'Paso 3 de 3 · Solo tu nombre y WhatsApp',success:'Listo'};
  const val=id=>(($(id)&&$(id).value)||'').trim();

  function business(){ return state.business==='Otro' ? (val('contactBusinessOther')||'Otro') : state.business; }
  function goalText(){ const g=state.goals.slice(); const more=val('contactMore'); if(more) g.push(more); return g.join(', '); }
  function whenText(){
    if(state.when==='manana') return 'Mañana';
    if(state.when==='elegir'){ const d=val('contactDate'), t=val('contactTime'); return (d&&t)?('El '+d+' a las '+t+' (por confirmar)'):''; }
    return 'Lo antes posible';
  }
  function waLink(lines){ return 'https://wa.me/'+WA+'?text='+encodeURIComponent(lines.join('\n')); }
  function introLines(){
    const l=['Hola Daniel, vi tu página y quiero hablar contigo.'];
    if(state.service) l.push('Me interesa: '+SERVICIOS[state.service]);
    if(state.mode==='question'){ const q=val('contactQuestion'); if(q) l.push('','Mi pregunta: '+q); }
    else { const b=business(), g=goalText(); if(b) l.push('','Mi negocio: '+b); if(g) l.push('Quiero que mis clientes puedan: '+g); }
    return l;
  }
  function showService(){
    const n=$('contactServiceNote'); if(!n) return;
    n.hidden=!state.service;
    if(state.service) $('contactServiceName').textContent=SERVICIOS[state.service];
  }
  function updateDirect(){ const a=$('contactDirectWa'); if(a) a.href=waLink(introLines()); }

  function show(name){
    Object.values(screens).forEach(el=>{ if(el) el.hidden=true; });
    screens[name].hidden=false;
    hint.textContent=hints[name];
    const d=$('contactDirect'); if(d) d.hidden=(name==='success');
    if(typeof trackEvent==='function') trackEvent('contact_step',{step:name});
    screens[name].scrollIntoView({behavior:SCROLL_SUAVE,block:'nearest'});
    // Lleva el foco al encabezado de la pantalla nueva para que el lector de pantalla la anuncie (en "data" lo recibe el primer campo).
    if(name!=='data'){ const h=screens[name].querySelector('h3'); if(h){ h.tabIndex=-1; h.focus({preventScroll:true}); } }
  }
  function syncNext(){
    const n=$('contactToData'); if(n) n.disabled=!business();
    const q=$('questionToData'); if(q) q.disabled=!val('contactQuestion');
    updateDirect();
  }
  function pick(group,btn,multi){
    if(multi){
      const on=btn.getAttribute('aria-pressed')!=='true';
      btn.setAttribute('aria-pressed',on?'true':'false');
      state.goals=[...group.querySelectorAll('[aria-pressed="true"]')].map(b=>b.dataset.val);
    } else {
      group.querySelectorAll('.chip').forEach(b=>b.setAttribute('aria-checked',b===btn?'true':'false'));
    }
  }

  document.addEventListener('click',e=>{
    const start=e.target.closest('[data-contact-start]');
    if(start){ state.mode=start.dataset.contactStart; show(state.mode==='similar'?'similar':'question'); syncNext(); return; }
    if(e.target.closest('[data-contact-back]')){
      const cur=Object.keys(screens).find(k=>screens[k]&&!screens[k].hidden);
      show(cur==='data' ? (state.mode==='similar'?'similar':'question') : 'start'); return;
    }
    const chip=e.target.closest('.chip');
    if(chip){
      const group=chip.parentElement;
      if(group.id==='chipsBusiness'){ pick(group,chip,false); state.business=chip.dataset.val; const o=$('contactBusinessOther'); o.hidden=(state.business!=='Otro'); $('lblBizOther').hidden=o.hidden; if(!o.hidden) o.focus(); }
      else if(group.id==='chipsGoal'){ pick(group,chip,true); }
      else if(group.id==='chipsWhen'){ pick(group,chip,false); state.when=chip.dataset.val; $('contactWhenPick').hidden=(state.when!=='elegir'); }
      syncNext(); return;
    }
    if(e.target.closest('#contactServiceClear')){ state.service=''; showService(); updateDirect(); trackEvent('contact_service_clear'); return; }
    if(e.target.closest('#contactAddEmail')){ $('contactEmail').hidden=false; $('lblEmail').hidden=false; e.target.closest('#contactAddEmail').hidden=true; $('contactEmail').focus(); return; }
    if(e.target.closest('#contactToData')||e.target.closest('#questionToData')){ show('data'); $('contactName')?.focus(); return; }
    if(e.target.closest('#contactSend')){ send(); return; }
  });
  ['contactBusinessOther','contactMore','contactQuestion'].forEach(id=>{ const el=$(id); if(el) el.addEventListener('input',syncNext); });

  /* Errores junto al campo, con texto concreto. */
  function setErr(field, errId, msg){ const e=$(errId); if(e){ e.textContent=msg; e.hidden=false; } const f=$(field); if(f) f.setAttribute('aria-invalid','true'); }
  function clearErr(field, errId){ const e=$(errId); if(e){ e.textContent=''; e.hidden=true; } const f=$(field); if(f) f.removeAttribute('aria-invalid'); }
  function checkName(){ if(!val('contactName')){ setErr('contactName','errName','Falta tu nombre.'); return false; } clearErr('contactName','errName'); return true; }
  function checkWa(){ if(val('contactWhatsApp').replace(/\D/g,'').length<7){ setErr('contactWhatsApp','errWa','Falta tu WhatsApp, con el número completo. Por ejemplo: 310 123 4567.'); return false; } clearErr('contactWhatsApp','errWa'); return true; }
  function checkEmail(){ const v=val('contactEmail'); if(v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)){ setErr('contactEmail','errEmail','Revisa tu correo: debe verse como nombre@dominio.com. Si prefieres, déjalo vacío.'); return false; } clearErr('contactEmail','errEmail'); return true; }
  function checkConsent(){ if(!$('contactConsent').checked){ setErr('contactConsent','errConsent','Marca la casilla para aceptar el aviso de privacidad.'); return false; } clearErr('contactConsent','errConsent'); return true; }
  function checkWhen(){
    const e=$('errWhen'); let msg='';
    if(!whenText()) msg='Elige el día y la hora, o toca "Lo antes posible".';
    else if(state.when==='elegir' && val('contactDate') < $('contactDate').min) msg='Elige un día desde mañana.';
    if(msg){ e.textContent=msg; e.hidden=false; return false; }
    e.textContent=''; e.hidden=true; return true;
  }
  $('contactName').addEventListener('blur',checkName);
  $('contactWhatsApp').addEventListener('blur',checkWa);
  $('contactName').addEventListener('input',()=>{ if($('contactName').hasAttribute('aria-invalid')) checkName(); });
  $('contactWhatsApp').addEventListener('input',()=>{ if($('contactWhatsApp').hasAttribute('aria-invalid')) checkWa(); });
  $('contactEmail').addEventListener('blur',checkEmail);
  $('contactEmail').addEventListener('input',()=>{ if($('contactEmail').hasAttribute('aria-invalid')) checkEmail(); });
  $('contactConsent').addEventListener('change',checkConsent);
  ['contactDate','contactTime'].forEach(id=>{ const el=$(id); if(el) el.addEventListener('change',()=>{ if(!$('errWhen').hidden) checkWhen(); }); });

  function mostrarExito(ok){
    $('successMark').textContent = ok ? '✓' : '!';
    $('successMark').classList.toggle('warn', !ok);
    $('successKicker').textContent = ok ? 'SOLICITUD RECIBIDA' : 'FALTA UN PASO';
    $('successTitle').textContent = ok ? 'Listo, ya tengo tu solicitud.' : 'Tu solicitud no se envió sola.';
    $('successText').innerHTML = ok
      ? '<strong>Te escribo por WhatsApp en menos de 24 horas</strong> para confirmar la conversación. Si quieres adelantar, abre WhatsApp y envía tu mensaje: llegará con todo el contexto.'
      : '<strong>Puede ser tu conexión.</strong> Toca el botón y envíame tu mensaje por WhatsApp: llega con todo el contexto y te respondo en menos de 24 horas.';
    show('success');
  }

  function send(){
    const name=val('contactName'), wa=val('contactWhatsApp'), email=val('contactEmail');
    const okName=checkName(), okWa=checkWa(), okEmail=checkEmail(), okConsent=checkConsent(), okWhen=checkWhen();
    if(!okName){ $('contactName').focus(); return; }
    if(!okWa){ $('contactWhatsApp').focus(); return; }
    if(!okEmail){ $('contactEmail').focus(); return; }
    if(!okWhen){ const w=$('contactWhenPick'); (w.hidden?$('errWhen'):$('contactDate')).scrollIntoView({block:'center',behavior:SCROLL_SUAVE}); if(!w.hidden) $('contactDate').focus(); return; }
    if(!okConsent){ $('contactConsent').focus(); $('contactConsent').scrollIntoView({block:'center',behavior:SCROLL_SUAVE}); return; }
    const cuando=whenText();
    const similar=state.mode==='similar';
    const lines=introLines().concat(['','Nombre: '+name,'WhatsApp: '+wa,'Correo: '+(email||'No indicó'),'Cuándo escribirme: '+cuando,'','La hora queda pendiente de tu confirmación.']);
    const msg=lines.join('\n');
    $('contactSuccessWa').href='https://wa.me/'+WA+'?text='+encodeURIComponent(msg);
    const btn=$('contactSend'); const etiqueta=btn.innerHTML;
    btn.disabled=true; btn.textContent='Enviando…';
    saveLead({tipo_solicitud:'solicitud_conversacion',modalidad:similar?'QUIERO UNA EXPERIENCIA':'TENGO UNA PREGUNTA',nombre:name,whatsapp:wa,email,negocio_tipo:similar?business():'',objetivo:similar?goalText():'',pregunta:similar?'':val('contactQuestion'),cuando_escribirle:cuando,fecha_solicitada:state.when==='elegir'?val('contactDate'):'',hora_solicitada:state.when==='elegir'?val('contactTime'):'',consentimiento_datos:true,mensaje_whatsapp:msg,servicio_interes:state.service?SERVICIOS[state.service]:'',origen_pagina:state.origin,email_subject:'Nuevo lead | '+(similar?'quiere una experiencia ('+(business()||'sin tipo')+')':'pregunta')+(state.service?' · '+SERVICIOS[state.service]:'')}).then(ok=>{
      btn.disabled=false; btn.innerHTML=etiqueta;
      trackEvent('lead_enviado',{ok:ok,modalidad:similar?'experiencia':'pregunta'});
      mostrarExito(ok);
    });
  }

  // La fecha elegible empieza mañana.
  const date=$('contactDate'); if(date){ const d=new Date(); d.setDate(d.getDate()+1); date.min=d.toISOString().slice(0,10); }

  // Lo usa el paso de contexto que llega desde experiencia.html: marca el tipo de negocio y lo que el visitante quería facilitar.
  window.contactPrefill=function(biz,goal){
    const bg=$('chipsBusiness'), gg=$('chipsGoal');
    if(biz){
      const k=String(biz).toLowerCase();
      let hit=[...bg.querySelectorAll('.chip')].find(c=>c.dataset.val.toLowerCase().startsWith(k)||k.startsWith(c.dataset.val.toLowerCase().split(' ')[0]));
      if(!hit){ hit=bg.querySelector('[data-val="Otro"]'); $('contactBusinessOther').value=String(biz).slice(0,80); }
      pick(bg,hit,false); state.business=hit.dataset.val; $('contactBusinessOther').hidden=(state.business!=='Otro'); $('lblBizOther').hidden=$('contactBusinessOther').hidden;
    }
    if(goal){
      const g=String(goal), low=g.toLowerCase();
      const map=[['agend','Agendar citas'],['pedid','Hacer pedidos'],['pedir','Hacer pedidos'],['reserv','Reservar'],['cotiz','Pedir una cotización'],['duda','Resolver dudas'],['pregunt','Resolver dudas']];
      map.forEach(([key,label])=>{ if(low.includes(key)){ const c=gg.querySelector('[data-val="'+label+'"]'); if(c&&c.getAttribute('aria-pressed')!=='true') pick(gg,c,true); } });
      $('contactMore').value=g.slice(0,160);
    }
    syncNext();
  };
  showService();
  if(state.service||state.origin) trackEvent('contact_context',{service:state.service,origin:state.origin});
  syncNext();
})();

/* V26 — los CTA comerciales siguen llevando primero a esta experiencia. */
(function(){
  document.addEventListener('click',e=>{
    const link=e.target.closest('[data-pre-diagnostic="1"]'); if(!link)return;
    e.preventDefault(); const diag=document.getElementById('diagnostico');
    if(diag){trackEvent('cta_pre_diagnostic',{cta:(link.textContent||'').trim()});diag.scrollIntoView({behavior:SCROLL_SUAVE,block:'start'});}
  });
})();

/* V29 — recibe el contexto de experiencia.html (categoria + lo que el
   visitante quiere que sus clientes puedan hacer) y precarga el
   formulario de contacto, como si nunca hubiera salido del recorrido. */
(function(){
  let raw;
  try{ raw = sessionStorage.getItem('exp_handoff'); }catch(e){ return; }
  if(!raw) return;
  try{ sessionStorage.removeItem('exp_handoff'); }catch(e){}
  let data; try{ data = JSON.parse(raw); }catch(e){ return; }
  if(window.contactPrefill) window.contactPrefill(data.businessType, data.goal);
  const starter=document.querySelector('[data-contact-start="similar"]');
  if(starter) starter.click();
  const section=document.getElementById('diagnostico');
  if(section) setTimeout(()=>section.scrollIntoView({behavior:SCROLL_SUAVE,block:'start'}), 60);
})();

