#!/usr/bin/env node
// Resumen de la semana a partir de los reportes Closing publicados en Supabase (todas las máquinas publican ahí).
// Uso: node social/semana.mjs 2026-10-02     (cualquier fecha de la semana; normalmente el viernes)
// Imprime un JSON para poner en datos.semana del Closing del viernes (lo usan el carrusel y el video).
// Solo cuenta los días que tienen Closing; "dias" dice cuáles fueron, para no inventar nada.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fecha = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha ?? '')) { console.error('Uso: node social/semana.mjs YYYY-MM-DD'); process.exit(1); }

const iso = d => d.toISOString().slice(0, 10);
const base = new Date(`${fecha}T12:00:00Z`);
const lunes = new Date(base); lunes.setUTCDate(base.getUTCDate() - ((base.getUTCDay() + 6) % 7));
const dias = [...Array(5)].map((_, i) => { const d = new Date(lunes); d.setUTCDate(lunes.getUTCDate() + i); return iso(d); }).filter(d => d <= fecha);
const viernesAnterior = (() => { const d = new Date(lunes); d.setUTCDate(lunes.getUTCDate() - 3); return iso(d); })();

const SB = 'https://qyvkrowvinaslxdhvmku.supabase.co', KEY = 'sb_publishable_4pljPW7l6lTC4qF8RpjCPA_C83MsUqS';  // clave pública (solo lectura)
const desdeBase = await (async () => {
  try {
    const res = await fetch(`${SB}/rest/v1/reportes?select=fecha,tipo,datos&tipo=eq.closing&fecha=gte.${viernesAnterior}&fecha=lte.${fecha}`, { headers: { apikey: KEY } });
    return res.ok ? await res.json() : [];
  } catch { return []; }
})();
// Primero la base de datos; si un día no está ahí, el archivo local (por si aún no se publicó).
const leer = (f, t) => {
  const fila = desdeBase.find(x => x.fecha === f && x.tipo === t);
  if (fila) return { datos: fila.datos };
  const p = join(RAIZ, 'reportes', `${f}-${t}.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
};
const num = v => parseFloat(String(v ?? '').replace(/[^\d.\-−]/g, '').replace('−', '-'));
const pct = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + '%';

const cierres = dias.map(d => ({ fecha: d, r: leer(d, 'closing') })).filter(x => x.r);
if (!cierres.length) { console.error(`No hay reportes Closing para la semana de ${fecha}.`); process.exit(1); }

// Cambio semanal: contra el cierre del viernes anterior si existe; si no, componiendo los cambios diarios.
function cambioSemana(clave) {
  const ult = num(cierres.at(-1).r.datos[clave]?.ultimo);
  const prev = num(leer(viernesAnterior, 'closing')?.datos[clave]?.ultimo);
  if (ult && prev) return { valor: pct((ult / prev - 1) * 100), metodo: 'vs cierre del viernes anterior' };
  const diarios = cierres.map(c => num(c.r.datos[clave]?.cambio)).filter(Number.isFinite);
  if (!diarios.length) return null;
  return { valor: pct((diarios.reduce((a, c) => a * (1 + c / 100), 1) - 1) * 100), metodo: `compuesto de ${diarios.length} día(s)` };
}

let activadas = 0, objetivo = 0, stop = 0, abiertas = 0, total = 0, r = 0;
const picksDelDia = [];
for (const { fecha: f, r: rep } of cierres) {
  for (const p of rep.datos.picks?.filas ?? []) {
    total++;
    const e = (p.estado ?? '').toLowerCase();
    if (!/sin activar/.test(e)) activadas++;
    // Orden importa: "Activada, sin stop ni objetivo" contiene "stop" y no es un stop.
    if (/sin stop|en curso/.test(e)) abiertas++;
    else if (/objetivo alcanzado/.test(e)) objetivo++;
    else if (/invalidada|stop/.test(e)) stop++;
    const rv = num(p.resultado_r); if (Number.isFinite(rv)) r += rv;
  }
  const pk = rep.datos.redes?.pick && (rep.datos.picks?.filas ?? []).find(p => p.ticker === rep.datos.redes.pick);
  if (pk) picksDelDia.push({ fecha: f, ticker: pk.ticker, estado: pk.estado, resultado_r: pk.resultado_r ?? null });
}

const out = {
  dias: cierres.map(c => c.fecha),
  nq: { cierre: cierres.at(-1).r.datos.nq?.ultimo, cambio: cambioSemana('nq') },
  es: { cierre: cierres.at(-1).r.datos.es?.ultimo, cambio: cambioSemana('es') },
  picks: { total, activadas, objetivo, stop, abiertas_al_cierre: abiertas, r_neto: (r >= 0 ? '+' : '−') + Math.abs(r).toFixed(1) + 'R' },
  picks_del_dia: picksDelDia,
};
console.log(JSON.stringify(out, null, 2));
