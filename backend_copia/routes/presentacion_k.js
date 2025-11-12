/**
 * Rutas para la gestión de presentaciones de reactivos.
 * Permite crear, actualizar, consultar y eliminar presentaciones 
 * asociadas a la sede del usuario autenticado.
 * Ës de reactivos
 */


const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken } = require('../middlewares/auth');

// 🔹 Crear presentación
router.post('/', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;
    const { nombre } = req.body;

    const [result] = await pool.query(
      'INSERT INTO presentacion_k (nombre, id_sede) VALUES (?, ?)',
      [nombre, id_sede]
    );

    res.status(201).json({
      message: 'Presentación creada exitosamente',
      id_presentacion_k: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Actualizar presentación
router.put('/:id_presentacion_k', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;
    const { nombre } = req.body;
    const { id_presentacion_k } = req.params;

    const [result] = await pool.query(
      'UPDATE presentacion_k SET nombre = ? WHERE id_presentacion_k = ? AND id_sede = ?',
      [nombre, id_presentacion_k, id_sede]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Presentación no encontrada o no pertenece a tu sede'
      });
    }

    res.json({ message: 'La presentación se actualizó exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Obtener presentación por ID
router.get('/:id_presentacion_k', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;
    const { id_presentacion_k } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM presentacion_k WHERE id_presentacion_k = ? AND id_sede = ?',
      [id_presentacion_k, id_sede]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Presentación no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Obtener todas las presentaciones de la sede actual
router.get('/', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
      'SELECT id_presentacion_k, nombre AS presentacion_k FROM presentacion_k WHERE id_sede = ?',
     

      [id_sede]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Eliminar presentación
router.delete('/:id_presentacion_k', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;
    const { id_presentacion_k } = req.params;

    const [result] = await pool.query(
      'DELETE FROM presentacion_k WHERE id_presentacion_k = ? AND id_sede = ?',
      [id_presentacion_k, id_sede]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Presentación no encontrada o no pertenece a tu sede'
      });
    }

    res.json({ message: 'Presentación eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
