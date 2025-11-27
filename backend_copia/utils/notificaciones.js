/**
 * 🔔 Módulo de Notificaciones - Sistema Kardex (corregido)
 * ------------------------------------------------------------
 */

const pool = require('../db');
const nodemailer = require('nodemailer');

// 🔹 Función global para obtener fecha local en formato YYYY-MM-DD
function fechaLocalYYYYMMDD(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')}`;
}

// 🔹 Crear notificación segura
async function crearNotificacion({ tipo, id_kardex = null, id_insumo = null, mensaje, fecha_evento = null, creado_por = null, id_sede }) {
  const id_kardex_nn = id_kardex ?? 0;
  const id_insumo_nn = id_insumo ?? 0;
  const fecha_evento_date = fecha_evento ? new Date(fecha_evento).toISOString().split('T')[0] : null;

  // Validación estricta de fecha
  let fecha_evento_datetime = null;
  if (fecha_evento) {
    const s = String(fecha_evento).trim();
    if (s && s !== '' && !s.includes('0000-00-00') && s !== 'null' && s !== 'undefined' && s.length > 3) {
      const d = new Date(s);
      if (!isNaN(d.getTime()) && d.getFullYear() >= 1900) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2,'0');
        const dd = String(d.getDate()).padStart(2,'0');
        const hh = String(d.getHours()).padStart(2,'0');
        const mi = String(d.getMinutes()).padStart(2,'0');
        const ss = String(d.getSeconds()).padStart(2,'0');
        fecha_evento_datetime = `${y}-${m}-${dd} ${hh}:${mi}:${ss}`;
      } else {
        console.warn(`⚠️ Fecha rechazada (año inválido): "${s}" para id_sede ${id_sede}`);
      }
    } else {
      console.warn(`⚠️ Fecha rechazada (formato vacío o inválido): "${s}" para id_sede ${id_sede}`);
    }
  }

  const [result] = await pool.query(
    `INSERT IGNORE INTO notificaciones
      (tipo, id_kardex, id_insumo, mensaje, fecha_evento, creado_por, id_kardex_nn, id_insumo_nn, fecha_evento_date, id_sede)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tipo, id_kardex, id_insumo, mensaje, fecha_evento_datetime, creado_por, id_kardex_nn, id_insumo_nn, fecha_evento_date, id_sede]
  );

  return result.insertId || null;
}

// 🔹 Obtener notificaciones
async function obtenerNotificaciones({ soloNoLeidas = false, id_sede }) {
  let query = 'SELECT * FROM notificaciones WHERE id_sede = ? ORDER BY fecha_creacion DESC';
  let params = [id_sede];

  if (soloNoLeidas) {
    query = 'SELECT * FROM notificaciones WHERE leido = 0 AND id_sede = ? ORDER BY fecha_creacion DESC';
    params = [id_sede];
  }

  const [rows] = await pool.query(query, params);
  return rows;
}

// 🔹 Marcar notificación como leída
async function marcarLeida(id_notificacion, id_sede) {
  const [result] = await pool.query(
    'UPDATE notificaciones SET leido = 1 WHERE id_notificacion = ? AND id_sede = ?',
    [id_notificacion, id_sede]
  );
  return result.affectedRows > 0;
}

// 🔹 Crear notificación automática por vencimiento
async function generarNotificacionesAutomaticas(id_sede) {
  function normalizarFecha(fecha) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }

  const hoy = fechaLocalYYYYMMDD(new Date());

  function esFechaValida(fecha) {
    const d = new Date(fecha);
    return !isNaN(d.getTime());
  }

  // Vencimiento de kardex
  const [kardex] = await pool.query(`
    SELECT k.id_kardex, k.fecha_vencimiento, ni.nombre AS nombre_insumo, cc.nombre AS casa_comercial
    FROM kardex k
    LEFT JOIN nombre_insumo ni ON k.id_nombre_insumo = ni.id_nombre_insumo
    LEFT JOIN casa_comercial cc ON k.id_casa_comercial = cc.id_casa_comercial
    WHERE k.id_sede = ?
  `, [id_sede]);

  for (const item of kardex) {
    if (!item.fecha_vencimiento || !esFechaValida(item.fecha_vencimiento)) continue;

    const fechaVto = normalizarFecha(new Date(item.fecha_vencimiento));
    const diffDias = Math.floor((new Date(fechaLocalYYYYMMDD(fechaVto)) - new Date(hoy)) / (1000*60*60*24));
    const fechaStr = fechaLocalYYYYMMDD(fechaVto);

    if (diffDias === 7 || diffDias === 0) {
      const mensaje = diffDias === 7
        ? `El reactivo "${item.nombre_insumo}" de la casa comercial "${item.casa_comercial}" vencerá en 7 días.`
        : `⚠️ El reactivo "${item.nombre_insumo}" de la casa comercial "${item.casa_comercial}" vence HOY.`;

      await crearNotificacion({ tipo: 'vencimiento_kardex', id_kardex: item.id_kardex, mensaje, fecha_evento: fechaStr, id_sede });
    }
  }

  // Vencimiento de insumos
  const [insumos] = await pool.query(`
    SELECT i.id_insumo, i.fecha_de_vto, ni.nombre AS nombre_del_insumo, l.nombre AS laboratorio
    FROM insumos i
    LEFT JOIN nombre_del_insumo ni ON i.id_nombre_del_insumo = ni.id_nombre_del_insumo
    LEFT JOIN laboratorio l ON i.id_laboratorio = l.id_laboratorio
    WHERE i.id_sede = ?
  `, [id_sede]);

  for (const item of insumos) {
    if (!item.fecha_de_vto || !esFechaValida(item.fecha_de_vto)) continue;

    const fechaVto = normalizarFecha(new Date(item.fecha_de_vto));
    const diffDias = Math.floor((new Date(fechaLocalYYYYMMDD(fechaVto)) - new Date(hoy)) / (1000*60*60*24));
    const fechaStr = fechaVto.toISOString().split('T')[0];

    if (diffDias === 7 || diffDias === 0) {
      const mensaje = diffDias === 7
        ? `El insumo "${item.nombre_del_insumo}" del laboratorio "${item.laboratorio}" vencerá en 7 días.`
        : `⚠️ El insumo "${item.nombre_del_insumo}" del laboratorio "${item.laboratorio}" vence HOY.`;

      await crearNotificacion({ tipo: 'vencimiento_insumo', id_insumo: item.id_insumo, mensaje, fecha_evento: fechaStr, id_sede });
    }
  }
}

// 🔹 Procesar salidas
async function procesarSalidas(id_sede) {
  try {
    const hoy = fechaLocalYYYYMMDD(new Date());

    // Salidas de kardex
    const [kardexSalidas] = await pool.query(`
      SELECT k.id_kardex, k.fecha_terminacion, ni.nombre AS nombre_insumo, cc.nombre AS casa_comercial
      FROM kardex k
      LEFT JOIN nombre_insumo ni ON k.id_nombre_insumo = ni.id_nombre_insumo
      LEFT JOIN casa_comercial cc ON k.id_casa_comercial = cc.id_casa_comercial
      WHERE k.id_sede = ?
    `, [id_sede]);

    for (const item of kardexSalidas) {
      if (!item.fecha_terminacion) continue;
      const fechaSalida = new Date(item.fecha_terminacion);
      if (isNaN(fechaSalida.getTime())) {
        console.warn(`❌ Fecha inválida kardex id_kardex=${item.id_kardex}, fecha_terminacion="${item.fecha_terminacion}"`);
        continue;
      }
      const fechaStr = fechaLocalYYYYMMDD(fechaSalida);
      if (fechaStr === hoy) {
        await crearNotificacion({
          tipo: 'salida_kardex',
          id_kardex: item.id_kardex,
          mensaje: `El reactivo "${item.nombre_insumo}" de la casa comercial "${item.casa_comercial}" ha sido dado de salida`,
          fecha_evento: fechaStr,
          id_sede
        });
      }
    }

    // Salidas de insumos
    const [insumosSalidas] = await pool.query(`
      SELECT i.id_insumo, i.termino, ndi.nombre AS nombre_del_insumo, l.nombre AS laboratorio
      FROM insumos i
      LEFT JOIN nombre_del_insumo ndi ON i.id_nombre_del_insumo = ndi.id_nombre_del_insumo
      LEFT JOIN laboratorio l ON i.id_laboratorio = l.id_laboratorio
      WHERE i.id_sede = ?
    `, [id_sede]);

    for (const item of insumosSalidas) {
      if (!item.termino) continue;
      const fechaSalida = new Date(item.termino);
      if (isNaN(fechaSalida.getTime())) {
        console.warn(`❌ Fecha inválida insumo id_insumo=${item.id_insumo}, termino="${item.termino}"`);
        continue;
      }
      const fechaStr = fechaLocalYYYYMMDD(fechaSalida);
      if (fechaStr === hoy) {
        await crearNotificacion({
          tipo: 'salida_insumo',
          id_insumo: item.id_insumo,
          mensaje: `El insumo "${item.nombre_del_insumo}" del laboratorio "${item.laboratorio}" ha sido dado de salida`,
          fecha_evento: fechaStr,
          id_sede
        });
      }
    }

    console.log(`✅ procesarSalidas completado para id_sede ${id_sede}`);
  } catch (error) {
    console.error(`❌ Error procesando salidas para id_sede ${id_sede}:`, error.message, error.code);
  }
}

// 🔹 Enviar notificaciones por correo
async function enviarNotificacionesPorCorreo(id_sede) {
  const [notis] = await pool.query(`
    SELECT * FROM notificaciones WHERE enviado_email = 0 AND id_sede = ?
  `, [id_sede]);
  if (!notis.length) return;

  const [suscriptores] = await pool.query(`
    SELECT correo FROM suscripcion_notificaciones WHERE id_sede = ?
  `, [id_sede]);
  if (!suscriptores.length) return;

  const destinatarios = suscriptores.map(s => s.correo);
  const transporte = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  for (const n of notis) {
    await transporte.sendMail({
      from: `"Kardex Sistema" <${process.env.EMAIL_USER}>`,
      to: destinatarios.join(','),
      subject: 'Notificación del Sistema Kardex',
      text: n.mensaje
    });
    await pool.query(
      `UPDATE notificaciones SET enviado_email = 1 WHERE id_notificacion = ? AND id_sede = ?`,
      [n.id_notificacion, id_sede]
    );
  }
  console.log('Notificaciones enviadas por correo a los suscriptores ✅');
}

module.exports = { 
  crearNotificacion, 
  obtenerNotificaciones, 
  marcarLeida, 
  procesarSalidas, 
  generarNotificacionesAutomaticas, 
  enviarNotificacionesPorCorreo 
};
