// LokiAlphaTrading Community: carga y dibuja los reportes diarios desde Supabase.
// Clave pública (publishable): segura en el sitio. La tabla solo permite lectura (RLS).

const SUPABASE_URL = 'https://qyvkrowvinaslxdhvmku.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4pljPW7l6lTC4qF8RpjCPA_C83MsUqS';

// Enlaces de invitación a los grupos de WhatsApp. Vacío = el botón no se muestra.
const WHATSAPP = { noticias: '', stocks: '', nq: '' };

const TIPOS = [
  { id: 'matutino', nombre: 'Matutino', hora: '~9:00 AM ET' },
  { id: 'meridiano', nombre: 'Meridiano', hora: '~12:00 PM ET' },
  { id: 'closing', nombre: 'Closing', hora: '~5:00 PM ET' },
];

// ---------- Datos ----------
async function api(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/reportes?${query}`, {
    headers: { apikey: SUPABASE_KEY },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
}

const ultimaFecha = async () => (await api('select=fecha&order=fecha.desc&limit=1'))[0]?.fecha;
const reportesDe = fecha => api(`select=*&fecha=eq.${fecha}&order=publicado_en.asc`);
const indiceEntre = (desde, hasta) =>
  api(`select=fecha,tipo&fecha=gte.${desde}&fecha=lte.${hasta}&order=fecha.asc`);
const recientes = n => api(`select=fecha,tipo&order=fecha.desc,publicado_en.desc&limit=${n}`);

// ---------- Utilidades ----------
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fechaLarga = f => new Date(`${f}T12:00:00Z`).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fechaCorta = f => new Date(`${f}T12:00:00Z`).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const horaET = ts => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET';
const tipoNombre = id => TIPOS.find(t => t.id === id)?.nombre ?? id;
const dirClase = v => (/^\s*[+]/.test(v) ? 'up' : /^\s*[−-]/.test(v) ? 'down' : '');

function estadoBadge(estado) {
  if (!estado) return '';
  const e = estado.toLowerCase();
  const cls = /objetivo|sostuvo|ganad/.test(e) ? 'ok'
    : /invalid|stop|rompi|falló|perd/.test(e) ? 'bad'
    : /activada|en curso/.test(e) ? 'open' : 'wait';
  return `<span class="estado ${cls}">${esc(estado)}</span>`;
}

function tabla(cols, filas) {
  const head = cols.map(c => `<th class="${c.num ? 'num' : ''}">${esc(c.t)}</th>`).join('');
  const body = filas.map(f => `<tr>${cols.map(c => {
    const raw = f[c.k];
    const html = c.fmt ? c.fmt(raw, f) : esc(raw ?? '—');
    return `<td class="${c.cls ?? (c.num ? 'num' : '')}">${html}</td>`;
  }).join('')}</tr>`).join('');
  return `<div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function seccion(clase, icono, titulo, sub, contenido) {
  if (!contenido) return '';
  return `<section class="section ${clase}">
    <div class="section-head"><img src="assets/${icono}" alt="" width="44" height="44">
      <div><h3>${esc(titulo)}</h3>${sub ? `<p>${esc(sub)}</p>` : ''}</div></div>
    ${contenido}</section>`;
}

const tarjeta = (titulo, nota, cuerpo, extra = '') =>
  `<div class="card ${extra}">${titulo ? `<h4>${esc(titulo)}</h4>` : ''}${nota ? `<p class="note">${esc(nota)}</p>` : ''}${cuerpo}</div>`;

const bloques = (d, seccionId) => (d.bloques ?? [])
  .filter(b => (b.seccion ?? 'stocks') === seccionId)
  .map(b => tarjeta(b.titulo, null, `<p style="margin:0">${esc(b.texto)}</p>`)).join('');

// ---------- Piezas del reporte ----------
function agenda(items) {
  return `<div class="agenda">${items.map(it => {
    const p = Number(it.prob) || 0;
    const color = p >= 7 ? 'var(--red)' : p >= 4 ? 'var(--orange)' : 'var(--green)';
    return `<div class="event ${p >= 7 ? 'hot' : ''}">
      <div class="time">${esc(it.hora)}</div>
      <div><div class="topic">${p >= 7 ? '⚠️ ' : ''}${esc(it.tema)}${it.estado ? `<span class="badge-done">${esc(it.estado)}</span>` : ''}</div>
        ${it.efecto ? `<div class="effect">${esc(it.efecto)}</div>` : ''}</div>
      ${p ? `<div class="prob"><span class="n" style="color:${color}">${p}<small style="font-size:11px;color:var(--muted)">/10</small></span>
        <span class="lbl">Prob. de mover el mercado</span><div class="bar"><i style="width:${p * 10}%;background:${color}"></i></div></div>` : '<div></div>'}
    </div>`;
  }).join('')}</div>`;
}

function seccionNoticias(d) {
  let html = '';
  if (d.agenda?.length) html += agenda(d.agenda);
  if (d.que_movio) html += tarjeta('Qué movió el mercado', null, `<p style="margin:0">${esc(d.que_movio)}</p>`);
  if (d.despues_cierre?.length) html += tarjeta('Después del cierre', null, tabla(
    [{ t: 'Ticker', k: 'ticker', cls: 'tk' }, { t: 'Mov.', k: 'cambio', num: true, fmt: v => `<span class="${dirClase(v)}">${esc(v ?? '—')}</span>` }, { t: 'Nota', k: 'nota', cls: 'small' }],
    d.despues_cierre));
  if (d.manana?.length) html += `<h4 style="font:700 15px var(--display);margin:18px 0 10px">Agenda de mañana</h4>` + agenda(d.manana);
  html += bloques(d, 'noticias');
  return seccion('noticias', 'news.png', 'Noticias', 'Eventos que pueden mover el mercado. Hora en ET (Nueva York).', html);
}

function seccionNQ(d) {
  const nq = d.nq;
  let html = '';
  if (nq) {
    const tend = (nq.tendencias ?? []).map(t => `<div class="card">
      <div class="trend"><span class="eyebrow">Tendencia ${esc(t.marco)}</span>
      <span class="val ${/alcista/i.test(t.valor) ? 'up' : /bajista/i.test(t.valor) ? 'down' : 'warn'}">${esc(t.valor)}</span></div>
      <p class="note" style="margin:6px 0 0">${esc(t.nota)}</p></div>`).join('');
    const escalera = nq.escalera?.length ? tarjeta('Niveles mayores', nq.nota,
      `<ul class="ladder">${nq.escalera.map(l => `<li class="${esc(l.tipo)}"><span class="lv">${esc(l.nivel)}</span><span class="nt">${esc(l.nota)}</span></li>`).join('')}</ul>`) : '';
    html += `<div class="nq-grid"><div>${tend}${nq.lectura ? tarjeta('Lectura', null, `<p style="margin:0">${esc(nq.lectura)}</p>`, 'reading') : ''}</div><div>${escalera}</div></div>`;
  }
  html += bloques(d, 'nq');
  return seccion('nq', 'nqes.png', 'NQ / ES', nq ? `NQ1! ${nq.ultimo ?? ''} ${nq.cambio ?? ''}` : '', html);
}

function seccionStocks(d) {
  let html = '';

  if (d.scorecard) {
    const s = d.scorecard;
    html += `<div class="rates">
      ${s.tasa_activacion ? `<div class="stat"><span class="eyebrow">Tasa de activación</span><span class="v">${esc(s.tasa_activacion)}</span><span class="d">Selecciones que se activaron</span></div>` : ''}
      ${s.tasa_objetivo ? `<div class="stat"><span class="eyebrow">Tasa de objetivo</span><span class="v">${esc(s.tasa_objetivo)}</span><span class="d">Activadas que llegaron al objetivo</span></div>` : ''}
    </div>${s.nota ? `<p class="foot-note" style="margin:-4px 0 12px">${esc(s.nota)}</p>` : ''}`;
  }

  if (d.picks?.filas?.length) {
    const conEstado = d.picks.filas.some(f => f.estado);
    const cols = [
      { t: 'Nivel', k: 'nivel', fmt: v => `<span class="pill">${esc(v)}</span>` },
      { t: 'Ticker', k: 'ticker', cls: 'tk' },
      { t: 'Precio', k: 'precio', num: true },
      { t: 'Gap', k: 'gap', num: true, fmt: v => `<span class="${dirClase(v)}">${esc(v ?? '—')}</span>` },
    ];
    if (conEstado) cols.push({ t: 'Estado', k: 'estado', fmt: v => estadoBadge(v) }, { t: 'Máx. a favor', k: 'max_favor', num: true });
    cols.push({ t: 'Catalizador', k: 'catalizador', cls: 'small' });
    if (!conEstado) cols.push({ t: 'Stop', k: 'stop', num: true }, { t: 'Objetivo', k: 'objetivo', num: true });
    cols.push({ t: 'Notas', k: 'nota', cls: 'small' });
    html += tarjeta('Watchlist del día', d.picks.nota, tabla(cols, d.picks.filas) +
      (d.picks.descartadas ? `<p class="foot-note"><strong>Descartadas:</strong> ${esc(d.picks.descartadas)}</p>` : ''));
  }

  if (d.movers?.length) html += tarjeta('Megacaps: mayores movimientos', null, tabla(
    [{ t: 'Ticker', k: 'ticker', cls: 'tk' }, { t: 'Cambio', k: 'cambio', num: true, fmt: v => `<span class="${dirClase(v)}">${esc(v ?? '—')}</span>` }, { t: 'Motivo', k: 'nota', cls: 'small' }],
    d.movers));

  const sp = d.soportes;
  if (sp) {
    let cuerpo = '';
    if (sp.top3?.length) cuerpo += `<h4 style="font:700 15px var(--display);margin:4px 0 10px">Los 3 a vigilar</h4><div class="top3">${sp.top3.map(t => `<div class="card">
      <div class="trend"><strong class="tk" style="font:700 16px var(--mono)">${esc(t.ticker)}</strong>
      <span><span class="grade ${esc(t.grado)}">${esc(t.grado)}</span> <span class="eyebrow">R:R ${esc(t.rr)}</span></span></div>
      <div class="lvl">${esc(t.nivel)}</div>${t.resultado ? estadoBadge(t.resultado) + ' ' : ''}<p>${esc(t.texto)}</p></div>`).join('')}</div>`;
    if (sp.revision?.length) cuerpo += tarjeta('Revisión de soportes de la mañana', null, tabla(
      [{ t: 'Ticker', k: 'ticker', cls: 'tk' }, { t: 'Soporte', k: 'nivel', num: true }, { t: 'Resultado', k: 'resultado', fmt: v => estadoBadge(v) }, { t: 'Nota', k: 'nota', cls: 'small' }],
      sp.revision));
    if (sp.filas?.length) cuerpo += tarjeta('Megacaps más cerca de su soporte', sp.nota, tabla([
      { t: '#', k: '_i', num: true, fmt: (_, f) => sp.filas.indexOf(f) + 1 },
      { t: 'Ticker', k: 'ticker', cls: 'tk' },
      { t: 'Precio', k: 'precio', num: true },
      { t: 'Soporte', k: 'soporte', num: true },
      { t: 'Tipo de nivel', k: 'tipo_nivel', cls: 'small' },
      { t: 'Dist. ATR', k: 'dist_atr', num: true },
      { t: 'Tendencia', k: 'tendencia' },
      { t: 'Grado', k: 'grado', fmt: v => `<span class="grade ${esc(v)}">${esc(v)}</span>` },
      { t: 'Objetivo', k: 'objetivo', num: true },
      { t: 'Invalidación', k: 'invalidacion', num: true },
      { t: 'R:R', k: 'rr', num: true, fmt: v => `<span class="${parseFloat(v) < 1 ? 'warn' : ''}">${esc(v ?? '—')}</span>` },
      ...(sp.filas.some(f => f.resultado) ? [{ t: 'Resultado', k: 'resultado', fmt: v => estadoBadge(v) }] : []),
    ], sp.filas) + (sp.pie ? `<p class="foot-note">${esc(sp.pie)}</p>` : ''));
    html += cuerpo;
  }

  if (d.megas?.filas?.length) html += tarjeta('Ranking de megacaps', d.megas.nota, tabla([
    { t: '#', k: '_i', num: true, fmt: (_, f) => d.megas.filas.indexOf(f) + 1 },
    { t: 'Ticker', k: 'ticker', cls: 'tk' },
    { t: 'Tipo', k: 'tipo', fmt: v => `<span class="pill">${esc(v)}</span>` },
    { t: 'Sesgo', k: 'sesgo' },
    { t: 'Gap', k: 'gap', num: true, fmt: v => `<span class="${dirClase(v)}">${esc(v ?? '—')}</span>` },
    { t: 'Catalizador', k: 'catalizador', cls: 'small' },
    { t: 'R1', k: 'r1', num: true },
    { t: 'Último', k: 'ultimo', num: true },
    { t: 'S1', k: 's1', num: true },
  ], d.megas.filas));

  html += bloques(d, 'stocks');
  return seccion('stocks', 'stocks.png', 'Stocks', 'Watchlist, megacaps y soportes para rebotes. Órdenes siempre límite.', html);
}

function renderReporte(r) {
  const d = r.datos ?? {};
  const pulso = d.pulso?.length ? `<div class="pulse">${d.pulso.map(p => `<div class="stat">
    <span class="eyebrow">${esc(p.etiqueta)}</span>
    <span class="v ${p.dir === 'up' ? 'up' : p.dir === 'down' ? 'down' : ''}">${esc(p.valor)}</span>
    <span class="d">${esc(p.detalle)}</span></div>`).join('')}</div>` : '';
  return `
    <div class="report-head">
      <span class="eyebrow">${esc(fechaLarga(r.fecha))}</span>
      <h2>${esc(r.titulo)}</h2>
      <div class="meta">Publicado ${esc(horaET(r.publicado_en))}${d.generado ? ` · datos ${esc(d.generado)}` : ''} · Órdenes siempre límite</div>
    </div>
    ${d.resumen ? `<div class="summary">${esc(d.resumen)}</div>` : ''}
    ${pulso}
    ${seccionNoticias(d)}
    ${seccionNQ(d)}
    ${seccionStocks(d)}`;
}

// ---------- Vista de un día (pestañas) ----------
function renderDia(el, fecha, reportes, tipoInicial, alCambiar) {
  if (!reportes.length) {
    el.innerHTML = `<p class="empty">No hay reportes para ${esc(fechaLarga(fecha))}.</p>`;
    return;
  }
  const porTipo = Object.fromEntries(reportes.map(r => [r.tipo, r]));
  let actual = porTipo[tipoInicial] ? tipoInicial : reportes[reportes.length - 1].tipo;

  const pintar = () => {
    el.innerHTML = `<div class="tabs" role="tablist">${TIPOS.map(t => `
      <button class="tab" role="tab" data-tipo="${t.id}" aria-selected="${t.id === actual}" ${porTipo[t.id] ? '' : 'disabled'}
        title="${porTipo[t.id] ? '' : 'Aún no publicado'}"><i class="dot"></i>${t.nombre}<span style="color:var(--faint);font-weight:500">${porTipo[t.id] ? horaET(porTipo[t.id].publicado_en) : t.hora}</span></button>`).join('')}
      </div><div id="reporte">${renderReporte(porTipo[actual])}</div>`;
    el.querySelectorAll('.tab:not(:disabled)').forEach(b => b.addEventListener('click', () => {
      actual = b.dataset.tipo;
      pintar();
      alCambiar?.(actual);
    }));
  };
  pintar();
  alCambiar?.(actual);
}

// ---------- Página: Inicio ----------
async function iniciarInicio() {
  const el = document.getElementById('ultimo');
  renderCanales();
  try {
    const fecha = await ultimaFecha();
    if (!fecha) { el.innerHTML = '<p class="empty">Todavía no hay reportes publicados.</p>'; return; }
    renderDia(el, fecha, await reportesDe(fecha));
  } catch (e) {
    el.innerHTML = `<p class="empty">No se pudo cargar el reporte (${esc(e.message)}).</p>`;
  }
}

function renderCanales() {
  const el = document.getElementById('canales');
  if (!el) return;
  const canales = [
    { id: 'noticias', icono: 'news.png', titulo: 'Noticias', texto: 'Agenda económica, Fed y titulares con su probabilidad de mover el mercado.' },
    { id: 'nq', icono: 'nqes.png', titulo: 'NQ / ES Tips', texto: 'Tendencia y niveles mayores de los futuros del Nasdaq y el S&P 500.' },
    { id: 'stocks', icono: 'stocks.png', titulo: 'Stocks Tips', texto: 'Watchlist del día, ranking de megacaps y soportes para rebotes.' },
  ];
  el.innerHTML = canales.map(c => `<div class="channel ${c.id}">
    <img src="assets/${c.icono}" alt="LokiAlphaTrading ${esc(c.titulo)}" width="96" height="96">
    <h4>${esc(c.titulo)}</h4><p>${esc(c.texto)}</p>
    ${WHATSAPP[c.id] ? `<a class="btn" href="${esc(WHATSAPP[c.id])}" target="_blank" rel="noopener">Unirme en WhatsApp</a>` : ''}
  </div>`).join('');
}

// ---------- Página: Archivo ----------
async function iniciarArchivo() {
  const cal = document.getElementById('calendario');
  const vista = document.getElementById('vista');
  const params = new URLSearchParams(location.search);
  let seleccion = params.get('fecha');
  let tipoSel = params.get('tipo');
  let mes;

  const hoyET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const ultimos = await recientes(40).catch(() => []);
  if (!seleccion) seleccion = ultimos[0]?.fecha;
  const base = (seleccion ?? hoyET).split('-').map(Number);
  mes = { y: base[0], m: base[1] - 1 };

  const actualizarURL = () => {
    const q = new URLSearchParams();
    if (seleccion) q.set('fecha', seleccion);
    if (tipoSel) q.set('tipo', tipoSel);
    history.replaceState(null, '', `?${q}`);
  };

  async function pintarCalendario() {
    const dias = new Date(Date.UTC(mes.y, mes.m + 1, 0)).getUTCDate();
    const inicio = (new Date(Date.UTC(mes.y, mes.m, 1)).getUTCDay() + 6) % 7; // lunes primero
    const indice = await indiceEntre(iso(mes.y, mes.m, 1), iso(mes.y, mes.m, dias)).catch(() => []);
    const porDia = {};
    indice.forEach(r => (porDia[r.fecha] ??= []).push(r.tipo));
    const nm = new Date(Date.UTC(mes.y, mes.m, 1)).toLocaleDateString('es', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const nombreMes = nm.charAt(0).toUpperCase() + nm.slice(1);

    let celdas = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<div class="dow">${d}</div>`).join('');
    celdas += '<div></div>'.repeat(inicio);
    for (let d = 1; d <= dias; d++) {
      const f = iso(mes.y, mes.m, d);
      const tipos = porDia[f] ?? [];
      const cls = ['day', tipos.length && 'has', f === seleccion && 'sel', f === hoyET && 'today'].filter(Boolean).join(' ');
      celdas += `<button class="${cls}" data-fecha="${f}" ${tipos.length ? '' : 'disabled'} aria-label="${fechaLarga(f)}${tipos.length ? '' : ', sin reportes'}">
        ${d}<span class="dots">${TIPOS.filter(t => tipos.includes(t.id)).map(t => `<i class="${t.id}"></i>`).join('')}</span></button>`;
    }

    cal.innerHTML = `
      <div class="cal-head"><button id="prev" aria-label="Mes anterior">‹</button><strong>${esc(nombreMes)}</strong><button id="next" aria-label="Mes siguiente">›</button></div>
      <div class="cal-grid">${celdas}</div>
      <div class="legend">${TIPOS.map(t => `<span><i class="${t.id}"></i>${t.nombre}</span>`).join('')}</div>
      <div class="recent"><span class="eyebrow">Recientes</span>
        ${[...new Set(ultimos.map(r => r.fecha))].slice(0, 7).map(f => `<a href="?fecha=${f}" data-fecha="${f}">${esc(fechaCorta(f))}<span>${ultimos.filter(r => r.fecha === f).map(r => tipoNombre(r.tipo)).join(' · ')}</span></a>`).join('') || '<p class="foot-note">Sin reportes aún.</p>'}
      </div>`;

    cal.querySelector('#prev').onclick = () => { mes = mes.m ? { y: mes.y, m: mes.m - 1 } : { y: mes.y - 1, m: 11 }; pintarCalendario(); };
    cal.querySelector('#next').onclick = () => { mes = mes.m < 11 ? { y: mes.y, m: mes.m + 1 } : { y: mes.y + 1, m: 0 }; pintarCalendario(); };
    cal.querySelectorAll('[data-fecha]').forEach(b => b.addEventListener('click', e => {
      e.preventDefault();
      seleccion = b.dataset.fecha;
      tipoSel = null;
      const [y, m] = seleccion.split('-').map(Number);
      mes = { y, m: m - 1 };
      pintarCalendario();
      cargarDia();
    }));
  }

  async function cargarDia() {
    if (!seleccion) { vista.innerHTML = '<p class="empty">Todavía no hay reportes publicados.</p>'; return; }
    vista.innerHTML = '<p class="loading">Cargando…</p>';
    try {
      renderDia(vista, seleccion, await reportesDe(seleccion), tipoSel, t => { tipoSel = t; actualizarURL(); });
    } catch (e) {
      vista.innerHTML = `<p class="empty">No se pudo cargar (${esc(e.message)}).</p>`;
    }
  }

  await pintarCalendario();
  await cargarDia();
}
