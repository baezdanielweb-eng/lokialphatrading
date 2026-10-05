#!/usr/bin/env node
// Arma un video vertical (1080×1920) con voz de IA a partir de un carrusel ya generado y un guion.
// Uso: node social/video.mjs social/guiones/<fecha>-<tipo>.json
// Voz: "piper:<modelo>" usa Piper (gratis, local, sin cuenta; modelos en social/voces/), por ejemplo
// "piper:es_MX-claude-high". Cualquier otro valor usa las voces del Mac (`say`), por ejemplo "Paulina".
// "ritmo" (solo Piper) ajusta la velocidad: 1 = normal, 0.9 = 10% más rápido.
// "eleven:<voice_id>" usa ElevenLabs (modelo multilingüe) con la clave ELEVENLABS_API_KEY de .env (nunca se imprime).
// El plan gratis solo permite las voces integradas; las de la biblioteca (p. ej. venezolanas) requieren plan pago.
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
const VENV_PIPER = join(RAIZ, '.venv-voz', 'bin', 'piper');
function claveEleven() {
  const env = join(RAIZ, '.env');
  const m = existsSync(env) && readFileSync(env, 'utf8').match(/^ELEVENLABS_API_KEY=(.+)$/m);
  if (!m) throw new Error('Falta ELEVENLABS_API_KEY en .env');
  return m[1].trim();
}
let caracteresEleven = 0;
async function hablar(texto, archivo) {
  const voz = g.voz ?? 'Paulina';
  if (voz.startsWith('eleven:')) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voz.slice(7))}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': claveEleven(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texto, model_id: 'eleven_multilingual_v2', language_code: 'es',
        voice_settings: { stability: g.estabilidad ?? 0.5, similarity_boost: 0.75 } }),
    });
    if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 200)}`);
    writeFileSync(archivo, Buffer.from(await r.arrayBuffer()));
    caracteresEleven += texto.length;
  } else if (voz.startsWith('piper:')) {
    const modelo = join(RAIZ, 'social', 'voces', `${voz.slice(6)}.onnx`);
    if (!existsSync(modelo)) throw new Error(`Falta el modelo de voz: ${modelo}`);
    execFileSync(VENV_PIPER, ['-m', modelo, '-f', archivo, '--length-scale', String(g.ritmo ?? 1), '--sentence-silence', '0.15'],
      { input: texto, stdio: ['pipe', 'ignore', 'ignore'] });
  } else {
    run('say', ['-v', voz, '-r', String(g.velocidad ?? 180), '-o', archivo, texto]);
  }
}
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
    const audio = join(tmp, `a${n}.${(g.voz ?? '').startsWith('eleven:') ? 'mp3' : (g.voz ?? '').startsWith('piper:') ? 'wav' : 'aiff'}`), html = join(tmp, `f${n}.html`), png = join(tmp, `f${n}.png`), mp4 = join(tmp, `s${n}.mp4`);
    await hablar(p.decir, audio);
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
const salida = join(carrusel, `video-${(g.nombreVoz ?? g.voz ?? 'Paulina').replace(/^(piper|eleven):/, '')}.mp4`);
run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', '-movflags', '+faststart', salida]);
rmSync(tmp, { recursive: true, force: true });
console.log(`Listo: ${salida} · ${duracion(salida).toFixed(1)} s${caracteresEleven ? ` · ElevenLabs: ${caracteresEleven} caracteres` : ''}`);
