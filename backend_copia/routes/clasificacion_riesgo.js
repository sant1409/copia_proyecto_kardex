// Rutas para gestionar las clasificaciones de riesgo del sistema.
// Permite crear, actualizar, consultar y eliminar clasificaciones por sede.
// Todas las operaciones están protegidas con autenticación por token.
//Esta es la clasificacion de reactivos


const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken } = require('../middlewares/auth');


// ✅ Crear clasificación de riesgo
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    const id_sede = req.usuario.id_sede;

    const [result] = await pool.query(
      'INSERT INTO clasificacion_riesgo (nombre, id_sede) VALUES (?, ?)',
      [nombre, id_sede]
    );

    res.status(201).json({
      message: 'Clasificación creada exitosamente!',
      id_clasificacion_riesgo: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Actualizar clasificación
router.put('/:id_clasificacion_riesgo', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;
    const { nombre } = req.body;
    const { id_clasificacion_riesgo } = req.params;

    const [result] = await pool.query(
      'UPDATE clasificacion_riesgo SET nombre = ? WHERE id_clasificacion_riesgo = ? AND id_sede = ?',
      [nombre, id_clasificacion_riesgo, id_sede]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Clasificación no encontrada o pertenece a otra sede' });
    }

    res.json({ message: 'La clasificación se actualizó exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener una clasificación
router.get('/:id_clasificacion_riesgo', verificarToken, async (req, res) => {
  try {
    const { id_clasificacion_riesgo } = req.params;
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
      'SELECT * FROM clasificacion_riesgo WHERE id_clasificacion_riesgo = ? AND id_sede = ?',
      [id_clasificacion_riesgo, id_sede]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Clasificación no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener todas las clasificaciones de la sede
router.get('/', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
      'SELECT id_clasificacion_riesgo, nombre AS clasificacion_riesgo FROM clasificacion_riesgo WHERE id_sede = ?',
      [id_sede]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Eliminar clasificación
router.delete('/:id_clasificacion_riesgo', verificarToken, async (req, res) => {
  try {
    const { id_clasificacion_riesgo } = req.params;
    const id_sede = req.usuario.id_sede;

    const [result] = await pool.query(
      'DELETE FROM clasificacion_riesgo WHERE id_clasificacion_riesgo = ? AND id_sede = ?',
      [id_clasificacion_riesgo, id_sede]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Clasificación no encontrada o pertenece a otra sede' });
    }

    res.json({ message: 'Clasificación eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
