#!/usr/bin/env node
// Publica (o reemplaza) un reporte en Supabase.
// Uso: node scripts/publicar.mjs reportes/2026-10-02-matutino.json
//
// El JSON debe tener: { fecha: "YYYY-MM-DD", tipo: "matutino"|"meridiano"|"closing", titulo, publicado_en?, datos: {...}, datos_en?: {...} }
// datos = español (principal). datos_en = la misma estructura traducida al inglés (opcional).
// La clave secreta se pide a la CLI de Supabase en cada ejecución: nunca se imprime ni se guarda en disco.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const REF = 'qyvkrowvinaslxdhvmku';
const URL = `https://${REF}.supabase.co/rest/v1/reportes?on_conflict=fecha,tipo`;
const TIPOS = ['matutino', 'meridiano', 'closing'];

const archivo = process.argv[2];
if (!archivo) {
  console.error('Uso: node scripts/publicar.mjs <reporte.json>');
  process.exit(1);
}

const reporte = JSON.parse(readFileSync(archivo, 'utf8'));
if (!/^\d{4}-\d{2}-\d{2}$/.test(reporte.fecha || '')) throw new Error('fecha debe ser YYYY-MM-DD');
if (!TIPOS.includes(reporte.tipo)) throw new Error(`tipo debe ser uno de: ${TIPOS.join(', ')}`);
if (!reporte.titulo) throw new Error('falta titulo');
if (typeof reporte.datos !== 'object') throw new Error('falta datos');
if (reporte.datos_en && typeof reporte.datos_en !== 'object') throw new Error('datos_en debe ser un objeto');

const claves = JSON.parse(execFileSync('supabase', ['projects', 'api-keys', '--project-ref', REF, '--reveal', '-o', 'json'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
}));
const secreta = claves.find(k => k.type === 'secret')?.api_key;
if (!secreta) throw new Error('No se encontró la clave secreta. ¿Está iniciada la sesión de la CLI (supabase login)?');

const fila = {
  fecha: reporte.fecha,
  tipo: reporte.tipo,
  titulo: reporte.titulo,
  datos: reporte.datos,
  ...(reporte.datos_en ? { datos_en: reporte.datos_en } : {}),
  ...(reporte.publicado_en ? { publicado_en: reporte.publicado_en } : {}),
};

const res = await fetch(URL, {
  method: 'POST',
  headers: {
    apikey: secreta,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation',
  },
  body: JSON.stringify(fila),
});

const cuerpo = await res.text();
if (!res.ok) {
  console.error(`Error ${res.status}: ${cuerpo}`);
  process.exit(1);
}
const [guardado] = JSON.parse(cuerpo);
console.log(`Publicado: ${guardado.fecha} · ${guardado.tipo} · id ${guardado.id} · ${guardado.publicado_en} · inglés: ${guardado.datos_en ? 'sí' : 'no'}`);
