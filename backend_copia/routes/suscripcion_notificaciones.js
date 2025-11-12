/**
 * 🔹 suscripcion_notificaciones.routes.js
 * Rutas para gestionar las suscripciones de notificaciones por sede.
 * Permite crear, listar, actualizar y eliminar correos suscritos
 * asociados al usuario autenticado.
 */


const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken } = require('../middlewares/auth'); 

// 🔹 Obtener todas las suscripciones (opcionalmente filtradas por sede)
router.get('/', verificarToken, async (req, res) => {
  try {
   const id_sede = req.usuario.id_sede;
   
    let query = 'SELECT * FROM suscripcion_notificaciones';
    let params = [];

    if (id_sede) {
      query += ' WHERE id_sede = ?';
      params.push(id_sede);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener suscripciones:', error);
    res.status(500).json({ error: 'Error al obtener suscripciones' });
  }
});

// 🔹 Crear una suscripción
router.post('/', verificarToken, async (req, res) => {
  try {
    const { correo } = req.body;
       const id_sede = req.usuario.id_sede;
    if (!correo || !id_sede) {
      return res.status(400).json({ error: 'Faltan datos obligatorios: correo o id_sede' });
    }

    const [result] = await pool.query(
      'INSERT IGNORE INTO suscripcion_notificaciones (correo, id_sede) VALUES (?, ?)',
      [correo, id_sede]
    );

    res.json({ id: result.insertId, correo, id_sede });
  } catch (error) {
    console.error('Error al crear suscripción:', error);
    res.status(500).json({ error: 'Error al crear suscripción' });
  }
});

// 🔹 Eliminar una suscripción
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
      const id_sede = req.usuario.id_sede;
    const [result] = await pool.query(
      'DELETE FROM suscripcion_notificaciones WHERE id_suscripcion_notificaciones = ? AND id_sede = ?',
      [id, id_sede]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Suscripción no encontrada' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar suscripción:', error);
    res.status(500).json({ error: 'Error al eliminar suscripción' });
  }
});

// 🔹 Actualizar correo de una suscripción
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { correo } = req.body;
    const id_sede = req.usuario.id_sede;

    if (!correo) return res.status(400).json({ error: 'No hay datos para actualizar' });

    const [result] = await pool.query(
      `UPDATE suscripcion_notificaciones SET correo = ? WHERE id_suscripcion_notificaciones = ? AND id_sede = ?`,
      [correo, id, id_sede]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Suscripción no encontrada' });

    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar suscripción:', error);
    res.status(500).json({ error: 'Error al actualizar suscripción' });
  }
});

module.exports = router;
