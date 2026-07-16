/**
 * AAMF Portfolio — Servidor local
 * ─────────────────────────────────────────────────────────────
 * Sirve el portfolio estático con los datos locales actuales,
 * expone endpoints de Git (diff, status, push) y sincroniza
 * index.json automáticamente antes de cada publicación.
 *
 * Uso:  node server.js
 * Deps: npm install
 * ─────────────────────────────────────────────────────────────
 * Correcciones aplicadas — ver correcciones.md para el detalle:
 *  - [Punto 5] El servidor ahora escucha solo en 127.0.0.1 (loopback),
 *    no en todas las interfaces de red. Antes era alcanzable desde
 *    cualquier otro equipo en la misma red Wi-Fi/LAN, ya que decap-server
 *    y este servidor no tienen autenticación.
 *  - [Punto 6] Se normalizan los saltos de línea finales de los .json en
 *    data/ antes de calcular el diff y antes de publicar, para eliminar
 *    el ruido cosmético "\ No newline at end of file" que aparecía en
 *    cada edición hecha desde el CMS.
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express');
const { simpleGit } = require('simple-git');
const fs   = require('fs');
const path = require('path');

const app  = express();
const PORT = 3000;
const HOST = '127.0.0.1';   // Solo accesible desde este equipo (ver Punto 5)

// Rutas clave — ajustar si la estructura del proyecto cambia
const ROOT           = __dirname;
const DATA_DIR        = path.join(ROOT, 'data');
const PROYECTOS_DIR  = path.join(ROOT, 'data', 'proyectos');
const INDEX_FILE     = path.join(PROYECTOS_DIR, 'index.json');

const git = simpleGit(ROOT);

// ─── Middleware ───────────────────────────────────────────────
app.use(express.json());
app.use(express.static(ROOT));   // sirve index.html, perfil.html, data/, admin/, etc.

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Recorre data/ recursivamente y asegura que todo archivo .json termine
 * con un único salto de línea final. (Punto 6)
 * Decap CMS a veces guarda el JSON sin salto de línea final, lo que
 * generaba una anotación "\ No newline at end of file" en el diff de
 * publicar.html en cada edición, aunque el contenido real fuera idéntico.
 */
function normalizarSaltosDeLinea(dir = DATA_DIR) {
  if (!fs.existsSync(dir)) return;
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      normalizarSaltosDeLinea(ruta);
    } else if (entrada.name.endsWith('.json')) {
      const contenido = fs.readFileSync(ruta, 'utf8');
      if (contenido.length && !contenido.endsWith('\n')) {
        fs.writeFileSync(ruta, contenido + '\n', 'utf8');
      }
    }
  }
}

/**
 * Reconstruye index.json leyendo todos los .json en data/proyectos/
 * (excluye el propio index.json).
 * Retorna el array de slugs resultante.
 *
 * Nota (Punto 3): el orden aquí es siempre alfabético y se regenera en
 * cada publicación. La colección "Índice de proyectos" del CMS se dejó
 * oculta (hide: true) precisamente porque cualquier orden manual que se
 * definiera ahí se perdería en el siguiente push, y el front-end tampoco
 * lo usa para ordenar (ordena por año). Ver correcciones.md.
 */
function sincronizarIndex() {
  if (!fs.existsSync(PROYECTOS_DIR)) {
    throw new Error('No se encontró la carpeta data/proyectos/');
  }
  const slugs = fs.readdirSync(PROYECTOS_DIR)
    .filter(f => f.endsWith('.json') && f !== 'index.json')
    .map(f => f.replace('.json', ''))
    .sort();
  fs.writeFileSync(INDEX_FILE, JSON.stringify({ slugs }, null, 2) + '\n', 'utf8');
  return slugs;
}

/**
 * Mapea el código de estado de simple-git a una etiqueta legible.
 */
function tipoDeEstado(wt) {
  const mapa = { '?': 'nuevo', 'M': 'modificado', 'D': 'eliminado',
                 'A': 'añadido', 'R': 'renombrado', 'C': 'copiado' };
  return mapa[wt] || wt;
}

// ─── Endpoints ───────────────────────────────────────────────

/**
 * GET /api/status
 * Devuelve la lista de archivos en data/ con cambios pendientes
 * y el diff completo de los archivos YA rastreados por Git.
 * Los archivos nuevos (untracked) aparecen en la lista pero no
 * tienen diff hasta que se añaden con git add.
 */
app.get('/api/status', async (_req, res) => {
  try {
    normalizarSaltosDeLinea();

    const status = await git.status();
    const diff   = await git.diff(['HEAD', '--', 'data/']);

    // Archivos modificados, eliminados, etc. (rastreados)
    const rastreados = status.files
      .filter(f => f.path.startsWith('data/') && f.working_dir !== '?')
      .map(f => ({ path: f.path, tipo: tipoDeEstado(f.working_dir) }));

    // Archivos nuevos no rastreados en data/
    const noRastreados = status.not_added
      .filter(f => f.startsWith('data/'))
      .map(f => ({ path: f, tipo: 'nuevo' }));

    const archivos = [...rastreados, ...noRastreados];

    res.json({
      ok: true,
      hayCambios: archivos.length > 0,
      archivos,
      diff: diff || ''
    });
  } catch (e) {
    console.error('[/api/status]', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * POST /api/sync
 * Sincroniza index.json con los archivos reales en disco.
 * Se puede llamar de forma independiente para corregir
 * desincronizaciones sin necesidad de hacer un push.
 */
app.post('/api/sync', (_req, res) => {
  try {
    normalizarSaltosDeLinea();
    const slugs = sincronizarIndex();
    res.json({ ok: true, slugs });
  } catch (e) {
    console.error('[/api/sync]', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * POST /api/push
 * Flujo completo de publicación:
 *   1. Normaliza saltos de línea y sincroniza index.json
 *   2. Verifica que existan cambios en data/
 *   3. git add data/
 *   4. git commit -m <mensaje>
 *   5. git push origin main
 *
 * Body JSON: { "mensaje": "string opcional" }
 */
app.post('/api/push', async (req, res) => {
  const { mensaje = 'Update: cambios del portfolio' } = req.body;

  try {
    // 1. Normalizar y sincronizar index.json antes de commitear
    normalizarSaltosDeLinea();
    sincronizarIndex();

    // 2. Verificar que haya algo que commitear en data/
    await git.add('data/');   // staged necesario para que status lo vea
    const status = await git.status();
    const staged = status.staged.filter(f => f.startsWith('data/'));

    if (staged.length === 0) {
      return res.json({
        ok: false,
        error: 'No hay cambios en data/ para publicar.'
      });
    }

    // 3. Commit y push
    await git.commit(mensaje);
    await git.push('origin', 'main');

    res.json({ ok: true, archivosCommiteados: staged });
  } catch (e) {
    console.error('[/api/push]', e.message);

    // Devolver el mensaje crudo de Git para que el usuario sepa qué pasó
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ─── Inicio ──────────────────────────────────────────────────
app.listen(PORT, HOST, () => {
  console.log('\n──────────────────────────────────────────────');
  console.log('  AAMF Portfolio — Servidor local activo');
  console.log('──────────────────────────────────────────────');
  console.log(`  Preview :  http://localhost:${PORT}`);
  console.log(`  Admin   :  http://localhost:${PORT}/admin/`);
  console.log(`  Publicar:  http://localhost:${PORT}/publicar.html`);
  console.log(`  (Solo accesible desde este equipo — bind: ${HOST})`);
  console.log('──────────────────────────────────────────────');
  console.log('  Ctrl+C para detener el servidor\n');
});
