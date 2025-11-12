// Rutas para gestionar las casas comerciales del sistema.
// Permite crear, actualizar, consultar y eliminar casas comerciales por sede.
// Todas las operaciones requieren autenticación con token.
//Tener en cuenta que este hace parte de kardex(reactivos)

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken } = require('../middlewares/auth');


// ✅ Crear casa comercial
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    const id_sede = req.usuario.id_sede; // viene del token

    const [result] = await pool.query(
      'INSERT INTO casa_comercial (nombre, id_sede) VALUES (?, ?)',
      [nombre, id_sede]
    );

    res.status(201).json({
      message: 'Casa comercial creada exitosamente!',
      id_casa_comercial: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Actualizar casa comercial
router.put('/:id_casa_comercial', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;
    const { nombre } = req.body;
    const { id_casa_comercial } = req.params;

    const [result] = await pool.query(
      'UPDATE casa_comercial SET nombre = ? WHERE id_casa_comercial = ? AND id_sede = ?',
      [nombre, id_casa_comercial, id_sede]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Casa comercial no encontrada o no pertenece a esta sede' });
    }

    res.json({ message: 'Casa comercial actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener una casa comercial por ID (solo de su sede)
router.get('/:id_casa_comercial', verificarToken, async (req, res) => {
  try {
    const { id_casa_comercial } = req.params;
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
      'SELECT * FROM casa_comercial WHERE id_casa_comercial = ? AND id_sede = ?',
      [id_casa_comercial, id_sede]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Casa comercial no encontrada o pertenece a otra sede' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener todas las casas comerciales de la sede
router.get('/', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
      'SELECT id_casa_comercial, nombre AS casa_comercial, id_sede FROM casa_comercial WHERE id_sede = ?',

      [id_sede]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Eliminar casa comercial (solo si es de su sede)
router.delete('/:id_casa_comercial', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;
    const { id_casa_comercial } = req.params;

    const [result] = await pool.query(
      'DELETE FROM casa_comercial WHERE id_casa_comercial = ? AND id_sede = ?',
      [id_casa_comercial, id_sede]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Casa comercial no encontrada o pertenece a otra sede' });
    }

    res.json({ message: 'Casa comercial eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
