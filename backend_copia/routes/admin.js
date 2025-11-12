// Ruta que valida una clave maestra para activar el modo administrador.
// Requiere autenticación por token y devuelve si el acceso es permitido junto con el id de la sede.


const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth');

// Clave maestra (puede ser la misma para todas las sedes)
const CLAVE_GENERAL = "clave12345";

router.post("/verificar-admin", verificarToken, (req, res) => {
  try {
    const { clave } = req.body;
    const id_sede = req.usuario.id_sede; // viene del token

    if (clave === CLAVE_GENERAL) {
      res.json({
        acceso: true,
        id_sede,
        mensaje: `Modo administrador activado para sede ${id_sede}`,
      });
    } else {
      res.json({ acceso: false, mensaje: "Clave incorrecta" });
    }
  } catch (error) {
    console.error("Error en /verificar-admin:", error);
    res.status(500).json({ acceso: false, mensaje: "Error interno del servidor" });
  }
});

module.exports = router;
