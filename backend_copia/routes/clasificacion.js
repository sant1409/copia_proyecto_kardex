// Rutas para gestionar las clasificaciones del sistema.
// Permite crear, actualizar, consultar y eliminar clasificaciones por sede.
// Todas las operaciones requieren autenticación mediante token.
//Esta es la clasificacion de insumos

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken } = require('../middlewares/auth');


// ✅ Crear clasificación
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    const id_sede = req.usuario.id_sede;

    const [result] = await pool.query(
      'INSERT INTO clasificacion (nombre, id_sede) VALUES (?, ?)',
      [nombre, id_sede]
    );

    res.status(201).json({
      message: 'Clasificación creada exitosamente!',
      id_clasificacion: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Actualizar clasificación
router.put('/:id_clasificacion', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;
    const { nombre } = req.body;
    const { id_clasificacion } = req.params;

    const [result] = await pool.query(
      'UPDATE clasificacion SET nombre = ? WHERE id_clasificacion = ? AND id_sede = ?',
      [nombre, id_clasificacion, id_sede]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: 'Clasificación no encontrada o pertenece a otra sede' });
    }

    res.json({ message: 'Clasificación actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener una clasificación
router.get('/:id_clasificacion', verificarToken, async (req, res) => {
  try {
    const { id_clasificacion } = req.params;
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
      'SELECT * FROM clasificacion WHERE id_clasificacion = ? AND id_sede = ?',
      [id_clasificacion, id_sede]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Clasificación no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener todas las clasificaciones
router.get('/', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;
    const [rows] = await pool.query(
      'SELECT id_clasificacion, nombre AS clasificacion FROM clasificacion WHERE id_sede = ?',
      [id_sede]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Eliminar clasificación
router.delete('/:id_clasificacion', verificarToken, async (req, res) => {
  try {
    const { id_clasificacion } = req.params;
    const id_sede = req.usuario.id_sede;

    const [result] = await pool.query(
      'DELETE FROM clasificacion WHERE id_clasificacion = ? AND id_sede = ?',
      [id_clasificacion, id_sede]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: 'Clasificación no encontrada o pertenece a otra sede' });
    }

    res.json({ message: 'Clasificación eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
