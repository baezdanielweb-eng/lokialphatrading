// LokiAlphaTrading Community: carga y dibuja los reportes diarios desde Supabase.
// Clave pública (publishable): segura en el sitio. La tabla solo permite lectura (RLS).
// Idioma principal: español. Inglés opcional (botón ES/EN): textos de la interfaz en I18N,
// contenido del reporte en la columna datos_en (si falta, se muestra el español con un aviso).

const SUPABASE_URL = 'https://qyvkrowvinaslxdhvmku.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4pljPW7l6lTC4qF8RpjCPA_C83MsUqS';

// Enlaces de invitación a los grupos de WhatsApp. Vacío = el botón no se muestra.
const WHATSAPP = { noticias: 'https://chat.whatsapp.com/L2ZrdwgmF32GQb0OQ7yufX?mode=gi_t', stocks: 'https://chat.whatsapp.com/K9l8jF7tYQNDREPnglAgGS?mode=gi_t', nq: 'https://chat.whatsapp.com/KGTg3x7aSY04ZooumMn7vj?mode=gi_t' };

// ---------- Idioma ----------
const I18N = {
  es: {
    locale: 'es',
    'nav.home': 'Inicio', 'nav.archive': 'Archivo', 'nav.news': 'Noticias', 'nav.nq': 'NQ / ES', 'nav.stocks': 'Stocks',
    'page.noticias.sub': 'Agenda económica, titulares del mercado y lo que lo movió, con enlaces a la fuente original.',
    'page.nq.sub': 'Tendencia, niveles mayores y lectura del NQ y el ES en cada reporte del día.',
    'page.stocks.sub': 'Watchlist, resultados, megacaps y soportes para rebotes del día.',
    'day.prev': 'Día anterior', 'day.next': 'Día siguiente', 'day.archive': 'Archivo completo',
    'vol': 'Volumen', 'vol.session': 'Sesión', 'vol.contracts': 'Contratos', 'vol.avg20': 'Prom. 20 días', 'vol.rel': 'Relativo', 'vol.byHour': 'Volumen por hora (sesión regular)', 'vol.hour': 'Hora', 'vol.range': 'Rango', 'vol.move': 'Mov.',
    'piv': 'Pivotes clásicos', 'piv.level': 'Nivel', 'events': 'Eventos y reacción del mercado', 'ev.time': 'Hora', 'ev.event': 'Evento', 'ev.nq': 'NQ', 'ev.es': 'ES', 'ev.read': 'Lectura',
    'headlines': 'Titulares del mercado', 'readMore': 'Leer artículo completo', 'moreInfo': 'Más información', 'seeAllNews': 'Ver todas las noticias',
    'hero.tagline': 'APRENDE • COMPARTE • CRECE',
    'hero.text': 'Tres reportes cada día de mercado: el <strong>Matutino</strong> antes de la apertura, el <strong>Meridiano</strong> al mediodía y el <strong>Closing</strong> al cierre. Noticias, futuros del NQ/ES y stocks, con niveles claros y resultados honestos.',
    'hero.latest': 'Ver el último reporte', 'hero.archive': 'Archivo por fecha',
    'channels.title': 'Nuestros canales', 'channels.sub': 'Cada reporte se resume en tres grupos de la comunidad.',
    'channels.join': 'Unirme en WhatsApp',
    'ch.noticias.t': 'Noticias', 'ch.noticias.d': 'Agenda económica, Fed y titulares con su probabilidad de mover el mercado.',
    'ch.nq.t': 'NQ / ES Tips', 'ch.nq.d': 'Tendencia y niveles mayores de los futuros del Nasdaq y el S&P 500.',
    'ch.stocks.t': 'Stocks Tips', 'ch.stocks.d': 'Watchlist del día, ranking de megacaps y soportes para rebotes.',
    'footer.disclaimer': '<strong>Contenido educativo, no es asesoría financiera.</strong> Cada operación es responsabilidad de quien la ejecuta. Todas las órdenes (entrada, stop y objetivo) son límite. Horas en ET (Nueva York).',
    'tipo.matutino': 'Matutino', 'tipo.meridiano': 'Meridiano', 'tipo.closing': 'Closing',
    'titulo.matutino': 'LokiAlphaTrading - Reporte Matutino', 'titulo.meridiano': 'LokiAlphaTrading - Reporte Meridiano', 'titulo.closing': 'LokiAlphaTrading - Closing',
    'tab.notyet': 'Aún no publicado',
    'meta.published': 'Publicado', 'meta.data': 'datos', 'meta.limit': 'Órdenes siempre límite',
    'msg.loading': 'Cargando…', 'msg.loadingLatest': 'Cargando el último reporte…', 'msg.none': 'Todavía no hay reportes publicados.',
    'msg.noneDay': 'No hay reportes para', 'msg.error': 'No se pudo cargar', 'msg.noEnglish': '',
    'sec.noticias': 'Noticias', 'sec.noticias.sub': 'Eventos que pueden mover el mercado. Hora en ET (Nueva York).',
    'sec.nq': 'NQ / ES', 'sec.stocks': 'Stocks', 'sec.stocks.sub': 'Watchlist, megacaps y soportes para rebotes. Órdenes siempre límite.',
    'prob': 'Prob. de mover el mercado', 'whatMoved': 'Qué movió el mercado', 'afterHours': 'Después del cierre', 'tomorrow': 'Agenda de mañana',
    'trend': 'Tendencia', 'levels': 'Niveles mayores', 'reading': 'Lectura',
    'rate.trigger': 'Tasa de activación', 'rate.trigger.d': 'Selecciones que se activaron',
    'rate.tp': 'Tasa de objetivo', 'rate.tp.d': 'Activadas que llegaron al objetivo',
    'watchlist': 'Watchlist del día', 'discarded': 'Descartadas:', 'movers': 'Megacaps: mayores movimientos',
    'top3': 'Los 3 a vigilar', 'review': 'Revisión de soportes de la mañana', 'supports': 'Megacaps más cerca de su soporte', 'ranking': 'Ranking de megacaps',
    'c.level': 'Nivel', 'c.ticker': 'Ticker', 'c.price': 'Precio', 'c.gap': 'Gap', 'c.status': 'Estado', 'c.maxFav': 'Máx. a favor',
    'c.catalyst': 'Catalizador', 'c.stop': 'Stop', 'c.target': 'Objetivo', 'c.notes': 'Notas', 'c.move': 'Mov.', 'c.note': 'Nota',
    'c.change': 'Cambio', 'c.reason': 'Motivo', 'c.support': 'Soporte', 'c.result': 'Resultado', 'c.levelType': 'Tipo de nivel',
    'c.distAtr': 'Dist. ATR', 'c.trend': 'Tendencia', 'c.grade': 'Grado', 'c.invalidation': 'Invalidación', 'c.type': 'Tipo', 'c.bias': 'Sesgo', 'c.last': 'Último',
    'cal.prev': 'Mes anterior', 'cal.next': 'Mes siguiente', 'cal.recent': 'Recientes', 'cal.noReports': 'sin reportes', 'cal.dow': ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  },
  en: {
    locale: 'en-US',
    'nav.home': 'Home', 'nav.archive': 'Archive', 'nav.news': 'News', 'nav.nq': 'NQ / ES', 'nav.stocks': 'Stocks',
    'page.noticias.sub': 'Economic calendar, market headlines and what moved the market, with links to the original source.',
    'page.nq.sub': 'Trend, major levels and the NQ and ES read in each of the day\'s reports.',
    'page.stocks.sub': 'Watchlist, results, megacaps and bounce supports for the day.',
    'day.prev': 'Previous day', 'day.next': 'Next day', 'day.archive': 'Full archive',
    'vol': 'Volume', 'vol.session': 'Session', 'vol.contracts': 'Contracts', 'vol.avg20': '20-day avg', 'vol.rel': 'Relative', 'vol.byHour': 'Volume by hour (regular session)', 'vol.hour': 'Hour', 'vol.range': 'Range', 'vol.move': 'Move',
    'piv': 'Classic pivots', 'piv.level': 'Level', 'events': 'Events and market reaction', 'ev.time': 'Time', 'ev.event': 'Event', 'ev.nq': 'NQ', 'ev.es': 'ES', 'ev.read': 'Read',
    'headlines': 'Market headlines', 'readMore': 'Read full article', 'moreInfo': 'More info', 'seeAllNews': 'See all news',
    'hero.tagline': 'LEARN • SHARE • GROW',
    'hero.text': 'Three reports every market day: the <strong>Morning</strong> report before the open, the <strong>Midday</strong> update and the <strong>Closing</strong> report. News, NQ/ES futures and stocks, with clear levels and honest results.',
    'hero.latest': 'See the latest report', 'hero.archive': 'Archive by date',
    'channels.title': 'Our channels', 'channels.sub': 'Each report is summarized in three community groups (in Spanish).',
    'channels.join': 'Join on WhatsApp',
    'ch.noticias.t': 'News', 'ch.noticias.d': 'Economic calendar, Fed and headlines, scored by how likely they are to move the market.',
    'ch.nq.t': 'NQ / ES Tips', 'ch.nq.d': 'Trend and major levels for Nasdaq and S&P 500 futures.',
    'ch.stocks.t': 'Stocks Tips', 'ch.stocks.d': 'Daily watchlist, megacap ranking and bounce supports.',
    'footer.disclaimer': '<strong>Educational content, not financial advice.</strong> Every trade is the responsibility of whoever places it. All orders (entry, stop and target) are limit orders. Times in ET (New York).',
    'tipo.matutino': 'Morning', 'tipo.meridiano': 'Midday', 'tipo.closing': 'Closing',
    'titulo.matutino': 'LokiAlphaTrading - Morning Report', 'titulo.meridiano': 'LokiAlphaTrading - Midday Report', 'titulo.closing': 'LokiAlphaTrading - Closing',
    'tab.notyet': 'Not published yet',
    'meta.published': 'Published', 'meta.data': 'data', 'meta.limit': 'Limit orders only',
    'msg.loading': 'Loading…', 'msg.loadingLatest': 'Loading the latest report…', 'msg.none': 'No reports published yet.',
    'msg.noneDay': 'No reports for', 'msg.error': 'Could not load', 'msg.noEnglish': 'This report is only available in Spanish.',
    'sec.noticias': 'News', 'sec.noticias.sub': 'Events that can move the market. Times in ET (New York).',
    'sec.nq': 'NQ / ES', 'sec.stocks': 'Stocks', 'sec.stocks.sub': 'Watchlist, megacaps and bounce supports. Limit orders only.',
    'prob': 'Chance of moving the market', 'whatMoved': 'What moved the market', 'afterHours': 'After the close', 'tomorrow': "Tomorrow's calendar",
    'trend': 'Trend', 'levels': 'Major levels', 'reading': 'Read',
    'rate.trigger': 'Trigger rate', 'rate.trigger.d': 'Picks that triggered',
    'rate.tp': 'Target-hit rate', 'rate.tp.d': 'Triggered picks that reached target',
    'watchlist': "Today's watchlist", 'discarded': 'Cut:', 'movers': 'Megacaps: biggest moves',
    'top3': 'Top 3 to watch', 'review': 'Morning supports: how they did', 'supports': 'Megacaps closest to support', 'ranking': 'Megacap ranking',
    'c.level': 'Tier', 'c.ticker': 'Ticker', 'c.price': 'Price', 'c.gap': 'Gap', 'c.status': 'Status', 'c.maxFav': 'Max in favor',
    'c.catalyst': 'Catalyst', 'c.stop': 'Stop', 'c.target': 'Target', 'c.notes': 'Notes', 'c.move': 'Move', 'c.note': 'Note',
    'c.change': 'Change', 'c.reason': 'Why', 'c.support': 'Support', 'c.result': 'Result', 'c.levelType': 'Level type',
    'c.distAtr': 'ATR dist.', 'c.trend': 'Trend', 'c.grade': 'Grade', 'c.invalidation': 'Invalidation', 'c.type': 'Type', 'c.bias': 'Bias', 'c.last': 'Last',
    'cal.prev': 'Previous month', 'cal.next': 'Next month', 'cal.recent': 'Recent', 'cal.noReports': 'no reports', 'cal.dow': ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  },
};

function idiomaInicial() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'es' || q === 'en') return q;
  try { const g = localStorage.getItem('lat-lang'); if (g === 'es' || g === 'en') return g; } catch (e) {}
  return 'es';
}
let LANG = idiomaInicial();
const T = k => I18N[LANG][k] ?? I18N.es[k] ?? k;
const LOC = () => T('locale');

// Textos fijos del HTML: <elemento data-i18n="clave">. data-i18n-html permite <strong>.
function aplicarIdioma() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = T(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = T(el.dataset.i18nHtml); });
  document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)));
}

function montarSelectorIdioma(alCambiar) {
  const nav = document.querySelector('.nav');
  if (!nav || nav.querySelector('.lang')) return;
  const box = document.createElement('div');
  box.className = 'lang';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', 'Idioma / Language');
  box.innerHTML = '<button data-lang="es">ES</button><button data-lang="en">EN</button>';
  box.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.dataset.lang === LANG) return;
    LANG = b.dataset.lang;
    try { localStorage.setItem('lat-lang', LANG); } catch (err) {}
    const u = new URL(location.href);
    LANG === 'es' ? u.searchParams.delete('lang') : u.searchParams.set('lang', LANG);
    history.replaceState(null, '', u);
    aplicarIdioma();
    alCambiar();
  });
  nav.appendChild(box);
  aplicarIdioma();
}

const TIPOS = [
  { id: 'matutino', hora: '~9:00 AM ET' },
  { id: 'meridiano', hora: '~12:00 PM ET' },
  { id: 'closing', hora: '~5:00 PM ET' },
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
const fechaLarga = f => new Date(`${f}T12:00:00Z`).toLocaleDateString(LOC(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fechaCorta = f => new Date(`${f}T12:00:00Z`).toLocaleDateString(LOC(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const horaET = ts => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET';
const tipoNombre = id => T(`tipo.${id}`);
// Solo enlaces https externos; cualquier otra cosa se descarta.
const urlSegura = u => (typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : null);
const enlaceExt = (url, texto, fuente) => {
  const u = urlSegura(url);
  return u ? `<a class="ext" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(texto)} ↗</a>${fuente ? `<span class="src">${esc(fuente)}</span>` : ''}` : '';
};
const dirClase = v => (/^\s*[+]/.test(v) ? 'up' : /^\s*[−-]/.test(v) ? 'down' : '');

function estadoBadge(estado) {
  if (!estado) return '';
  const e = estado.toLowerCase();
  const cls = /objetivo|sostuvo|ganad|target|held|\bwin/.test(e) ? 'ok'
    : /invalid|stop|rompi|falló|perd|broke|fail|loss/.test(e) ? 'bad'
    : /activada|en curso|triggered|open/.test(e) && !/sin activar|not triggered|untriggered/.test(e) ? 'open' : 'wait';
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

const subtitulo = txt => `<h4 style="font:700 15px var(--display);margin:18px 0 10px">${esc(txt)}</h4>`;
const pctFmt = v => `<span class="${dirClase(v)}">${esc(v ?? '—')}</span>`;

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
        ${it.efecto ? `<div class="effect">${esc(it.efecto)}</div>` : ''}
        ${it.enlace ? `<div class="links">${enlaceExt(it.enlace, T('moreInfo'), it.fuente)}</div>` : ''}</div>
      ${p ? `<div class="prob"><span class="n" style="color:${color}">${p}<small style="font-size:11px;color:var(--muted)">/10</small></span>
        <span class="lbl">${esc(T('prob'))}</span><div class="bar"><i style="width:${p * 10}%;background:${color}"></i></div></div>` : '<div></div>'}
    </div>`;
  }).join('')}</div>`;
}

function titulares(items) {
  return `<div class="headlines">${items.map(h => `<article class="headline">
    <div class="h-meta">${h.hora && h.hora !== '—' ? `<span class="time">${esc(h.hora)}</span>` : ''}${(h.tickers ?? []).map(t => `<span class="pill">${esc(t)}</span>`).join('')}${h.categoria ? `<span class="cat">${esc(h.categoria)}</span>` : ''}</div>
    <h4>${esc(h.titulo)}</h4>
    ${h.resumen ? `<p>${esc(h.resumen)}</p>` : ''}
    <div class="links">${enlaceExt(h.url, T('readMore'), h.fuente)}</div>
  </article>`).join('')}</div>`;
}

// completo = página de Noticias (incluye titulares). En el inicio solo se enlaza a ella.
function seccionNoticias(d, r, completo) {
  let html = '';
  if (d.agenda?.length) html += agenda(d.agenda);
  if (d.que_movio) html += tarjeta(T('whatMoved'), null, `<p style="margin:0">${esc(d.que_movio)}</p>`);
  if (completo && d.titulares?.length) html += subtitulo(T('headlines')) + titulares(d.titulares);
  if (d.despues_cierre?.length) html += tarjeta(T('afterHours'), null, tabla(
    [{ t: T('c.ticker'), k: 'ticker', cls: 'tk' }, { t: T('c.move'), k: 'cambio', num: true, fmt: pctFmt }, { t: T('c.note'), k: 'nota', cls: 'small' }],
    d.despues_cierre));
  if (d.manana?.length) html += subtitulo(T('tomorrow')) + agenda(d.manana);
  html += bloques(d, 'noticias');
  if (!completo && html) html += `<p class="more-link"><a href="noticias.html?fecha=${esc(r.fecha)}&tipo=${esc(r.tipo)}${LANG !== 'es' ? '&lang=' + LANG : ''}">${esc(T('seeAllNews'))}${d.titulares?.length ? ` (${d.titulares.length})` : ''} →</a></p>`;
  return seccion('noticias', 'news.png', T('sec.noticias'), T('sec.noticias.sub'), html);
}

// Bloque de un futuro (NQ o ES): tendencias, escalera de niveles y lectura.
function bloqueFuturo(f, titulo) {
  if (!f) return '';
  const tend = (f.tendencias ?? []).map(t => `<div class="card">
    <div class="trend"><span class="eyebrow">${esc(T('trend'))} · ${esc(t.marco)}</span>
    <span class="val ${/alcista|bullish/i.test(t.valor) ? 'up' : /bajista|bearish/i.test(t.valor) ? 'down' : 'warn'}">${esc(t.valor)}</span></div>
    <p class="note" style="margin:6px 0 0">${esc(t.nota)}</p></div>`).join('');
  const escalera = f.escalera?.length ? tarjeta(titulo ? `${T('levels')} · ${titulo}` : T('levels'), f.nota,
    `<ul class="ladder">${f.escalera.map(l => `<li class="${esc(l.tipo)}"><span class="lv">${esc(l.nivel)}</span><span class="nt">${esc(l.nota)}</span></li>`).join('')}</ul>`) : '';
  return `<div class="nq-grid"><div>${tend}${f.lectura ? tarjeta(T('reading'), null, `<p style="margin:0">${esc(f.lectura)}</p>`, 'reading') : ''}</div><div>${escalera}</div></div>`;
}

// completo = página NQ/ES: agrega ES, volumen, pivotes y eventos cruzados.
function seccionNQ(d, completo) {
  const nq = d.nq;
  let html = '';
  if (nq) html += bloqueFuturo(nq, completo && d.es ? 'NQ1!' : '');
  if (completo) {
    if (d.es) html += subtitulo(`ES1! ${d.es.ultimo ?? ''} ${d.es.cambio ?? ''}`) + bloqueFuturo(d.es, 'ES1!');
    const v = d.volumen;
    if (v) {
      let cuerpo = '';
      if (v.filas?.length) cuerpo += tabla([
        { t: '', k: 'simbolo', cls: 'tk' }, { t: T('vol.session'), k: 'sesion' },
        { t: T('vol.contracts'), k: 'volumen', num: true }, { t: T('vol.avg20'), k: 'promedio20', num: true },
        { t: T('vol.rel'), k: 'relativo', num: true }, { t: T('c.note'), k: 'nota', cls: 'small' },
      ], v.filas);
      if (v.horas?.length) cuerpo += `<h4 style="font:700 14px var(--display);margin:16px 0 8px">${esc(T('vol.byHour'))}</h4>` + tabla([
        { t: T('vol.hour'), k: 'hora', cls: 'tk' },
        { t: 'NQ', k: 'nq_vol', num: true, fmt: (x, f) => `${esc(x ?? '—')}<span class="volbar"><i style="width:${Math.round((f.nq_pct ?? 0))}%"></i></span>` },
        { t: `NQ ${T('vol.range')}`, k: 'nq_rango', num: true }, { t: `NQ ${T('vol.move')}`, k: 'nq_mov', num: true, fmt: pctFmt },
        { t: 'ES', k: 'es_vol', num: true }, { t: `ES ${T('vol.move')}`, k: 'es_mov', num: true, fmt: pctFmt },
        { t: T('c.note'), k: 'nota', cls: 'small' },
      ], v.horas);
      html += tarjeta(T('vol'), v.resumen, cuerpo);
    }
    const pv = d.pivotes;
    if (pv?.filas?.length) html += tarjeta(T('piv'), pv.nota, tabla([
      { t: T('piv.level'), k: 'nombre', fmt: x => `<span class="pill piv-${/^R/.test(x) ? 'r' : /^S/.test(x) ? 's' : 'p'}">${esc(x)}</span>` },
      { t: 'NQ', k: 'nq', num: true }, { t: 'ES', k: 'es', num: true }, { t: T('c.note'), k: 'nota', cls: 'small' },
    ], pv.filas));
    if (d.eventos?.length) html += tarjeta(T('events'), null, tabla([
      { t: T('ev.time'), k: 'hora', cls: 'tk' }, { t: T('ev.event'), k: 'evento' },
      { t: T('ev.nq'), k: 'nq', num: true, fmt: pctFmt }, { t: T('ev.es'), k: 'es', num: true, fmt: pctFmt },
      { t: T('ev.read'), k: 'lectura', cls: 'small' },
    ], d.eventos));
  }
  html += bloques(d, 'nq');
  return seccion('nq', 'nqes.png', T('sec.nq'), nq ? `NQ1! ${nq.ultimo ?? ''} ${nq.cambio ?? ''}` : '', html);
}

function seccionStocks(d) {
  let html = '';

  if (d.scorecard) {
    const s = d.scorecard;
    html += `<div class="rates">
      ${s.tasa_activacion ? `<div class="stat"><span class="eyebrow">${esc(T('rate.trigger'))}</span><span class="v">${esc(s.tasa_activacion)}</span><span class="d">${esc(T('rate.trigger.d'))}</span></div>` : ''}
      ${s.tasa_objetivo ? `<div class="stat"><span class="eyebrow">${esc(T('rate.tp'))}</span><span class="v">${esc(s.tasa_objetivo)}</span><span class="d">${esc(T('rate.tp.d'))}</span></div>` : ''}
    </div>${s.nota ? `<p class="foot-note" style="margin:-4px 0 12px">${esc(s.nota)}</p>` : ''}`;
  }

  if (d.picks?.filas?.length) {
    const conEstado = d.picks.filas.some(f => f.estado);
    const cols = [
      { t: T('c.level'), k: 'nivel', fmt: v => `<span class="pill">${esc(v)}</span>` },
      { t: T('c.ticker'), k: 'ticker', cls: 'tk' },
      { t: T('c.price'), k: 'precio', num: true },
      { t: T('c.gap'), k: 'gap', num: true, fmt: pctFmt },
    ];
    if (conEstado) cols.push({ t: T('c.status'), k: 'estado', fmt: v => estadoBadge(v) }, { t: T('c.maxFav'), k: 'max_favor', num: true });
    cols.push({ t: T('c.catalyst'), k: 'catalizador', cls: 'small' });
    if (!conEstado) cols.push({ t: T('c.stop'), k: 'stop', num: true }, { t: T('c.target'), k: 'objetivo', num: true });
    cols.push({ t: T('c.notes'), k: 'nota', cls: 'small' });
    html += tarjeta(T('watchlist'), d.picks.nota, tabla(cols, d.picks.filas) +
      (d.picks.descartadas ? `<p class="foot-note"><strong>${esc(T('discarded'))}</strong> ${esc(d.picks.descartadas)}</p>` : ''));
  }

  if (d.movers?.length) html += tarjeta(T('movers'), null, tabla(
    [{ t: T('c.ticker'), k: 'ticker', cls: 'tk' }, { t: T('c.change'), k: 'cambio', num: true, fmt: pctFmt }, { t: T('c.reason'), k: 'nota', cls: 'small' }],
    d.movers));

  const sp = d.soportes;
  if (sp) {
    if (sp.top3?.length) html += subtitulo(T('top3')) + `<div class="top3">${sp.top3.map(t => `<div class="card">
      <div class="trend"><strong class="tk" style="font:700 16px var(--mono)">${esc(t.ticker)}</strong>
      <span><span class="grade ${esc(t.grado)}">${esc(t.grado)}</span> <span class="eyebrow">R:R ${esc(t.rr)}</span></span></div>
      <div class="lvl">${esc(t.nivel)}</div>${t.resultado ? estadoBadge(t.resultado) + ' ' : ''}<p>${esc(t.texto)}</p></div>`).join('')}</div>`;
    if (sp.revision?.length) html += tarjeta(T('review'), null, tabla(
      [{ t: T('c.ticker'), k: 'ticker', cls: 'tk' }, { t: T('c.support'), k: 'nivel', num: true }, { t: T('c.result'), k: 'resultado', fmt: v => estadoBadge(v) }, { t: T('c.note'), k: 'nota', cls: 'small' }],
      sp.revision));
    if (sp.filas?.length) html += tarjeta(T('supports'), sp.nota, tabla([
      { t: '#', k: '_i', num: true, fmt: (_, f) => sp.filas.indexOf(f) + 1 },
      { t: T('c.ticker'), k: 'ticker', cls: 'tk' },
      { t: T('c.price'), k: 'precio', num: true },
      { t: T('c.support'), k: 'soporte', num: true },
      { t: T('c.levelType'), k: 'tipo_nivel', cls: 'small' },
      { t: T('c.distAtr'), k: 'dist_atr', num: true },
      { t: T('c.trend'), k: 'tendencia' },
      { t: T('c.grade'), k: 'grado', fmt: v => `<span class="grade ${esc(v)}">${esc(v)}</span>` },
      { t: T('c.target'), k: 'objetivo', num: true },
      { t: T('c.invalidation'), k: 'invalidacion', num: true },
      { t: 'R:R', k: 'rr', num: true, fmt: v => `<span class="${parseFloat(v) < 1 ? 'warn' : ''}">${esc(v ?? '—')}</span>` },
      ...(sp.filas.some(f => f.resultado) ? [{ t: T('c.result'), k: 'resultado', fmt: v => estadoBadge(v) }] : []),
    ], sp.filas) + (sp.pie ? `<p class="foot-note">${esc(sp.pie)}</p>` : ''));
  }

  if (d.megas?.filas?.length) html += tarjeta(T('ranking'), d.megas.nota, tabla([
    { t: '#', k: '_i', num: true, fmt: (_, f) => d.megas.filas.indexOf(f) + 1 },
    { t: T('c.ticker'), k: 'ticker', cls: 'tk' },
    { t: T('c.type'), k: 'tipo', fmt: v => `<span class="pill">${esc(v)}</span>` },
    { t: T('c.bias'), k: 'sesgo' },
    { t: T('c.gap'), k: 'gap', num: true, fmt: pctFmt },
    { t: T('c.catalyst'), k: 'catalizador', cls: 'small' },
    { t: 'R1', k: 'r1', num: true },
    { t: T('c.last'), k: 'ultimo', num: true },
    { t: 'S1', k: 's1', num: true },
  ], d.megas.filas));

  html += bloques(d, 'stocks');
  return seccion('stocks', 'stocks.png', T('sec.stocks'), T('sec.stocks.sub'), html);
}

function renderReporte(r, solo) {
  const enIngles = LANG === 'en' && r.datos_en;
  const d = (enIngles ? r.datos_en : r.datos) ?? {};
  const aviso = LANG === 'en' && !r.datos_en ? `<div class="summary" style="border-left-color:var(--orange)">${esc(T('msg.noEnglish'))}</div>` : '';
  const pulso = d.pulso?.length ? `<div class="pulse">${d.pulso.map(p => `<div class="stat">
    <span class="eyebrow">${esc(p.etiqueta)}</span>
    <span class="v ${p.dir === 'up' ? 'up' : p.dir === 'down' ? 'down' : ''}">${esc(p.valor)}</span>
    <span class="d">${esc(p.detalle)}</span></div>`).join('')}</div>` : '';
  return `
    <div class="report-head">
      <span class="eyebrow">${esc(fechaLarga(r.fecha))}</span>
      <h2>${esc(LANG === 'en' ? T(`titulo.${r.tipo}`) : r.titulo)}</h2>
      <div class="meta">${esc(T('meta.published'))} ${esc(horaET(r.publicado_en))}${d.generado ? ` · ${esc(T('meta.data'))} ${esc(d.generado)}` : ''} · ${esc(T('meta.limit'))}</div>
    </div>
    ${aviso}
    ${d.resumen ? `<div class="summary">${esc(d.resumen)}</div>` : ''}
    ${pulso}
    ${!solo || solo === 'noticias' ? seccionNoticias(d, r, solo === 'noticias') : ''}
    ${!solo || solo === 'nq' ? seccionNQ(d, solo === 'nq') : ''}
    ${!solo || solo === 'stocks' ? seccionStocks(d) : ''}`;
}

// ---------- Vista de un día (pestañas) ----------
function renderDia(el, fecha, reportes, tipoInicial, alCambiar, solo) {
  if (!reportes.length) {
    el.innerHTML = `<p class="empty">${esc(T('msg.noneDay'))} ${esc(fechaLarga(fecha))}.</p>`;
    return () => {};
  }
  const porTipo = Object.fromEntries(reportes.map(r => [r.tipo, r]));
  let actual = porTipo[tipoInicial] ? tipoInicial : reportes[reportes.length - 1].tipo;

  const pintar = () => {
    el.innerHTML = `<div class="tabs" role="tablist">${TIPOS.map(t => `
      <button class="tab" role="tab" data-tipo="${t.id}" aria-selected="${t.id === actual}" ${porTipo[t.id] ? '' : 'disabled'}
        title="${porTipo[t.id] ? '' : esc(T('tab.notyet'))}"><i class="dot"></i>${esc(tipoNombre(t.id))}<span style="color:var(--faint);font-weight:500">${porTipo[t.id] ? horaET(porTipo[t.id].publicado_en) : t.hora}</span></button>`).join('')}
      </div><div id="reporte">${renderReporte(porTipo[actual], solo)}</div>`;
    el.querySelectorAll('.tab:not(:disabled)').forEach(b => b.addEventListener('click', () => {
      actual = b.dataset.tipo;
      pintar();
      alCambiar?.(actual);
    }));
  };
  pintar();
  alCambiar?.(actual);
  return pintar;
}

// ---------- Página: Inicio ----------
async function iniciarInicio() {
  const el = document.getElementById('ultimo');
  let repintar = () => {};
  montarSelectorIdioma(() => { renderCanales(); repintar(); });
  renderCanales();
  el.innerHTML = `<p class="loading">${esc(T('msg.loadingLatest'))}</p>`;
  try {
    const fecha = await ultimaFecha();
    if (!fecha) { el.innerHTML = `<p class="empty">${esc(T('msg.none'))}</p>`; return; }
    repintar = renderDia(el, fecha, await reportesDe(fecha));
  } catch (e) {
    el.innerHTML = `<p class="empty">${esc(T('msg.error'))} (${esc(e.message)}).</p>`;
  }
}

function renderCanales() {
  const el = document.getElementById('canales');
  if (!el) return;
  const canales = [
    { id: 'noticias', icono: 'news.png' },
    { id: 'nq', icono: 'nqes.png' },
    { id: 'stocks', icono: 'stocks.png' },
  ];
  el.innerHTML = canales.map(c => `<div class="channel ${c.id}">
    <img src="assets/${c.icono}" alt="LokiAlphaTrading ${esc(T(`ch.${c.id}.t`))}" width="96" height="96">
    <h4>${esc(T(`ch.${c.id}.t`))}</h4><p>${esc(T(`ch.${c.id}.d`))}</p>
    ${WHATSAPP[c.id] ? `<a class="btn" href="${esc(WHATSAPP[c.id])}" target="_blank" rel="noopener">${esc(T('channels.join'))}</a>` : ''}
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
  let repintarDia = () => {};

  montarSelectorIdioma(() => { pintarCalendario(); repintarDia(); });

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
    if (LANG !== 'es') q.set('lang', LANG);
    history.replaceState(null, '', `?${q}`);
  };

  async function pintarCalendario() {
    const dias = new Date(Date.UTC(mes.y, mes.m + 1, 0)).getUTCDate();
    const inicio = (new Date(Date.UTC(mes.y, mes.m, 1)).getUTCDay() + 6) % 7; // lunes primero
    const indice = await indiceEntre(iso(mes.y, mes.m, 1), iso(mes.y, mes.m, dias)).catch(() => []);
    const porDia = {};
    indice.forEach(r => (porDia[r.fecha] ??= []).push(r.tipo));
    const nm = new Date(Date.UTC(mes.y, mes.m, 1)).toLocaleDateString(LOC(), { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const nombreMes = nm.charAt(0).toUpperCase() + nm.slice(1);

    let celdas = T('cal.dow').map(d => `<div class="dow">${d}</div>`).join('');
    celdas += '<div></div>'.repeat(inicio);
    for (let d = 1; d <= dias; d++) {
      const f = iso(mes.y, mes.m, d);
      const tipos = porDia[f] ?? [];
      const cls = ['day', tipos.length && 'has', f === seleccion && 'sel', f === hoyET && 'today'].filter(Boolean).join(' ');
      celdas += `<button class="${cls}" data-fecha="${f}" ${tipos.length ? '' : 'disabled'} aria-label="${fechaLarga(f)}${tipos.length ? '' : ', ' + T('cal.noReports')}">
        ${d}<span class="dots">${TIPOS.filter(t => tipos.includes(t.id)).map(t => `<i class="${t.id}"></i>`).join('')}</span></button>`;
    }

    cal.innerHTML = `
      <div class="cal-head"><button id="prev" aria-label="${esc(T('cal.prev'))}">‹</button><strong>${esc(nombreMes)}</strong><button id="next" aria-label="${esc(T('cal.next'))}">›</button></div>
      <div class="cal-grid">${celdas}</div>
      <div class="legend">${TIPOS.map(t => `<span><i class="${t.id}"></i>${esc(tipoNombre(t.id))}</span>`).join('')}</div>
      <div class="recent"><span class="eyebrow">${esc(T('cal.recent'))}</span>
        ${[...new Set(ultimos.map(r => r.fecha))].slice(0, 7).map(f => `<a href="?fecha=${f}" data-fecha="${f}">${esc(fechaCorta(f))}<span>${ultimos.filter(r => r.fecha === f).map(r => tipoNombre(r.tipo)).join(' · ')}</span></a>`).join('') || `<p class="foot-note">${esc(T('msg.none'))}</p>`}
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
    if (!seleccion) { vista.innerHTML = `<p class="empty">${esc(T('msg.none'))}</p>`; return; }
    vista.innerHTML = `<p class="loading">${esc(T('msg.loading'))}</p>`;
    try {
      repintarDia = renderDia(vista, seleccion, await reportesDe(seleccion), tipoSel, t => { tipoSel = t; actualizarURL(); });
    } catch (e) {
      vista.innerHTML = `<p class="empty">${esc(T('msg.error'))} (${esc(e.message)}).</p>`;
    }
  }

  await pintarCalendario();
  await cargarDia();
}

// ---------- Páginas: Noticias / NQ-ES / Stocks ----------
async function iniciarSeccion(id) {
  const vista = document.getElementById('vista');
  const navDia = document.getElementById('nav-dia');
  const params = new URLSearchParams(location.search);
  let fecha = params.get('fecha');
  let tipoSel = params.get('tipo');
  let repintar = () => {};
  let vecinos = {};

  const actualizarURL = () => {
    const q = new URLSearchParams();
    if (fecha) q.set('fecha', fecha);
    if (tipoSel) q.set('tipo', tipoSel);
    if (LANG !== 'es') q.set('lang', LANG);
    history.replaceState(null, '', `?${q}`);
  };

  const pintarNav = () => {
    if (!fecha) { navDia.innerHTML = ''; return; }
    const boton = (f, txt, cls) => f
      ? `<a class="btn ${cls}" href="?fecha=${f}" data-fecha="${f}">${esc(txt)}</a>`
      : `<span class="btn ${cls}" aria-disabled="true">${esc(txt)}</span>`;
    navDia.innerHTML = `${boton(vecinos.prev, '← ' + T('day.prev'), 'prev')}
      <span class="day-label">${esc(fechaLarga(fecha).charAt(0).toUpperCase() + fechaLarga(fecha).slice(1))}</span>
      ${boton(vecinos.next, T('day.next') + ' →', 'next')}
      <a class="archive-link" href="archivo.html?fecha=${fecha}${LANG !== 'es' ? '&lang=' + LANG : ''}">${esc(T('day.archive'))}</a>`;
    navDia.querySelectorAll('[data-fecha]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault(); fecha = a.dataset.fecha; tipoSel = null; cargar();
    }));
  };

  async function cargar() {
    vista.innerHTML = `<p class="loading">${esc(T('msg.loading'))}</p>`;
    try {
      if (!fecha) fecha = await ultimaFecha();
      if (!fecha) { vista.innerHTML = `<p class="empty">${esc(T('msg.none'))}</p>`; return; }
      const [reps, prev, next] = await Promise.all([
        reportesDe(fecha),
        api(`select=fecha&fecha=lt.${fecha}&order=fecha.desc&limit=1`),
        api(`select=fecha&fecha=gt.${fecha}&order=fecha.asc&limit=1`),
      ]);
      vecinos = { prev: prev[0]?.fecha, next: next[0]?.fecha };
      pintarNav();
      repintar = renderDia(vista, fecha, reps, tipoSel, t => { tipoSel = t; actualizarURL(); }, id);
    } catch (e) {
      vista.innerHTML = `<p class="empty">${esc(T('msg.error'))} (${esc(e.message)}).</p>`;
    }
  }

  montarSelectorIdioma(() => { pintarNav(); repintar(); });
  await cargar();
}
