-- Sección de Educación: lecciones (videos de YouTube, slides y PDFs) + administradores.

-- Administradores: solo estos correos pueden crear, editar o borrar contenido.
create table public.admins (
  email      text primary key check (email = lower(email)),
  creado_en  timestamptz not null default now()
);
alter table public.admins enable row level security;  -- sin políticas: nadie lo lee desde el sitio

-- Los correos de administradores se agregan directamente en la base (no en el repositorio público).

-- ¿La sesión actual es de un administrador?
create function public.es_admin() returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admins where email = lower(auth.jwt() ->> 'email'));
$$;
grant execute on function public.es_admin() to anon, authenticated;

create table public.lecciones (
  id               bigint generated always as identity primary key,
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now(),
  publicado        boolean not null default false,
  titulo           text not null check (char_length(titulo) between 3 and 140),
  titulo_en        text,
  descripcion      text,
  descripcion_en   text,
  nivel            text not null check (nivel in ('basico', 'intermedio', 'avanzado')),
  tema             text not null check (tema in ('fundamentos', 'tecnico', 'estrategias', 'riesgo', 'psicologia', 'futuros', 'macro', 'herramientas')),
  formato          text not null check (formato in ('video', 'slides', 'pdf')),
  youtube_id       text check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  archivo_url      text check (archivo_url ~ '^https://'),
  duracion         text,                       -- "8 min", "12 slides", "6 páginas"
  ruta_inicio      integer,                    -- posición en "Empieza aquí" (null = no está en la ruta)
  aplicalo_url     text check (aplicalo_url ~ '^(https://|[a-z]+\.html)'),  -- enlace a un reporte real
  aplicalo_texto   text,
  aplicalo_texto_en text,
  orden            integer not null default 100,
  constraint video_tiene_youtube check (formato <> 'video' or youtube_id is not null),
  constraint archivo_tiene_url  check (formato = 'video' or archivo_url is not null)
);
create index lecciones_filtros_idx on public.lecciones (publicado, nivel, tema, orden);

alter table public.lecciones enable row level security;
grant select on public.lecciones to anon, authenticated;
grant insert, update, delete on public.lecciones to authenticated;

create policy "lecciones: publicadas para todos, borradores para admins"
  on public.lecciones for select to anon, authenticated
  using (publicado or public.es_admin());
create policy "lecciones: admins crean"   on public.lecciones for insert to authenticated with check (public.es_admin());
create policy "lecciones: admins editan"  on public.lecciones for update to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "lecciones: admins borran"  on public.lecciones for delete to authenticated using (public.es_admin());

create function public.tocar_actualizado() returns trigger language plpgsql as $$
begin new.actualizado_en = now(); return new; end $$;
create trigger lecciones_actualizado before update on public.lecciones
  for each row execute function public.tocar_actualizado();

-- Archivos (PDFs y slides): lectura pública, subida solo para admins. Máx. 50 MB por archivo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('educacion', 'educacion', true, 52428800, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);

create policy "educacion: admins suben"  on storage.objects for insert to authenticated with check (bucket_id = 'educacion' and public.es_admin());
create policy "educacion: admins editan" on storage.objects for update to authenticated using (bucket_id = 'educacion' and public.es_admin());
create policy "educacion: admins borran" on storage.objects for delete to authenticated using (bucket_id = 'educacion' and public.es_admin());
