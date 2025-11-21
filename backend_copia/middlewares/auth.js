/**
 * 🛡️ auth.js
 * Middleware de autenticación con JWT.
 * Comprueba la validez del token en el encabezado Authorization
 * y permite el acceso a rutas protegidas agregando la información del usuario a req.
 */

const jwt = require('jsonwebtoken');

// 🔐 La clave debe venir SIEMPRE del .env
const claveSecreta = process.env.JWT_SECRET;

// 🔒 Middleware para verificar token
function verificarToken(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1]; // formato: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Token faltante' });
  }

  try {
    const usuario = jwt.verify(token, claveSecreta);
    req.usuario = usuario; // agregamos los datos del usuario al request
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { verificarToken };
