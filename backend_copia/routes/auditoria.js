// Rutas para gestionar auditorías del sistema.
// Permite crear, listar y eliminar registros de auditoría por sede.
// Requiere autenticación con token para todas las operaciones.


const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verificarToken } = require('../middlewares/auth');


// Crear auditoría
router.post('/', verificarToken, async (req, res) => {
  const { entidad_afectada, id_entidad, accion, detalle_adicional, id_usuario, nombre_responsable } = req.body;
  const id_sede = req.usuario.id_sede;

  try {
    const [result] = await pool.query(
      `INSERT INTO auditoria (
        entidad_afectada, id_entidad, accion, detalle_adicional, id_usuario, nombre_responsable, id_sede
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [entidad_afectada, id_entidad, accion, detalle_adicional, id_usuario, nombre_responsable, id_sede]
    );

    res.status(201).json({ message: 'Auditoría creada exitosamente!', id_auditoria: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todas las auditorías
router.get('/', verificarToken, async (req, res) => {

  const id_sede = req.usuario.id_sede;

  try {
    const [result] = await pool.query(
      'SELECT * FROM auditoria WHERE id_sede = ? ORDER BY fecha_hora DESC',
      [id_sede]
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🧹 Limpiar auditorías antiguas o todas (por sede)
router.delete('/limpiar', verificarToken, async (req, res) => {
  try {
    const { opcion } = req.body; 
    const id_sede = req.usuario.id_sede; // ✅ Se usa para filtrar por sede

    let query = '';
    let mensaje = '';

    switch (opcion) {
      case 'este_mes':
        query = `
          DELETE FROM auditoria
          WHERE id_sede = ?
          AND (
            MONTH(fecha_hora) != MONTH(NOW()) 
            OR YEAR(fecha_hora) != YEAR(NOW())
          )
        `;
        mensaje = 'Se borraron las auditorías que no pertenecen a este mes.';
        break;

      case 'tres_meses':
        query = `
          DELETE FROM auditoria
          WHERE id_sede = ?
          AND fecha_hora < DATE_SUB(NOW(), INTERVAL 3 MONTH)
        `;
        mensaje = 'Se borraron las auditorías con más de 3 meses.';
        break;

      case 'todas':
        query = `
          DELETE FROM auditoria
          WHERE id_sede = ?
        `;
        mensaje = 'Se eliminaron todas las auditorías de esta sede.';
        break;

      default:
        return res.status(400).json({ error: 'Opción no válida' });
    }

    // ✅ Se pasa id_sede como parámetro
    const [result] = await pool.query(query, [id_sede]);
    res.json({ mensaje, eliminadas: result.affectedRows });

  } catch (error) {
    console.error('❌ Error limpiando auditorías:', error);
    res.status(500).json({ error: 'Error al limpiar auditorías' });
  }
});

module.exports = router;
