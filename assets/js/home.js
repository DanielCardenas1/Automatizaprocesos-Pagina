const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}
}),{threshold:.08});
document.querySelectorAll('.rev').forEach(el=>io.observe(el));

// ============ ANALÍTICA (MVP, sin backend) ============
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

// ============ LEADS ============
// El localStorage por sí solo no sirve de nada: vive en el navegador del
// visitante, Daniel nunca lo ve si esa persona no toca un CTA. Web3Forms
// manda cada lead a danielkadioz@gmail.com sin necesitar backend propio.
const WEB3FORMS_ACCESS_KEY = '9b941d91-076c-4b07-bbac-3d8ec2abb159';
function saveLead(lead) {
  const conFecha = Object.assign({ fecha: new Date().toISOString() }, lead);
  try {
    const leads = JSON.parse(localStorage.getItem('ap_leads') || '[]');
    leads.push(conFecha);
    localStorage.setItem('ap_leads', JSON.stringify(leads));
  } catch (e) {}
  try {
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(Object.assign({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: conFecha.email_subject || 'Nuevo lead — Automatiza Procesos',
        from_name: 'Diagnóstico Automatiza Procesos'
      }, conFecha))
    }).catch(() => {});
  } catch (e) {}
}

// ============ CTA FINAL — se vuelve contextual tras un diagnóstico/idea ============
function actualizarCtaFinal(opts) {
  const h = document.getElementById('ctaFinalH');
  const sub = document.getElementById('ctaFinalSub');
  const wa = document.getElementById('ctaFinalWa');
  const waLabel = document.getElementById('ctaFinalWaLabel');
  if (h) h.innerHTML = opts.heading;
  if (sub) sub.textContent = opts.sub;
  if (wa) wa.href = opts.waUrl;
  if (waLabel) waLabel.textContent = opts.waLabel;
}

// ============ SEGUNDO CEREBRO V3 — base de conocimiento (KB) ============
// Transcrito de asistente-conocimiento.md. Es la fuente de verdad de casos
// reales, precios y contacto. Si el .md cambia, refleja el cambio aquí
// también — no hay backend que lo cargue en vivo desde un archivo estático.
const KB = {
  contacto: { whatsapp: '573005333763', email: 'danielkadioz@gmail.com' },
  // Señales = patrones que delatan que el problema descrito se parece a un
  // caso YA resuelto. Sirven para "detección de soluciones reutilizables":
  // si el usuario describe algo con ese patrón, se le cita el caso real y
  // se le enlaza al modal existente — nunca se inventa un caso nuevo.
  casos: [
    { id: 'pension', modalId: 'modal-pension', resumen: 'liquidación pensional: de 8 a 456 casos/mes automatizando cartas de cobro y cálculo de cuotas', senales: [/liquid/i, /pension/i, /cobr.*(otra|otras|otro)/i, /carta.*cobro/i, /resoluci/i] },
    { id: 'dxcr', modalId: 'modal-dxcr', resumen: 'conciliación bancaria: de 5 días a 1 hora cruzando pagos de 138 sedes contra facturas', senales: [/\bsede/i, /\bbanco\b/i, /concili/i, /cruz.*(movim|pago)/i, /extracto/i] },
    { id: 'zeus', modalId: 'modal-zeus', resumen: 'costeo de restaurantes: margen del 15% al 24% sabiendo cuánto se gana por plato', senales: [/cu[aá]nto\s+gan/i, /costo\s+por\s+(plato|producto|unidad)/i, /margen/i, /rentabilidad/i, /punto\s+de\s+venta/i] },
    { id: 'hojaldre', modalId: 'modal-hojaldre', resumen: 'recorrido comercial para un redistribuidor: descubrir, entender, calcular la oportunidad y contactar, en menos de una semana', senales: [/sin\s+p[aá]gina/i, /cat[aá]logo/i, /redistribuidor/i, /revender/i] },
    { id: 'invima', modalId: 'modal-invima', resumen: 'llenado de fichas técnicas regulatorias: 600+ fichas generadas sin errores de transcripción', senales: [/ficha\s+t[eé]cnica/i, /registro\s+sanitario/i, /invima/i, /copi.*dato/i] },
    { id: 'evaluador', modalId: 'modal-evaluador', resumen: 'evaluación de proyectos de múltiples centros: de semanas a horas aplicando criterios de calificación', senales: [/eval[uú].*proyecto/i, /calific/i, /criterios?\s+de\s+(evaluaci|calificaci)/i, /centros?\s+de\s+formaci/i, /regional/i] },
    { id: 'icbf', modalId: 'modal-icbf', resumen: 'bot que carga registros uno por uno en un sistema web: 350 beneficiarios en 1h 47min', senales: [/cargue\s+masivo/i, /uno\s+(a|por)\s+uno/i, /beneficiario/i, /carg.*registro/i, /formulario\s+web/i, /sistema\s+web/i, /plataforma/i] }
  ]
};

// ============ PATRONES V1-V6 — el tipo de recorrido del CLIENTE, no el ============
// tipo de tarea interna. Automatiza Procesos ya no clasifica "qué proceso
// administrativo automatizamos" — clasifica "en qué parte del recorrido de
// tus clientes hay fricción" (descubrir, elegir, agendar, consultar,
// cotizar, volver). "apertura" = lectura humana del problema, mostrada
// antes de preguntar nada. "preguntas" = banco ordenado de la mini-
// consultoría de ese patrón (fase 2.5). "soluciones" = biblioteca
// controlada — la IA clasifica e interpreta lenguaje natural, pero nunca
// inventa una solución fuera de esta lista (regla 6 del brief).
const PATRONES = {
  vender: {
    icono: '🛒', label: 'Quiero vender más',
    senales: [/vender\s+m[aá]s/i, /visitas?\s+pero\s+no\s+compran/i, /me\s+escriben\s+pero\s+no\s+compran/i, /tengo\s+interesados/i, /conseguir\s+clientes/i, /convertir\s+mejor/i, /no\s+s[eé]\s+c[oó]mo\s+venderlos/i, /mejorar\s+mis\s+ventas/i, /genera\s+preguntas\s+pero\s+no\s+ventas/i, /captar\s+clientes/i, /pocas?\s+conversion/i, /despu[eé]s\s+desaparecen/i, /preguntan\s+(el\s+)?precios?/i, /dejan\s+de\s+responder/i, /no\s+vuelven\s+a\s+escribir/i, /no\s+cierro\s+la\s+venta/i],
    apertura: 'Por lo que cuentas, el problema parece estar en la conversión. Te llegan personas interesadas, pero algo se pierde entre que preguntan y que compran. Eso puede hacer que el contacto se enfríe, que la persona no vuelva a escribir, o que la venta dependa de que tú estés disponible para responder a tiempo.',
    preguntas: ['friccion_venta', 'canal_contacto', 'que_preguntan_antes_comprar', 'que_pasa_si_no_respondes_rapido'],
    friccionIds: ['friccion_venta', 'que_pasa_si_no_respondes_rapido'],
    recorrido: 'Descubre → Consulta → Decide → Compra, sin perder el contacto en el camino',
    soluciones: ['Landing comercial', 'Recorrido de venta guiado', 'Captura de leads', 'WhatsApp estructurado', 'Seguimiento comercial']
  },
  elegir: {
    icono: '🔎', label: 'Mis clientes no saben cuál elegir',
    senales: [/muchos\s+productos/i, /no\s+saben?\s+cu[aá]l\s+elegir/i, /cu[aá]l\s+les\s+sirve/i, /muchas\s+opciones/i, /recomendar\s+productos/i, /\bcomparar\b/i, /cat[aá]logo/i, /caracter[ií]sticas/i, /necesidades\s+diferentes/i],
    apertura: 'Por lo que cuentas, el problema parece estar en la elección. Tienes una oferta amplia, pero el cliente necesita demasiada ayuda para saber cuál opción le conviene. Eso puede hacer que termine preguntando por WhatsApp, abandone la búsqueda o elija sin suficiente seguridad.',
    preguntas: ['que_debe_elegir', 'cuantas_opciones', 'que_pregunta_antes_elegir', 'como_ayudas_elegir', 'que_pasa_sin_encontrar'],
    friccionIds: ['como_ayudas_elegir', 'que_pasa_sin_encontrar'],
    recorrido: 'Llega → Le preguntamos lo justo → Ve solo las opciones que aplican → Elige → Contacta',
    soluciones: ['Buscador con filtros', 'Selector guiado (quiz)', 'Catálogo personalizado', 'Comparador']
  },
  agendar: {
    icono: '📅', label: 'Quiero facilitar las citas',
    senales: [/\bcitas?\b/i, /reservas?/i, /\bagenda\b/i, /disponibilidad/i, /\bhorarios?\b/i, /reservar/i, /agendar/i, /calendario/i],
    apertura: 'Por lo que cuentas, el problema parece estar en agendar o reservar. Coordinar esto manualmente toma tiempo y genera ida y vuelta innecesaria. Eso puede hacer que alguien se canse de esperar respuesta y termine buscando en otro lado.',
    preguntas: ['que_agenda', 'como_agenda_hoy', 'info_antes_confirmar', 'quien_administra_agenda', 'que_pasa_despues_reservar'],
    friccionIds: ['como_agenda_hoy', 'que_pasa_despues_reservar'],
    recorrido: 'Descubre → Elige el servicio → Ve disponibilidad → Agenda → Confirmación → Recordatorio',
    soluciones: ['Selector de servicio', 'Agenda con disponibilidad', 'Confirmación automática', 'Recordatorios', 'WhatsApp estructurado']
  },
  consultar: {
    icono: '💬', label: 'Me hacen demasiadas preguntas',
    senales: [/hacen\s+muchas\s+preguntas/i, /siempre\s+preguntan\s+lo\s+mismo/i, /puedan\s+consultar/i, /orientaci[oó]n/i, /asesor[ií]a/i, /\bdudas\b/i, /recomendaciones/i, /instrucciones/i],
    apertura: 'Por lo que cuentas, el problema parece estar en las consultas repetidas. Tus clientes preguntan antes de decidir, y responder uno por uno te quita tiempo. Eso puede hacer que alguien se quede sin respuesta a tiempo, o que termines contestando lo mismo una y otra vez.',
    preguntas: ['que_preguntan_repetido', 'respuesta_depende', 'que_podria_autoconsultar', 'cuando_interviene_persona'],
    friccionIds: ['que_preguntan_repetido', 'cuando_interviene_persona'],
    recorrido: 'Llega con una duda → La resuelve solo o con una guía → Si necesita más, se deriva al profesional',
    soluciones: ['Centro de información', 'FAQ inteligente', 'Consulta guiada', 'Derivación al profesional']
  },
  cotizar: {
    icono: '💰', label: 'Quiero recibir solicitudes mejor organizadas',
    senales: [/cotizaci[oó]n(es)?/i, /presupuesto/i, /precio\s+personalizado/i, /depende\s+de\s+(cantidad|medida)/i, /servicios?\s+personalizados?/i, /\bsolicitar\b/i],
    apertura: 'Por lo que cuentas, el problema parece estar en las cotizaciones. Tu precio depende de varias variables y armar cada una a mano toma tiempo. Eso puede hacer que la persona se vaya a comparar con alguien más mientras espera tu respuesta.',
    preguntas: ['de_que_depende_precio', 'que_necesitas_para_cotizar', 'cuanto_tardas_cotizar', 'que_pasa_mientras_espera'],
    friccionIds: ['que_necesitas_para_cotizar', 'que_pasa_mientras_espera'],
    recorrido: 'Describe lo que necesita → Recibe una estimación al momento → Confirma los detalles con Daniel',
    soluciones: ['Calculadora de precio', 'Configurador', 'Formulario inteligente', 'WhatsApp con info precargada']
  },
  volver: {
    icono: '🔄', label: 'Quiero que mis clientes vuelvan',
    senales: [/clientes\s+existentes/i, /\brecompra\b/i, /\bseguimiento\b/i, /mantenimiento/i, /renovaci[oó]n/i, /recordatorios/i, /volver\s+a\s+comprar/i, /fidelizaci[oó]n/i, /no\s+vuelven/i, /compran\s+una\s+vez/i],
    apertura: 'Por lo que cuentas, el problema parece estar en que el cliente no vuelve. Compra una vez, pero hoy no hay algo que sistemáticamente lo traiga de regreso. Eso puede hacer que la recompra dependa solo de que él se acuerde por su cuenta.',
    preguntas: ['hace_seguimiento', 'cada_cuanto_podria_volver', 'que_le_haria_volver', 'como_te_encuentran_de_nuevo'],
    friccionIds: [],
    recorrido: 'Compra → Se le hace seguimiento en el momento correcto → Vuelve o renueva',
    soluciones: ['Recordatorios automáticos', 'Historial de cliente', 'Campañas segmentadas', 'Seguimiento por WhatsApp']
  }
};

function clasificarPatron(texto) {
  const s = texto.toLowerCase();
  const scores = {};
  Object.keys(PATRONES).forEach(k => { scores[k] = PATRONES[k].senales.filter(rx => rx.test(s)).length; });
  const ranked = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
  const top = ranked[0];
  const relevantes = ranked.filter(k => scores[k] > 0);
  return { tipo: scores[top] > 0 ? top : 'default', score: scores[top], relevantes, scores };
}

// ============ EXTRACCIÓN DE HECHOS ============
// Cada extractor es independiente y genérico (no depende del sector). Un
// hecho solo se guarda si el texto lo afirma explícitamente — nunca se
// inventa ni se asume un valor por defecto (regla de no inventar).
const AP_OBJETOS = ['facturas', 'nómina', 'nomina', 'pensiones', 'inventario', 'medicamentos', 'clientes', 'beneficiarios', 'proyectos', 'contratos', 'pagos', 'cobros', 'pedidos', 'historias clínicas', 'historial', 'historiales', 'pacientes', 'mascotas', 'empleados', 'proveedores', 'matrículas', 'matriculas', 'estudiantes', 'productos', 'pólizas', 'polizas', 'solicitudes', 'órdenes', 'ordenes', 'citas', 'casos', 'reservas', 'fichas', 'registros', 'formularios', 'documentos', 'reportes'];
const AP_FUENTES = ['excel', 'plataforma', 'sistema', 'base de datos', 'pdf', 'formulario', 'correo', 'whatsapp', 'drive', 'sheets', 'word', 'erp', 'crm', 'carpetas', 'papel'];

function detectarFrecuenciaEnTexto(texto) {
  const s = texto.toLowerCase();
  // \b en todos los patrones: sin esto, "anual" hacía match dentro de
  // "manualmente" y marcaba frecuencia Anual en textos que solo decían
  // que el proceso era manual — un hecho inventado a partir de ruido.
  if (/\bcada d[ií]a\b|\bdiari[ao]s?\b|\bcada noche\b/.test(s)) return 'Diaria';
  if (/\bcada semana\b|\bsemanal(es)?\b/.test(s)) return 'Semanal';
  if (/\bquincenal(es)?\b|\bcada quince\b/.test(s)) return 'Quincenal';
  if (/\bcada mes\b|\bmensual(es)?\b|\bmes\s+a\s+mes\b/.test(s)) return 'Mensual';
  if (/\bcada a[ñn]o\b|\banual(es)?\b/.test(s)) return 'Anual';
  if (/\bocasional(es)?\b|\bde vez en cuando\b|\brara vez\b/.test(s)) return 'Ocasional';
  return null;
}
function detectarEsfuerzoEnTexto(texto) {
  const s = texto.toLowerCase();
  const horas = s.match(/(\d+)\s*(?:a\s*\d+\s*)?h(?:oras?)?\b/);
  if (horas) {
    const n = parseInt(horas[1], 10);
    if (n < 1) return 'Menos de 1h';
    if (n <= 3) return '1–3h';
    if (n <= 6) return '3–6h';
    return 'Más de 6h';
  }
  if (/todo el d[ií]a|el d[ií]a entero/.test(s)) return 'Más de 6h';
  if (/medio d[ií]a/.test(s)) return '3–6h';
  if (/\d+\s*minutos?/.test(s)) return 'Menos de 1h';
  return null;
}
function detectarCantidad(texto) {
  const m = texto.match(/(\d+)\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)?)/i);
  return m ? m[0].trim().replace(/\s+/g, ' ') : null;
}
function detectarObjeto(texto) {
  const s = texto.toLowerCase();
  // Se toma la coincidencia que aparece más temprano EN EL TEXTO (no la
  // primera del diccionario) — así "12 documentos... reporte de nómina"
  // reconoce "documentos" como el objeto central, no "nómina" solo porque
  // esa palabra esté antes en la lista interna.
  let mejor = null, mejorIdx = Infinity;
  AP_OBJETOS.forEach(o => { const idx = s.indexOf(o); if (idx !== -1 && idx < mejorIdx) { mejor = o; mejorIdx = idx; } });
  if (mejor) return mejor;
  // Fallback genérico: qué viene después de un verbo típico de intake, sin
  // depender de una lista cerrada de sustantivos por profesión.
  const m = texto.match(/(?:tengo que|me toca|debo|necesito|tengo)\s+([a-záéíóúñ\s]{3,40}?)(?:[.,]|$)/i);
  return m ? m[1].trim() : null;
}
function detectarFuente(texto) {
  const s = texto.toLowerCase();
  return AP_FUENTES.find(f => s.includes(f)) || null;
}
function detectaSolucionPropuesta(texto) {
  return /\b(quiero|necesito|me gustar[ií]a)\s+(un|una)\s+(app|aplicaci[oó]n|bot|sistema|plataforma|software)\b/i.test(texto);
}
// Señal para el patrón "elegir": no es una pregunta dedicada, se detecta
// en cualquier respuesta del caso — igual que frecuencia/esfuerzo — para no
// gastar una pregunta completa en algo que casi siempre se menciona solo.
function detectarSabeElegir(texto) {
  const s = texto.toLowerCase();
  if (/no\s+sabe|no\s+tiene\s+claro|no\s+s[ée]\s+cu[aá]l|le\s+preguntan|pregunta(n)?\s+mucho|se\s+pierde|se\s+confunde|no\s+encuentra/.test(s)) return 'no_sabe';
  if (/ya\s+sabe|tiene\s+claro|sabe\s+lo\s+que\s+quiere|llega\s+decidido/.test(s)) return 'sabe';
  return null;
}
function esRespuestaAmbigua(texto) {
  const s = texto.toLowerCase().trim();
  // OJO: \w y \b en JS solo reconocen [A-Za-z0-9_] — una tilde (é, í, á...)
  // justo antes de un \b rompe el boundary y el patrón deja de matchear
  // ("no sé" con tilde no matcheaba /no\s+s[ée]\b/). Por eso aquí el corte
  // de palabra se hace con un lookahead explícito que sí conoce acentos,
  // en vez de \b, en cualquier patrón que termine en una vocal con tilde.
  const finPalabra = '(?![a-záéíóúñ])';
  return new RegExp('no\\s+s[ée]' + finPalabra).test(s)
    || /no\s+tengo\s+idea/.test(s)
    || /m[aá]s\s+o\s+menos/.test(s)
    // "depende" solo cuenta como respuesta ambigua si NO va seguido de una
    // explicación ("depende de la cantidad" es información real, no un
    // esquive — esto importa mucho para el patrón "cotizar", donde
    // "depende de X" es justo la respuesta buena a la pregunta decisiva).
    || /\bdepende\b(?!\s+de\b)/.test(s)
    || /no\s+estoy\s+segur/.test(s)
    || /otra\s+persona/.test(s)
    || /^tal\s+vez\b/.test(s)
    || new RegExp('^quiz[aá]s' + finPalabra).test(s)
    || /^creo\s+que\b/.test(s);
}

// Lee TODOS los hechos genéricos que el texto afirma. Se llama sobre cada
// mensaje del usuario (no solo el primero) — así una respuesta larga con
// ruido igual aporta datos aunque no conteste literalmente la pregunta.
function extraerHechos(texto) {
  const h = {};
  const frecuencia = detectarFrecuenciaEnTexto(texto); if (frecuencia) h.frecuencia = frecuencia;
  const esfuerzo = detectarEsfuerzoEnTexto(texto); if (esfuerzo) h.esfuerzo = esfuerzo;
  const cantidad = detectarCantidad(texto); if (cantidad) h.cantidad = cantidad;
  const objeto = detectarObjeto(texto); if (objeto) h.objeto = objeto;
  const fuente = detectarFuente(texto); if (fuente) h.fuente = fuente;
  if (detectaSolucionPropuesta(texto)) h.solucion_propuesta_usuario = true;
  const sabeElegir = detectarSabeElegir(texto); if (sabeElegir) h.sabe_elegir = sabeElegir;
  return h;
}
function fusionarHechos(c, nuevos) {
  Object.keys(nuevos).forEach(k => { if (c.hechos[k] === undefined || c.hechos[k] === null) c.hechos[k] = nuevos[k]; });
}

// ============ CATÁLOGO DE PREGUNTAS DE ALTO VALOR ============
// Una por patrón — la que más cambia qué le recomendamos (regla 4 y 11 del
// brief: cada pregunta debe tener una razón; máximo 3-4, casi siempre 1).
// Una respuesta puede no tener marcadores de incertidumbre ("no sé",
// "depende") y aun así no responder nada concreto — reconoce la EXISTENCIA
// de un dato sin decir cuál es (ej. "en un formato que tenemos"). Esto
// también debe forzar una reformulación, no solo la incertidumbre explícita.
function esRespuestaVaga(texto) {
  const s = texto.toLowerCase().trim().replace(/[.!]+$/, '');
  return /^(en\s+)?(un|una|el|la|los|las)\s+(formato|sistema|proceso|forma|manera)\s+que\s+tenemos$/.test(s)
      || /^(ya\s+)?(lo\s+)?tenemos(\s+algo)?$/.test(s)
      || /^(algo\s+)?as[ií]$/.test(s)
      || s.length < 4;
}

// "guardar" devuelve true si logró interpretar algo concreto y false si la
// respuesta fue vaga — un false dispara UNA reformulación (ver
// responderCaso) en vez de aceptar cualquier texto como hecho.
// Fábrica para preguntas de texto libre: guarda la respuesta tal cual la
// escribió la persona (nunca se reinterpreta ni se completa), y solo pide
// reformular si la respuesta fue detectada como vaga (ver esRespuestaVaga).
function slotTexto(campo, preguntaTxt, reformularTxt) {
  return {
    pregunta: () => preguntaTxt,
    reformular: () => reformularTxt,
    guardar: (texto, c) => { if (esRespuestaVaga(texto)) return false; c.hechos[campo] = texto.trim(); return true; }
  };
}

const SLOTS = {
  // — vender —
  friccion_venta: slotTexto('friccion_venta',
    '¿Qué ocurre después de que alguien muestra interés: se pierde el contacto, tarda mucho en responder, o no sabe qué hacer para comprar?',
    'Sin problema — pensando en la última vez que alguien preguntó y no compró, ¿qué pasó justo después?'),
  canal_contacto: slotTexto('canal_contacto',
    '¿Por dónde te contactan principalmente: WhatsApp, Instagram, llamada, otro?',
    'Sin problema — ¿cuál es el canal donde más te escriben?'),
  que_preguntan_antes_comprar: slotTexto('que_preguntan_antes_comprar',
    '¿Qué suelen preguntar antes de decidirse a comprar?',
    'Piensa en la última venta: ¿qué te preguntó esa persona antes de decidirse?'),
  que_pasa_si_no_respondes_rapido: slotTexto('que_pasa_si_no_respondes_rapido',
    '¿Qué pasa si no alcanzas a responder rápido — vuelven a escribir o se van con otro?',
    '¿Notas que se pierden ventas cuando te demoras en contestar?'),

  // — elegir —
  que_debe_elegir: slotTexto('que_debe_elegir',
    '¿Qué tiene que elegir actualmente tu cliente?',
    'Sin problema — ¿entre qué está decidiendo tu cliente: productos, servicios, opciones, paquetes?'),
  cuantas_opciones: slotTexto('cuantas_opciones',
    '¿Cuántas opciones tiene aproximadamente?',
    'Dame un número aproximado — ¿son pocas (menos de 10) o son muchas?'),
  que_pregunta_antes_elegir: slotTexto('que_pregunta_antes_elegir',
    '¿Qué suele preguntar antes de decidir?',
    'Piensa en la última vez: ¿qué te preguntó esa persona antes de elegir?'),
  como_ayudas_elegir: slotTexto('como_ayudas_elegir',
    '¿Cómo lo ayudas actualmente a elegir?',
    '¿Le explicas tú directamente, le mandas un catálogo, o queda por su cuenta?'),
  que_pasa_sin_encontrar: slotTexto('que_pasa_sin_encontrar',
    '¿Qué pasa cuando no encuentra rápidamente una opción?',
    '¿Se va, te escribe con más preguntas, o elige algo sin estar seguro?'),

  // — agendar —
  que_agenda: slotTexto('que_agenda',
    '¿Qué puede agendar o reservar?',
    'Sin problema — ¿qué tipo de cita, turno o reserva maneja tu negocio?'),
  como_agenda_hoy: slotTexto('como_agenda_hoy',
    '¿Cómo lo hacen actualmente?',
    '¿Coordinan por WhatsApp o llamada a mano, o ya usas algún calendario?'),
  info_antes_confirmar: slotTexto('info_antes_confirmar',
    '¿Qué información necesitas antes de confirmar?',
    'Piensa en la última cita que confirmaste — ¿qué datos necesitaste pedir antes?'),
  quien_administra_agenda: slotTexto('quien_administra_agenda',
    '¿Quién administra actualmente la agenda?',
    '¿Lo haces tú directamente o alguien más de tu equipo?'),
  que_pasa_despues_reservar: slotTexto('que_pasa_despues_reservar',
    '¿Qué ocurre después de reservar?',
    '¿Se manda una confirmación, un recordatorio, o queda solo agendado sin más seguimiento?'),

  // — consultar —
  que_preguntan_repetido: slotTexto('que_preguntan_repetido',
    '¿Qué preguntas recibes repetidamente?',
    'Piensa en esta semana — ¿cuál fue la pregunta que más se repitió?'),
  respuesta_depende: {
    pregunta: () => '¿Las respuestas que das dependen de cada cliente, o casi siempre son la misma?',
    reformular: () => '¿Podrías escribir la respuesta una sola vez y que sirva para casi todos, o cada caso es realmente distinto?',
    guardar: (texto, c) => {
      const s = texto.toLowerCase();
      if (/depende|cada\s+(cliente|caso|producto)|var[ií]a/.test(s)) { c.hechos.respuesta_depende = 'depende'; return true; }
      if (/siempre\s+(la\s+)?misma|igual\s+para\s+todos|no\s+depende|la\s+misma/.test(s)) { c.hechos.respuesta_depende = 'fija'; return true; }
      return false;
    }
  },
  que_podria_autoconsultar: slotTexto('que_podria_autoconsultar',
    '¿Qué información podría consultar el cliente por sí mismo?',
    '¿Hay algo que ya expliques siempre igual y que podría estar escrito en algún lado?'),
  cuando_interviene_persona: slotTexto('cuando_interviene_persona',
    '¿En qué momento debe intervenir una persona?',
    '¿En qué punto la consulta ya no se puede resolver sola y necesita que tú o alguien del equipo responda?'),

  // — cotizar —
  de_que_depende_precio: slotTexto('de_que_depende_precio',
    '¿De qué depende el precio en tu caso: cantidad, medidas, tipo de servicio, otra cosa?',
    'Sin problema — dame un ejemplo: ¿qué cambia entre una cotización barata y una cara?'),
  que_necesitas_para_cotizar: slotTexto('que_necesitas_para_cotizar',
    '¿Qué información necesitas del cliente para poder cotizar?',
    'Piensa en la última cotización que armaste — ¿qué datos le pediste primero?'),
  cuanto_tardas_cotizar: slotTexto('cuanto_tardas_cotizar',
    '¿Cuánto te toma armar una cotización hoy?',
    '¿Es cosa de minutos, o te toma horas o incluso días?'),
  que_pasa_mientras_espera: slotTexto('que_pasa_mientras_espera',
    '¿Qué pasa mientras el cliente espera tu cotización — sigue buscando en otro lado?',
    '¿Notas que algunos se van con otro mientras esperan tu respuesta?'),

  // — volver —
  hace_seguimiento: {
    pregunta: () => '¿Hoy haces algún tipo de seguimiento a quien ya te compró, o queda ahí hasta que vuelve por su cuenta?',
    reformular: () => '¿Le escribes tú en algún momento después de la compra, aunque sea de vez en cuando?',
    guardar: (texto, c) => {
      const s = texto.toLowerCase();
      if (/no\s+s[ée]|no\s+tengo\s+idea/.test(s)) { c.hechos.hace_seguimiento = 'desconocido'; return true; }
      if (/\bno\b/.test(s) && !/no\s+s[ée]/.test(s)) { c.hechos.hace_seguimiento = 'no'; return true; }
      if (/\bs[ií]\b|a\s+veces|algo\s+hago|de\s+vez\s+en\s+cuando/.test(s)) { c.hechos.hace_seguimiento = 'si'; return true; }
      return false;
    }
  },
  cada_cuanto_podria_volver: slotTexto('cada_cuanto_podria_volver',
    '¿Cada cuánto tendría sentido que un cliente vuelva a comprarte o renovar?',
    'Aunque sea aproximado — ¿estamos hablando de semanas, meses, o es algo más esporádico?'),
  que_le_haria_volver: slotTexto('que_le_haria_volver',
    '¿Qué haría que un cliente decida volver en vez de buscar en otro lado?',
    '¿Un recordatorio, una oferta, o simplemente que se acuerde de ti a tiempo?'),
  como_te_encuentran_de_nuevo: slotTexto('como_te_encuentran_de_nuevo',
    '¿Hoy cómo te vuelve a encontrar un cliente cuando quiere volver?',
    '¿Te busca en WhatsApp, en redes, o tiene que preguntar de nuevo cómo contactarte?')
};

// ============ CHIPS DE RESPUESTA RÁPIDA (capa visual, no lógica) ============
// Viven fuera de SLOTS a propósito: no tocan pregunta()/guardar()/
// reformular() de ningún slot. Al hacer clic, el chip solo llama a
// responderCaso(texto) con ese texto — se comporta EXACTAMENTE como si el
// usuario lo hubiera escrito y enviado. El campo de texto libre sigue
// siempre visible debajo; esto es un atajo, no un formulario cerrado.
const SLOT_CHIPS = {
  friccion_venta: ['Deja de responder', 'Tarda en decidir', 'No sabe cómo comprar'],
  canal_contacto: ['WhatsApp', 'Instagram', 'Llamada', 'Otro canal'],
  que_preguntan_antes_comprar: ['El precio', 'Si funciona para su caso', 'Los tiempos de entrega'],
  que_pasa_si_no_respondes_rapido: ['Se va con otro', 'Deja de escribir', 'Vuelve a preguntar después'],
  que_debe_elegir: ['Entre productos', 'Entre servicios', 'Entre paquetes o planes'],
  cuantas_opciones: ['Menos de 10', 'Entre 10 y 30', 'Más de 30'],
  que_pregunta_antes_elegir: ['Precio', 'Cuál le sirve mejor', 'Diferencias entre opciones'],
  como_ayudas_elegir: ['Le explico yo directamente', 'Le mando un catálogo', 'Queda por su cuenta'],
  que_pasa_sin_encontrar: ['Se va sin decidir', 'Me escribe con más preguntas', 'Elige algo sin estar seguro'],
  que_agenda: ['Citas de servicio', 'Turnos o reservas', 'Sesiones o consultas'],
  como_agenda_hoy: ['Coordinamos por WhatsApp', 'Coordinamos por llamada', 'Ya uso un calendario'],
  info_antes_confirmar: ['Fecha y hora disponible', 'Datos del cliente', 'Tipo de servicio que necesita'],
  quien_administra_agenda: ['Yo directamente', 'Alguien de mi equipo', 'Nadie fijo'],
  que_pasa_despues_reservar: ['Mando confirmación manual', 'Mando recordatorio', 'Queda agendado sin más'],
  que_preguntan_repetido: ['Precios y planes', 'Cómo funciona el servicio', 'Disponibilidad'],
  respuesta_depende: ['Depende de cada cliente', 'Siempre la misma'],
  que_podria_autoconsultar: ['Precios', 'Cómo funciona el proceso', 'Requisitos o condiciones'],
  cuando_interviene_persona: ['Cuando es un caso particular', 'Cuando hay que decidir algo', 'Casi siempre interviene alguien'],
  de_que_depende_precio: ['Cantidad', 'Medidas', 'Tipo de servicio'],
  que_necesitas_para_cotizar: ['Cantidad o medidas', 'Tipo de producto o servicio', 'Ubicación o fecha'],
  cuanto_tardas_cotizar: ['Minutos', 'Un par de horas', 'Uno o varios días'],
  que_pasa_mientras_espera: ['Sigue buscando en otro lado', 'Espera sin más', 'Deja de responder'],
  hace_seguimiento: ['Sí, a veces', 'No, nada'],
  cada_cuanto_podria_volver: ['Cada semana', 'Cada mes', 'Es esporádico'],
  que_le_haria_volver: ['Un recordatorio a tiempo', 'Una oferta puntual', 'Que se acuerde de mí'],
  como_te_encuentran_de_nuevo: ['Me buscan en WhatsApp', 'Me buscan en redes', 'Tienen que volver a preguntar']
};

// ============ ESTADO ÚNICO DE CONVERSACIÓN + MEMORIA DEL CASO ============
const MAX_PREGUNTAS = 5;
function casoNuevo() {
  return {
    activo: false, patron: null, patronesDetectados: null,
    hechos: {}, textoOriginal: '', casoSugerido: null,
    preguntasHechas: [], slotPendiente: null, reformulado: {},
    investigar: false, origen: 'directo', aperturaMostrada: false,
    miniDemoCompletada: false
  };
}
let caso = casoNuevo();

function mostrarInputChat(mostrar) {
  const wrap = document.getElementById('chatInpWrap');
  if (wrap) wrap.style.display = mostrar ? 'flex' : 'none';
}

function reiniciarSiHabiaCaso() {
  const b = document.getElementById('chatMsgs');
  if (b.dataset.used === '1') {
    const div = document.createElement('div');
    div.style.cssText = 'text-align:center;margin:16px 0 6px;font-family:\'DM Mono\',monospace;font-size:9.5px;color:var(--ink3);letter-spacing:.5px;text-transform:uppercase';
    div.textContent = '— nuevo caso —';
    b.appendChild(div);
  } else {
    b.dataset.used = '1';
  }
}

// Punto de entrada ÚNICO para arrancar un caso desde texto libre (hero o
// cambio de tema a mitad de conversación).
function iniciarCaso(texto, origen) {
  texto = (texto || '').trim();
  if (!texto) return;
  caso = casoNuevo();
  caso.activo = true;
  caso.origen = origen || 'directo';
  caso.textoOriginal = texto;
  const clasif = clasificarPatron(texto);
  fusionarHechos(caso, extraerHechos(texto));

  const s = texto.toLowerCase();
  let casoSugerido = null, mejorScore = 0;
  KB.casos.forEach(cs => {
    const score = cs.senales.filter(rx => rx.test(s)).length;
    if (score >= 2 && score > mejorScore) { casoSugerido = cs; mejorScore = score; }
  });
  caso.casoSugerido = casoSugerido;

  trackEvent('inicio_diagnostico', { origen: caso.origen });
  trackEvent('start_diagnosis', { origen: caso.origen });
  trackEvent('problema_enviado', { texto: texto, patron: clasif.tipo });

  reiniciarSiHabiaCaso();
  addMsg(texto, 'u');
  scrollToDiag();

  // Caso fuera de los 6 patrones: no forzar una clasificación ni arrastrar
  // a la persona por una pregunta más — se dice honestamente que no encaja
  // y se cierra el caso escalando a Daniel (regla "caso fuera de los
  // patrones" del brief).
  if (clasif.tipo === 'default') {
    caso.patron = 'default';
    setTimeout(escalarSinPatron, 550);
    return;
  }

  // Regla 13 del brief: si el texto dispara más de un patrón, no forzar
  // uno solo — mostrar las oportunidades detectadas y dejar que la
  // persona elija cuál mejorar primero, en vez de adivinar por ella.
  if (clasif.relevantes.length >= 2) {
    caso.patronesDetectados = clasif;
    setTimeout(mostrarOportunidadesMultiples, 550);
  } else {
    caso.patron = clasif.tipo;
    setTimeout(procesarSiguientePaso, 550);
  }
}

// Punto de entrada directo desde uno de los 6 botones de patrón: la
// persona ya nos dio la clasificación, no hay que inferirla del texto.
function iniciarCasoDesdePatron(key) {
  const p = PATRONES[key];
  if (!p) return;
  trackEvent('click_problem', { patron: key });
  caso = casoNuevo();
  caso.activo = true;
  caso.origen = 'boton_patron';
  caso.patron = key;
  caso.textoOriginal = p.label;
  trackEvent('inicio_diagnostico', { origen: caso.origen });
  trackEvent('start_diagnosis', { origen: caso.origen, patron: key });
  reiniciarSiHabiaCaso();
  addMsg(p.icono + ' ' + p.label, 'u');
  scrollToDiag();
  setTimeout(procesarSiguientePaso, 550);
}

// Punto de entrada ÚNICO para responder dentro de un caso activo (chip o
// texto libre llegan aquí siempre por el mismo camino).
function responderCaso(texto) {
  texto = (texto || '').trim();
  if (!texto || !caso.activo) return;

  const slotId = caso.slotPendiente;

  // Cambio de tema: si la respuesta trae un disparador de problema nuevo y
  // no encaja con el caso activo, se abre un caso nuevo en vez de forzarla
  // como respuesta al slot pendiente.
  const disparadorNuevoCaso = /\b(tengo que|necesito|me toca|otra pregunta|otra cosa|quiero mejor)\b/i.test(texto);
  const clasifNueva = clasificarPatron(texto);
  if (slotId && disparadorNuevoCaso && clasifNueva.tipo !== 'default' && clasifNueva.tipo !== caso.patron && clasifNueva.score >= 2 && !esRespuestaAmbigua(texto)) {
    addMsg(texto, 'u');
    scrollToDiag();
    setTimeout(() => iniciarCaso(texto, 'chat_nuevo_tema'), 400);
    return;
  }

  addMsg(texto, 'u');
  scrollToDiag();
  fusionarHechos(caso, extraerHechos(texto));

  if (slotId) {
    const slot = SLOTS[slotId];
    // Dos motivos para reformular en vez de aceptar la respuesta: (a) trae
    // un marcador explícito de incertidumbre ("no sé", "depende"), o (b)
    // el propio slot no logró interpretar nada concreto (guardar → false),
    // como cuando alguien confirma que "algo" existe sin decir qué es.
    const esSegundoIntento = caso.reformulado[slotId] === true;
    const fnGuardar = (esSegundoIntento && slot.guardarReformulado) ? slot.guardarReformulado : slot.guardar;
    const ambigua = esRespuestaAmbigua(texto);
    const yaResuelto = !ambigua ? fnGuardar(texto, caso) : false;
    const necesitaReformular = (ambigua || yaResuelto === false) && !caso.reformulado[slotId];
    if (necesitaReformular) {
      caso.reformulado[slotId] = true;
      setTimeout(() => { addMsg(slot.reformular(caso), 'b'); mostrarInputChat(true); }, 450);
      return;
    }
    if ((ambigua || yaResuelto === false) && caso.reformulado[slotId]) {
      // Ya se intentó aclarar una vez y sigue sin resolverse: el motor deja
      // de insistir en este slot y lo marca como no confirmable.
      caso.hechos[slotId] = 'sin_confirmar';
      caso.investigar = true;
    } else if (yaResuelto) {
      trackEvent('complete_question', { slot: slotId, patron: caso.patron });
    }
    caso.slotPendiente = null;
  }
  setTimeout(procesarSiguientePaso, 450);
}

// ============ MOTOR DE DECISIÓN DE PREGUNTAS ============
// Recorre el banco de preguntas del patrón activo EN ORDEN y devuelve la
// primera que todavía no tiene respuesta. Nunca pregunta dos veces lo mismo
// (un slot resuelto deja de estar "undefined") y nunca supera MAX_PREGUNTAS.
function elegirSiguientePregunta(c) {
  if (c.preguntasHechas.length >= MAX_PREGUNTAS) return null;
  const p = PATRONES[c.patron];
  if (!p) return null;
  const pendiente = p.preguntas.find(slotId => c.hechos[slotId] === undefined);
  return pendiente ? { slot: pendiente } : null;
}

function procesarSiguientePaso() {
  const p = PATRONES[caso.patron];
  // Antes de la primera pregunta, se muestra la lectura del problema en
  // lenguaje humano (no un porcentaje) — regla del brief: "antes de
  // proponer una solución, entender cómo funciona hoy".
  if (p && !caso.aperturaMostrada) {
    caso.aperturaMostrada = true;
    addMsg(p.apertura, 'b');
    setTimeout(() => {
      addMsg('Antes de proponerte una solución, quiero entender un poco mejor cómo funciona hoy.', 'b');
      setTimeout(procesarSiguientePaso, 700);
    }, 900);
    return;
  }

  const decision = elegirSiguientePregunta(caso);
  if (!decision) return mostrarTyping();

  caso.slotPendiente = decision.slot;
  caso.preguntasHechas.push({ slot: decision.slot });
  addMsg(SLOTS[decision.slot].pregunta(caso), 'b');
  mostrarInputChat(true);
  // Capa visual opcional: accesos rápidos por si no sabe cómo empezar a
  // responder. Al hacer clic llaman a responderCaso() con ese texto,
  // exactamente igual que si el usuario lo hubiera escrito — no cambia
  // pregunta(), guardar() ni la clasificación en absoluto.
  if (SLOT_CHIPS[decision.slot]) addChips(SLOT_CHIPS[decision.slot], (v) => responderCaso(v));
}

// Regla 13 del brief: cuando el texto libre dispara varios patrones a la
// vez, se muestran como oportunidades con un ranking relativo (no una
// probabilidad real — es un orden, no una medición) y la persona elige
// cuál mejorar primero, en vez de que el motor adivine por ella.
function mostrarOportunidadesMultiples() {
  const clasif = caso.patronesDetectados;
  const top = clasif.relevantes.slice(0, 3);
  const topScore = clasif.scores[top[0]] || 1;
  const pct = (k) => Math.min(95, Math.round(60 + 35 * (clasif.scores[k] / topScore)));
  const lineas = top.map(k => '· ' + PATRONES[k].label + ' — ' + pct(k) + '%').join('<br/>');
  addMsgHTML('Detectamos varias oportunidades en tu negocio:<br/>' + lineas, 'b');
  setTimeout(() => {
    addMsg('¿Cuál quieres mejorar primero?', 'b');
    addChips(top.map(k => PATRONES[k].label), (v) => {
      addMsg(v, 'u');
      caso.patron = top.find(k => PATRONES[k].label === v) || top[0];
      setTimeout(procesarSiguientePaso, 450);
    });
  }, 500);
}

// Caso fuera de los 6 patrones: no se inventa un recorrido genérico —
// se dice honestamente y se cierra directo con la opción de hablar con
// Daniel (regla "caso fuera de los patrones" del brief).
function escalarSinPatron() {
  addMsgHTML('Esto no encaja claramente con los problemas que estamos diagnosticando actualmente.<br/>Prefiero no darte una solución genérica que quizá no tenga sentido.<br/><br/>Cuéntame un poco más sobre el problema y lo revisamos contigo.', 'b');
  setTimeout(cerrarCaso, 900);
}

function mostrarTyping() {
  mostrarInputChat(false);
  const b = document.getElementById('chatMsgs');
  const t = document.createElement('div');
  t.className = 'msg msg-b'; t.id = 'typing'; t.textContent = 'Analizando tu proceso...';
  t.style.cssText = 'opacity:0;transform:translateY(7px);transition:opacity .3s,transform .3s;font-style:italic;color:var(--ink3)';
  b.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)' });
  b.scrollTop = b.scrollHeight;
  setTimeout(cerrarCaso, 1200);
}

// ============ SALIDA DEL DIAGNÓSTICO ============
// "Problema principal" y "Oportunidad" por patrón — se construyen con lo
// que la persona realmente contestó, nunca con un dato que no dio. El
// "problema" reutiliza la misma apertura que ya se mostró en el chat (regla:
// consistencia entre lo que se dijo y lo que queda en el resultado). La
// "fricción" se arma solo con hechos que la persona afirmó — si no hay
// suficientes, se dice explícitamente que falta esa información.
function armarFriccion(c, ids) {
  const partes = ids.map(id => c.hechos[id]).filter(v => v && v !== 'sin_confirmar' && v !== 'desconocido');
  if (!partes.length) return 'Necesitamos conocer esto para recomendarte el recorrido correcto.';
  return partes.join(' ');
}
const NARRATIVA = {
  vender: {
    problema: () => PATRONES.vender.apertura,
    friccion: (c) => armarFriccion(c, PATRONES.vender.friccionIds),
    oportunidad: () => 'Hay una oportunidad clara para guiar ese interés hasta la compra, en vez de dejar que la persona insista por su cuenta.'
  },
  elegir: {
    problema: () => PATRONES.elegir.apertura,
    friccion: (c) => armarFriccion(c, PATRONES.elegir.friccionIds),
    oportunidad: (c) => c.hechos.sabe_elegir === 'sabe' ? 'Como ya suelen saber qué buscan, probablemente el mayor impacto está en otro punto del recorrido.' : 'Hay una oportunidad clara para ayudarles a decidir sin que tengan que preguntarte uno por uno.'
  },
  agendar: {
    problema: () => PATRONES.agendar.apertura,
    friccion: (c) => armarFriccion(c, PATRONES.agendar.friccionIds),
    oportunidad: () => 'Hay una oportunidad clara para que el cliente vea disponibilidad y agende sin ida y vuelta contigo.'
  },
  consultar: {
    problema: () => PATRONES.consultar.apertura,
    friccion: (c) => armarFriccion(c, PATRONES.consultar.friccionIds),
    oportunidad: (c) => c.hechos.respuesta_depende === 'depende' ? 'Hay una oportunidad de guiar la consulta paso a paso antes de que hable contigo o el profesional.' : 'Hay una oportunidad clara: si la respuesta se repite, se puede resolver sin que la escribas cada vez.'
  },
  cotizar: {
    problema: () => PATRONES.cotizar.apertura,
    friccion: (c) => armarFriccion(c, PATRONES.cotizar.friccionIds),
    oportunidad: () => 'Hay una oportunidad de darle una primera estimación al momento, sin que tenga que esperar tu respuesta.'
  },
  volver: {
    problema: () => PATRONES.volver.apertura,
    friccion: (c) => {
      const partes = [];
      if (c.hechos.hace_seguimiento === 'no') partes.push('Hoy no hay ningún seguimiento después de la compra.');
      else if (c.hechos.hace_seguimiento === 'si') partes.push('Hoy el seguimiento existe, pero es manual.');
      if (c.hechos.como_te_encuentran_de_nuevo) partes.push(c.hechos.como_te_encuentran_de_nuevo);
      return partes.length ? partes.join(' ') : 'Necesitamos conocer esto para recomendarte el recorrido correcto.';
    },
    oportunidad: () => 'Hay una oportunidad de traer de vuelta a quien ya te compró, en el momento justo.'
  }
};

// Salidas del diagnóstico: 🟢 oportunidad clara / 🟡 investigar / 🔴 no
// prioritario / 👤 escalar. Nunca se fuerza una salida positiva por
// quedar bien — regla 2 del brief: si no hay evidencia, se dice.
function calcularViabilidad(c) {
  if (c.investigar) {
    return { codigo: '🟡', label: 'Necesita investigación', clase: 'med',
      motivo: 'Hay una oportunidad real, pero depende de algo que todavía no está confirmado. Prefiero comprobarlo antes de decirte que se puede.' };
  }
  if (!c.patron || c.patron === 'default') {
    return { codigo: '👤', label: 'Escalar a Daniel', clase: 'low',
      motivo: 'No quiero darte una respuesta improvisada — este caso necesita que Daniel lo revise directamente.' };
  }
  if (c.patron === 'elegir' && c.hechos.sabe_elegir === 'sabe') {
    return { codigo: '🔴', label: 'No es prioritario todavía', clase: 'low',
      motivo: 'Si tus clientes ya suelen saber qué quieren, un selector o comparador no va a mover mucho la aguja — probablemente hay otra mejora con más impacto.' };
  }
  if (c.hechos.frecuencia === 'Ocasional') {
    return { codigo: '🔴', label: 'No es prioritario todavía', clase: 'low',
      motivo: 'Por lo que cuentas, esto pasa poco — probablemente hay otras mejoras con más impacto antes que esta.' };
  }
  return { codigo: '🟢', label: 'Oportunidad clara', clase: '',
    motivo: 'Hay información suficiente para proponer un recorrido concreto.' };
}

function faltaPorConfirmar(c) {
  const faltantes = [];
  const p = PATRONES[c.patron];
  if (p) {
    p.preguntas.forEach(slotId => {
      if (c.hechos[slotId] === 'sin_confirmar' || c.hechos[slotId] === undefined) faltantes.push(SLOTS[slotId].pregunta(c));
    });
  } else {
    faltantes.push('Todavía no identificamos con claridad en qué parte del recorrido está la oportunidad — hace falta que Daniel lo revise directamente.');
  }
  return faltantes;
}

// cerrarCaso() ya no arma una tarjeta de resultado con badge/grid — eso
// es exactamente lo que la nueva experiencia prohíbe (ver regla 6/9 del
// brief: "no muestres una tarjeta de resultado... simplemente continúa
// la conversación"). Todo el CÁLCULO (viabilidad, narrativa, caso
// sugerido) sigue intacto — solo cambió cómo se presenta: como texto que
// continúa el mismo hilo, con addMsg/addMsgHTML, en vez de una tarjeta.
function cerrarCaso() {
  const typing = document.getElementById('typing'); if (typing) typing.remove();
  mostrarInputChat(false);
  caso.activo = false;

  const viab = calcularViabilidad(caso);
  const p = PATRONES[caso.patron];
  const narr = NARRATIVA[caso.patron];
  const tienePatron = !!(p && narr && (viab.codigo === '🟢' || viab.codigo === '🟡'));

  if (tienePatron) {
    addMsg('Creo que ya entendí dónde está el problema.', 'b');
    setTimeout(() => addMsg(narr.oportunidad(caso), 'b'), 800);
    setTimeout(() => renderRecorridoPersonalizado(caso.patron), 1700);
  } else {
    // 🔴 / 👤 — el propio motor ya explica honestamente por qué (viab.motivo),
    // sin inventar un recorrido que el diagnóstico no puede sostener.
    addMsg(viab.motivo, 'b');
  }

  if (caso.hechos.solucion_propuesta_usuario) {
    setTimeout(() => addMsg('Puede que termine siendo eso — pero primero conviene validar el problema y buscar la forma más simple de resolverlo, antes de asumir la tecnología.', 'b'), tienePatron ? 2500 : 1500);
  }

  // "Ya resolvimos un patrón parecido" — solo cuando el patrón encajó
  // (🟢/🟡); nunca se sugiere automatización interna dentro de esta
  // conversación, ni siquiera de forma indirecta.
  if (caso.casoSugerido && (viab.codigo === '🟢' || viab.codigo === '🟡')) {
    setTimeout(() => {
      addMsgHTML('Ya resolvimos algo parecido: ' + caso.casoSugerido.resumen + ' <span class="ver-caso-link" style="text-decoration:underline;cursor:pointer;font-weight:600">Ver caso real →</span>', 'r');
      const b = document.getElementById('chatMsgs');
      const link = b.lastElementChild.querySelector('.ver-caso-link');
      if (link) link.addEventListener('click', () => {
        trackEvent('cta_seleccionado', { cta: 'ver_caso_sugerido', caso: caso.casoSugerido.id });
        // Los 6 casos internos ya no tienen modal en esta página (viven en
        // sistemas-internos.html) — Hojaldito sí sigue teniendo el suyo aquí.
        if (document.getElementById(caso.casoSugerido.modalId)) abrirModal(caso.casoSugerido.modalId);
        else window.open('sistemas-internos.html', '_blank');
      });
    }, tienePatron ? 2900 : 1900);
  }

  const ctaLabel = viab.codigo === '🔴' ? 'Igual quiero que Daniel lo revise' : (viab.codigo === '👤' ? 'Hablar con Daniel' : 'Quiero diseñar este recorrido');
  const waMsg = 'Hola Daniel, hice el diagnóstico en Automatiza Procesos.\nMi problema: ' + caso.textoOriginal + '\nResultado: ' + viab.codigo + ' ' + viab.label + '\nHechos: ' + JSON.stringify(caso.hechos);
  const waUrl = 'https://wa.me/' + KB.contacto.whatsapp + '?text=' + encodeURIComponent(waMsg);

  trackEvent('diagnostico_completado', { patron: caso.patron, viabilidad: viab.codigo, preguntas: caso.preguntasHechas.length });
  trackEvent('diagnosis_generated', { patron: caso.patron, viabilidad: viab.codigo });
  // Se manda el lead apenas se cierra el caso, sin esperar a que la
  // persona toque un botón — si alguien recibe un 🟢 y cierra la pestaña
  // sin escribir por WhatsApp, este es el único registro que sobrevive.
  saveLead({ tipo_solicitud: 'diagnostico_completado', problema_original: caso.textoOriginal, patron: caso.patron, hechos: caso.hechos, viabilidad: viab.codigo, origen: caso.origen, caso_sugerido: caso.casoSugerido ? caso.casoSugerido.id : null });
  actualizarCtaFinal({
    heading: 'Ya tienes un diagnóstico<br/>listo. <em>Retómalo cuando quieras.</em>',
    sub: viab.codigo + ' ' + viab.label + ' — ' + caso.textoOriginal,
    waUrl: waUrl,
    waLabel: ctaLabel
  });

  const delayFinal = tienePatron ? 3300 : 1400;
  setTimeout(() => {
    addMsgHTML('<a href="' + waUrl + '" target="_blank" style="color:var(--ink);text-decoration:underline;font-weight:600">' + ctaLabel + ' →</a>', 'r');
    document.querySelector('#chatMsgs').lastElementChild.querySelector('a').addEventListener('click', () => {
      trackEvent('cta_seleccionado', { cta: ctaLabel });
      trackEvent('whatsapp_iniciado', { origen: 'resultado_diagnostico' });
      trackEvent('whatsapp_click', { origen: 'resultado_diagnostico', patron: caso.patron });
      saveLead({ tipo_solicitud: ctaLabel, problema_original: caso.textoOriginal, patron: caso.patron, hechos: caso.hechos, viabilidad: viab.codigo, origen: caso.origen, caso_sugerido: caso.casoSugerido ? caso.casoSugerido.id : null });
    });
    // Único punto donde el diagnóstico avisa al resto de la narrativa que
    // terminó — no toca clasificación ni resultado, solo decide si sigue
    // con la mini-simulación (si hay patrón) o pasa directo a la pausa.
    setTimeout(() => {
      if (MINI_DEMO[caso.patron]) iniciarMiniDemo(caso.patron);
      else avanzarNarrativaPostDiagnostico();
    }, 1100);
  }, delayFinal);
}

function addMsg(txt, type) {
  const b = document.getElementById('chatMsgs');
  const m = document.createElement('div');
  m.className = 'msg msg-' + type;
  m.textContent = txt;
  m.style.cssText = 'opacity:0;transform:translateY(7px);transition:opacity .3s,transform .3s';
  b.appendChild(m);
  requestAnimationFrame(() => { m.style.opacity = '1'; m.style.transform = 'translateY(0)' });
  b.scrollTop = b.scrollHeight;
}

function addMsgHTML(html, type) {
  const b = document.getElementById('chatMsgs');
  const m = document.createElement('div');
  m.className = 'msg msg-' + type;
  m.innerHTML = html;
  m.style.cssText = 'opacity:0;transform:translateY(7px);transition:opacity .3s,transform .3s';
  b.appendChild(m);
  requestAnimationFrame(() => { m.style.opacity = '1'; m.style.transform = 'translateY(0)' });
  b.scrollTop = b.scrollHeight;
}

function addChips(options, onPick) {
  const b = document.getElementById('chatMsgs');
  const wrap = document.createElement('div');
  wrap.className = 'diag-quick';
  wrap.style.cssText = 'opacity:0;transition:opacity .3s;margin-top:2px;pointer-events:none';
  options.forEach(opt => {
    const c = document.createElement('button');
    c.type = 'button'; c.className = 'qchip'; c.textContent = opt;
    c.addEventListener('click', () => { wrap.remove(); onPick(opt); });
    wrap.appendChild(c);
  });
  b.appendChild(wrap);
  b.scrollTop = b.scrollHeight;
  requestAnimationFrame(() => { wrap.style.opacity = '1'; b.scrollTop = b.scrollHeight; });
  // Bloquea clics mientras el layout se reacomoda (evita que un clic aterrice en el chip equivocado)
  setTimeout(() => { wrap.style.pointerEvents = 'auto'; }, 350);
}

function scrollToDiag() {
  const el = document.getElementById('chatMsgs');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function esIdea(texto) {
  return /\bidea\b/i.test(texto);
}

// ============ HERO — input principal ============
const heroInput = document.getElementById('heroInput');
const heroSubmit = document.getElementById('heroSubmit');
const heroDefaultPlaceholder = heroInput.placeholder;

function submitHero() {
  const v = heroInput.value;
  if (!v.trim()) return;
  heroInput.value = '';
  if (esIdea(v)) {
    trackEvent('inicio_diagnostico', { origen: 'hero_idea' });
    const box = document.getElementById('ideaBox');
    if (box) box.style.display = 'block';
    const ii = document.getElementById('ideaInput');
    if (ii) { ii.value = v; setTimeout(() => ii.focus(), 200); }
    return;
  }
  iniciarCaso(v, 'hero');
}
heroSubmit.addEventListener('click', submitHero);
heroInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitHero(); } });

// ============ CHAT — input de respuestas dentro de un caso activo ============
// Enter y botón llaman a la misma función; ella es la única puerta de
// entrada para respuestas de seguimiento (texto libre, no solo chips).
const chatFieldInput = document.getElementById('chatFieldInput');
const chatFieldSend = document.getElementById('chatFieldSend');
function enviarRespuestaChat() {
  if (!chatFieldInput) return;
  const v = chatFieldInput.value;
  if (!v.trim()) return;
  chatFieldInput.value = '';
  responderCaso(v);
}
if (chatFieldSend) chatFieldSend.addEventListener('click', enviarRespuestaChat);
if (chatFieldInput) chatFieldInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarRespuestaChat(); } });

// ============ EJEMPLOS DE FRASE EN EL HERO ============
// No son botones de servicio: rellenan el input y corren por el mismo
// camino que si la persona lo hubiera escrito (iniciarCaso), clasificación
// incluida — refuerza que es lenguaje natural, no un menú.
document.querySelectorAll('.examples .ex-chip[data-ej]').forEach(btn => {
  btn.addEventListener('click', () => {
    const texto = btn.dataset.ej;
    heroInput.value = texto;
    iniciarCaso(texto, 'hero_ejemplo');
  });
});

// ============ "TENGO UNA IDEA" — link contextual, no una sección ============
const ideaBox = document.getElementById('ideaBox');
const toggleIdea = document.getElementById('toggleIdea');
if (toggleIdea && ideaBox) {
  toggleIdea.addEventListener('click', () => {
    const abierto = getComputedStyle(ideaBox).display !== 'none';
    ideaBox.style.display = abierto ? 'none' : 'block';
    if (!abierto) document.getElementById('ideaInput').focus();
  });
}

// ============ EVIDENCIA — casos reales ============
// La landing ya muestra evidencia, método, Daniel y cierre siempre
// visibles (no ocultos). Esta función solo desplaza hasta ahí: al
// terminar la conversación completa, o de una sola vez si se pide
// ver la evidencia directamente.
function mostrarTail() {
  const casos = document.getElementById('casos');
  if (casos) casos.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
const skipExplore = document.getElementById('skipExplore');
if (skipExplore) skipExplore.addEventListener('click', () => { trackEvent('cta_seleccionado', { cta: 'ver_evidencia_directo' }); mostrarTail(); });

// ============ EL MOMENTO EN QUE ENTIENDE ============
// Reemplaza lo que antes era la sección "Tu recorrido": ahora es una sola
// línea que continúa la conversación (PATRONES[patron].recorrido, tal
// cual existe, sin inventar nada por paso).
function renderRecorridoPersonalizado(patron) {
  const p = PATRONES[patron];
  if (!p) return;
  addMsgHTML('<em>' + p.recorrido + '</em>', 'r');
}

// ============ EL MOMENTO EN QUE LO PRUEBA ============
// Mismo principio que DEMO_VET_PASOS: NO toca caso/PATRONES/SLOTS ni el
// motor real — es una simulación aparte. Surge como ocurrencia dentro de
// la propia conversación (nunca "prueba nuestra demo"), usa addMsg/
// addChips igual que cualquier otra respuesta del chat.
const MINI_DEMO = {
  vender: { q1: { pregunta: '¿Qué le frena más para comprar?', opciones: ['El precio no está claro', 'Tiene dudas antes de decidir', 'No está seguro de que sea lo que necesita'] }, q2: { pregunta: '¿Qué lo ayudaría a decidirse más rápido?', opciones: ['Ver el precio de una vez', 'Resolver sus dudas sin esperar', 'Que le confirmen que es la opción correcta'] } },
  elegir: { q1: { pregunta: '¿Qué busca principalmente?', opciones: ['Rapidez', 'Precio', 'Mayor acompañamiento'] }, q2: { pregunta: '¿Qué es más importante al recomendarle algo?', opciones: ['Que decida rápido', 'Que no se equivoque', 'Que se sienta acompañado'] } },
  agendar: { q1: { pregunta: '¿Qué necesita saber antes de reservar?', opciones: ['Disponibilidad real', 'Cuánto cuesta', 'Cuánto dura'] }, q2: { pregunta: '¿Qué haría que reserve ahora y no después?', opciones: ['Ver un horario disponible ya', 'Confirmar el precio de una vez', 'Recibir confirmación al instante'] } },
  consultar: { q1: { pregunta: '¿Qué tipo de duda tiene?', opciones: ['Algo que ya explicaste muchas veces', 'Algo específico de su caso', 'No sabe ni por dónde empezar'] }, q2: { pregunta: '¿Qué necesita para resolverla sin escribirte?', opciones: ['Una respuesta clara y directa', 'Una guía paso a paso', 'Hablar con alguien del equipo'] } },
  cotizar: { q1: { pregunta: '¿Qué tiene claro sobre lo que necesita?', opciones: ['Ya sabe exactamente qué quiere', 'Tiene una idea aproximada', 'Todavía no sabe qué pedir'] }, q2: { pregunta: '¿Qué esperaría recibir primero?', opciones: ['Un estimado inmediato', 'Que le pidan los datos clave', 'Hablar directo contigo'] } },
  volver: { q1: { pregunta: '¿Por qué no ha vuelto todavía?', opciones: ['Se le olvidó', 'No sabe si ya es momento', 'No encontró un motivo para volver'] }, q2: { pregunta: '¿Qué lo haría volver?', opciones: ['Un recordatorio a tiempo', 'Una razón concreta para volver', 'Que sea fácil encontrarte de nuevo'] } }
};
function iniciarMiniDemo(patron) {
  const cfg = MINI_DEMO[patron];
  if (!cfg) { avanzarNarrativaPostDiagnostico(); return; }
  addMsg('Si esto fuera para uno de tus clientes, probablemente empezaría así...', 'b');
  setTimeout(() => {
    addMsg(cfg.q1.pregunta, 'b');
    addChips(cfg.q1.opciones, (op) => { addMsg(op, 'u'); setTimeout(() => mostrarMiniDemoQ2(patron, op), 500); });
  }, 1000);
}
function mostrarMiniDemoQ2(patron, a1) {
  const cfg = MINI_DEMO[patron];
  addMsg(cfg.q2.pregunta, 'b');
  addChips(cfg.q2.opciones, (op) => { addMsg(op, 'u'); setTimeout(() => mostrarMiniDemoResultado(patron, a1, op), 500); });
}
function mostrarMiniDemoResultado(patron, a1, a2) {
  addMsg('Por lo que elegiste — ' + a1 + ' y ' + a2 + ' — probablemente lo primero es resolver justo eso, en vez de hacer que tu cliente lo repita cada vez que pregunta.', 'b');
  caso.miniDemoCompletada = true;
  setTimeout(avanzarNarrativaPostDiagnostico, 1600);
}

// ============ LA PAUSA ============
// El único quiebre deliberado de toda la conversación. Solo se arma
// cuando sí hubo un diagnóstico real (caso.textoOriginal existe) — si el
// visitante saltó directo a ver la evidencia, esto nunca se llama, y por
// lo tanto nunca se le dice "viviste" algo que no vivió.
function renderRevelacion() {
  if (!caso.textoOriginal) return;
  const textoSeguro = caso.textoOriginal.replace(/</g, '&lt;');
  const pasos = ['Entraste con una pregunta.', 'Contaste: "' + textoSeguro + '"', 'Te hicimos algunas preguntas.', 'Entendimos dónde estaba la fricción.'];
  if (caso.miniDemoCompletada) pasos.push('Y terminaste probando cómo podría vivirlo uno de tus clientes.');

  addMsg('Espera.', 'b');
  setTimeout(() => {
    addMsg('¿Te diste cuenta de lo que acabas de hacer?', 'b');
    let i = 0;
    const siguiente = () => {
      if (i >= pasos.length) {
        setTimeout(() => {
          addMsg('Eso es exactamente lo que hacemos.', 'b');
          setTimeout(() => {
            addMsgHTML('No te lo explicamos.<br/>Te lo hicimos vivir.', 'b');
            setTimeout(() => {
              addMsg('Ahora imagina hacer lo mismo con tus clientes.', 'b');
              setTimeout(mostrarTail, 1600);
            }, 1500);
          }, 1200);
        }, 700);
        return;
      }
      addMsg(pasos[i], 'r');
      i++;
      setTimeout(siguiente, 700);
    };
    setTimeout(siguiente, 900);
  }, 1200);
}

// Único orquestador llamado tras la mini-simulación (o directo desde
// cerrarCaso si no hubo patrón) — no decide nada del diagnóstico, solo
// avisa que la conversación llegó al punto de la pausa.
function avanzarNarrativaPostDiagnostico() {
  const ctaH = document.getElementById('ctaFinalH');
  const ctaSub = document.getElementById('ctaFinalSub');
  if (ctaH) ctaH.innerHTML = 'Ahora que viste cómo funciona...<br/><em>¿qué quieres que sea más fácil para tus clientes?</em>';
  if (ctaSub) ctaSub.textContent = 'Cuéntame arriba y diseñamos el recorrido juntos.';
  renderRevelacion();
}

// ============ CASOS → "Tengo un problema parecido" ============
function casoAbrirDiagnostico(id, texto) {
  trackEvent('cta_seleccionado', { cta: 'caso_parecido', caso: id });
  const overlay = document.querySelector('.modal-overlay.open');
  if (overlay) { overlay.classList.remove('open'); document.body.style.overflow = ''; }
  setTimeout(() => {
    heroInput.placeholder = heroDefaultPlaceholder;
    heroInput.value = texto;
    document.getElementById('stageInputWrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
    heroInput.focus();
  }, 350);
}

// ============ TENGO UNA IDEA ============
function analizarIdea() {
  const ideaInput = document.getElementById('ideaInput');
  const v = ideaInput.value.trim();
  if (!v) return;
  trackEvent('idea_enviada', { texto: v });
  const out = document.getElementById('ideaResult');
  out.innerHTML = '<div style="font-size:11px;color:var(--ink3);font-style:italic;padding-top:6px">Estructurando tu idea...</div>';
  setTimeout(() => {
    const waMsg = 'Hola Daniel, quiero aterrizar esta idea en Automatiza Procesos:\n' + v;
    const waUrl = 'https://wa.me/573005333763?text=' + encodeURIComponent(waMsg);
    const safe = v.replace(/</g, '&lt;');
    out.innerHTML = '<p style="font-size:12.5px;color:var(--ink2);line-height:1.65;margin-bottom:10px">Antes de construir la versión completa, habría que validar si existe un cliente dispuesto a usar esto y pagar por ello.</p>' +
      '<p style="font-size:12.5px;color:var(--ink2);line-height:1.65;margin-bottom:16px">El primer prototipo recomendado sería una versión mínima que resuelva el paso más doloroso de lo que describes — no la plataforma completa.</p>' +
      '<a href="' + waUrl + '" target="_blank" class="btn-dark" style="font-size:12px;padding:10px 16px" id="ideaCta">Quiero aterrizar esta idea →</a>';
    const ideaCta = document.getElementById('ideaCta');
    if (ideaCta) ideaCta.addEventListener('click', () => {
      trackEvent('conversion', { tipo: 'aterrizar_idea' });
      trackEvent('whatsapp_iniciado', { origen: 'idea' });
      saveLead({ tipo_solicitud: 'idea', problema_original: v, diagnostico: 'Idea por estructurar', solucion_propuesta: 'Prototipo mínimo', nivel_oportunidad: 'Por confirmar', siguiente_paso: 'Conversación de aterrizaje', origen: 'idea' });
    });
    actualizarCtaFinal({
      heading: 'Ya le contaste tu idea<br/>a <em>Daniel.</em>',
      sub: v,
      waUrl: waUrl,
      waLabel: 'Quiero aterrizar esta idea'
    });
  }, 900);
}
const ideaBtn = document.getElementById('ideaBtn');
if (ideaBtn) ideaBtn.addEventListener('click', analizarIdea);

// ============ DEMO — Ejemplo: clínica veterinaria ============
// Guion fijo, autocontenido: NO toca `caso`, PATRONES, SLOTS ni ninguna
// función del motor de diagnóstico real. Es solo una simulación visual
// para que el visitante entienda qué significa "diseñar un recorrido".
const DEMO_VET_PASOS = [
  '<div class="msg msg-b">Hola 👋 Bienvenido a la Clínica Ejemplo. ¿Qué necesitas hoy?</div><div class="msg msg-b">🩺 Mi mascota tiene un síntoma &nbsp;·&nbsp; 📅 Quiero agendar una cita &nbsp;·&nbsp; ❓ Tengo una duda general &nbsp;·&nbsp; 💰 Quiero saber precios</div><div class="msg msg-u">Mi mascota tiene un síntoma</div>',
  '<div class="msg msg-u">Mi perro no ha comido en 2 días, ¿es grave?</div><div class="msg msg-b">Con la información que el veterinario dejó definida para estos casos: si además está decaído, vomita o tiene fiebre, conviene priorizar la valoración.</div><div class="msg msg-b" style="font-style:italic">Esto es orientación general, no un diagnóstico — el veterinario es quien evalúa a tu mascota.</div>',
  '<div class="msg msg-b">Por lo que cuentas, esto conviene revisarlo pronto con el veterinario, no solo con información general.</div><div class="msg msg-b">¿Agendamos una valoración general o es una urgencia?</div><div class="msg msg-u">Valoración general</div>',
  '<div class="msg msg-b">Estas son las opciones disponibles para Valoración general:</div><div class="msg msg-b">🗓️ Mañana 10:00 a.m. &nbsp;·&nbsp; 🗓️ Mañana 3:00 p.m. &nbsp;·&nbsp; 🗓️ Pasado mañana 9:00 a.m.</div><div class="msg msg-u">Mañana 10:00 a.m.</div>',
  '<div class="msg msg-b">✅ Cita confirmada — Valoración general, mañana 10:00 a.m.</div><div class="msg msg-b">Esto mismo llega por WhatsApp con los datos ya organizados para la clínica: nombre, mascota, motivo y hora — sin que tengas que volver a escribirlos.</div>',
  '<div class="msg msg-b" style="font-style:italic">2 días después de la cita 👇</div><div class="msg msg-b">Hola 👋 ¿Cómo sigue Toby después de la consulta? Si necesita un control, aquí puedes agendarlo.</div>'
];
function demoVetMostrar(i, btn) {
  const panel = document.getElementById('demoVetPanel');
  if (panel) panel.innerHTML = DEMO_VET_PASOS[i];
  document.querySelectorAll('#demoVetSteps .demo-step').forEach(el => el.classList.remove('on'));
  if (btn) btn.classList.add('on');
  trackEvent('demo_view', { demo: 'veterinaria', paso: i });
}

function abrirModal(id){
  const m=document.getElementById(id);
  if(!m)return;
  trackEvent('case_view', { caso: id });
  m.classList.add('open');
  document.body.style.overflow='hidden';
  if(id==='modal-icbf'){
    setTimeout(()=>{
      const wt=document.getElementById('dwtyped');
      if(wt&&wt.innerHTML===''){
        dWIdx=0;
        (function step(){
          if(!wt)return;
          const ch=WTEXT[dWIdx];
          wt.innerHTML+=(ch==='\n'?'<br>':ch);
          dWIdx++;
          if(dWIdx<WTEXT.length){dWTimer=setTimeout(step,14);}
        })();
      }
    },400);
  }
}
function cerrarModal(id){
  const m=document.getElementById(id);
  if(m){m.classList.remove('open');document.body.style.overflow='';}
}
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    document.querySelectorAll('.modal-overlay.open').forEach(function(m){m.classList.remove('open');});
    document.body.style.overflow='';
  }
});
setTimeout(function(){
  document.querySelectorAll('.modal-overlay').forEach(function(m){
    m.addEventListener('click',function(e){if(e.target===m){m.classList.remove('open');document.body.style.overflow='';}});
  });
},500);
function mTab(prefix,tab,btn){
  document.querySelectorAll('#modal-'+prefix+' .mtc').forEach(function(t){t.classList.remove('on');});
  document.querySelectorAll('#modal-'+prefix+' .mtab').forEach(function(t){t.classList.remove('on');});
  var tc=document.getElementById(prefix+'-'+tab);if(tc)tc.classList.add('on');
  if(btn)btn.classList.add('on');
  if(prefix==='icbf'&&tab==='demo'){
    setTimeout(function(){
      var wt=document.getElementById('dwtyped');
      if(wt&&wt.innerHTML===''){
        dWIdx=0;
        (function step(){
          if(!wt)return;
          var ch=WTEXT[dWIdx];
          wt.innerHTML+=(ch==='\n'?'<br>':ch);
          dWIdx++;
          if(dWIdx<WTEXT.length){dWTimer=setTimeout(step,14);}
        })();
      }
    },200);
  }
}
var WTEXT='Actualmente ingresamos la información de 350 beneficiarios en el sistema web de forma manual. El proceso consiste en abrir el formulario, copiar los datos de cada persona desde un archivo Excel e ingresar uno a uno: nombre, documento, fecha de nacimiento, modalidad, dirección, teléfono y datos del acudiente.\n\nCon una persona dedicada exclusivamente a esto, el proceso toma entre 4 y 5 días hábiles. Se cometen errores de digitación con frecuencia y corregirlos toma tiempo adicional.';
var dWIdx=0,dWTimer=null,dBotInt=null;
function dSetI(id,cls){var el=document.getElementById(id);if(el)el.className='dtl-i'+(cls?' '+cls:'');}
function dShow(id){var el=document.getElementById(id);if(el){el.style.display='';setTimeout(function(){el.scrollIntoView({behavior:'smooth',block:'nearest'});},150);}}
function dGoS1(){clearTimeout(dWTimer);dSetI('dic0','dn');dShow('ds1');setTimeout(function(){dSetI('dic1','act');},200);}
function dAccept(){
  var btn=document.getElementById('daccbtn');
  if(btn){btn.textContent='Propuesta aceptada ✓';btn.classList.add('clicked');btn.disabled=true;}
  setTimeout(function(){dGoS2();},700);
}
function dGoS2(){
  dSetI('dic1','dn');dShow('ds2');setTimeout(function(){dSetI('dic2','act');},200);
  var msg=document.getElementById('ddmsg');
  var txt='Hola, aquí está la entrega completa. El bot quedó listo con tus datos reales. La guía explica paso a paso cómo ejecutarlo. Te envío también la invitación para la sesión en vivo. Cualquier ajuste en los primeros 30 días lo resuelvo sin costo adicional.';
  var i=0;var iv=setInterval(function(){if(msg)msg.textContent=txt.substring(0,i+1);i++;if(i>=txt.length)clearInterval(iv);},13);
  var files=[
    {ico:'PY',name:'bot_carga_masiva.py',desc:'Bot principal — lee el Excel y llena el sistema automáticamente',color:'#3776ab'},
    {ico:'MD',name:'GUIA_USO.md',desc:'Instrucciones de instalación, configuración y ejecución paso a paso',color:'#555'},
    {ico:'CAL',name:'sesion_entrega.ics',desc:'Invitación sesión en vivo — Google Meet · 45 minutos',color:'#c53030'},
  ];
  var list=document.getElementById('dflist');
  if(list){files.forEach(function(f,i){
    var item=document.createElement('div');item.className='fitem';
    item.innerHTML='<div class="fico" style="background:'+f.color+'">'+f.ico+'</div><div class="finfo"><div class="fname">'+f.name+'</div><div class="fdesc2">'+f.desc+'</div></div><div class="fdl">Descargar</div>';
    list.appendChild(item);setTimeout(function(){item.classList.add('show');},700+i*350);
  });}
  setTimeout(function(){var br=document.getElementById('dbot-run');if(br)br.style.display='block';dRunBot();},1800);
}
function dAddLog(txt,cls,delay){
  return new Promise(function(res){setTimeout(function(){
    var c=document.getElementById('dbotlog');if(!c){res();return;}
    var d=document.createElement('div');d.className='bll';
    var now=new Date();var ts=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')+':'+String(now.getSeconds()).padStart(2,'0');
    d.innerHTML='<span class="bts">['+ts+']</span><span class="'+(cls||'')+'">'+txt+'</span>';
    c.appendChild(d);requestAnimationFrame(function(){d.classList.add('show');});c.scrollTop=c.scrollHeight;res();
  },delay||0);});
}
async function dRunBot(){
  await dAddLog('Iniciando bot_carga_masiva.py','binf',100);
  await dAddLog('Excel leído: 350 beneficiarios · 19 grupos','bok',500);
  await dAddLog('Login exitoso — navegando al formulario','bok',900);
  await dAddLog('Cargue masivo iniciado...','',1200);
  var reg=1;
  dBotInt=setInterval(function(){
    reg=Math.min(reg+4,350);var pct=Math.round(reg/350*100);
    var ce=document.getElementById('dbcnt');if(ce)ce.textContent='Beneficiario '+reg+' de 350';
    var pf=document.getElementById('dbcpf');if(pf)pf.style.width=pct+'%';
    var pe=document.getElementById('dbcpct');if(pe)pe.textContent=pct+'%';
    if(reg>=350){
      clearInterval(dBotInt);
      dAddLog('350 registros procesados — 334 OK · 16 observaciones','bok',200);
      setTimeout(function(){var g=document.getElementById('dgarantia');if(g)g.classList.add('show');},800);
      setTimeout(function(){dGoS3();},1600);
    }
  },60);
}
function dGoS3(){dSetI('dic2','dn');dShow('ds3');setTimeout(function(){dSetI('dic3','act');setTimeout(function(){dSetI('dic3','dn');},600);},200);}
function dReset(){
  clearTimeout(dWTimer);if(dBotInt)clearInterval(dBotInt);dWIdx=0;
  var wt=document.getElementById('dwtyped');if(wt)wt.innerHTML='';
  ['ds1','ds2','ds3'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none';});
  ['dic0','dic1','dic2','dic3'].forEach(function(id){dSetI(id,'');});dSetI('dic0','act');
  var fl=document.getElementById('dflist');if(fl)fl.innerHTML='';
  var dm=document.getElementById('ddmsg');if(dm)dm.textContent='';
  var bl=document.getElementById('dbotlog');if(bl)bl.innerHTML='';
  var br=document.getElementById('dbot-run');if(br)br.style.display='none';
  var bc=document.getElementById('dbcnt');if(bc)bc.textContent='Beneficiario 1 de 350';
  var bf=document.getElementById('dbcpf');if(bf)bf.style.width='0%';
  var bp=document.getElementById('dbcpct');if(bp)bp.textContent='0%';
  var g=document.getElementById('dgarantia');if(g)g.classList.remove('show');
  var btn=document.getElementById('daccbtn');
  if(btn){btn.textContent='Acepto la propuesta →';btn.classList.remove('clicked');btn.disabled=false;}
}


// ── DEMO BOT TRES FASES ──
var DNAMES=['Valentina Morales','Santiago Pérez','Isabella Ramírez','Mateo González','Sofía Herrera','Sebastián López','Camila Torres','Nicolás Rodríguez','Valeria Martínez','Samuel Vargas','Luciana Díaz','Mariana Ruiz','Paula Mendoza','Tomás Reyes','Andrés Rojas','Natalia Gutiérrez','Felipe Sánchez','Julián Medina','Laura Hernández','Diego Patiño','Daniela Cárdenas','Esteban Ríos','Sara Ibáñez','Juan Ortiz','Manuela Restrepo'];
var DGRUPOS=['D2-001','D2-002','D2-003','D2-004','D2-005','D2-006','D2-007','D2-008','D2-009','D2-010','D2-011','D2-012','D2-013','D2-014','D2-015','D2-016','D2-017','D2-018','D2-019'];
var DMODS=['CDI Institucional','CDI Familiar','HCB','CDI Institucional','CDI Familiar'];
var DALL=[];
var dRegInt=null;
var dXlBuilt=false;

function dGenB(i){
  var n=DNAMES[i%DNAMES.length];
  var doc=String(10000000+i*73+i%97).slice(0,8);
  var tel='311'+String(1000000+i*97).slice(0,7);
  var dir='Calle '+((i%30)+1)+' #'+((i%15)+1)+'-'+((i%50)+10)+' Duitama';
  var acud=DNAMES[(i+9)%DNAMES.length];
  var grupo=DGRUPOS[i%DGRUPOS.length];
  var mod=DMODS[i%DMODS.length];
  var ok=i%17!==5&&i%23!==11;
  var obs=ok?'':i%2===0?'Doc ilegible':'Dirección incompleta';
  return {n:n,doc:doc,tel:tel,dir:dir,acud:acud,grupo:grupo,mod:mod,ok:ok,obs:obs};
}

function dBuildXl(){
  if(dXlBuilt)return;
  DALL=[];
  for(var i=0;i<100;i++)DALL.push(dGenB(i));
  var body=document.getElementById('dxlbody');
  if(!body){console.log('dxlbody not found');return;}
  body.innerHTML='';
  var cols='24px repeat(7,1fr)';
  var hdr=document.createElement('div');
  hdr.className='xlrow xlhdr';hdr.style.gridTemplateColumns=cols;
  hdr.innerHTML='<div class="xlc rn" style="background:#155d35;color:#fff"></div>'+
    ['NOMBRE','DOC','MODALIDAD','ACUDIENTE','TEL','DIRECCIÓN','GRUPO']
    .map(function(h){return '<div class="xlc hc">'+h+'</div>';}).join('');
  body.appendChild(hdr);
  for(var j=0;j<100;j++){
    var r=DALL[j];
    var fade=j>20;
    var row=document.createElement('div');
    row.className='xlrow'+(j===0?' xlact':j<5?' xlhl':'');
    row.id='dxr'+j;
    row.style.gridTemplateColumns=cols;
    if(fade)row.style.opacity=String(Math.max(0.06,1-(j-20)*0.05));
    row.innerHTML='<div class="xlc rn">'+(j+3)+'</div>'+
      '<div class="xlc'+(fade?' fade':'')+'">'+r.n+'</div>'+
      '<div class="xlc'+(fade?' fade':'')+'" style="font-size:9px">'+r.doc+'</div>'+
      '<div class="xlc'+(fade?' fade':'')+'">'+r.mod+'</div>'+
      '<div class="xlc'+(fade?' fade':'')+'">'+r.acud+'</div>'+
      '<div class="xlc'+(fade?' fade':'')+'">'+r.tel+'</div>'+
      '<div class="xlc'+(fade?' fade':'')+'">'+r.dir+'</div>'+
      '<div class="xlc'+(fade?' fade':'')+'" style="font-weight:500">'+r.grupo+'</div>';
    body.appendChild(row);
  }
  dXlBuilt=true;
}

function dSetPhase(n){
  ['dph0','dph1','dph2'].forEach(function(id,i){
    var el=document.getElementById(id);if(!el)return;
    if(i<n)el.className='dph dn';
    else if(i===n)el.className='dph on';
    else el.className='dph';
  });
  ['dst0','dst1','dst2'].forEach(function(id,i){
    var el=document.getElementById(id);
    if(el)el.style.display=(i===n?'':'none');
  });
}

function dTypeF(id,val,delay){
  return new Promise(function(res){
    setTimeout(function(){
      var el=document.getElementById(id);if(!el){res();return;}
      el.textContent='';el.classList.add('tp');
      var i=0;var spd=Math.max(20,38-val.length);
      var iv=setInterval(function(){
        el.textContent=val.substring(0,i+1);i++;
        if(i>=val.length){clearInterval(iv);el.classList.remove('tp');el.classList.add('dn');res();}
      },spd);
    },delay||0);
  });
}

function dAnimNum(id,to,delay){
  setTimeout(function(){
    var el=document.getElementById(id);if(!el)return;
    var c=0;var step=Math.ceil(to/20);
    var iv=setInterval(function(){c=Math.min(c+step,to);el.textContent=c;if(c>=to)clearInterval(iv);},55);
  },delay||0);
}

async function dFillRec(idx){
  var r=DALL[idx];
  var fields=['df1','df2','df3','df4','df5'];
  var vals=[r.n,r.doc,r.mod,r.grupo,r.dir];
  fields.forEach(function(fid){var el=document.getElementById(fid);if(el){el.textContent='';el.className='dfi'+(fid==='df5'?' s2':'');}});
  var sv=document.getElementById('dfsave');if(sv){sv.style.opacity='.4';sv.style.background='#8b1a1a';}
  var sd=document.getElementById('dfsaved');if(sd)sd.style.display='none';
  var ft=document.getElementById('dftitle');if(ft)ft.textContent='Nuevo beneficiario — '+(idx+1)+' de 100';
  var bc=document.getElementById('dbct');if(bc)bc.textContent=''+(idx+1)+'/100';
  var bt=document.getElementById('dbtabt');if(bt)bt.textContent='Sistema — Beneficiario '+(idx+1)+'/100';
  document.querySelectorAll('.xlact').forEach(function(e){e.classList.remove('xlact');});
  var xr=document.getElementById('dxr'+idx);if(xr)xr.classList.add('xlact');
  var d=0;
  for(var i=0;i<fields.length;i++){await dTypeF(fields[i],vals[i],d);d+=220;}
  await new Promise(function(res){setTimeout(res,d+80);});
  if(sv){sv.style.opacity='1';sv.style.background='#166534';}
  if(sd){sd.style.display='flex';var st=document.getElementById('dfsavedtxt');if(st)st.textContent='Registro '+(idx+1)+' guardado — siguiente...';}
  await new Promise(function(res){setTimeout(res,350);});
}

async function dStartBot(){
  if(!dXlBuilt||DALL.length===0){dBuildXl();}
  dSetPhase(1);
  await dFillRec(0);
  await dFillRec(1);
  var reg=2;
  dRegInt=setInterval(function(){
    reg=Math.min(reg+2,100);
    var pct=Math.round(reg/100*100);
    var cr=document.getElementById('dcreg');if(cr)cr.textContent='Beneficiario '+reg+' de 100';
    var pf=document.getElementById('dcpf');if(pf)pf.style.width=pct+'%';
    var pc=document.getElementById('dcpct');if(pc)pc.textContent=pct+'%';
    var ft=document.getElementById('dftitle');if(ft)ft.textContent='Nuevo beneficiario — '+reg+' de 100';
    var bc=document.getElementById('dbct');if(bc)bc.textContent=''+reg+'/100';
    var bt=document.getElementById('dbtabt');if(bt)bt.textContent='Sistema — Beneficiario '+reg+'/100';
    var sd=document.getElementById('dfsaved');if(sd)sd.style.display='flex';
    var st=document.getElementById('dfsavedtxt');if(st)st.textContent='Registro '+reg+' guardado — siguiente...';
    if(reg>=100){clearInterval(dRegInt);setTimeout(function(){dShowReport();},600);}
  },75);
}

function dShowReport(){
  dSetPhase(2);
  var tb=document.getElementById('drtb');if(!tb)return;
  var sample=[];
  for(var i=0;i<100;i+=11)sample.push({r:DALL[i],idx:i});
  sample.forEach(function(o,si){
    var tr=document.createElement('tr');
    tr.innerHTML='<td style="color:var(--ink3)">'+(o.idx+1)+'</td>'+
      '<td style="font-size:9px">'+o.r.n+'</td>'+
      '<td style="font-size:9px;font-family:var(--font-mono)">'+o.r.grupo+'</td>'+
      '<td>5/5</td>'+
      '<td><span class="dbk '+(o.r.ok?'ok':'wn')+'">'+(o.r.ok?'Correcto':'Observación')+'</span></td>';
    tr.style.opacity='0';tr.style.transition='opacity .2s';
    tb.appendChild(tr);
    setTimeout(function(){tr.style.opacity='1';},si*40);
  });
  var sum=document.createElement('tr');
  sum.innerHTML='<td colspan="5" style="font-size:9px;color:var(--ink3);font-style:italic;text-align:center;padding:6px">100 registros procesados en total</td>';
  tb.appendChild(sum);
  dAnimNum('dm0',100,200);dAnimNum('dm1',94,600);dAnimNum('dm2',6,1000);
}

function dDlReport(){
  var now=new Date();
  var txt='==============================\nREPORTE CARGUE BENEFICIARIOS\n==============================\n';
  txt+='Fecha: '+now.toLocaleDateString('es-CO')+' '+now.toLocaleTimeString('es-CO')+'\n';
  txt+='Total: 100 | Correctos: 94 | Observaciones: 6\n';
  txt+='Tiempo: 1h 47min vs +5 dias manual\n------------------------------\n\n';
  DALL.forEach(function(r,i){
    txt+='['+String(i+1).padStart(3,'0')+'] '+r.n+' | '+r.grupo+' | '+(r.ok?'OK':'OBS: '+r.obs)+'\n';
  });
  txt+='\n==============================\nDaniel Cardenas Espinosa\n==============================\n';
  var a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));
  a.download='reporte_beneficiarios_'+now.toISOString().slice(0,10)+'.txt';
  a.click();
}

function dReset(){
  if(dRegInt)clearInterval(dRegInt);
  var tb=document.getElementById('drtb');if(tb)tb.innerHTML='';
  ['df1','df2','df3','df4','df5'].forEach(function(id){var el=document.getElementById(id);if(el){el.textContent='';el.className='dfi'+(id==='df5'?' s2':'');}});
  var sv=document.getElementById('dfsave');if(sv){sv.style.opacity='.4';sv.style.background='#8b1a1a';}
  var sd=document.getElementById('dfsaved');if(sd)sd.style.display='none';
  var cr=document.getElementById('dcreg');if(cr)cr.textContent='Beneficiario 1 de 100';
  var pf=document.getElementById('dcpf');if(pf)pf.style.width='0%';
  var pc=document.getElementById('dcpct');if(pc)pc.textContent='0%';
  ['dm0','dm1','dm2'].forEach(function(id){var el=document.getElementById(id);if(el)el.textContent='0';});
  document.querySelectorAll('.xlact').forEach(function(e){e.classList.remove('xlact');});
  var xr=document.getElementById('dxr0');if(xr)xr.classList.add('xlact');
  dSetPhase(0);
}

// Build excel when tab opens
var _origMTab=window.mTab;
window.mTab=function(prefix,tab,btn){
  if(_origMTab)_origMTab(prefix,tab,btn);
  if(prefix==='icbf'&&tab==='demo'){setTimeout(function(){dBuildXl();},300);}
};
