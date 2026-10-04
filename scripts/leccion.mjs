#!/usr/bin/env node
// Publica una lección de Educación (para cuando el equipo le pasa material a Claude).
// Uso: node scripts/leccion.mjs educacion/<leccion>.json [archivo.pdf|.png|.jpg]
// El JSON lleva los campos de la tabla "lecciones" (ver educacion/README.md). Si se pasa un archivo,
// se sube al almacenamiento "educacion" y su enlace público va en archivo_url.
// Si ya existe una lección con el mismo título, se actualiza en vez de duplicarla.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, extname } from 'node:path';

const REF = 'qyvkrowvinaslxdhvmku';
const BASE = `https://${REF}.supabase.co`;
const TIPOS = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

const [json, archivo] = process.argv.slice(2);
if (!json) { console.error('Uso: node scripts/leccion.mjs <leccion.json> [archivo]'); process.exit(1); }
const leccion = JSON.parse(readFileSync(json, 'utf8'));

const claves = JSON.parse(execFileSync('supabase', ['projects', 'api-keys', '--project-ref', REF, '--reveal', '-o', 'json'], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
}));
const secreta = claves.find(k => k.type === 'secret')?.api_key;
if (!secreta) throw new Error('No se encontró la clave secreta. ¿Está iniciada la sesión de la CLI (supabase login)?');
const H = { apikey: secreta, Authorization: `Bearer ${secreta}` };

if (archivo) {
  const tipo = TIPOS[extname(archivo).toLowerCase()];
  if (!tipo) throw new Error('Formato no permitido (PDF, PNG, JPG o WEBP).');
  const limpio = basename(archivo).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9.]+/g, '-');
  const ruta = `${new Date().toISOString().slice(0, 10)}-${limpio}`;
  const res = await fetch(`${BASE}/storage/v1/object/educacion/${ruta}`, {
    method: 'POST', headers: { ...H, 'Content-Type': tipo, 'x-upsert': 'true' }, body: readFileSync(archivo),
  });
  if (!res.ok) throw new Error(`Error al subir el archivo ${res.status}: ${await res.text()}`);
  leccion.archivo_url = `${BASE}/storage/v1/object/public/educacion/${ruta}`;
  console.log(`Archivo subido: ${leccion.archivo_url}`);
}

const existe = await (await fetch(`${BASE}/rest/v1/lecciones?select=id&titulo=eq.${encodeURIComponent(leccion.titulo)}`, { headers: H })).json();
const url = existe[0] ? `${BASE}/rest/v1/lecciones?id=eq.${existe[0].id}` : `${BASE}/rest/v1/lecciones`;
const res = await fetch(url, {
  method: existe[0] ? 'PATCH' : 'POST',
  headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=representation' },
  body: JSON.stringify(leccion),
});
const cuerpo = await res.text();
if (!res.ok) { console.error(`Error ${res.status}: ${cuerpo}`); process.exit(1); }
const [g] = JSON.parse(cuerpo);
console.log(`${existe[0] ? 'Actualizada' : 'Creada'}: #${g.id} · ${g.titulo} · ${g.nivel}/${g.tema}/${g.formato} · ${g.publicado ? 'publicada' : 'borrador'}`);
