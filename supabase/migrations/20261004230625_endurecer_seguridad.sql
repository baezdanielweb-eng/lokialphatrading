-- Endurecimiento de seguridad (revisión del 4 oct 2026).
-- Las reglas RLS ya bloqueaban todo; esto quita permisos sobrantes para que un error futuro en una
-- regla no abra un hueco (defensa en profundidad).

-- 1. Quitar TODOS los permisos de tablas a los roles públicos y volver a dar solo lo necesario.
revoke all on all tables in schema public from anon, authenticated;

grant select on public.reportes  to anon, authenticated;              -- el sitio lee los reportes
grant select on public.mensajes  to anon, authenticated;              -- tabla de prueba antigua, solo lectura
grant select on public.lecciones to anon, authenticated;              -- Educación: publicadas (RLS)
grant insert, update, delete on public.lecciones to authenticated;    -- solo admins (RLS)
-- public.admins: sin permisos para nadie desde la API.

-- Las tablas nuevas empiezan cerradas: cada migración debe dar sus permisos explícitamente.
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated, public;

-- 2. Funciones internas: nadie de afuera las llama.
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
revoke execute on function public.tocar_actualizado() from anon, authenticated, public;
alter function public.tocar_actualizado() set search_path = '';

-- 3. es_admin(): solo para usuarios con sesión. Los visitantes anónimos usan una regla sin la función.
revoke execute on function public.es_admin() from anon, public;
grant execute on function public.es_admin() to authenticated;

drop policy "lecciones: publicadas para todos, borradores para admins" on public.lecciones;
create policy "lecciones: visitantes ven publicadas"
  on public.lecciones for select to anon
  using (publicado);
create policy "lecciones: con sesión ven publicadas, admins ven todo"
  on public.lecciones for select to authenticated
  using (publicado or public.es_admin());
