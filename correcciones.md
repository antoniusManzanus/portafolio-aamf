# Correcciones al sistema de publicación offline — AAMF Portfolio

Este documento registra los errores encontrados en la herramienta de edición
offline (Decap CMS + `decap-server` + `server.js` + `publicar.html`), la
corrección aplicada a cada uno, por qué se resolvió de esa forma y en qué
fuente se apoya. Todas las correcciones fueron probadas de punta a punta en
un entorno real (repositorio Git, `npm install`, `decap-server` y
`server.js` corriendo juntos) antes de incluirse aquí.

## Resumen

| # | Problema | Severidad | Estado |
|---|----------|-----------|--------|
| 1 | El panel `/admin/` carga el editor desde una CDN externa | Alta — rompe el objetivo "offline" | ✅ Corregido |
| 2 | Las imágenes de los proyectos son URLs externas (ibb.co) | — | ⚪ Aceptado tal cual, sin cambios (confirmado por el usuario) |
| 3 | La colección "Índice de proyectos" del CMS no tiene efecto real | Media — confunde al usuario | ✅ Corregido |
| 4 | `git push` falla con un error críptico si no hay identidad de Git configurada | Media — bloquea la publicación | ✅ Corregido |
| 5 | `decap-server` y `server.js` quedan expuestos a toda la red local | Media — riesgo de seguridad | ✅ Corregido |
| 6 | Ruido "`\ No newline at end of file`" en cada diff | Baja — cosmético | ✅ Corregido |

---

## Punto 1 — El panel de administración no funciona sin internet

### Problema

`admin/index.html` (subido como `admin-index.html`) cargaba el editor de
Decap CMS desde una CDN pública:

```html
<script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
```

Aunque `decap-server` y `server.js` corren 100 % en la máquina local, esa
línea depende de que `unpkg.com` esté disponible en el momento de abrir
`/admin/`. Sin internet, el navegador nunca descarga el editor y el panel
simplemente no carga — el resto de la arquitectura offline (escritura local
de archivos, git status/diff, push manual) queda inutilizada.

### Evidencia

Se descargó el paquete `decap-cms` desde npm para inspeccionarlo. Su
`dist/` no es un único archivo: es un *bundle* de Webpack dividido en ~186
fragmentos que se cargan bajo demanda (`117.decap-cms.js`,
`1181.decap-cms.js`, etc.), resueltos automáticamente según la ubicación
del `<script>` que los invoca (`document.currentScript`):

```
document.currentScript||(vt=document.getElementsByTagName("script"))[vt.length-1])
__webpack_require__.p=e  // publicPath automático
```

Esto significa que la versión servida por unpkg.com **también** depende de
que unpkg entregue esos fragmentos adicionales bajo demanda — no es un
problema exclusivo de "un archivo faltante", sino de toda una cadena de
descargas dinámicas atada a la CDN.

### Corrección

Se "vendoriza" (empaqueta como archivo propio del proyecto) el bundle
completo de `decap-cms`, en vez de referenciarlo por CDN:

1. `decap-cms` se agrega como `devDependency` fija en `package.json`
   (versión `3.14.1`, en vez de depender de "lo último" en unpkg).
2. Un script nuevo, `scripts/vendorizar-cms.js`, copia todo
   `node_modules/decap-cms/dist/*.js` (sin los `.map`, que solo sirven
   para depurar) hacia `admin/vendor/decap-cms/`.
3. Ese script se ejecuta automáticamente después de `npm install`, vía el
   hook `"postinstall"` de `package.json` — no requiere un paso manual
   adicional.
4. `admin/index.html` ahora carga el archivo local:
   ```html
   <script src="/admin/vendor/decap-cms/decap-cms.js"></script>
   ```
5. `admin/vendor/decap-cms/` **se debe comitear al repositorio** (no está
   en `.gitignore`). Así el panel funciona offline incluso en un equipo
   recién clonado, sin depender de correr `npm install` solo para abrir el
   CMS, y el sitio en producción (Netlify) tampoco depende de que
   unpkg.com esté disponible.

Se probó sirviendo el archivo local con `server.js` y confirmando que
responde con `200 OK` y que `admin/index.html` ya no contiene ninguna
referencia a `unpkg.com` para el editor.

### Justificación

- Es exactamente el enfoque que recomienda la documentación oficial de
  Decap CMS para trabajar con un repositorio local: instalarlo vía npm y
  no depender de una CDN para el flujo de trabajo local.
- De regalo, esto también **desacopla la producción de unpkg.com**: si esa
  CDN cambia de versión (`^3.0.0` es un rango abierto) o tiene una caída,
  el panel en Netlify seguiría funcionando igual, porque sirve su propia
  copia versionada.
- Al fijar la versión (`3.14.1` en vez de `^3.0.0`), el editor no cambia
  de comportamiento sin que alguien lo decida explícitamente.
- Como beneficio adicional, se fijó también `decap-server` como
  `devDependency` (antes solo se ejecutaba vía `npx decap-server` sin
  estar declarado en `package.json`, por lo que `npx` podía intentar
  resolverlo contra el registro de npm). Con la dependencia ya instalada
  en `node_modules/.bin`, `npx` la usa directamente sin tocar la red: es
  el comportamiento documentado de `npx` — primero busca en
  `node_modules/.bin` del proyecto, y solo si no la encuentra ahí consulta
  el registro remoto.

### Archivos modificados / nuevos

- `admin/index.html` (antes `admin-index.html`)
- `package.json`
- `scripts/vendorizar-cms.js` (nuevo)

### Fuentes

- Decap CMS — *Working with a Local Git Repository*:
  <https://decapcms.org/docs/working-with-a-local-git-repository/>
- Paquete `decap-cms` en npm (estructura de `dist/`, versiones):
  <https://www.npmjs.com/package/decap-cms>
- Paquete `decap-server` en npm:
  <https://www.npmjs.com/package/decap-server>
- Comportamiento de resolución de `npx` (prioriza `node_modules/.bin`
  local antes que el registro remoto):
  <https://dev.to/luckychauhan/understanding-npx-how-it-really-works-5g3j>

---

## Punto 2 — Imágenes alojadas externamente (ibb.co)

Confirmado por el usuario como comportamiento esperado: es una decisión de
diseño ya tomada a propósito (ver el comentario "BUG-8 CORREGIDO" dentro
de `config.yml`, donde el campo `portada` se cambió de `widget: image` a
`widget: string` justamente porque todas las imágenes son URLs externas).
**No se modifica.** Se deja documentado únicamente como limitación
conocida: sin internet, la vista previa local no mostrará las imágenes de
los proyectos, aunque todo el resto de la edición y publicación sí
funcione sin conexión.

---

## Punto 3 — La colección "Índice de proyectos" del CMS no tiene efecto real

### Problema

`config.yml` define una colección editable en el panel para reordenar
manualmente los `slugs` de `data/proyectos/index.json`. Sin embargo:

- `server.js` regenera `index.json` automáticamente en cada
  `POST /api/push` (función `sincronizarIndex()`), ordenando los `slugs`
  **alfabéticamente** a partir de los archivos que existen en el disco.
  Cualquier orden manual definido desde el CMS se pierde en la siguiente
  publicación.
- El sitio público tampoco usa ese orden: en `index.html` (línea ~784) los
  proyectos siempre se reordenan por año, descendente:
  ```js
  proyectos.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
  ```

Es decir, un usuario podría arrastrar proyectos en el CMS pensando que
está cambiando el orden en el sitio, y ese esfuerzo no tendría ningún
efecto visible ni permanente.

### Evidencia

Se reprodujo el flujo completo: se creó y luego se eliminó un proyecto de
prueba, y en ambos casos `index.json` terminó regenerado alfabéticamente
por `server.js` tras el push, sin importar el orden previo.

### Corrección

En `config.yml`, la colección `indice` se marca con `hide: true` y se deja
un comentario explicando por qué:

```yaml
# Corrección Punto 3: esta colección se oculta porque no tiene efecto
# real. server.js regenera index.json automáticamente en cada "Publicar"
# ...
- name: indice
  label: Índice de proyectos
  hide: true
  ...
```

No se tocó la lógica de `sincronizarIndex()` ni el orden por año del
sitio: ambos comportamientos son intencionales y correctos, el problema
era exclusivamente que el CMS ofrecía un control que no hacía nada.

### Justificación

Se optó por **ocultar la colección** en vez de eliminarla o reescribir el
mecanismo de ordenamiento, porque:

- Es el cambio de menor riesgo: no toca la lógica ya probada de
  auto-sincronización ni el comportamiento del sitio público.
- `hide: true` es una opción soportada oficialmente por Decap CMS para
  colecciones que existen pero no deben mostrarse en la interfaz.
- Mantiene la definición disponible por si en el futuro se decide exponer
  `index.json` como referencia de solo lectura.

### Archivos modificados

- `admin/config.yml`

### Fuentes

- Decap CMS — *Configuration Options* (opción `hide` a nivel de
  colección): <https://decapcms.org/docs/configuration-options/>

---

## Punto 4 — `git push` falla con un error críptico si no hay identidad de Git

### Problema

`/api/push` ejecuta `git.commit(mensaje)` internamente. Si el equipo no
tiene configurado `git config user.name` / `user.email` (algo común en una
instalación nueva de Git en Windows), el commit falla y `publicar.html`
muestra el error crudo de Git tal cual, que no es amigable para alguien
sin experiencia técnica:

```
Author identity unknown

*** Please tell me who you are.

Run

  git config --global user.email "you@example.com"
  git config --global user.name "Your Name"
```

### Evidencia

Se reprodujo en un repositorio de prueba sin identidad configurada: el
endpoint `/api/push` devolvió exactamente ese mensaje, y el flujo se
detiene ahí — el usuario tendría que saber abrir una terminal y ejecutar
esos dos comandos por su cuenta.

### Corrección

`iniciar.bat` ahora verifica la identidad de Git **antes** de llegar a la
pantalla de publicar, y si falta, la pide por pantalla y la configura:

```bat
git config user.name >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
  set /p GIT_NOMBRE="  Escribe tu nombre: "
  git config --global user.name "!GIT_NOMBRE!"
)
git config user.email >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
  set /p GIT_CORREO="  Escribe tu correo electronico: "
  git config --global user.email "!GIT_CORREO!"
)
```

(Se agregó `setlocal enabledelayedexpansion` al inicio del script para que
`!GIT_NOMBRE!` refleje el valor recién escrito dentro del mismo bloque
`if`, algo que `%GIT_NOMBRE%` no garantiza en batch.)

### Justificación

Es preferible detectar y resolver el problema en el primer paso del script
(antes de `git pull`, antes de tocar el CMS) que dejar que aparezca como
un error de git sin contexto justo cuando el usuario ya editó varios
archivos y quiere publicar. Se usa `--global` porque la identidad de Git
es una configuración del equipo, no del proyecto — solo hay que
preguntarla una vez por instalación de Windows.

### Archivos modificados

- `iniciar.bat`

### Fuentes

- Comportamiento estándar de Git al commitear sin identidad configurada
  (mensaje reproducido directamente en las pruebas de este documento).

---

## Punto 5 — `decap-server` y `server.js` quedan expuestos a toda la red local

### Problema

Ni `decap-server` ni `server.js` tienen autenticación. La documentación
oficial de Decap CMS lo advierte explícitamente: *"decap-server runs an
unauthenticated express server [...] it should only be used for local
development"*. El proyecto sí restringe el `Origin` por CORS a
`localhost`/`127.0.0.1`, pero **CORS no es un mecanismo de control de
acceso del servidor**: solo le indica al *navegador* si debe permitirle a
un script leer la respuesta. Un cliente que no sea un navegador (otra
herramienta, otro proceso, otro equipo en la misma red Wi-Fi) puede seguir
enviando peticiones directas al puerto 8081 (`decap-server`, que escribe
archivos) o al 3000 (`server.js`, que puede hacer `git push`), y el
servidor las procesa igual.

Además, por defecto, `app.listen(PORT)` de Express escucha en todas las
interfaces de red del equipo, no solo en `localhost` — es decir, en una
red compartida (oficina, café, coworking), cualquier otro dispositivo
podría alcanzar esos puertos.

### Evidencia

Se confirmó en la documentación de Decap CMS y en MDN:

- *"CORS is enforced by the browser, not the server [...] Non-browser
  clients (curl, Postman, server-to-server requests) ignore CORS headers
  entirely."*
- Se probó además que `decap-server` soporta una variable de entorno
  `BIND_HOST` para restringir a qué interfaz se enlaza (se ubicó en su
  código fuente y se confirmó en pruebas: con `BIND_HOST=127.0.0.1` el
  log pasó de `"listening on port 8081"` a
  `"listening on 127.0.0.1:8081"`).

### Corrección

- `server.js`: `app.listen(PORT)` → `app.listen(PORT, '127.0.0.1', ...)`.
- `iniciar.bat`: se define `BIND_HOST=127.0.0.1` antes de lanzar
  `decap-server`:
  ```bat
  start "Decap Server" cmd /k "cd /d "%~dp0" && set BIND_HOST=127.0.0.1 && npx decap-server"
  ```

Se verificó que, tras el cambio, ambos servidores siguen siendo
accesibles vía `http://localhost:...` desde el propio equipo (la
resolución de `localhost` a `127.0.0.1` es estándar en Windows), pero ya
no aceptan conexiones desde otra IP de la red.

### Justificación

Restringir el *bind* a la interfaz de loopback es la forma correcta de
resolver esto — no requiere añadir autenticación (que Decap CMS no
soporta en este modo) ni cambiar la arquitectura; simplemente hace que el
puerto no exista para el resto de la red, que es exactamente el alcance
que se pretende ("herramienta para uso personal, en la propia máquina").

### Archivos modificados

- `server.js`
- `iniciar.bat`

### Fuentes

- Decap CMS — *Working with a Local Git Repository* (advertencia sobre
  servidor sin autenticación y variable `BIND_HOST`):
  <https://decapcms.org/docs/working-with-a-local-git-repository/>
- MDN — *Cross-Origin Resource Sharing (CORS)* (CORS es un mecanismo del
  navegador, no del servidor):
  <https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS>

---

## Punto 6 — Ruido "`\ No newline at end of file`" en cada diff

### Problema

Al guardar desde el CMS, algunos `.json` quedaban sin salto de línea final,
lo que hacía que `git diff` marcara esa línea como cambiada en
`publicar.html` (`\ No newline at end of file`) aunque el contenido real
no hubiera cambiado en nada más. Esto añadía ruido visual al revisar los
cambios antes de publicar.

### Evidencia

Se reprodujo guardando un `.json` sin salto de línea final y confirmando
que aparecía esa anotación en el diff mostrado por `/api/status`.

### Corrección

Se agregó una función `normalizarSaltosDeLinea()` en `server.js` que
recorre `data/` recursivamente y agrega un único salto de línea final a
cualquier `.json` que no lo tenga. Se invoca al inicio de `/api/status`,
`/api/sync` y `/api/push`, así que el diff que ve el usuario y lo que se
publica siempre está normalizado.

### Justificación

Es una corrección de una sola vez y de bajo riesgo: no cambia el
contenido de los archivos, solo asegura consistencia en el formato del
archivo (algo que la mayoría de editores hace de forma automática). Se
resolvió en el servidor y no en el CMS porque así corrige también el
historial de archivos que ya se habían guardado sin salto de línea antes
de esta corrección.

### Archivos modificados

- `server.js`

### Fuentes

- Comportamiento reproducido directamente en las pruebas de este
  documento (diff de Git antes/después de la normalización).

---

## Archivos entregados con las correcciones

```
admin/
  config.yml          ← modificado (Punto 3)
  index.html           ← modificado (Punto 1), antes "admin-index.html"
  vendor/decap-cms/    ← se genera solo con "npm install" (Punto 1)
scripts/
  vendorizar-cms.js    ← nuevo (Punto 1)
server.js               ← modificado (Puntos 5 y 6)
iniciar.bat             ← modificado (Puntos 4 y 5)
package.json            ← modificado (Punto 1)
```

Los demás archivos (`index.html`, `perfil.html`, `contacto.html`,
`publicar.html`, y los `.json` de `data/`) no requirieron cambios.

## Cómo aplicar estas correcciones sobre tu repositorio real

1. Reemplaza `server.js`, `iniciar.bat` y `package.json` en la raíz del
   proyecto por las versiones corregidas.
2. Reemplaza `admin/config.yml` y `admin/index.html` (el archivo que
   subiste como `admin-index.html` va en la carpeta `admin/`, con el
   nombre `index.html`).
3. Copia la carpeta `scripts/` (con `vendorizar-cms.js`) a la raíz del
   proyecto.
4. Corre `npm install` una vez — esto instalará `decap-cms` y
   `decap-server` como dependencias fijas y generará automáticamente
   `admin/vendor/decap-cms/`.
5. Confirma que `admin/vendor/decap-cms/` **no** esté en `.gitignore`, y
   haz commit de todo (incluida esa carpeta) para que quede disponible
   offline en cualquier clon futuro del repositorio y en Netlify.

El instructivo de uso (`instructivo-de-uso.md`) cubre este mismo proceso
paso a paso para un usuario sin experiencia técnica en Windows 11.
