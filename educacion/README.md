# Educación: cómo se publica una lección

Fuente de verdad: la tabla `lecciones` en Supabase. Hay dos formas de publicar:

1. **Panel de administración**: `/admin.html` (acceso con enlace mágico; solo correos en la tabla `admins`).
2. **Claude**: un JSON aquí + `node scripts/leccion.mjs educacion/<archivo>.json [archivo.pdf|.png|.jpg]`.
   Si ya existe una lección con el mismo título, se actualiza.

| Campo | Valores |
| --- | --- |
| `titulo` / `titulo_en` | 3–140 caracteres (español obligatorio) |
| `descripcion` / `descripcion_en` | 1–2 frases |
| `nivel` | `basico` · `intermedio` · `avanzado` |
| `tema` | `fundamentos` · `tecnico` · `estrategias` · `riesgo` · `psicologia` · `futuros` · `macro` · `herramientas` |
| `formato` | `video` (requiere `youtube_id`, 11 caracteres) · `slides` / `pdf` (requieren archivo) |
| `duracion` | texto libre: "8 min", "12 slides", "4 páginas" |
| `ruta_inicio` | posición en "Empieza aquí" (vacío = no está en la ruta) |
| `orden` | número menor = aparece primero (por defecto 100) |
| `aplicalo_url` | página del sitio (`nq.html?fecha=…&tipo=…`) o enlace https |
| `aplicalo_texto` / `_en` | texto corto del enlace |
| `publicado` | `true` = visible para todos; `false` = borrador (solo admins) |

Los archivos van al almacenamiento público `educacion` (PDF, PNG, JPG, WEBP; máx. 50 MB).
Los correos de administradores **no** van en este repositorio (es público): se agregan directo en la base.
