/**
 * 🔹 sede.routes.js
 * Rutas para gestionar las sedes del sistema.
 * Permite crear, listar y obtener sedes, así como asignar una sede
 * al usuario autenticado según su sesión o token.
 */


const express = require('express');
const router = express.Router();
const pool = require('../db');

// 🔹 Obtener todas las sedes (puede estar público o protegido, según tu necesidad)
router.get('/', async (req, res) => {
  try {
    const [sedes] = await pool.query('SELECT * FROM sede');
    res.json(sedes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Crear una nueva sede (solo admin, se asume que el token tiene rol de usuario)
router.post('/', async (req, res) => {
  const { nombre } = req.body;
  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre de la sede es obligatorio' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO sede (nombre) VALUES (?)',
      [nombre]
    );
    res.status(201).json({ id_sede: result.insertId, nombre });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Seleccionar sede para el usuario (ahora se guarda en el token / usuario)
router.post('/seleccionar', async (req, res) => {
  const { id_sede } = req.body;
  if (!id_sede) return res.status(400).json({ error: 'El id_sede es obligatorio' });

  // Actualizamos la sede del usuario en la base de datos (o donde guardes info del usuario)
  try {
    await pool.query('UPDATE usuarios SET id_sede = ? WHERE id_usuario = ?', [
      id_sede,
      req.usuario.id_usuario
    ]);

    // También se puede actualizar en el objeto req.usuario para que siga activo en la sesión/token
    req.usuario.id_sede = id_sede;

    res.json({ message: 'Sede seleccionada', id_sede });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Obtener la sede actual del usuario
router.get('/actual',  (req, res) => {
  if (!req.usuario.id_sede) {
    return res.status(404).json({ error: 'No hay sede seleccionada para este usuario' });
  }
  res.json({ id_sede: req.usuario.id_sede });
});

// 🔹 Obtener una sede por su ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM sede WHERE id_sede = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sede no encontrada' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
