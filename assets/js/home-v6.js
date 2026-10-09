/* ============================================================
   home-v6.js — lo minimo que necesita la homepage nueva:
   analitica basica, captura de leads (Web3Forms), el flujo de contacto
   de #diagnostico y la entrega de contexto desde experiencia.html.
   (Extraido de home.js, que sigue siendo el motor de la home anterior.)
   ============================================================ */
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
  try {
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(Object.assign({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: conFecha.email_subject || 'Nuevo lead | Daniel Cárdenas',
        from_name: 'Contacto danielcardenas.co'
      }, conFecha))
    }).catch(() => {});
  } catch (e) {}
}

/* V26 — continuación real después del recorrido: contexto breve + solicitud de conversación. */
(function(){
  const $=id=>document.getElementById(id);
  const screens={start:$('contactScreenStart'),similar:$('contactScreenSimilar'),question:$('contactScreenQuestion'),data:$('contactScreenData'),success:$('contactScreenSuccess')};
  if(!screens.start)return;
  const state={mode:null,businessType:'',goal:'',question:''};
  const step=$('contactStepLabel'),hint=$('contactStepHint');
  function show(name){Object.values(screens).forEach(el=>{if(el)el.hidden=true;}); screens[name].hidden=false;
    const map={start:['01','Elige la opción que más se ajuste.'],similar:['02','Cuéntame qué quieres hacer más fácil.'],question:['02','Cuéntame qué quieres preguntarme.'],data:['03','Solo necesito tus datos y, si quieres, un horario.'],success:['✓','Solicitud enviada']};
    step.textContent=map[name][0]; hint.textContent=map[name][1];
    screens[name].scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function goData(){
    if(state.mode==='similar'){
      state.businessType=($('contactBusinessType').value||'').trim(); state.goal=($('contactGoal').value||'').trim();
      if(!state.businessType||!state.goal){$('contactFeedback').textContent='Cuéntame a qué se dedica tu negocio y qué quieres hacer más fácil para tus clientes.';return;}
    } else {
      state.question=($('contactQuestion').value||'').trim();
      if(!state.question){return;}
    }
    show('data'); $('contactName')?.focus();
  }
  document.addEventListener('click',e=>{
    const start=e.target.closest('[data-contact-start]');
    if(start){state.mode=start.dataset.contactStart; show(state.mode==='similar'?'similar':'question'); return;}
    if(e.target.closest('#contactToData')){goData();return;}
    if(e.target.closest('#questionToData')){goData();return;}
    if(e.target.closest('#contactSend')){send();return;}
  });
  function send(){
    const name=($('contactName').value||'').trim(), wa=($('contactWhatsApp').value||'').trim(), email=($('contactEmail').value||'').trim();
    const consent=!!$('contactConsent')?.checked;
    const date=($('contactDate').value||'').trim(), time=($('contactTime').value||'').trim();
    const fb=$('contactFeedback');
    if(!name||!wa){fb.textContent='Solo necesito tu nombre y WhatsApp para poder contactarte.';return;}
    if(!consent){fb.textContent='Para enviar tu solicitud, debes aceptar el aviso de privacidad.';return;}
    if(!date||!time){fb.textContent='Si quieres que revisemos una hora, selecciona el día y la hora que prefieres.';return;}
    const type=state.mode==='similar'?'QUIERO ALGO PARECIDO':'TENGO UNA PREGUNTA';
    const details=state.mode==='similar'?['A qué se dedica: '+state.businessType,'Qué quiere hacer más fácil: '+state.goal].join('\n'):['Pregunta: '+state.question].join('\n');
    const msg=['Hola Daniel, acabo de recorrer tu página y quiero hablar contigo.','',type,details,'','Nombre: '+name,'WhatsApp: '+wa,'Correo: '+(email||'No indicó'),'Fecha solicitada: '+date,'Hora solicitada: '+time,'','La hora queda pendiente de tu confirmación.'].join('\n');
    try{saveLead({tipo_solicitud:'solicitud_conversacion',modalidad:type,nombre:name,whatsapp:wa,email,negocio_tipo:state.businessType,objetivo:state.goal,pregunta:state.question,fecha_solicitada:date,hora_solicitada:time,consentimiento_datos:true,mensaje_whatsapp:msg,origen:'recorrido_experiencial'});}catch(e){}
    show('success');
    setTimeout(()=>window.open('https://wa.me/573118262315?text='+encodeURIComponent(msg),'_blank'),350);
  }
  const date=$('contactDate'); if(date){const d=new Date(); d.setDate(d.getDate()+1); date.min=d.toISOString().slice(0,10);}
})();

/* V26 — los CTA comerciales siguen llevando primero a esta experiencia. */
(function(){
  document.addEventListener('click',e=>{
    const link=e.target.closest('[data-pre-diagnostic="1"]'); if(!link)return;
    e.preventDefault(); const diag=document.getElementById('diagnostico');
    if(diag){trackEvent('cta_pre_diagnostic',{cta:(link.textContent||'').trim()});diag.scrollIntoView({behavior:'smooth',block:'start'});}
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
  const businessType=document.getElementById('contactBusinessType');
  const goal=document.getElementById('contactGoal');
  if(businessType && data.businessType) businessType.value = data.businessType;
  if(goal && data.goal) goal.value = data.goal;
  const starter=document.querySelector('[data-contact-start="similar"]');
  if(starter) starter.click();
  const section=document.getElementById('diagnostico');
  if(section) setTimeout(()=>section.scrollIntoView({behavior:'smooth',block:'start'}), 60);
})();

