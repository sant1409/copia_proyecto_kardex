## Proyecto Kardex


## carpetas para el proyecto
```
backend_kardex  = JavaScript - express - node.js - sequelize
frontend_kardex = React + vite + css
```
## Comandos del sistema - backend
```
Abrir carpeta 
cd backend_kardex
__________________
Comando para empezar a desarrollar el backend
npm init -y
npm install
npm install bcrypt = Sirve para encriptar contraseñas en la base de datos
npm install cors = permite bloquear peticiones de otros dominios. ej: backend está en localhost:3000 y frontend en localhost:5173, con cors permites que se comuniquen.
npm install dotenv = Permite guardas variables en el archivo .env, donde van los datos de la base de datos
npm install express = framework mas utilizado para crear servidores en Node.js
npm install mysql2 = Es el conector de Node.js para MYSQL, permitiendo hacer consultas mysql desde mi codigo
npm install sequelize = Es una ORM , que permite interactuar con la base de datos. Ej: crear migraciones
npm install --save-dev sequelize-cli = Es la herramienta de línea de comandos para trabajar con Sequelize.
npm install nodemailer  permite enviar codigos de verificacion al registrarse
npm install node-cron
npm install jsonwebtoken - token
___________________
Crear migraciones a la base de datos desde el backend
npx sequelize-cli migration:generate --name create-nombre_entidad
npx sequelize-cli db:migrate

__________________
```
## Comandos del sitema - frontend
```
Abrir carpeta
cd frontend_kardex
_________________
Comandos para el frontend
npm init -y
npm install
npm create vite@latest  = Al ejecutar este, te salen las opciones de con que dependencias quieres realizar el proyecto
npm install react
npm install react-dom
npm install react-router-dom
npm install react-select
npm install xlsx file-saver  = sirve para exportar a excel
npm install @react-pdf/renderer = sirve para descargar pdf

```
## Pasos para migrar el proyecto para un repositorio en git hub
```
git init
Crear el .gitignore
git add .
git commit -m "Lo que quiera poner"
git remote add origin https://github.com/sant1409/ProyectoKardex   a ca se pone la ruta del proyecto
git push -u origin master      si utiliza main se remplaza por master
 
```