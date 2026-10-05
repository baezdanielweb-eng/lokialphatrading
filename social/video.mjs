#!/usr/bin/env node
// Arma un video vertical (1080×1920) con voz de IA a partir de un carrusel ya generado y un guion.
// Uso: node social/video.mjs social/guiones/<fecha>-<tipo>.json
// Voz: por ahora las voces en español del Mac (comando `say`). Más adelante se puede cambiar por
// ElevenLabs/Azure con una clave guardada en .env (nunca en el repositorio).
// Salida: <carpeta del carrusel>/video.mp4 (+ subtítulos quemados y aviso de voz generada con IA).

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = 1080, H = 1920, PAUSA = 0.3;

const g = JSON.parse(readFileSync(resolve(RAIZ, process.argv[2] ?? ''), 'utf8'));
const carrusel = resolve(RAIZ, g.carrusel);
if (!existsSync(join(carrusel, 'slide-1.png'))) throw new Error(`Primero genera el carrusel: node social/generar.mjs …`);
const tmp = join(carrusel, '_video');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const duracion = f => parseFloat(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]));

const marco = (slide, texto) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@600;800&family=Montserrat:wght@800&display=block" rel="stylesheet">
<style>
  * { margin:0; box-sizing:border-box; }
  body { width:${W}px; height:${H}px; background:#04070d; color:#e9eef7; font-family:Inter,sans-serif; display:flex; flex-direction:column; }
  .top { height:150px; display:flex; align-items:center; justify-content:space-between; padding:0 56px; }
  .top b { font:800 34px Montserrat; } .top b i { font-style:normal; color:#2f8cff; } .top span { font:800 30px Inter; color:#8d9ab0; }
  img.s { width:${W}px; height:1350px; display:block; }
  .cap { flex:1; display:flex; align-items:center; justify-content:center; padding:0 60px; text-align:center; }
  .cap p { font:800 46px/1.25 Inter; background:#2f8cff; color:#fff; padding:14px 22px; border-radius:18px; box-decoration-break:clone; -webkit-box-decoration-break:clone; }
  .ai { position:absolute; bottom:22px; width:100%; text-align:center; font:600 22px Inter; color:#5d6a80; }
</style></head><body>
  <div class="top"><b>Loki<i>Alpha</i>trading</b><span>@tradeaconloki</span></div>
  <img class="s" src="file://${join(carrusel, `slide-${slide}.png`)}">
  <div class="cap"><p>${esc(texto)}</p></div>
  <div class="ai">Voz generada con IA · Contenido educativo</div>
</body></html>`;

const segmentos = [];
let n = 0;
for (const b of g.bloques) {
  for (const p of b.partes) {
    n++;
    const audio = join(tmp, `a${n}.aiff`), html = join(tmp, `f${n}.html`), png = join(tmp, `f${n}.png`), mp4 = join(tmp, `s${n}.mp4`);
    run('say', ['-v', g.voz ?? 'Paulina', '-r', String(g.velocidad ?? 180), '-o', audio, p.decir]);
    const d = duracion(audio) + PAUSA;
    writeFileSync(html, marco(b.slide, p.texto));
    run(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
      `--window-size=${W},${H}`, '--virtual-time-budget=3000', `--screenshot=${png}`, `file://${html}`]);
    run('ffmpeg', ['-y', '-loop', '1', '-framerate', '30', '-i', png, '-i', audio,
      '-af', `apad=pad_dur=${PAUSA}`, '-t', d.toFixed(3),
      '-c:v', 'libx264', '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-r', '30',
      '-c:a', 'aac', '-ar', '44100', '-ac', '2', '-b:a', '160k', mp4]);
    segmentos.push(mp4);
    process.stdout.write(`  ${n}. ${d.toFixed(1)}s · ${p.texto.slice(0, 60)}\n`);
  }
}

const lista = join(tmp, 'lista.txt');
writeFileSync(lista, segmentos.map(s => `file '${s}'`).join('\n'));
const salida = join(carrusel, 'video.mp4');
run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', '-movflags', '+faststart', salida]);
rmSync(tmp, { recursive: true, force: true });
console.log(`Listo: ${salida} · ${duracion(salida).toFixed(1)} s`);
