// Panel de administración de Educación (solo para correos en la tabla "admins").
// Acceso con enlace mágico por correo (sin contraseña). La seguridad real la ponen las reglas RLS:
// aunque alguien abra esta página, la base de datos rechaza cambios de quien no es admin.

const db = supabase.createClient(
  'https://qyvkrowvinaslxdhvmku.supabase.co',
  'sb_publishable_4pljPW7l6lTC4qF8RpjCPA_C83MsUqS'
);
const app = document.getElementById('app');
const BUCKET = 'educacion';

const NIVELES = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado' };
const TEMAS = { fundamentos: 'Fundamentos', tecnico: 'Análisis técnico', estrategias: 'Estrategias', riesgo: 'Gestión de riesgo', psicologia: 'Psicología', futuros: 'Futuros NQ/ES', macro: 'Noticias y macro', herramientas: 'Herramientas' };
const FORMATOS = { video: 'Video (YouTube)', slides: 'Slides (PDF o imagen)', pdf: 'PDF' };

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const opciones = (obj, sel) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(v)}</option>`).join('');

// Acepta cualquier enlace de YouTube (watch, youtu.be, shorts, embed) o el ID directo.
function idYoutube(texto) {
  const t = (texto || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(t)) return t;
  const m = t.match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

let lecciones = [];
let editando = null;

// ---------- Acceso ----------
async function iniciar() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) return pantallaLogin();
  const { data: esAdmin, error } = await db.rpc('es_admin');
  if (error || !esAdmin) {
    app.innerHTML = `<h1>Sin permisos</h1><p class="sub">La cuenta <b>${esc(session.user.email)}</b> no está en la lista de administradores.</p>
      <button class="btn" id="salir">Cerrar sesión</button>`;
    document.getElementById('salir').onclick = salir;
    return;
  }
  await cargar();
  pantallaPanel(session.user.email);
}

function pantallaLogin() {
  app.innerHTML = `<div class="login card">
    <h1>Administración</h1>
    <p class="sub">Te enviamos un enlace de acceso por correo. Solo funciona para administradores.</p>
    <form id="f-login">
      <div class="field"><label for="email">Correo</label><input id="email" type="email" required autocomplete="email"></div>
      <button class="btn primary" type="submit">Enviarme el enlace</button>
      <p class="msg" id="m-login"></p>
    </form></div>`;
  document.getElementById('f-login').onsubmit = async e => {
    e.preventDefault();
    const m = document.getElementById('m-login');
    m.className = 'msg'; m.textContent = 'Enviando…';
    const { error } = await db.auth.signInWithOtp({
      email: document.getElementById('email').value.trim().toLowerCase(),
      // Solo cuentas existentes: los registros nuevos están desactivados en Supabase.
      options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: false },
    });
    if (error) {
      m.className = 'msg err';
      m.textContent = /signup|not allowed|not found/i.test(error.message)
        ? 'Ese correo no tiene acceso de administrador.'
        : 'No se pudo enviar: ' + error.message;
      return;
    }
    m.className = 'msg ok'; m.textContent = 'Listo. Revisa tu correo y abre el enlace en este mismo navegador.';
  };
}

async function salir() { await db.auth.signOut(); pantallaLogin(); }

// ---------- Datos ----------
async function cargar() {
  const { data, error } = await db.from('lecciones').select('*').order('orden').order('creado_en', { ascending: false });
  if (error) throw error;
  lecciones = data;
}

// ---------- Panel ----------
function pantallaPanel(email) {
  const borradores = lecciones.filter(l => !l.publicado).length;
  app.innerHTML = `
    <div class="bar">
      <div><h1>Educación</h1><p class="sub" style="margin:0">${lecciones.length} lecciones${borradores ? ` · <span class="drafts">${borradores} sin publicar</span>` : ''}</p></div>
      <span class="who">${esc(email)} · <a href="#" id="salir">Cerrar sesión</a></span>
    </div>
    <div class="bar"><button class="btn primary" id="nueva">+ Nueva lección</button><a class="btn" href="educacion.html" target="_blank">Ver la página pública ↗</a></div>
    <div id="form"></div>
    <div class="card">${lecciones.length ? `<div class="table-scroll"><table><thead><tr>
      <th>Publicada</th><th>Título</th><th>Nivel</th><th>Tema</th><th>Formato</th><th class="num">Ruta</th><th class="num">Orden</th><th></th></tr></thead><tbody>
      ${lecciones.map(l => `<tr>
        <td><label class="pub"><input type="checkbox" data-pub="${l.id}" ${l.publicado ? 'checked' : ''}> ${l.publicado ? 'Sí' : 'No'}</label></td>
        <td><b>${esc(l.titulo)}</b>${l.titulo_en ? `<div class="foot-note" style="margin:2px 0 0">${esc(l.titulo_en)}</div>` : ''}</td>
        <td><span class="lvl ${esc(l.nivel)}">${esc(NIVELES[l.nivel])}</span></td>
        <td>${esc(TEMAS[l.tema])}</td><td>${esc(l.formato)}</td>
        <td class="num">${l.ruta_inicio ?? '—'}</td><td class="num">${l.orden}</td>
        <td><div class="tbl-actions"><button class="btn small" data-edit="${l.id}">Editar</button><button class="btn small danger" data-del="${l.id}">Borrar</button></div></td>
      </tr>`).join('')}</tbody></table></div>` : '<p class="empty">Todavía no hay lecciones. Crea la primera con “+ Nueva lección”.</p>'}</div>`;

  document.getElementById('salir').onclick = e => { e.preventDefault(); salir(); };
  document.getElementById('nueva').onclick = () => formulario(null);
  app.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => formulario(lecciones.find(l => l.id == b.dataset.edit)));
  app.querySelectorAll('[data-del]').forEach(b => b.onclick = () => borrar(lecciones.find(l => l.id == b.dataset.del)));
  app.querySelectorAll('[data-pub]').forEach(c => c.onchange = async () => {
    const { error } = await db.from('lecciones').update({ publicado: c.checked }).eq('id', c.dataset.pub);
    if (error) { alert('No se pudo cambiar: ' + error.message); c.checked = !c.checked; return; }
    await cargar(); pantallaPanel(email);
  });
  if (editando !== null) formulario(editando === 'nueva' ? null : lecciones.find(l => l.id === editando));
}

function formulario(l) {
  editando = l ? l.id : 'nueva';
  const v = l ?? { nivel: 'basico', tema: 'fundamentos', formato: 'video', orden: 100, publicado: false };
  const caja = document.getElementById('form');
  caja.innerHTML = `<div class="card" style="border-color:var(--blue)">
    <h4 style="font:700 17px var(--display);margin:0 0 14px">${l ? 'Editar lección' : 'Nueva lección'}</h4>
    <form id="f-lec" class="grid-form">
      <div class="field"><label>Título (español) *</label><input name="titulo" required minlength="3" maxlength="140" value="${esc(v.titulo)}"></div>
      <div class="field"><label>Título (inglés)</label><input name="titulo_en" maxlength="140" value="${esc(v.titulo_en)}"></div>
      <div class="field"><label>Descripción (español)</label><textarea name="descripcion">${esc(v.descripcion)}</textarea></div>
      <div class="field"><label>Descripción (inglés)</label><textarea name="descripcion_en">${esc(v.descripcion_en)}</textarea></div>
      <div class="field"><label>Nivel *</label><select name="nivel">${opciones(NIVELES, v.nivel)}</select></div>
      <div class="field"><label>Tema *</label><select name="tema">${opciones(TEMAS, v.tema)}</select></div>
      <div class="field"><label>Formato *</label><select name="formato" id="formato">${opciones(FORMATOS, v.formato)}</select></div>
      <div class="field"><label>Duración</label><input name="duracion" placeholder="8 min · 12 slides · 6 páginas" value="${esc(v.duracion)}"></div>
      <div class="field full" id="campo-video"><label>Enlace de YouTube *</label><input name="youtube" placeholder="https://youtu.be/…" value="${v.youtube_id ? 'https://youtu.be/' + esc(v.youtube_id) : ''}">
        <span class="hint">Sirve cualquier enlace de YouTube (normal, corto, Shorts) o el ID de 11 caracteres. Puede ser un video “no listado”.</span></div>
      <div class="field full" id="campo-archivo"><label>Archivo (PDF o imagen, máx. 50 MB) *</label><input type="file" name="archivo" accept="application/pdf,image/png,image/jpeg,image/webp">
        <span class="hint">${v.archivo_url ? `Actual: <a href="${esc(v.archivo_url)}" target="_blank">ver archivo</a>. Sube otro solo si quieres reemplazarlo.` : 'Se guarda en el almacenamiento del sitio.'}</span></div>
      <div class="field"><label>Posición en “Empieza aquí”</label><input name="ruta_inicio" type="number" min="1" placeholder="vacío = no está en la ruta" value="${v.ruta_inicio ?? ''}"></div>
      <div class="field"><label>Orden en la lista</label><input name="orden" type="number" value="${v.orden ?? 100}"><span class="hint">Número menor = aparece primero.</span></div>
      <div class="field full"><label>“Aplícalo hoy”: enlace a un reporte real</label><input name="aplicalo_url" placeholder="nq.html?fecha=2026-10-02&tipo=closing" value="${esc(v.aplicalo_url)}">
        <span class="hint">Página del sitio (noticias.html, nq.html, stocks.html, archivo.html con ?fecha=) o un enlace https.</span></div>
      <div class="field"><label>Texto del enlace (español)</label><input name="aplicalo_texto" placeholder="pivotes del 2 oct" value="${esc(v.aplicalo_texto)}"></div>
      <div class="field"><label>Texto del enlace (inglés)</label><input name="aplicalo_texto_en" value="${esc(v.aplicalo_texto_en)}"></div>
      <div class="field full"><label class="pub" style="text-transform:none;letter-spacing:0;font:600 14px var(--font);color:var(--text)"><input type="checkbox" name="publicado" ${v.publicado ? 'checked' : ''}> Publicar (visible para todos)</label></div>
      <div class="full bar"><button class="btn primary" type="submit">Guardar</button><button class="btn" type="button" id="cancelar">Cancelar</button><p class="msg" id="m-lec"></p></div>
    </form></div>`;
  const f = document.getElementById('f-lec');
  const mostrar = () => {
    const vid = f.formato.value === 'video';
    document.getElementById('campo-video').hidden = !vid;
    document.getElementById('campo-archivo').hidden = vid;
  };
  f.formato.onchange = mostrar; mostrar();
  document.getElementById('cancelar').onclick = () => { editando = null; caja.innerHTML = ''; };
  f.onsubmit = e => { e.preventDefault(); guardar(f, l); };
  caja.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function subirArchivo(file) {
  const limpio = file.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9.]+/g, '-');
  const ruta = `${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}-${limpio}`;
  const { error } = await db.storage.from(BUCKET).upload(ruta, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return db.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
}

async function guardar(f, l) {
  const m = document.getElementById('m-lec');
  const err = t => { m.className = 'msg err'; m.textContent = t; };
  const val = n => f[n].value.trim() || null;
  const fila = {
    titulo: val('titulo'), titulo_en: val('titulo_en'), descripcion: val('descripcion'), descripcion_en: val('descripcion_en'),
    nivel: f.nivel.value, tema: f.tema.value, formato: f.formato.value, duracion: val('duracion'),
    ruta_inicio: f.ruta_inicio.value ? Number(f.ruta_inicio.value) : null, orden: Number(f.orden.value || 100),
    aplicalo_url: val('aplicalo_url'), aplicalo_texto: val('aplicalo_texto'), aplicalo_texto_en: val('aplicalo_texto_en'),
    publicado: f.publicado.checked,
  };
  try {
    if (fila.formato === 'video') {
      const id = idYoutube(f.youtube.value);
      if (!id) return err('Ese enlace de YouTube no es válido.');
      fila.youtube_id = id; fila.archivo_url = null;
    } else {
      fila.youtube_id = null;
      const archivo = f.archivo.files[0];
      if (archivo) {
        if (archivo.size > 50 * 1024 * 1024) return err('El archivo pasa de 50 MB.');
        m.className = 'msg'; m.textContent = 'Subiendo archivo…';
        fila.archivo_url = await subirArchivo(archivo);
      } else if (l?.archivo_url) fila.archivo_url = l.archivo_url;
      else return err('Falta el archivo.');
    }
    m.className = 'msg'; m.textContent = 'Guardando…';
    const q = l ? db.from('lecciones').update(fila).eq('id', l.id) : db.from('lecciones').insert(fila);
    const { error } = await q;
    if (error) throw error;
    editando = null;
    await cargar();
    const { data: { session } } = await db.auth.getSession();
    pantallaPanel(session.user.email);
  } catch (e) { err('No se pudo guardar: ' + e.message); }
}

async function borrar(l) {
  if (!confirm(`¿Borrar “${l.titulo}”? No se puede deshacer.`)) return;
  const { error } = await db.from('lecciones').delete().eq('id', l.id);
  if (error) return alert('No se pudo borrar: ' + error.message);
  // Si el archivo está en nuestro almacenamiento, también se borra.
  const marca = `/storage/v1/object/public/${BUCKET}/`;
  if (l.archivo_url?.includes(marca)) await db.storage.from(BUCKET).remove([decodeURIComponent(l.archivo_url.split(marca)[1])]);
  await cargar();
  const { data: { session } } = await db.auth.getSession();
  pantallaPanel(session.user.email);
}

db.auth.onAuthStateChange((evento) => { if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT') iniciar(); });
iniciar().catch(e => { app.innerHTML = `<p class="empty">Error: ${esc(e.message)}</p>`; });
