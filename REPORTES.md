# Formato de reportes (sitio LokiAlphaTrading Community)

Cada reporte es un archivo `reportes/YYYY-MM-DD-<tipo>.json` que se publica con:

```
node scripts/publicar.mjs reportes/YYYY-MM-DD-<tipo>.json
```

Publicar de nuevo el mismo día y tipo **reemplaza** el reporte (sirve para corregir). El sitio (`index.html` y `archivo.html`) lee Supabase en vivo, así que no hace falta volver a subir el sitio.

**Languages:** `datos` is the main version, in **Spanish**. `datos_en` is the **same structure translated to English**; the site's ES/EN switch shows it, and if it's missing, English readers see the Spanish version with a notice. Always write both. Keep numbers, tickers and the `tipo` codes in `escalera` (cielo/resistencia/precio/soporte) identical in both, and translate everything else, including status words (e.g. *Target hit*, *Held*, *Broke*, *Stopped out*, *Not triggered*, *Triggered, no stop or target*).

 Every field is optional: the site only draws the sections that exist. Values are strings formatted for display, e.g. `"31,084"`, `"+1.05%"`, `"−8.0%"` (a minus sign or `-` turns red, `+` turns green).

```jsonc
{
  "fecha": "2026-10-02",                 // trading day (ET)
  "tipo": "matutino",                    // matutino | meridiano | closing
  "titulo": "LokiAlphaTrading - Reporte Matutino",   // or "- Reporte Meridiano" / "- Closing"
  "publicado_en": "2026-10-02T12:50:00Z",// optional; defaults to now (UTC)
  "datos_en": { /* same keys as datos, in English */ },
  "datos": {
    "generado": "8:50 AM ET",
    "resumen": "One or two sentences: what matters today.",
    "pulso": [ { "etiqueta": "SPY premarket", "valor": "+0.83%", "detalle": "770.32", "dir": "up|down|flat" } ],

    // ---- Noticias (blue) ----
    "agenda":   [ { "hora": "8:30", "tema": "...", "efecto": "...", "prob": 10, "estado": "Ya salió",
                    "enlace": "https://… (optional: official release or article)", "fuente": "BLS" } ],
    // Market headlines: shown on the Noticias page (the homepage links to it). 6–12 items.
    "titulares": [ { "hora": "8:30", "categoria": "Macro|Fed|Empresas|Geopolítica|Semana|…", "tickers": ["TSLA"],
                     "titulo": "Our own headline", "resumen": "1–2 sentences IN OUR OWN WORDS (never copy article text)",
                     "fuente": "CNBC", "url": "https://… (the article from WebSearch results; https only)" } ],
    "que_movio": "Closing: what moved the market today.",
    "despues_cierre": [ { "ticker": "NKE", "cambio": "−8.0%", "nota": "AH earnings..." } ],
    "manana":   [ /* same shape as agenda: tomorrow's calendar (Closing) */ ],

    // ---- NQ / ES (green) ----   (never include briefing/Jarvis data: local only)
    "nq": {
      "ultimo": "31,084", "cambio": "+1.05%", "nota": "ATR, close reference...",
      "tendencias": [ { "marco": "Diaria", "valor": "Alcista|Bajista|Lateral", "nota": "..." } ],
      "escalera": [ { "nivel": "31,151.5", "nota": "Máximo histórico · +68 pts", "tipo": "cielo|resistencia|precio|soporte" } ],
      "lectura": "If/then read."
    },
    // ---- NQ/ES page only (expanded) ----
    "es": { /* same shape as "nq": ultimo, cambio, nota, tendencias, escalera, lectura */ },
    "volumen": { "resumen": "...",
      "filas": [ { "simbolo": "NQ1!", "sesion": "Completa (Globex)", "volumen": "573,488", "promedio20": "564,359", "relativo": "1.02×", "nota": "..." } ],
      "horas": [ { "hora": "9:30", "nq_vol": "129,032", "nq_pct": 100, "nq_rango": "31,056–31,282.5", "nq_mov": "+117.75",
                   "es_vol": "370,762", "es_mov": "+14.75", "nota": "..." } ] },   // nq_pct = bar width vs the biggest hour
    "pivotes": { "nota": "Classic floor pivots from the prior regular session H/L/C",
      "filas": [ { "nombre": "R3|R2|R1|P|S1|S2|S3", "nq": "31,533.5", "es": "7,864.4", "nota": "confluence with structure" } ] },
    "eventos": [ { "hora": "10:00", "evento": "...", "nq": "+80", "es": "+15.5", "lectura": "how the market reacted (or what to watch)" } ],

    // ---- Stocks (gold) ----
    "scorecard": { "tasa_activacion": "2/3 (67%)", "tasa_objetivo": "1/2 (50%)", "nota": "..." },
    "picks": {
      "nota": "...",
      "filas": [ { "nivel": "Small|Large|Mega", "ticker": "ON", "precio": "85.90", "gap": "+7.3%",
                   "catalizador": "...", "stop": "$0.50", "objetivo": "$0.75", "nota": "...",
                   "estado": "Objetivo alcanzado", "max_favor": "+1.8%" } ],   // estado/max_favor: Meridiano + Closing
      "descartadas": "..."
    },
    "movers": [ { "ticker": "NVDA", "cambio": "+3.1%", "nota": "why" } ],
    "soportes": {
      "nota": "...",
      "top3":     [ { "ticker": "NVDA", "grado": "A", "rr": "1.9", "nivel": "234.50", "texto": "...", "resultado": "Sostuvo +1.2%" } ],
      "revision": [ { "ticker": "MSFT", "nivel": "517.78", "resultado": "Rompió", "nota": "..." } ],  // Meridiano/Closing: morning top 3 result
      "filas":    [ { "ticker": "MSFT", "precio": "518.38", "soporte": "517.78", "tipo_nivel": "...", "dist_atr": "0.05",
                      "tendencia": "Alcista", "grado": "A|B|C", "objetivo": "522.85", "invalidacion": "514.73", "rr": "1.2",
                      "resultado": "Sostuvo" } ],
      "pie": "Footnote."
    },
    "megas": { "nota": "...", "filas": [ { "ticker": "ON", "tipo": "Mega|Noticia", "sesgo": "...", "gap": "+7.3%",
                                           "catalizador": "...", "r1": "86.47", "ultimo": "85.90", "s1": "85.55" } ] },

    // ---- Free blocks, in any section ----
    "bloques": [ { "seccion": "noticias|nq|stocks", "titulo": "...", "texto": "..." } ]
  }
}
```

**Status words** (`estado` / `resultado`) are colored automatically:
- green: *Objetivo alcanzado*, *Sostuvo*
- red: *Invalidada*, *Stop*, *Rompió*, *Falló sin activar*
- blue: *Activada – en curso*
- grey: *Sin activar*, anything else

Full example: `reportes/2026-10-02-matutino.json`.
