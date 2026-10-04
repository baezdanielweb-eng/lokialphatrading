#!/usr/bin/env node
// Genera un carrusel (PNG 1080×1350) a partir de un reporte publicado.
// Uso: node social/generar.mjs reportes/2026-10-02-closing.json
// Salida: social/<fecha>-<tipo>/slide-1.png … + caption.txt
// Los números salen del mismo JSON que usa el sitio. Por ahora: formato Closing.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = 1080, H = 1350;

const archivo = process.argv[2];
if (!archivo) { console.error('Uso: node social/generar.mjs <reporte.json>'); process.exit(1); }
const r = JSON.parse(readFileSync(resolve(RAIZ, archivo), 'utf8'));
if (r.tipo !== 'closing') { console.error('Por ahora solo hay plantilla para el Closing.'); process.exit(1); }
const d = r.datos;

const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const dir = v => (/^\s*\+/.test(v) ? 'up' : /^\s*[−-]/.test(v) ? 'down' : '');
const fecha = new Date(`${r.fecha}T12:00:00Z`);
const dia = fecha.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '');
const diaCap = dia.charAt(0).toUpperCase() + dia.slice(1);
const assets = join(RAIZ, 'assets');

// ---------- Plantilla común ----------
const css = `
:root { --bg:#04070d; --card:#0c1322; --card2:#101a2d; --border:#1a2740; --text:#e9eef7; --muted:#8d9ab0; --faint:#5d6a80;
  --blue:#2f8cff; --green:#22c55e; --gold:#f5b800; --red:#ef4444; --orange:#f59e0b; }
* { box-sizing:border-box; margin:0; }
html, body { width:${W}px; height:${H}px; }
body { background: radial-gradient(900px 600px at 50% -120px, rgba(47,140,255,.22), transparent 70%), var(--bg);
  color:var(--text); font-family:'Inter',system-ui,sans-serif; padding:72px 76px 64px; display:flex; flex-direction:column; overflow:hidden; }
.top { display:flex; align-items:center; gap:18px; }
.top img { width:64px; height:64px; border-radius:50%; }
.brand { font:800 30px/1 'Montserrat',sans-serif; letter-spacing:-.01em; }
.brand .a { color:var(--blue); }
.brand small { display:block; font:700 13px/1 'Montserrat',sans-serif; letter-spacing:.3em; color:var(--muted); margin-top:6px; }
.pager { margin-left:auto; font:700 22px/1 'JetBrains Mono',monospace; color:var(--faint); }
main { flex:1; display:flex; flex-direction:column; justify-content:center; gap:34px; }
.eyebrow { font:800 22px/1.2 'Montserrat',sans-serif; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); }
h1 { font:800 76px/1.05 'Montserrat',sans-serif; letter-spacing:-.02em; }
h2 { font:800 58px/1.08 'Montserrat',sans-serif; letter-spacing:-.015em; }
.lead { font-size:32px; line-height:1.4; color:var(--muted); }
.up { color:var(--green); } .down { color:var(--red); } .blue { color:var(--blue); } .gold { color:var(--gold); } .green { color:var(--green); }
.foot { display:flex; justify-content:space-between; align-items:center; border-top:2px solid var(--border); padding-top:24px; color:var(--muted); font-size:22px; }
.foot b { color:var(--text); }
.card { background:var(--card); border:2px solid var(--border); border-radius:26px; padding:28px 32px; }
.mono { font-family:'JetBrains Mono',monospace; }
.grid2 { display:grid; grid-template-columns:1fr 1fr; gap:22px; }
.stat .k { font:800 20px/1 'Montserrat',sans-serif; letter-spacing:.14em; color:var(--muted); text-transform:uppercase; }
.stat .v { font:700 56px/1.15 'JetBrains Mono',monospace; margin-top:12px; }
.stat .d { font-size:22px; color:var(--muted); margin-top:4px; }
.row { display:flex; align-items:center; gap:24px; }
.badge { font:800 22px/1 'Inter',sans-serif; padding:12px 16px; border-radius:12px; white-space:nowrap; }
.b-ok { background:rgba(34,197,94,.16); color:var(--green); } .b-bad { background:rgba(239,68,68,.16); color:var(--red); } .b-wait { background:rgba(141,154,176,.16); color:var(--muted); }
.sec-icon { width:84px; height:84px; border-radius:50%; }
`;
const fuentes = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&family=Montserrat:wght@700;800&display=block" rel="stylesheet">';

function pagina(n, total, cuerpo, pie = '') {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">${fuentes}<style>${css}</style></head><body>
  <div class="top"><img src="file://${assets}/favicon.png"><div class="brand">Loki<span class="a">Alpha</span>trading<small>COMMUNITY</small></div><div class="pager">${n}/${total}</div></div>
  <main>${cuerpo}</main>
  <div class="foot"><span>${pie || 'Educativo, no es asesoría financiera'}</span><b>@tradeaconloki</b></div>
  </body></html>`;
}

// ---------- Diapositivas del Closing ----------
const nq = d.nq ?? {};
const picks = d.picks?.filas ?? [];
const sc = d.scorecard ?? {};
const pulso = d.pulso ?? [];
const eventos = d.eventos ?? [];
const nfp = eventos.find(e => /NFP|Empleo/i.test(e.evento));
const giro = eventos.find(e => /Sin evento/i.test(e.evento));
const athNivel = (nq.escalera ?? []).find(l => /histórico/i.test(l.nota))?.nivel ?? '';
// "31,265–282.5" → "31,282.5": el tramo abreviado reemplaza los últimos dígitos enteros del primero.
const topeRango = n => { const [a, b] = n.split('–'); if (!b) return a; const ent = b.split('.')[0].length; return a.slice(0, a.length - ent) + b; };

const slides = [];

// 1. Portada
slides.push(`
  <div class="eyebrow">Closing · ${esc(diaCap)}</div>
  <h1>El NQ tocó <span class="blue">máximo histórico</span> y devolvió ${esc((giro?.nq ?? '').replace('−', ''))} puntos</h1>
  <p class="lead">${esc(d.resumen?.split('. ')[0] ?? '')}.</p>
  <div class="row" style="gap:18px;margin-top:10px">
    <img class="sec-icon" src="file://${assets}/news.png"><img class="sec-icon" src="file://${assets}/nqes.png"><img class="sec-icon" src="file://${assets}/stocks.png">
    <span style="font-size:26px;color:var(--muted);margin-left:8px">Desliza →</span>
  </div>`);

// 2. Pulso: cierres
const elegidos = pulso.filter(p => /SPY|QQQ|NQ1|ES1|VIX|IWM/.test(p.etiqueta)).slice(0, 6);
slides.push(`
  <div class="eyebrow">Cierres del día</div>
  <h2>Así cerró el mercado</h2>
  <div class="grid2">${elegidos.map(p => `<div class="card stat">
    <div class="k">${esc(p.etiqueta.replace(' (cierre 4 PM)', ''))}</div>
    <div class="v ${p.dir === 'up' ? 'up' : p.dir === 'down' ? 'down' : ''}">${esc(p.valor)}</div>
    <div class="d">${esc(p.detalle)}</div></div>`).join('')}</div>`);

// 3. Qué movió el mercado (eventos con reacción medida)
const evs = eventos.filter(e => e.nq && e.nq !== '—').slice(0, 4);
slides.push(`
  <div class="row"><img class="sec-icon" src="file://${assets}/news.png"><div class="eyebrow" style="color:var(--blue)">Noticias</div></div>
  <h2>¿Qué movió el mercado?</h2>
  <div style="display:grid;gap:18px">${evs.map(e => `<div class="card" style="display:grid;grid-template-columns:200px 1fr 170px;gap:22px;align-items:center;padding:24px 28px">
    <div class="mono blue" style="font-size:28px;font-weight:700">${esc(e.hora)}</div>
    <div style="font-size:28px;font-weight:700;line-height:1.25">${esc(e.evento)}</div>
    <div class="mono ${dir(e.nq)}" style="font-size:36px;font-weight:700;text-align:right">${esc(e.nq)}<div style="font-size:18px;color:var(--muted);font-family:Inter">pts NQ</div></div>
  </div>`).join('')}</div>`);

// 4. Resultados de la watchlist
// Orden importa: "Activada, sin stop ni objetivo" contiene ambas palabras y no es ni objetivo ni stop.
const icono = est => /sin stop|sin activar|en curso/i.test(est) ? ['b-wait', '⏳ Abierta al cierre']
  : /objetivo alcanzado/i.test(est) ? ['b-ok', '✅ Objetivo']
  : /invalidada|stop/i.test(est) ? ['b-bad', '❌ Stop'] : ['b-wait', '⏳ ' + est];
slides.push(`
  <div class="row"><img class="sec-icon" src="file://${assets}/stocks.png"><div class="eyebrow gold">Resultados</div></div>
  <h2>Watchlist: cómo nos fue</h2>
  <div style="display:grid;gap:18px">${picks.map(p => { const [c, t] = icono(p.estado); return `<div class="card" style="display:grid;grid-template-columns:170px 1fr auto;gap:22px;align-items:center">
    <div class="mono" style="font-size:44px;font-weight:700">${esc(p.ticker)}</div>
    <div style="font-size:24px;color:var(--muted);line-height:1.35">${esc(p.catalizador)}</div>
    <div style="text-align:right"><span class="badge ${c}">${t}</span><div class="mono ${dir(p.resultado_r ?? '')}" style="font-size:30px;font-weight:700;margin-top:10px">${esc(p.resultado_r ?? '')}</div></div>
  </div>`; }).join('')}</div>
  <div class="grid2">
    <div class="card stat"><div class="k">Activadas</div><div class="v">${esc(sc.tasa_activacion)}</div></div>
    <div class="card stat"><div class="k">Llegaron al objetivo</div><div class="v">${esc(sc.tasa_objetivo)}</div></div>
  </div>`);

// 5. Soportes por grado (resultado real de la tabla de la mañana)
const filas = d.soportes?.filas ?? [];
const conteo = g => {
  const f = filas.filter(x => x.grado === g && x.resultado !== 'No tocó');
  return { obj: f.filter(x => /Objetivo/.test(x.resultado)).length, sos: f.filter(x => /Sostuvo/.test(x.resultado)).length, rom: f.filter(x => /Rompió/.test(x.resultado)).length };
};
const barras = g => { const c = conteo(g), tot = c.obj + c.sos + c.rom || 1; return `<div class="card" style="padding:26px 30px">
  <div class="row" style="justify-content:space-between;margin-bottom:16px"><span style="font:800 40px Montserrat">Grado ${g}</span>
  <span style="font-size:24px;color:var(--muted)">${c.obj} objetivo · ${c.sos} sostuvo · ${c.rom} rompió</span></div>
  <div style="display:flex;height:34px;border-radius:10px;overflow:hidden;background:var(--border)">
    <i style="width:${c.obj / tot * 100}%;background:var(--green)"></i><i style="width:${c.sos / tot * 100}%;background:var(--blue)"></i><i style="width:${c.rom / tot * 100}%;background:var(--red)"></i></div></div>`; };
slides.push(`
  <div class="row"><img class="sec-icon" src="file://${assets}/stocks.png"><div class="eyebrow gold">Soportes de la mañana</div></div>
  <h2>Hoy los grado A <span class="down">se rompieron más</span></h2>
  <div style="display:grid;gap:18px">${['A', 'B', 'C'].map(barras).join('')}</div>
  <p class="lead" style="font-size:26px">El NQ giró desde máximos y los nombres de IA y semis (MU, INTC, PLTR) cayeron. Lo publicamos igual: así se mide si el método funciona.</p>`);

// 6. Niveles del NQ para la próxima sesión
const esc5 = (nq.escalera ?? []).filter(l => l.tipo !== 'cielo').slice(0, 6);
const colorTipo = t => t === 'resistencia' ? 'var(--red)' : t === 'soporte' ? 'var(--green)' : 'var(--text)';
slides.push(`
  <div class="row"><img class="sec-icon" src="file://${assets}/nqes.png"><div class="eyebrow green">NQ / ES</div></div>
  <h2>Niveles del NQ para el lunes</h2>
  <div class="card" style="padding:14px 32px">${esc5.map(l => `<div style="display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:center;padding:20px 0 20px 22px;border-left:8px solid ${colorTipo(l.tipo)};margin:6px 0;${l.tipo === 'precio' ? 'background:var(--card2);border-radius:0 14px 14px 0' : ''}">
    <span class="mono" style="font-size:38px;font-weight:700;color:${colorTipo(l.tipo)}">${esc(l.nivel)}</span>
    <span style="font-size:23px;color:var(--muted);line-height:1.3">${esc(l.nota.split(' · ')[0])}</span></div>`).join('')}</div>
  <p class="lead" style="font-size:26px">Sobre ${esc(topeRango(athNivel))} (máximo histórico): cielo azul. Pivotes, volumen y lectura completa en el sitio.</p>`);

// 7. Agenda + cierre
const manana = (d.manana ?? []).filter(m => Number(m.prob) >= 3).slice(0, 3);
slides.push(`
  <div class="eyebrow">Lo que viene</div>
  <h2>Agenda del lunes</h2>
  <div style="display:grid;gap:16px">${manana.map(m => { const p = Number(m.prob); const col = p >= 7 ? 'var(--red)' : p >= 4 ? 'var(--orange)' : 'var(--green)'; return `<div class="card" style="display:grid;grid-template-columns:150px 1fr 120px;gap:20px;align-items:center;padding:22px 28px">
    <div class="mono blue" style="font-size:26px;font-weight:700">${esc(m.hora)}</div>
    <div style="font-size:25px;font-weight:700;line-height:1.3">${esc(m.tema.split(' · ').find(x => /FOMC|minutas/i.test(x)) ?? m.tema.split(' · ')[0])}</div>
    <div class="mono" style="font-size:40px;font-weight:700;color:${col};text-align:right">${p}<span style="font-size:20px;color:var(--muted)">/10</span></div></div>`; }).join('')}</div>
  <div class="card" style="text-align:center;border-color:var(--blue);padding:34px">
    <div style="font:800 40px/1.2 Montserrat">Reporte completo en el link de la bio</div>
    <div style="font-size:26px;color:var(--muted);margin-top:12px">lokialphatrading.pages.dev · Grupos de WhatsApp: Noticias, NQ/ES y Stocks</div>
  </div>`);

// ---------- Render ----------
const out = join(RAIZ, 'social', `${r.fecha}-${r.tipo}`);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
slides.forEach((cuerpo, i) => {
  const html = join(out, `slide-${i + 1}.html`);
  writeFileSync(html, pagina(i + 1, slides.length, cuerpo, i === slides.length - 1 ? 'Educativo, no es asesoría financiera · Órdenes límite' : ''));
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
    `--window-size=${W},${H}`, '--virtual-time-budget=4000', `--screenshot=${join(out, `slide-${i + 1}.png`)}`, `file://${html}`],
    { stdio: 'ignore' });
});

// ---------- Texto para la publicación ----------
const caption = `${d.resumen?.split('. ').slice(0, 2).join('. ')}.

📊 Resultados del día: ${sc.tasa_activacion} activadas, ${sc.tasa_objetivo} al objetivo. Publicamos aciertos y errores.
📈 Niveles del NQ para el lunes, pivotes y volumen: reporte completo en el link de la bio.
💬 Únete a los grupos de WhatsApp: Noticias, NQ/ES y Stocks.

Contenido educativo, no es asesoría financiera. Órdenes siempre límite.

#trading #tradingenespañol #nasdaq #NQ #futuros #daytrading #bolsa #acciones #inversiones #LokiAlphaTrading`;
writeFileSync(join(out, 'caption.txt'), caption);
console.log(`Listo: ${slides.length} diapositivas en ${out}`);
