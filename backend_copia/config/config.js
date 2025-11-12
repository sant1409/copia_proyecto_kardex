// backend_copia/config/config.js
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || null,
    database: process.env.MYSQLDATABASE || 'prueba_kardex',
    host: process.env.MYSQLHOST || '127.0.0.1',
    port: process.env.MYSQLPORT ? Number(process.env.MYSQLPORT) : 3306,
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    host: process.env.MYSQLHOST,
    port: Number(process.env.MYSQLPORT),
    dialect: 'mysql',
    logging: false
  }
};
