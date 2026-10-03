# Formato de reportes (sitio LokiAlphaTrading Community)

Cada reporte es un archivo `reportes/YYYY-MM-DD-<tipo>.json` que se publica con:

```
node scripts/publicar.mjs reportes/YYYY-MM-DD-<tipo>.json
```

Publicar de nuevo el mismo día y tipo **reemplaza** el reporte (sirve para corregir). El sitio (`index.html` y `archivo.html`) lee Supabase en vivo, así que no hace falta volver a subir el sitio.

All text is in **Spanish**. Every field is optional: the site only draws the sections that exist. Values are strings formatted for display, e.g. `"31,084"`, `"+1.05%"`, `"−8.0%"` (a minus sign or `-` turns red, `+` turns green).

```jsonc
{
  "fecha": "2026-10-02",                 // trading day (ET)
  "tipo": "matutino",                    // matutino | meridiano | closing
  "titulo": "LokiAlphaTrading - Reporte Matutino",   // or "- Reporte Meridiano" / "- Closing"
  "publicado_en": "2026-10-02T12:50:00Z",// optional; defaults to now (UTC)
  "datos": {
    "generado": "8:50 AM ET",
    "resumen": "One or two sentences: what matters today.",
    "pulso": [ { "etiqueta": "SPY premarket", "valor": "+0.83%", "detalle": "770.32", "dir": "up|down|flat" } ],

    // ---- Noticias (blue) ----
    "agenda":   [ { "hora": "8:30", "tema": "...", "efecto": "...", "prob": 10, "estado": "Ya salió" } ],
    "que_movio": "Closing: what moved the market today.",
    "despues_cierre": [ { "ticker": "NKE", "cambio": "−8.0%", "nota": "AH earnings..." } ],
    "manana":   [ /* same shape as agenda: tomorrow's calendar (Closing) */ ],

    // ---- NQ / ES (green) ----
    "nq": {
      "ultimo": "31,084", "cambio": "+1.05%", "nota": "ATR, close reference...",
      "tendencias": [ { "marco": "Diaria", "valor": "Alcista|Bajista|Lateral", "nota": "..." } ],
      "escalera": [ { "nivel": "31,151.5", "nota": "Máximo histórico · +68 pts", "tipo": "cielo|resistencia|precio|soporte" } ],
      "lectura": "If/then read."
    },
    "briefing": { "estado": "pendiente|listo", "texto": "Summary only. Never name the source or paste its scenarios." },

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
