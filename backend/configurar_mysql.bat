@echo off
title Sol de Casa - Configurar Base de Datos MySQL
echo ========================================================
echo   CONFIGURANDO BASE DE DATOS MYSQL (SOL DE CASA)
echo ========================================================
echo.
echo Comprobando archivo .env...
if not exist .env (
    echo Creando archivo .env desde plantilla...
    copy .env.example .env
    echo Archivo .env creado. Por favor revisa tu usuario y clave si es necesario.
)
echo.
echo Ejecutando migraciones y datos de prueba...
npm run setup
echo.
pause

