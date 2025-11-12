/**
 * Rutas para la gestión de los nombres de reactivos.
 * Permite crear, actualizar, obtener y eliminar nombres de reactivos asociados a la sede del usuario autenticado.
 * Todas las operaciones están protegidas mediante verificación de token.
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken } = require('../middlewares/auth');

// 🔹 Crear insumo (registrar con la sede del usuario)
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    const id_sede = req.usuario.id_sede; 

    const [result] = await pool.query(
      'INSERT INTO nombre_insumo (nombre, id_sede) VALUES (?, ?)',
      [nombre, id_sede]
    );

    res.status(201).json({
      message: 'Nombre del insumo creado exitosamente',
      id_nombre_insumo: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Actualizar insumo (solo si pertenece a la sede del usuario)
router.put('/:id_nombre_insumo', verificarToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    const { id_nombre_insumo } = req.params;
    const id_sede = req.usuario.id_sede;

    const [result] = await pool.query(
      'UPDATE nombre_insumo SET nombre = ? WHERE id_nombre_insumo = ? AND id_sede = ?',
      [nombre, id_nombre_insumo, id_sede]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Insumo no encontrado o no pertenece a tu sede' });
    }

    res.json({ message: 'El nombre de insumo se actualizó exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Obtener un insumo por ID (solo si pertenece a la sede del usuario)
router.get('/:id_nombre_insumo', verificarToken, async (req, res) => {
  try {
    const { id_nombre_insumo } = req.params;
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
      'SELECT * FROM nombre_insumo WHERE id_nombre_insumo = ? AND id_sede = ?',
      [id_nombre_insumo, id_sede]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Insumo no encontrado o no pertenece a tu sede' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Obtener todos los insumos de la sede actual
router.get('/', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
      'SELECT id_nombre_insumo, nombre AS nombre_insumo FROM nombre_insumo WHERE id_sede = ?',
      [id_sede]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Eliminar insumo (solo si pertenece a la sede)
router.delete('/:id_nombre_insumo', verificarToken, async (req, res) => {
  try {
    const { id_nombre_insumo } = req.params;
    const id_sede = req.usuario.id_sede;

    const [result] = await pool.query(
      'DELETE FROM nombre_insumo WHERE id_nombre_insumo = ? AND id_sede = ?',
      [id_nombre_insumo, id_sede]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Insumo no encontrado o no pertenece a tu sede' });
    }

    res.json({ message: 'Insumo eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
