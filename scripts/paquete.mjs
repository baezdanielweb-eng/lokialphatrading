#!/usr/bin/env node
// Paquete de WhatsApp + carrusel de un reporte (tabla privada "paquetes" + bucket privado "paquetes").
// social/20*/ está en .gitignore: los mensajes nunca van al repo público. El VPS sube; la MacBook revisa, baja y marca lo enviado.
//
// Uso:
//   node scripts/paquete.mjs subir   <fecha> <tipo>          # sube social/<fecha>-<tipo>/whatsapp.json
//                                                           #   ({ "noticias": "...", "stocks": "...", "nqes": "..." }) + slide-*.png + caption.txt
//   node scripts/paquete.mjs estado  <fecha>                 # qué reportes están en el sitio y qué paquetes hay
//   node scripts/paquete.mjs bajar   <fecha> <tipo>          # -> social/<fecha>-<tipo>/ (whatsapp.json + imágenes + caption)
//   node scripts/paquete.mjs enviado <fecha> <tipo> <grupo>  # grupo: noticias | stocks | nqes
//
// La clave secreta se pide a la CLI de Supabase en cada ejecución: nunca se imprime ni se guarda en disco.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const REF = 'qyvkrowvinaslxdhvmku';
const BASE = `https://${REF}.supabase.co`;
const BUCKET = 'paquetes';
const TIPOS = ['matutino', 'meridiano', 'closing'];
const GRUPOS = ['noticias', 'stocks', 'nqes'];

const [accion, fecha, tipo, extra] = process.argv.slice(2);
const uso = () => { console.error('Uso: node scripts/paquete.mjs subir|estado|bajar|enviado <fecha> [tipo] [grupo]'); process.exit(1); };
if (!['subir', 'estado', 'bajar', 'enviado'].includes(accion)) uso();
if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) uso();
if (accion !== 'estado' && !TIPOS.includes(tipo)) throw new Error(`tipo debe ser uno de: ${TIPOS.join(', ')}`);

const claves = JSON.parse(execFileSync('supabase', ['projects', 'api-keys', '--project-ref', REF, '--reveal', '-o', 'json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
}));
const secreta = claves.find(k => k.type === 'secret')?.api_key;
if (!secreta) throw new Error('No se encontró la clave secreta. ¿Está iniciada la sesión de la CLI (supabase login)?');

async function pedir(ruta, opciones = {}) {
  const res = await fetch(BASE + ruta, { ...opciones, headers: { apikey: secreta, ...(opciones.headers || {}) } });
  if (!res.ok) throw new Error(`${opciones.method || 'GET'} ${ruta} → ${res.status}: ${await res.text()}`);
  return res;
}
const carpeta = `social/${fecha}-${tipo}`;

if (accion === 'subir') {
  const mensajes = JSON.parse(readFileSync(join(carpeta, 'whatsapp.json'), 'utf8'));
  for (const g of GRUPOS) if (typeof mensajes[g] !== 'string' || !mensajes[g].trim()) throw new Error(`falta el mensaje "${g}"`);

  const imagenes = [];
  let caption = null;
  if (existsSync(carpeta)) {
    for (const archivo of readdirSync(carpeta).filter(a => /^slide-\d+\.png$/.test(a)).sort()) {
      const ruta = `${fecha}-${tipo}/${archivo}`;
      await pedir(`/storage/v1/object/${BUCKET}/${ruta}`, {
        method: 'POST',
        headers: { 'Content-Type': 'image/png', 'x-upsert': 'true' },
        body: readFileSync(join(carpeta, archivo)),
      });
      imagenes.push(ruta);
    }
    if (existsSync(join(carpeta, 'caption.txt'))) caption = readFileSync(join(carpeta, 'caption.txt'), 'utf8');
  }

  const res = await pedir('/rest/v1/paquetes?on_conflict=fecha,tipo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ fecha, tipo, mensajes: { noticias: mensajes.noticias, stocks: mensajes.stocks, nqes: mensajes.nqes }, caption, imagenes, enviado: {} }),
  });
  const [fila] = await res.json();
  console.log(`Paquete guardado: ${fila.fecha} · ${fila.tipo} · id ${fila.id} · ${imagenes.length} imágenes · caption: ${caption ? 'sí' : 'no'}`);
}

if (accion === 'estado') {
  const reportes = await (await pedir(`/rest/v1/reportes?fecha=eq.${fecha}&select=tipo,publicado_en`)).json();
  const paquetes = await (await pedir(`/rest/v1/paquetes?fecha=eq.${fecha}&select=tipo,creado_en,imagenes,enviado`)).json();
  for (const t of TIPOS) {
    const r = reportes.find(x => x.tipo === t);
    const p = paquetes.find(x => x.tipo === t);
    const env = p ? GRUPOS.map(g => `${g}:${p.enviado[g] ? 'enviado' : 'pendiente'}`).join(' ') : '';
    console.log(`${t.padEnd(10)} sitio: ${r ? r.publicado_en : 'no'} · paquete: ${p ? `${p.creado_en} · ${p.imagenes.length} imágenes · ${env}` : 'no'}`);
  }
}

if (accion === 'bajar') {
  const [p] = await (await pedir(`/rest/v1/paquetes?fecha=eq.${fecha}&tipo=eq.${tipo}&select=*`)).json();
  if (!p) { console.error(`No hay paquete para ${fecha} · ${tipo}`); process.exit(2); }
  mkdirSync(carpeta, { recursive: true });
  for (const ruta of p.imagenes) {
    const res = await pedir(`/storage/v1/object/authenticated/${BUCKET}/${ruta}`);
    writeFileSync(join(carpeta, ruta.split('/').pop()), Buffer.from(await res.arrayBuffer()));
  }
  if (p.caption) writeFileSync(join(carpeta, 'caption.txt'), p.caption);
  const salida = join(carpeta, 'whatsapp.json');
  writeFileSync(salida, JSON.stringify({ ...p.mensajes, creado_en: p.creado_en, enviado: p.enviado }, null, 2) + '\n');
  console.log(`Bajado: ${salida} · ${p.imagenes.length} imágenes · enviado: ${JSON.stringify(p.enviado)}`);
}

if (accion === 'enviado') {
  if (!GRUPOS.includes(extra)) throw new Error(`grupo debe ser uno de: ${GRUPOS.join(', ')}`);
  const [p] = await (await pedir(`/rest/v1/paquetes?fecha=eq.${fecha}&tipo=eq.${tipo}&select=enviado`)).json();
  if (!p) { console.error(`No hay paquete para ${fecha} · ${tipo}`); process.exit(2); }
  const enviado = { ...p.enviado, [extra]: new Date().toISOString() };
  await pedir(`/rest/v1/paquetes?fecha=eq.${fecha}&tipo=eq.${tipo}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enviado }),
  });
  console.log(`Marcado enviado: ${fecha} · ${tipo} · ${extra}`);
}
