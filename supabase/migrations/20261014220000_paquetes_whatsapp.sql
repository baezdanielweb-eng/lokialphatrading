-- Paquetes de WhatsApp + carrusel: el VPS genera cada reporte y guarda aquí los 3 mensajes de WhatsApp
-- y las imágenes del carrusel; la MacBook los baja y los envía (scripts/paquete.mjs).
-- PRIVADO: sin permisos ni reglas para anon/authenticated. Solo la clave secreta (que salta RLS) lee y escribe.

create table public.paquetes (
  id         bigint generated always as identity primary key,
  fecha      date not null,
  tipo       text not null check (tipo in ('matutino', 'meridiano', 'closing')),
  mensajes   jsonb not null default '{}'::jsonb,   -- { noticias, stocks, nqes }: texto listo para WhatsApp
  caption    text,                                 -- caption.txt del carrusel
  imagenes   text[] not null default '{}',         -- rutas en el bucket "paquetes": <fecha>-<tipo>/slide-N.png
  creado_en  timestamptz not null default now(),
  enviado    jsonb not null default '{}'::jsonb,   -- { noticias: "2026-10-14T13:40:00Z", ... } al enviar
  unique (fecha, tipo)
);

alter table public.paquetes enable row level security;
revoke all on public.paquetes from anon, authenticated;

-- Bucket privado para las imágenes del carrusel. Sin reglas en storage.objects: solo la clave secreta.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('paquetes', 'paquetes', false, 10485760, array['image/png', 'image/jpeg', 'text/plain']);
