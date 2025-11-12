const pool = require('../db');

async function registrarAuditoria(entidad_afectada, id_entidad, accion, usuario) {
  try {
    const { id_usuario, nombre, id_sede } = usuario;
    let detalle_adicional = "";

    // --- Según la entidad afectada ---
    if (entidad_afectada === "kardex") {
      // 🔹 Obtenemos nombre del reactivo y casa comercial
      const [rows] = await pool.query(
        `SELECT ni.nombre AS nombre_reactivo, cc.nombre AS casa_comercial
         FROM kardex k
         JOIN nombre_insumo ni ON k.id_nombre_insumo = ni.id_nombre_insumo
         JOIN casa_comercial cc ON k.id_casa_comercial = cc.id_casa_comercial
         WHERE k.id_kardex = ? AND k.id_sede = ?`,
        [id_entidad, id_sede]
      );

      if (rows.length > 0) {
        const { nombre_reactivo, casa_comercial } = rows[0];
        detalle_adicional = `Se ${accion} el reactivo "${nombre_reactivo}" de la casa comercial "${casa_comercial}".`;
      } else {
        detalle_adicional = `Se ${accion} un reactivo (no se encontró información detallada).`;
      }
    }

    else if (entidad_afectada === "insumos") {
      // 🔹 Obtenemos nombre del insumo y laboratorio
      const [rows] = await pool.query(
        `SELECT ni.nombre AS nombre_insumo, l.nombre AS laboratorio
         FROM insumos i
         JOIN nombre_del_insumo ni ON i.id_nombre_del_insumo = ni.id_nombre_del_insumo
         JOIN laboratorio l ON i.id_laboratorio = l.id_laboratorio
         WHERE i.id_insumo = ? AND i.id_sede = ?`,
        [id_entidad, id_sede]
      );

      if (rows.length > 0) {
        const { nombre_insumo, laboratorio } = rows[0];
        detalle_adicional = `Se ${accion} el insumo "${nombre_insumo}" del laboratorio "${laboratorio}".`;
      } else {
        detalle_adicional = `Se ${accion} un insumo (no se encontró información detallada).`;
      }
    }

    // --- Insertar en la tabla auditoria ---
    const [result] = await pool.query(
      `INSERT INTO auditoria (
        entidad_afectada, id_entidad, accion, detalle_adicional, id_usuario, nombre_responsable, id_sede
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [entidad_afectada, id_entidad, accion, detalle_adicional, id_usuario, nombre, id_sede]
    );

    console.log("✅ Auditoría creada con ID:", result.insertId);
    return result.insertId;

  } catch (error) {
    console.error("❌ Error en registrarAuditoria:", error.sqlMessage || error.message);
    throw error;
  }
}

module.exports = { registrarAuditoria };
