-- Versión en inglés de cada reporte (opcional). El sitio usa "datos" (español) si falta.
alter table public.reportes add column datos_en jsonb;
