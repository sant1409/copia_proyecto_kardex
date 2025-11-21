const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth');

// Clave maestra tomada del .env
const CLAVE_GENERAL = process.env.CLAVE_GENERAL;

router.post("/verificar-admin", verificarToken, (req, res) => {
  try {
    const { clave } = req.body;
    const id_sede = req.usuario.id_sede; // viene del token

    if (clave === CLAVE_GENERAL) {
      return res.json({
        acceso: true,
        id_sede,
        mensaje: `Modo administrador activado para sede ${id_sede}`,
      });
    }

    return res.json({
      acceso: false,
      mensaje: "Clave incorrecta"
    });

  } catch (error) {
    console.error("Error en /verificar-admin:", error);
    return res.status(500).json({
      acceso: false,
      mensaje: "Error interno del servidor"
    });
  }
});

module.exports = router;
