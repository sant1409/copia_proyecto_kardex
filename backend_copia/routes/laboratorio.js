// Rutas para gestionar los laboratorios del sistema.
// Permite crear, actualizar, consultar y eliminar laboratorios por sede.
// Todas las operaciones están protegidas con autenticación mediante token.
// Parte de insumos

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken } = require('../middlewares/auth');

// ✅ Crear laboratorio
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    const id_sede = req.usuario.id_sede;

    const [result] = await pool.query(
      'INSERT INTO laboratorio (nombre, id_sede) VALUES (?, ?)',
      [nombre, id_sede]
    );

    res.status(201).json({
      message: 'Laboratorio creado exitosamente!',
      id_laboratorio: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Actualizar laboratorio
router.put('/:id_laboratorio', verificarToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    const { id_laboratorio } = req.params;
    const id_sede = req.usuario.id_sede;

    const [result] = await pool.query(
      'UPDATE laboratorio SET nombre = ? WHERE id_laboratorio = ? AND id_sede = ?',
      [nombre, id_laboratorio, id_sede]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Laboratorio no encontrado o pertenece a otra sede' });
    }

    res.json({ message: 'Laboratorio actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener un laboratorio
router.get('/:id_laboratorio', verificarToken, async (req, res) => {
  try {
    const { id_laboratorio } = req.params;
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
      'SELECT * FROM laboratorio WHERE id_laboratorio = ? AND id_sede = ?',
      [id_laboratorio, id_sede]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Laboratorio no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener todos los laboratorios
router.get('/', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
      'SELECT id_laboratorio, nombre AS laboratorio FROM laboratorio WHERE id_sede = ?',
      [id_sede]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Eliminar laboratorio
router.delete('/:id_laboratorio', verificarToken, async (req, res) => {
  try {
    const { id_laboratorio } = req.params;
    const id_sede = req.usuario.id_sede;

    const [result] = await pool.query(
      'DELETE FROM laboratorio WHERE id_laboratorio = ? AND id_sede = ?',
      [id_laboratorio, id_sede]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Laboratorio no encontrado o pertenece a otra sede' });
    }

    res.json({ message: 'Laboratorio eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
