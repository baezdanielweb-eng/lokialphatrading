-- Tabla de prueba: mensajes públicos (cualquiera puede leer y escribir)
create table public.mensajes (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  nombre     text not null check (char_length(nombre) between 1 and 40),
  texto      text not null check (char_length(texto) between 1 and 500)
);

alter table public.mensajes enable row level security;

grant select, insert on public.mensajes to anon, authenticated;

-- Cualquiera puede leer los mensajes
create policy "mensajes: lectura publica"
  on public.mensajes for select
  to anon, authenticated
  using (true);

-- Cualquiera puede publicar un mensaje (no editar ni borrar)
create policy "mensajes: insertar publico"
  on public.mensajes for insert
  to anon, authenticated
  with check (true);
