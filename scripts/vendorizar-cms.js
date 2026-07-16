/**
 * vendorizar-cms.js
 * ─────────────────────────────────────────────────────────────
 * Corrección del Punto 1 (ver correcciones.md).
 *
 * admin/index.html cargaba el editor de Decap CMS desde una CDN
 * (unpkg.com), lo que impedía abrir el panel de administración sin
 * conexión a internet, incluso con decap-server y server.js corriendo
 * en local.
 *
 * Este script copia el bundle ya compilado de decap-cms (que se
 * descarga una vez desde npm a node_modules/) hacia admin/vendor/,
 * para que admin/index.html lo sirva como un archivo local. Se ejecuta
 * automáticamente después de "npm install" (ver "postinstall" en
 * package.json) y también se puede correr a mano con:
 *
 *   npm run vendorizar-cms
 *
 * Importante: admin/vendor/decap-cms/ debe quedar comiteado en el
 * repositorio (no está en .gitignore) para que:
 *   a) el panel funcione offline en cualquier equipo tras un git clone,
 *      sin necesitar "npm install" solo para abrir el CMS, y
 *   b) el sitio publicado en Netlify tampoco dependa de unpkg.com.
 *
 * Para actualizar la versión de decap-cms en el futuro:
 *   1. Cambiar la versión en package.json (devDependencies.decap-cms)
 *   2. npm install   (dispara este script automáticamente)
 *   3. Comitear los archivos nuevos/modificados en admin/vendor/
 */

const fs   = require('fs');
const path = require('path');

const ORIGEN  = path.join(__dirname, '..', 'node_modules', 'decap-cms', 'dist');
const DESTINO = path.join(__dirname, '..', 'admin', 'vendor', 'decap-cms');

function copiarDist() {
  if (!fs.existsSync(ORIGEN)) {
    console.warn(
      '[vendorizar-cms] No se encontró decap-cms en node_modules. ' +
      'Ejecuta "npm install" primero.'
    );
    return;
  }

  fs.rmSync(DESTINO, { recursive: true, force: true });
  fs.mkdirSync(DESTINO, { recursive: true });

  // Se copian todos los .js (bundle principal + fragmentos/"chunks" que
  // decap-cms carga dinámicamente). Se excluyen los .map porque solo
  // sirven para depurar y no son necesarios para que el CMS funcione.
  const archivos = fs.readdirSync(ORIGEN).filter(f => f.endsWith('.js'));

  for (const archivo of archivos) {
    fs.copyFileSync(path.join(ORIGEN, archivo), path.join(DESTINO, archivo));
  }

  console.log(`[vendorizar-cms] Copiados ${archivos.length} archivos a admin/vendor/decap-cms/`);
}

copiarDist();
