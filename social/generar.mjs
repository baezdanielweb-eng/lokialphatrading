#!/usr/bin/env node
// Carrusel SIMPLE del día (PNG 1080×1350): una idea por slide, pocas palabras, números grandes.
// Uso: node social/generar.mjs reportes/<fecha>-<tipo>.json [--pick TICKER] [--video]
//   --video: las slides son fondo del video (lunes/viernes); se oculta "Desliza →" porque no se publica el carrusel.
//   Matutino  (5): gancho · noche + niveles NQ/ES · pick del día · noticia clave · CTA
//   Meridiano (4): gancho · qué está pasando · cómo va el pick · CTA
//   Closing   (5): gancho · cierre NQ/ES · resultado del pick · noticias de mañana · CTA
// Los datos salen del mismo JSON del sitio. Campo opcional datos.redes = { gancho, subgancho, pick }:
// (+ sub2 opcional: subtítulo corto de la slide 2) lo escriben las skills; si falta, el gancho se arma con los datos y el pick es el primero de la watchlist.
// Semanal (si existe datos.semana, lo escriben las skills):
//   Lunes, Matutino: "Lo que viene esta semana" reemplaza la noticia clave (datos.semana.eventos).
//   Viernes, Closing: se agrega "La semana en números" (salida de social/semana.mjs).
// La versión detallada (7 slides) es social/generar-pro.mjs.

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = 1080, H = 1350;
const assets = join(RAIZ, 'assets');

const args = process.argv.slice(2);
const archivo = args.find(a => !a.startsWith('--'));
if (!archivo) { console.error('Uso: node social/generar.mjs <reporte.json> [--pick TICKER]'); process.exit(1); }
const pickArg = args.includes('--pick') ? args[args.indexOf('--pick') + 1] : null;
const modoVideo = args.includes('--video');
const r = JSON.parse(readFileSync(resolve(RAIZ, archivo), 'utf8'));
const d = r.datos;
const redes = d.redes ?? {};

// ---------- Utilidades ----------
const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const dir = v => (/^\s*\+/.test(v) ? 'up' : /^\s*[−-]/.test(v) ? 'down' : '');
const num = v => parseFloat(String(v ?? '').replace(/[^\d.\-−]/g, '').replace('−', '-'));
const fecha = new Date(`${r.fecha}T12:00:00Z`);
const diaCorto = (() => { const s = fecha.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace(/\./g, ''); return s.charAt(0).toUpperCase() + s.slice(1); })();
const SERIE = {
  matutino: { nombre: 'Plan del día', color: '#f5b800', manana: 'hoy' },
  meridiano: { nombre: 'Mediodía', color: '#2f8cff', manana: 'esta tarde' },
  closing: { nombre: 'Cierre del día', color: '#22c55e', manana: 'mañana' },
}[r.tipo];
if (!SERIE) throw new Error(`Tipo desconocido: ${r.tipo}`);

// Niveles más cercanos al precio a partir de la escalera (ordenada de arriba hacia abajo).
function cercanos(f) {
  const e = f?.escalera ?? [];
  const i = e.findIndex(l => l.tipo === 'precio');
  if (i < 0) return {};
  const res = [...e.slice(0, i)].reverse().find(l => l.tipo === 'resistencia');
  const sop = e.slice(i + 1).find(l => l.tipo === 'soporte');
  const cielo = e.slice(0, i).some(l => l.tipo === 'cielo');
  return { precio: e[i].nivel, res: res?.nivel, sop: sop?.nivel, cielo };
}
const pulso = et => (d.pulso ?? []).find(p => p.etiqueta.toUpperCase().startsWith(et));
const corto = (t, n = 70) => {
  t = String(t ?? '').split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/)[0];
  if (t.length <= n) return t;
  const c = t.slice(0, n - 1); return c.slice(0, c.lastIndexOf(' ') > n * 0.6 ? c.lastIndexOf(' ') : c.length).replace(/[,;:·\s]+$/, '') + '…';
};

// Pick del día: redes.pick → --pick → primero de la watchlist.
const picks = d.picks?.filas ?? [];
const pickTk = (redes.pick || pickArg || picks[0]?.ticker || '').toUpperCase();
const pick = picks.find(p => p.ticker.toUpperCase() === pickTk);

// ---------- Plantilla común ----------
const css = `
:root { --bg:#04070d; --card:#0c1322; --border:#1a2740; --text:#e9eef7; --muted:#8d9ab0; --faint:#5d6a80;
  --serie:${SERIE.color}; --blue:#2f8cff; --green:#22c55e; --red:#ef4444; --orange:#f59e0b; }
* { box-sizing:border-box; margin:0; }
html, body { width:${W}px; height:${H}px; }
body { background: radial-gradient(900px 620px at 50% -140px, color-mix(in srgb, var(--serie) 22%, transparent), transparent 70%), var(--bg);
  color:var(--text); font-family:'Inter',system-ui,sans-serif; padding:70px 80px 60px; display:flex; flex-direction:column; overflow:hidden; }
.top { display:flex; align-items:center; gap:18px; }
.top img { width:60px; height:60px; border-radius:50%; }
.serie { font:800 24px/1 'Montserrat',sans-serif; letter-spacing:.16em; text-transform:uppercase; color:var(--serie); }
.fecha { font:700 22px/1 'Inter'; color:var(--muted); margin-top:6px; }
.pager { margin-left:auto; font:700 22px/1 'JetBrains Mono',monospace; color:var(--faint); }
main { flex:1; display:flex; flex-direction:column; justify-content:center; gap:40px; }
.k { font:800 26px/1.2 'Montserrat',sans-serif; letter-spacing:.18em; text-transform:uppercase; color:var(--muted); }
h1 { font:800 92px/1.04 'Montserrat',sans-serif; letter-spacing:-.025em; }
h2 { font:800 64px/1.08 'Montserrat',sans-serif; letter-spacing:-.02em; }
.sub { font-size:36px; line-height:1.35; color:var(--muted); }
.big { font:700 120px/1 'JetBrains Mono',monospace; letter-spacing:-.03em; }
.mid { font:700 64px/1.05 'JetBrains Mono',monospace; }
.up { color:var(--green); } .down { color:var(--red); } .serie-c { color:var(--serie); }
.card { background:var(--card); border:2px solid var(--border); border-radius:28px; padding:34px 38px; }
.duo { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
.lv { display:flex; flex-direction:column; gap:4px; font-size:24px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); padding:12px 0; }
.lv b { font:700 44px 'JetBrains Mono',monospace; white-space:nowrap; letter-spacing:-.01em; text-transform:none; }
.lv.r b { color:var(--red); } .lv.s b { color:var(--green); }
.badge { display:inline-block; font:800 34px/1 'Inter'; padding:16px 22px; border-radius:16px; }
.b-ok { background:rgba(34,197,94,.16); color:var(--green); } .b-bad { background:rgba(239,68,68,.16); color:var(--red); }
.b-open { background:rgba(47,140,255,.16); color:var(--blue); } .b-wait { background:rgba(141,154,176,.16); color:var(--muted); }
.prob { height:20px; border-radius:10px; background:var(--border); overflow:hidden; margin-top:18px; }
.prob i { display:block; height:100%; }
.foot { display:flex; justify-content:space-between; align-items:center; border-top:2px solid var(--border); padding-top:22px; color:var(--muted); font-size:22px; }
.foot b { color:var(--text); }
`;
const fuentes = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&family=Montserrat:wght@700;800&display=block" rel="stylesheet">';
const pagina = (n, total, cuerpo) => `<!doctype html><html lang="es"><head><meta charset="utf-8">${fuentes}<style>${css}</style></head><body>
  <div class="top"><img src="file://${assets}/favicon.png"><div><div class="serie">${SERIE.nombre}</div><div class="fecha">${esc(diaCorto)} · LokiAlphaTrading</div></div><div class="pager">${n}/${total}</div></div>
  <main>${cuerpo}</main>
  <div class="foot"><span>Educativo, no es asesoría financiera</span><b>@tradeaconloki</b></div></body></html>`;

// ---------- Piezas ----------
function gancho() {
  if (redes.gancho) return [redes.gancho, redes.subgancho ?? ''];
  const nq = d.nq ?? {};
  const giro = (d.eventos ?? []).find(e => /Sin evento/i.test(e.evento));
  if (r.tipo === 'closing' && giro && /histórico/i.test(nq.nota ?? '')) return [`El Nasdaq tocó récord… y devolvió ${Math.abs(num(giro.nq))} puntos`, corto(d.resumen, 90)];
  const p = pulso('NQ1');
  if (r.tipo === 'matutino' && p) return [`El NQ ${num(p.valor) >= 0 ? 'sube' : 'baja'} ${p.valor.replace(/^[+−-]/, '')} antes de la apertura`, corto(d.resumen, 90)];
  return [corto(d.resumen, 60), ''];
}
const slideGancho = () => { const [g1, g2] = gancho(); return `
  <h1>${esc(g1)}</h1>${g2 ? `<p class="sub">${esc(g2)}</p>` : ''}
  <div style="display:flex;align-items:center;gap:16px"><img src="file://${assets}/nqes.png" style="width:78px;height:78px;border-radius:50%"><img src="file://${assets}/stocks.png" style="width:78px;height:78px;border-radius:50%"><img src="file://${assets}/news.png" style="width:78px;height:78px;border-radius:50%">${modoVideo ? '' : '<span style="font-size:28px;color:var(--muted);margin-left:8px">Desliza →</span>'}</div>`; };

function cajaFuturo(nombre, f, cambio) {
  if (!f) return '';
  const c = cercanos(f);
  return `<div class="card"><div class="k">${esc(nombre)}</div>
    <div class="mid ${dir(cambio)}" style="margin:12px 0 6px">${esc(f.ultimo ?? c.precio ?? '')}</div>
    <div style="font:700 30px 'JetBrains Mono';margin-bottom:14px" class="${dir(cambio)}">${esc(cambio ?? '')}</div>
    ${c.res ? `<div class="lv r"><span>Resistencia</span><b>${esc(c.res)}</b></div>` : c.cielo ? `<div class="lv r"><span>Arriba</span><b style="color:var(--blue)">Cielo azul</b></div>` : ''}
    ${c.sop ? `<div class="lv s"><span>Soporte</span><b>${esc(c.sop)}</b></div>` : ''}</div>`;
}
const slideFuturos = (titulo, sub) => { sub = redes.sub2 ?? sub; return `
  <div class="row" style="display:flex;align-items:center;gap:18px"><img src="file://${assets}/nqes.png" style="width:84px;height:84px;border-radius:50%"><div class="k" style="color:var(--green)">NQ / ES</div></div>
  <h2>${esc(titulo)}</h2>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}
  <div class="${d.nq && d.es ? 'duo' : ''}">${cajaFuturo('NQ1!', d.nq, d.nq?.cambio)}${cajaFuturo('ES1!', d.es, d.es?.cambio ?? pulso('ES1')?.detalle?.split(' ')[0])}</div>`; };

function estadoPick(p) {
  const e = (p?.estado ?? '').toLowerCase();
  if (/sin stop|en curso/.test(e)) return ['b-open', '⏳ Abierta'];
  if (/objetivo alcanzado/.test(e)) return ['b-ok', '✅ Objetivo'];
  if (/invalidada|stop/.test(e)) return ['b-bad', '❌ Stop'];
  if (/sin activar/.test(e)) return ['b-wait', '⏸ Sin activar'];
  return ['b-wait', p?.estado ? '• ' + p.estado : '• Pendiente'];
}
const slidePick = (titulo, conEstado) => pick ? `
  <div style="display:flex;align-items:center;gap:18px"><img src="file://${assets}/stocks.png" style="width:84px;height:84px;border-radius:50%"><div class="k" style="color:var(--gold, #f5b800)">Stocks · pick del día</div></div>
  <h2>${esc(titulo)}</h2>
  <div class="card" style="padding:44px 44px">
    <div style="display:flex;justify-content:space-between;align-items:baseline"><span class="big">${esc(pick.ticker)}</span>
      ${(() => { const v = conEstado ? (redes.pick_cambio ?? pick.gap ?? '') : (pick.gap ?? ''); return `<span class="mid ${dir(v)}" style="font-size:52px">${esc(v)}</span>`; })()}</div>
    ${conEstado && pick.precio ? `<div class="mono" style="font:700 40px 'JetBrains Mono';margin-top:18px;color:var(--muted)">$${esc(pick.precio)}</div>` : ''}
    <p class="sub" style="margin-top:24px">${esc(corto(conEstado ? (redes.pick_texto ?? pick.catalizador) : pick.catalizador, 95))}</p>
  </div>` : `<h2>${esc(titulo)}</h2><p class="sub">Sin pick definido para hoy.</p>`;

function slideNoticias(titulo, lista, n) {
  const top = [...(lista ?? [])].filter(x => Number(x.prob) > 0).sort((a, b) => b.prob - a.prob).slice(0, n);
  return `
  <div style="display:flex;align-items:center;gap:18px"><img src="file://${assets}/news.png" style="width:84px;height:84px;border-radius:50%"><div class="k" style="color:var(--blue)">Noticias</div></div>
  <h2>${esc(titulo)}</h2>
  <div style="display:grid;gap:22px">${top.map(x => { const p = Number(x.prob); const col = p >= 7 ? 'var(--red)' : p >= 4 ? 'var(--orange)' : 'var(--green)'; return `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:20px">
      <span class="mono" style="font:700 40px 'JetBrains Mono';color:var(--blue)">${esc(x.hora)}</span>
      <span style="font:700 46px 'JetBrains Mono';color:${col}">${p}<span style="font-size:24px;color:var(--muted)">/10</span></span></div>
    <div style="font:800 40px/1.2 Inter;margin-top:12px">${esc(corto(x.tema.split(' · ').find(t => /FOMC|minutas/i.test(t)) ?? x.tema, 60))}</div>
    <div class="prob"><i style="width:${p * 10}%;background:${col}"></i></div></div>`; }).join('')}</div>
  <p style="font-size:24px;color:var(--faint)">Probabilidad de mover el mercado (1–10)</p>`;
}

function slideSemanaEventos(ev) {
  const top = [...ev].sort((a, b) => (b.prob ?? 0) - (a.prob ?? 0)).slice(0, 4)
    .sort((a, b) => ['lun', 'mar', 'mié', 'jue', 'vie'].indexOf((a.dia ?? '').slice(0, 3).toLowerCase()) - ['lun', 'mar', 'mié', 'jue', 'vie'].indexOf((b.dia ?? '').slice(0, 3).toLowerCase()));
  return `
  <div style="display:flex;align-items:center;gap:18px"><img src="file://${assets}/news.png" style="width:84px;height:84px;border-radius:50%"><div class="k" style="color:var(--blue)">Noticias · semana</div></div>
  <h2>Lo que viene esta semana</h2>
  <div style="display:grid;gap:16px">${top.map(x => { const p = Number(x.prob) || 0; const col = p >= 7 ? 'var(--red)' : p >= 4 ? 'var(--orange)' : 'var(--green)'; return `<div class="card" style="display:grid;grid-template-columns:150px 1fr 110px;gap:18px;align-items:center;padding:24px 30px">
    <div><div style="font:800 30px Montserrat;color:var(--blue)">${esc(x.dia)}</div><div style="font:700 24px 'JetBrains Mono';color:var(--muted)">${esc(x.hora ?? '')}</div></div>
    <div style="font:800 34px/1.2 Inter">${esc(corto(x.tema, 46))}</div>
    <div style="font:700 44px 'JetBrains Mono';color:${col};text-align:right">${p}<span style="font-size:20px;color:var(--muted)">/10</span></div></div>`; }).join('')}</div>`;
}

function slideSemanaNumeros(sm) {
  const pk = sm.picks ?? {};
  const caja = (n, f) => f?.cambio ? `<div class="card"><div class="k">${n}</div><div class="mid ${dir(f.cambio.valor)}" style="margin-top:12px">${esc(f.cambio.valor)}</div><div style="font-size:26px;color:var(--muted);margin-top:6px">cierre ${esc(f.cierre ?? '')}</div></div>` : '';
  return `
  <div style="display:flex;align-items:center;gap:18px"><img src="file://${assets}/stocks.png" style="width:84px;height:84px;border-radius:50%"><div class="k" style="color:#f5b800">Resumen semanal</div></div>
  <h2>La semana en números</h2>
  <div class="duo">${caja('NQ1! · semana', sm.nq)}${caja('ES1! · semana', sm.es)}</div>
  <div class="card" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;text-align:center">
    <div><div class="mid" style="font-size:58px">${pk.activadas ?? 0}</div><div style="font-size:24px;color:var(--muted)">activadas</div></div>
    <div><div class="mid up" style="font-size:58px">${pk.objetivo ?? 0}</div><div style="font-size:24px;color:var(--muted)">✅ objetivo</div></div>
    <div><div class="mid down" style="font-size:58px">${pk.stop ?? 0}</div><div style="font-size:24px;color:var(--muted)">❌ stop</div></div>
    <div><div class="mid ${dir(pk.r_neto)}" style="font-size:58px">${esc(pk.r_neto ?? '')}</div><div style="font-size:24px;color:var(--muted)">neto</div></div></div>
  <p style="font-size:24px;color:var(--faint)">${(sm.dias ?? []).length} de 5 días con reporte · publicamos aciertos y errores</p>`;
}

// Top movers (informativo). d.movers = [{ticker, cambio, nota}], ganadoras y perdedoras; se muestran 4 y 4.
function slideMovers(titulo) {
  const num = x => parseFloat(String(x.cambio).replace('−', '-').replace('%', '')) || 0;
  const arriba = d.movers.filter(x => num(x) > 0).sort((a, b) => num(b) - num(a)).slice(0, 4);
  const abajo = d.movers.filter(x => num(x) < 0).sort((a, b) => num(a) - num(b)).slice(0, 4);
  const fila = x => `<div style="display:grid;grid-template-columns:150px 1fr 150px;gap:16px;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.06)">
      <span style="font:800 34px 'JetBrains Mono'">${esc(x.ticker)}</span>
      <span style="font-size:24px;color:var(--muted);line-height:1.25">${esc(corto(x.nota ?? '', 42))}</span>
      <span class="${dir(x.cambio)}" style="font:700 34px 'JetBrains Mono';text-align:right">${esc(x.cambio)}</span></div>`;
  return `
  <div style="display:flex;align-items:center;gap:18px"><img src="file://${assets}/stocks.png" style="width:84px;height:84px;border-radius:50%"><div class="k" style="color:var(--gold, #f5b800)">Stocks · top movers</div></div>
  <h2>${esc(titulo)}</h2>
  <div class="card" style="padding:22px 36px">${arriba.map(fila).join('')}</div>
  ${abajo.length ? `<div class="card" style="padding:22px 36px">${abajo.map(fila).join('')}</div>` : ''}
  <p style="font-size:22px;color:var(--faint)">${r.tipo === 'matutino' ? 'Premarket · ' : ''}EE.UU., capitalización > $2B</p>`;
}

const slideCTA = () => `
  <h1 style="font-size:84px">Reporte completo en el <span class="serie-c">link de la bio</span></h1>
  <div class="card" style="font-size:34px;line-height:1.5">
    📊 Niveles, pivotes y volumen<br>📰 Todas las noticias con fuentes<br>💬 Grupos de WhatsApp: Noticias · NQ/ES · Stocks</div>
  <p class="sub" style="font-size:30px">Síguenos: <b style="color:var(--text)">@tradeaconloki</b> · Órdenes siempre límite</p>`;

// ---------- Estructura por reporte ----------
const nqP = pulso('NQ1'), esP = pulso('ES1');
const slides = {
  matutino: () => [
    slideGancho(),
    slideFuturos('Qué pasó en la noche', corto(d.nq?.lectura ?? d.resumen, 80)),
    d.movers?.length ? slideMovers('Lo que se mueve antes de la apertura') : slidePick('El pick de hoy', false),
    d.semana?.eventos?.length ? slideSemanaEventos(d.semana.eventos) : slideNoticias('La noticia clave de hoy', (d.agenda ?? []).filter(x => !/^(Lun|Mar|Mié|Jue|Vie|Sáb|Dom)(\s|$)/.test(x.hora ?? '') && !/ya sali/i.test(x.estado ?? '')), 1),
    slideCTA(),
  ],
  meridiano: () => [
    slideGancho(),
    slideFuturos('Qué está pasando', corto(d.resumen, 80)),
    d.movers?.length ? slideMovers('Lo que más se mueve hoy') : slidePick('¿Cómo va el pick del día?', true),
    slideCTA(),
  ],
  closing: () => [
    slideGancho(),
    slideFuturos('Así cierra el día', corto((d.resumen ?? '').split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/)[1] ?? d.resumen, 95)),
    d.movers?.length ? slideMovers('Lo que más se movió hoy') : slidePick('¿Cómo cerró el pick del día?', true),
    ...(d.semana?.picks ? [slideSemanaNumeros(d.semana)] : []),
    slideNoticias('Lo que viene mañana', d.manana, 2),
    slideCTA(),
  ],
}[r.tipo]();

// ---------- Render ----------
const out = join(RAIZ, 'social', `${r.fecha}-${r.tipo}`);
mkdirSync(out, { recursive: true });
// Solo se reemplazan las slides y el texto; los videos u otros archivos de la carpeta se conservan.
for (const f of readdirSync(out)) if (/^slide-\d+\.(png|html)$/.test(f)) rmSync(join(out, f));
slides.forEach((cuerpo, i) => {
  const html = join(out, `slide-${i + 1}.html`);
  writeFileSync(html, pagina(i + 1, slides.length, cuerpo));
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
    `--window-size=${W},${H}`, '--virtual-time-budget=4000', `--screenshot=${join(out, `slide-${i + 1}.png`)}`, `file://${html}`], { stdio: 'ignore' });
  rmSync(html);
});

// ---------- Texto ----------
const [g1] = gancho();
const caption = `TÍTULO SUGERIDO:
${g1}

DESCRIPCIÓN:
${SERIE.nombre} · ${diaCorto}. ${corto(d.resumen, 200)}
${pick ? `\n🎯 Pick del día: ${pick.ticker}${pick.estado ? ` · ${pick.estado}` : ''}` : ''}
📈 Reporte completo, niveles y noticias: link en la bio.
💬 Grupos de WhatsApp: Noticias, NQ/ES y Stocks.

Contenido educativo, no es asesoría financiera. Órdenes siempre límite.

#trading #tradingenespañol #nasdaq #NQ #futuros #daytrading #bolsa #acciones #LokiAlphaTrading

TikTok: www.tiktok.com/@tradeaconloki`;
writeFileSync(join(out, 'caption.txt'), caption);
console.log(`Listo: ${slides.length} slides (${SERIE.nombre}) en ${out}${pick ? ` · pick ${pick.ticker}` : ''}`);
