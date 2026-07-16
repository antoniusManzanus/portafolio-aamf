@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ==============================================
echo   AAMF Portfolio - Iniciando entorno local
echo ==============================================
echo.

:: -- 1. Verificar dependencias (primera vez o tras actualizar) --
echo [1/5] Verificando dependencias...
if not exist "node_modules" (
  echo  No se encontraron dependencias instaladas. Instalando por primera vez...
  echo  Esto puede tardar unos minutos y requiere conexion a internet...
  echo.
  call npm install
  if !ERRORLEVEL! NEQ 0 (
    echo.
    echo  ERROR: no se pudieron instalar las dependencias.
    echo  Verifica tu conexion a internet e intenta de nuevo.
    echo.
    pause
    exit /b 1
  )
) else if not exist "admin\vendor\decap-cms\decap-cms.js" (
  echo  Falta el editor del CMS ^(admin\vendor\decap-cms^). Instalando...
  echo.
  call npm install
  if !ERRORLEVEL! NEQ 0 (
    echo.
    echo  ERROR: no se pudo instalar/actualizar decap-cms.
    echo  Verifica tu conexion a internet e intenta de nuevo.
    echo.
    pause
    exit /b 1
  )
)

:: -- 2. Verificar identidad de Git (necesaria para publicar) --
echo.
echo [2/5] Verificando identidad de Git...
git config user.name >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
  echo.
  echo  No se detecto un nombre configurado en Git en este equipo.
  echo  Se usara para firmar los cambios que publiques.
  set /p GIT_NOMBRE="  Escribe tu nombre: "
  git config --global user.name "!GIT_NOMBRE!"
)
git config user.email >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
  echo  No se detecto un correo configurado en Git en este equipo.
  set /p GIT_CORREO="  Escribe tu correo electronico: "
  git config --global user.email "!GIT_CORREO!"
)

:: -- 3. Sincronizar con GitHub --
echo.
echo [3/5] Sincronizando con GitHub (git pull)...
git pull origin main
if !ERRORLEVEL! NEQ 0 (
  echo.
  echo  ADVERTENCIA: git pull no pudo completarse.
  echo  Puede haber conflictos pendientes o falta de conexion.
  echo  Puedes continuar editando, pero el push podria fallar.
  echo.
  pause
)

:: -- 4. Iniciar decap-server (proxy local para el CMS) --
echo.
echo [4/5] Iniciando decap-server (puerto 8081, solo local)...
start "Decap Server" cmd /k "cd /d "%~dp0" && set BIND_HOST=127.0.0.1 && npx decap-server"

:: Esperar a que decap-server levante antes de abrir el navegador
timeout /t 3 /nobreak >nul

:: -- 5. Iniciar servidor Node.js + abrir navegador --
echo.
echo [5/5] Iniciando servidor local (puerto 3000, solo local)...
echo.
echo  Panel CMS:  http://localhost:3000/admin/
echo  Preview:    http://localhost:3000
echo  Publicar:   http://localhost:3000/publicar.html
echo.
echo  Ambos servidores solo aceptan conexiones desde este equipo.
echo  Cierra esta ventana para detener el servidor.
echo.

:: Abrir el panel de publicacion en el navegador por defecto
start "" "http://localhost:3000/publicar.html"

:: Iniciar Node.js en primer plano (mantiene esta ventana abierta)
node server.js

:: Si Node.js se detiene, pausar para ver el error
echo.
echo  El servidor se detuvo. Revisa los mensajes anteriores.
pause
