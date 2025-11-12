// Rutas para gestionar los nombres de insumos del sistema.
// Permite crear, actualizar, consultar y eliminar nombres de insumos por sede.
// Todas las operaciones están protegidas mediante autenticación por token.


const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken } = require('../middlewares/auth');

// ✅ Crear nombre de insumo
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    const id_sede = req.usuario.id_sede;

    const [result] = await pool.query(
      'INSERT INTO nombre_del_insumo (nombre, id_sede) VALUES (?, ?)',
      [nombre, id_sede]
    );

    res.status(201).json({
      message: 'Nombre de insumo creado exitosamente!',
      id_nombre_del_insumo: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Actualizar nombre de insumo
router.put('/:id_nombre_del_insumo', verificarToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    const { id_nombre_del_insumo } = req.params;
    const id_sede = req.usuario.id_sede;

    const [result] = await pool.query(
      'UPDATE nombre_del_insumo SET nombre = ? WHERE id_nombre_del_insumo = ? AND id_sede = ?',
      [nombre, id_nombre_del_insumo, id_sede]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Nombre de insumo no encontrado o pertenece a otra sede' });
    }

    res.json({ message: 'Nombre de insumo actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener un nombre de insumo por ID
router.get('/:id_nombre_del_insumo', verificarToken, async (req, res) => {
  try {
    const { id_nombre_del_insumo } = req.params;
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
      'SELECT * FROM nombre_del_insumo WHERE id_nombre_del_insumo = ? AND id_sede = ?',
      [id_nombre_del_insumo, id_sede]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Nombre de insumo no encontrado o pertenece a otra sede' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener todos los nombres de insumos
router.get('/', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
      'SELECT id_nombre_del_insumo, nombre AS nombre_del_insumo FROM nombre_del_insumo WHERE id_sede = ?',
      [id_sede]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Eliminar nombre de insumo
router.delete('/:id_nombre_del_insumo', verificarToken, async (req, res) => {
  try {
    const { id_nombre_del_insumo } = req.params;
    const id_sede = req.usuario.id_sede;

    const [result] = await pool.query(
      'DELETE FROM nombre_del_insumo WHERE id_nombre_del_insumo = ? AND id_sede = ?',
      [id_nombre_del_insumo, id_sede]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Nombre de insumo no encontrado o pertenece a otra sede' });
    }

    res.json({ message: 'Nombre de insumo eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
