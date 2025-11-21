#!/usr/bin/env bash
# Start script para Railway / deploys automáticos
# Este script instala dependencias y arranca el backend localizado en ./backend_copia

set -e
echo "Iniciando start.sh: instalar dependencias y arrancar backend_copia"
cd backend_copia
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Instalando dependencias en backend_copia..."
npm install --production
echo "Arrancando servidor: npm start"
npm start
