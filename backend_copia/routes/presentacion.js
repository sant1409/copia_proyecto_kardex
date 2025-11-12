/**
 * Rutas para la gestión de presentaciones de insumos.
 * Permite crear, editar, listar y eliminar presentaciones, 
 * restringidas a la sede del usuario autenticado.
 */


const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken } = require('../middlewares/auth');

// ✅ Crear presentación (solo para la id_sede del usuario)
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    const id_sede = req.usuario.id_sede;

    if (!id_sede) return res.status(401).json({ message: 'id_sede no encontrada' });

    const [result] = await pool.query(
      'INSERT INTO presentacion(nombre, id_sede) VALUES (?, ?)',
      [nombre, id_sede]
    );

    res.status(201).json({ message: 'Presentación creada exitosamente!', id_presentacion: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Actualizar presentación (solo si pertenece a su id_sede)
router.put('/:id_presentacion', verificarToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    const { id_presentacion } = req.params;
    const id_sede = req.usuario.id_sede;

    const [result] = await pool.query(
      'UPDATE presentacion SET nombre = ? WHERE id_presentacion = ? AND id_sede = ?',
      [nombre, id_presentacion, id_sede]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'No se encontró la presentación en tu id_sede' });

    res.json({ message: 'La presentación se actualizó exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener una presentación (solo si pertenece a su id_sede)
router.get('/:id_presentacion', verificarToken, async (req, res) => {
  try {
    const { id_presentacion } = req.params;
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
      'SELECT * FROM presentacion WHERE id_presentacion = ? AND id_sede = ?',
      [id_presentacion, id_sede]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: 'Presentación no encontrada en tu id_sede' });

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Listar todas las presentaciones de su id_sede
router.get('/', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
      'SELECT id_presentacion, nombre AS presentacion FROM presentacion WHERE id_sede = ?',
      [id_sede]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Eliminar presentación (solo si pertenece a su id_sede)
router.delete('/:id_presentacion', verificarToken, async (req, res) => {
  try {
    const { id_presentacion } = req.params;
    const id_sede = req.usuario.id_sede;

    const [result] = await pool.query(
      'DELETE FROM presentacion WHERE id_presentacion = ? AND id_sede = ?',
      [id_presentacion, id_sede]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Presentación no encontrada en tu id_sede' });

    res.json({ message: 'Presentación eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
