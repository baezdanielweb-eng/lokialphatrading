-- Reportes diarios: Matutino (/LAT-Morning), Meridiano (/LAT-Noon), Closing (/LAT-Closing)
create table public.reportes (
  id           bigint generated always as identity primary key,
  fecha        date not null,
  tipo         text not null check (tipo in ('matutino', 'meridiano', 'closing')),
  titulo       text not null,
  publicado_en timestamptz not null default now(),
  datos        jsonb not null default '{}'::jsonb,
  unique (fecha, tipo)
);

create index reportes_fecha_idx on public.reportes (fecha desc);

alter table public.reportes enable row level security;

-- El sitio solo lee. Las escrituras se hacen con la clave secreta (scripts/publicar.mjs), que salta RLS.
grant select on public.reportes to anon, authenticated;

create policy "reportes: lectura publica"
  on public.reportes for select
  to anon, authenticated
  using (true);

-- La tabla de prueba "mensajes" deja de aceptar mensajes públicos (evita spam cuando el sitio sea público).
drop policy "mensajes: insertar publico" on public.mensajes;
revoke insert on public.mensajes from anon, authenticated;
