// Rutas para gestionar las categorías del sistema.
// Permite crear, actualizar, consultar y eliminar categorías por sede.
// Todas las operaciones requieren autenticación con token.


const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken } = require('../middlewares/auth');

// ✅ Crear categoría
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre } = req.body;
    const id_sede = req.usuario.id_sede;

    const [result] = await pool.query(
      'INSERT INTO categoria (nombre, id_sede) VALUES (?, ?)',
      [nombre, id_sede]
    );

    res.status(201).json({
      message: 'Categoría creada exitosamente!',
      id_categoria: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Actualizar categoría
router.put('/:id_categoria', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;
    const { nombre } = req.body;
    const { id_categoria } = req.params;

    const [result] = await pool.query(
      'UPDATE categoria SET nombre = ? WHERE id_categoria = ? AND id_sede = ?',
      [nombre, id_categoria, id_sede]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada o pertenece a otra sede' });
    }

    res.json({ message: 'Categoría actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener una categoría por ID
router.get('/:id_categoria', verificarToken, async (req, res) => {
  try {
    const { id_categoria } = req.params;
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
     'SELECT id_categoria, nombre AS categoria, id_sede FROM categoria WHERE id_categoria = ? AND id_sede = ?',

    
      [id_categoria, id_sede]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Obtener todas las categorías de la sede
router.get('/', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(
  'SELECT id_categoria, nombre AS categoria, id_sede FROM categoria WHERE id_sede = ?',
  
  [id_sede]
   );


    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Eliminar categoría
router.delete('/:id_categoria', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;
    const { id_categoria } = req.params;

    const [result] = await pool.query(
      'DELETE FROM categoria WHERE id_categoria = ? AND id_sede = ?',
      [id_categoria, id_sede]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada o pertenece a otra sede' });
    }

    res.json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
