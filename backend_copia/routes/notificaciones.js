/**
 * Rutas para la gestión de notificaciones del sistema.
 * Permite listar, crear y marcar como leídas las notificaciones, 
 * mostrando información relacionada con kardex, insumos y laboratorios. 
 * Todas las operaciones están filtradas por la sede del usuario autenticado.
 */


const express = require('express');
const router = express.Router();
const pool = require('../db');
const { crearNotificacion, marcarLeida } = require('../utils/notificaciones');
const { verificarToken } = require('../middlewares/auth');

// 🔹 Obtener todas las notificaciones con info de kardex e insumos (solo de la sede del usuario)
router.get('/', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;

    const [rows] = await pool.query(`
      SELECT 
        n.id_notificacion, n.mensaje, n.tipo, n.fecha_evento, n.leido,
        k.lote, k.fecha_terminacion, ni.nombre AS nombre_insumo, cc.nombre AS casa_comercial,
        i.id_insumo, ndi.nombre AS nombre_del_insumo, l.nombre AS laboratorio
      FROM notificaciones n
      LEFT JOIN kardex k ON n.id_kardex = k.id_kardex
      LEFT JOIN nombre_insumo ni ON k.id_nombre_insumo = ni.id_nombre_insumo
      LEFT JOIN casa_comercial cc ON k.id_casa_comercial = cc.id_casa_comercial
      LEFT JOIN insumos i ON n.id_insumo = i.id_insumo
      LEFT JOIN nombre_del_insumo ndi ON i.id_nombre_del_insumo = ndi.id_nombre_del_insumo
      LEFT JOIN laboratorio l ON i.id_laboratorio = l.id_laboratorio
      WHERE n.leido = 0
      AND n.id_sede = ?
      ORDER BY n.fecha_creacion DESC
    `, [id_sede]);

    res.json(rows);
  } catch (error) {
    console.error('💥 Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// 🔹 Crear una notificación (guardar con sede del usuario)
router.post('/', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;
    const dataConSede = { ...req.body, id_sede }; // agrega sede al body
    const id = await crearNotificacion(dataConSede);

    res.json({ id });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({ error: 'Error al crear notificación' });
  }
});

// 🔹 Marcar como leída (solo si pertenece a la sede actual)
router.put('/:id/leida', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;      // ✅ obtener sede del token
    const id_notificacion = req.params.id;

    const [rows] = await pool.query(
      'SELECT id_notificacion FROM notificaciones WHERE id_notificacion = ? AND id_sede = ?',
      [id_notificacion, id_sede]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada o no pertenece a tu sede' });
    }

    // ✅ Pasar id_sede a la función
    const ok = await marcarLeida(id_notificacion, id_sede);

    res.json({ success: ok });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ error: 'Error al marcar notificación como leída' });
  }
});


module.exports = router;
