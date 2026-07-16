# Instructivo de uso — Portfolio AAMF (edición y publicación offline)

Esta guía explica, paso a paso, cómo dejar tu computadora lista para editar
el portfolio sin necesidad de internet, y cómo usar la herramienta en el
día a día. Está escrita para **Windows 11** y no asume experiencia técnica
previa.

> 💡 Todo lo que dice "una sola vez" solo lo harás la primera vez que
> configures tu computadora. Después, tu rutina normal es la de la
> **Parte 2**: abrir un archivo y editar.

---

## Índice

- [Parte 0 — Qué vas a instalar y para qué sirve](#parte-0)
- [Parte 1 — Preparar tu computadora (una sola vez)](#parte-1)
- [Parte 2 — Uso diario: editar, previsualizar y publicar](#parte-2)
- [Parte 3 — Solución de problemas frecuentes](#parte-3)
- [Parte 4 — Glosario breve](#parte-4)

---

<a id="parte-0"></a>
## Parte 0 — Qué vas a instalar y para qué sirve

| Programa | Para qué sirve | ¿Lo vas a usar directamente? |
|---|---|---|
| **Git para Windows** | Guarda el historial de cambios del proyecto y los sube a GitHub cuando publicas. | Casi nunca directamente — lo usa `iniciar.bat` por ti. |
| **Node.js** | Motor que permite correr el servidor local (`server.js`) y el editor (Decap CMS). | Casi nunca directamente. |
| **Un navegador** (Edge, Chrome, etc.) | Ahí es donde vas a editar el contenido y ver la vista previa. | Sí, todos los días. |

No necesitas instalar ningún editor de código ni saber programar. Una vez
hecha la configuración inicial, tu única herramienta de trabajo diaria es
hacer doble clic en un archivo y usar el navegador.

---

<a id="parte-1"></a>
## Parte 1 — Preparar tu computadora (una sola vez)

### 1.1 Instalar Git para Windows

1. Abre tu navegador y entra a **https://git-scm.com/download/win**
2. La descarga del instalador de 64 bits debería empezar sola. Si no,
   haz clic en el enlace "64-bit Git for Windows Setup".
3. Ejecuta el instalador descargado. Durante la instalación, **deja todas
   las opciones por defecto** y ve haciendo clic en "Next" hasta terminar
   (esto incluye instalar automáticamente el "Git Credential Manager",
   que más adelante te permitirá publicar sin escribir contraseñas a
   mano).

### 1.2 Instalar Node.js

1. Entra a **https://nodejs.org**
2. Descarga la versión marcada como **LTS** (es la recomendada y estable,
   a diferencia de "Current" que trae funciones más nuevas pero menos
   probadas).
3. Ejecuta el instalador `.msi` descargado y deja las opciones por
   defecto.

### 1.3 Verificar que ambos quedaron instalados

1. Abre el **Símbolo del sistema** (búscalo en el menú de inicio como
   "cmd" o "Símbolo del sistema").
2. Escribe y presiona Enter:
   ```
   git --version
   ```
   Debería mostrarte un número de versión, por ejemplo `git version
   2.46.0.windows.1`.
3. Escribe y presiona Enter:
   ```
   node --version
   ```
   Debería mostrarte algo como `v24.18.0`.

Si alguno de los dos comandos dice "no se reconoce como un comando
interno o externo", reinicia la computadora (a veces Windows necesita
reiniciar para reconocer los programas nuevos) e inténtalo de nuevo.

### 1.4 Descargar (clonar) el proyecto desde GitHub

1. Entra a la página de tu repositorio en GitHub.
2. Haz clic en el botón verde **"Code"** → pestaña **HTTPS** → haz clic
   en el ícono de copiar para copiar el enlace (se ve algo así:
   `https://github.com/tu-usuario/tu-repositorio.git`).
3. Elige en tu computadora una carpeta donde quieras guardar el proyecto,
   por ejemplo `Documentos`. Ábrela en el Explorador de archivos.
4. Haz clic en la barra de direcciones de arriba, escribe `cmd` y
   presiona Enter — esto abre una terminal ya ubicada en esa carpeta.
5. Escribe (reemplazando el enlace por el tuyo):
   ```
   git clone https://github.com/tu-usuario/tu-repositorio.git
   ```
6. Esto crea una carpeta nueva con todo el proyecto adentro.

### 1.5 Aplicar los archivos corregidos

Copia los archivos que se entregaron junto con este instructivo dentro de
la carpeta del proyecto que acabas de clonar, respetando esta ubicación:

```
tu-repositorio/
├─ admin/
│   ├─ config.yml       ← reemplaza el que ya existe
│   └─ index.html       ← reemplaza el que ya existe
├─ scripts/
│   └─ vendorizar-cms.js  ← carpeta y archivo nuevos, agrégalos
├─ server.js             ← reemplaza el que ya existe
├─ iniciar.bat            ← reemplaza el que ya existe
└─ package.json           ← reemplaza el que ya existe
```

> Si tienes dudas sobre qué cambió exactamente en cada archivo y por qué,
> revisa `correcciones.md` — ahí está el detalle técnico de cada
> corrección.

### 1.6 Instalar las dependencias (una sola vez)

1. En la misma terminal (o abre una nueva dentro de la carpeta del
   proyecto, igual que en el paso 1.4.4), escribe:
   ```
   npm install
   ```
2. Espera a que termine — puede tardar uno o dos minutos y **necesita
   conexión a internet** (es la única vez que la necesitas para
   instalar, no para usar la herramienta después).
3. Al terminar, deberías ver un mensaje como:
   ```
   [vendorizar-cms] Copiados 186 archivos a admin/vendor/decap-cms/
   ```
   Esto confirma que el editor del CMS quedó copiado en tu proyecto y ya
   no dependerá de internet para abrirse.

### 1.7 Guardar la carpeta del editor en tu repositorio (una sola vez)

Esa carpeta nueva (`admin/vendor/decap-cms/`) debe quedar publicada en
GitHub para que esté disponible offline la próxima vez, y para que el
sitio en línea también la use. Vas a hacerlo con la misma herramienta que
usarás en el día a día:

1. Haz doble clic en **`iniciar.bat`**.
2. La primera vez, es posible que te pida tu nombre y correo — escríbelos
   y presiona Enter después de cada uno (esto identifica tus cambios en
   el historial de Git; solo se pregunta una vez por computadora).
3. Cuando termine de iniciar, se abrirá tu navegador en
   `http://localhost:3000/publicar.html`.
4. Haz clic en **"Verificar cambios"**. Deberías ver que
   `admin/vendor/decap-cms/decap-cms.js` (y sus archivos acompañantes)
   aparecen como **nuevo**.
5. Escribe un mensaje como `Agrega el editor local del CMS` y haz clic en
   **"⬆ Publicar"**.
6. La primera vez que se publique algo desde este equipo, es posible que
   se abra una ventana del navegador pidiéndote iniciar sesión en
   GitHub — inicia sesión con tu cuenta y autoriza el acceso. Windows
   recordará esto para la próxima vez.

¡Listo! Tu computadora ya está lista. De aquí en adelante, tu flujo de
trabajo es el de la **Parte 2**.

---

<a id="parte-2"></a>
## Parte 2 — Uso diario: editar, previsualizar y publicar

### 2.1 Abrir la herramienta

Haz doble clic en **`iniciar.bat`**, dentro de la carpeta del proyecto.

Se abrirán, en este orden:

1. Una ventana negra que sincroniza tu proyecto con GitHub
   (`git pull`) — así siempre partes de la versión más reciente.
2. Una segunda ventana llamada **"Decap Server"** — esta es la que
   permite que el editor guarde tus cambios directamente en tu
   computadora. **No la cierres** mientras estés editando.
3. Tu navegador se abrirá automáticamente en la página de publicación.

> No necesitas conexión a internet para los pasos 2 en adelante, salvo
> para el paso final de "Publicar" (ver Parte 2.5).

### 2.2 Editar el contenido

Ve a **http://localhost:3000/admin/** (puedes escribirlo tú mismo en la
barra de direcciones, o hacer clic en "Panel CMS" desde la página de
publicación).

Ahí encontrarás, en el menú de la izquierda, tres secciones:

- **Proyectos** — agregar, editar o eliminar proyectos del portfolio
  (nombre, ubicación, año, descripciones, galería de imágenes, etc.)
- **Perfil del arquitecto** — datos que se muestran en la página de
  perfil (experiencia, formación, herramientas).
- **Información de contacto** — teléfono, correo, redes sociales.

Edita lo que necesites y haz clic en **"Guardar"** (o "Publish" según el
idioma que muestre tu navegador) dentro del editor. Esto **no** sube nada
a internet todavía — solo lo guarda en tu computadora. Puedes repetir
esto tantas veces como quieras, en cualquier cantidad de proyectos,
antes de publicar nada.

> ℹ️ Las imágenes de portada y galería son enlaces (URLs) a imágenes ya
> subidas a un servicio externo (por ejemplo ibb.co), no archivos que
> subas desde tu computadora. Si no tienes internet, esas imágenes no se
> verán en la vista previa (ver Parte 3), pero puedes seguir editando
> el resto del contenido sin problema.

### 2.3 Ver la vista previa (sin publicar)

Abre otra pestaña en tu navegador y ve a **http://localhost:3000**. Ahí
verás el sitio exactamente como quedaría publicado, ya con tus cambios
más recientes — aunque todavía no los hayas subido a internet. Puedes
recargar la página (F5) después de cada edición para ver el resultado.

También puedes revisar las páginas de perfil y contacto:
- `http://localhost:3000/perfil.html`
- `http://localhost:3000/contacto.html`

### 2.4 Revisar los cambios pendientes

Ve a **http://localhost:3000/publicar.html** y haz clic en
**"Verificar cambios"**. Vas a ver:

- La lista de archivos que modificaste, creaste o eliminaste (con una
  etiqueta de color: nuevo, modificado, eliminado).
- El detalle línea por línea de qué cambió en cada uno (en verde lo que
  se agregó, en rojo lo que se quitó).

Puedes editar todos los archivos que quieras (varios proyectos, tu perfil,
tu contacto) antes de este paso — todos se publican juntos en un solo
envío.

### 2.5 Publicar los cambios

1. Escribe un mensaje breve que describa lo que cambiaste, por ejemplo
   `Actualiza fotos de Casa Habitación R` (el campo ya trae un mensaje
   genérico si prefieres dejarlo así).
2. Haz clic en **"⬆ Publicar"**.
3. **Esto sí necesita conexión a internet**, porque en este paso se
   suben los cambios a GitHub. Espera el mensaje
   "✅ Publicado correctamente."
4. Netlify (el servicio que aloja el sitio en internet) detecta el
   cambio automáticamente y actualiza el sitio público en unos minutos.

### 2.6 Terminar la sesión

Cuando termines de editar, simplemente cierra las dos ventanas negras
("Decap Server" y la del servidor principal) o cierra la ventana del
símbolo del sistema. No hace falta ningún paso adicional — si dejaste
cambios sin publicar, seguirán ahí guardados en tu computadora la próxima
vez que abras `iniciar.bat`.

---

<a id="parte-3"></a>
## Parte 3 — Solución de problemas frecuentes

**"Windows protegió su PC" al abrir `iniciar.bat` o durante la
instalación**
Windows a veces muestra esta advertencia con archivos descargados de
internet que no reconoce. Haz clic en **"Más información"** y luego en
**"Ejecutar de todas formas"** — es seguro si el archivo viene de tu
propio proyecto.

**El botón "Publicar" muestra un error sobre "identity" o "who you are"**
Esto ya no debería ocurrir gracias a la corrección aplicada, pero si
aparece, significa que tu nombre/correo de Git no quedaron guardados.
Abre el símbolo del sistema dentro de la carpeta del proyecto y escribe:
```
git config --global user.name "Tu nombre"
git config --global user.email "tu-correo@ejemplo.com"
```

**No tengo internet en este momento, ¿puedo seguir trabajando?**
Sí. Puedes abrir `iniciar.bat`, editar en el panel, y revisar la vista
previa sin conexión (salvo que las imágenes de los proyectos no se
mostrarán, porque están alojadas en internet). Lo único que necesita
conexión es el paso final de "Publicar". Puedes dejar tus cambios
guardados localmente y publicarlos cuando recuperes internet.

**Cerré todo sin publicar, ¿perdí mis cambios?**
No. Tus cambios quedan guardados como archivos en tu computadora. La
próxima vez que abras `iniciar.bat`, en "Verificar cambios" los volverás
a ver listos para publicar.

**Voy a editar desde otra computadora, ¿hay algún riesgo?**
`iniciar.bat` siempre sincroniza primero con GitHub (`git pull`) antes de
dejarte editar, así que partirás de la versión más reciente. Evita tener
cambios sin publicar en dos computadoras distintas al mismo tiempo, para
no generar conflictos.

**El panel `/admin/` no carga o se ve en blanco**
Verifica que la carpeta `admin/vendor/decap-cms/` exista dentro de tu
proyecto y tenga archivos adentro. Si no está, ejecuta de nuevo
`npm install` desde una terminal dentro de la carpeta del proyecto (con
internet disponible) para regenerarla.

**Aparece un error de "puerto ocupado" o la ventana "Decap Server" se
cierra sola**
Es posible que ya tengas otra copia de `iniciar.bat` corriendo en
segundo plano. Cierra todas las ventanas negras relacionadas con el
proyecto y vuelve a abrir `iniciar.bat` una sola vez.

---

<a id="parte-4"></a>
## Parte 4 — Glosario breve

| Término | En simple |
|---|---|
| **Repositorio** | La carpeta de tu proyecto, con todo su historial de cambios guardado. |
| **Commit** | Una "foto" guardada de cómo estaban los archivos en un momento dado, con un mensaje describiéndola. |
| **Push / Publicar** | Enviar tus commits desde tu computadora hacia GitHub (y de ahí, a Netlify). |
| **Pull / Sincronizar** | Traer a tu computadora los cambios que ya están en GitHub (por ejemplo, los que hiciste desde otro equipo). |
| **CMS (Decap CMS)** | El panel visual (`/admin/`) donde editas el contenido sin tocar código. |
| **Servidor local** | El programa (`server.js`) que corre en tu computadora y te permite ver el sitio y publicar cambios. |

---

Si necesitas el detalle técnico de qué se corrigió en la herramienta y
por qué, consulta **`correcciones.md`**.
